// @ts-nocheck
import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { gradeToStageId } from '@/lib/stage-config'
import { initialMasteryMap } from '@/lib/mastery'
import { sendEmail, joinRequestEmailHtml } from '@/lib/email'

// ── POST /api/classes/join ────────────────────────────────────────────────────
// Join a class by join code.
//
// classes.auto_accept = true  → student is enrolled instantly (old behaviour)
// classes.auto_accept = false → a pending join request is created and the
//                                teacher approves it from their dashboard.
//
// Either way, the class grade is trusted as the student's level immediately:
// stage + placement_confirmed are set on first contact so the student gets the
// right content while waiting — only class membership awaits approval.

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { joinCode } = await request.json()
  if (!joinCode) return NextResponse.json({ error: 'Join code required' }, { status: 400 })

  // Admin client bypasses RLS — student can't read classes before enrollment.
  const admin = await createAdminClient()
  const trimmedCode = joinCode.trim().toUpperCase()

  const { data: cls, error: findError } = await admin
    .from('classes')
    .select('id, name, grade, teacher_id, auto_accept')
    .ilike('join_code', trimmedCode)
    .single()

  if (findError || !cls) {
    console.error('[join] class lookup failed:', findError?.message ?? 'no rows', `| code used: "${trimmedCode}"`)
    return NextResponse.json({ error: 'Invalid join code' }, { status: 404 })
  }

  // Already a member? Nothing to do.
  const { data: existingMember } = await admin
    .from('class_members')
    .select('class_id')
    .eq('class_id', cls.id)
    .eq('student_id', user.id)
    .maybeSingle()
  if (existingMember) {
    return NextResponse.json({ message: 'Already enrolled', class: cls })
  }

  // ── Confirm placement from class grade (both branches) ────────────────────
  // The class is the source of truth for the student's level — set it now so
  // the student sees the right content even while a request is pending.
  const gradeStr = (cls.grade ?? '').replace(/\D/g, '')  // "Grade 7" → "7"
  if (gradeStr) {
    const stage = gradeToStageId(gradeStr)
    await admin
      .from('profiles')
      .update({ stage, placement_confirmed: true })
      .eq('id', user.id)

    // Seed mastery rows if this is a fresh account
    const { data: existing } = await supabase
      .from('concept_mastery')
      .select('concept_id')
      .eq('student_id', user.id)
      .limit(1)
    if (!existing || existing.length === 0) {
      const rows = initialMasteryMap(user.id)
      for (let i = 0; i < rows.length; i += 20) {
        await supabase.from('concept_mastery').insert(rows.slice(i, i + 20))
      }
    }
  }

  // ── Approval required → create a pending request for the teacher ──────────
  if (!cls.auto_accept) {
    const { error: reqError } = await admin
      .from('class_join_requests')
      .insert({
        student_id: user.id,
        teacher_id: cls.teacher_id,
        class_id:   cls.id,
        grade:      gradeStr || null,
        status:     'pending',
      })
    if (reqError && reqError.code !== '23505') {   // 23505 = request already pending
      console.error('[join] request insert error:', reqError)
      return NextResponse.json({ error: reqError.message }, { status: 500 })
    }

    // Email the teacher (only for a genuinely new request; failures are non-fatal)
    if (!reqError) {
      const [{ data: teacher }, { data: student }] = await Promise.all([
        admin.from('profiles').select('name, email').eq('id', cls.teacher_id).maybeSingle(),
        admin.from('profiles').select('name, email').eq('id', user.id).maybeSingle(),
      ])
      if (teacher?.email) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
        await sendEmail({
          to:      teacher.email,
          subject: `🔔 ${student?.name ?? 'A student'} wants to join ${cls.name}`,
          html:    joinRequestEmailHtml({
            teacherName:  teacher.name ?? 'there',
            studentName:  student?.name ?? 'A student',
            studentEmail: student?.email ?? user.email ?? '',
            grade:        gradeStr || null,
            className:    cls.name,
            dashboardUrl: `${appUrl}/teacher/dashboard`,
          }),
        })
      }
    }
    return NextResponse.json({ pending: true, message: 'Request sent', class: cls })
  }

  // ── Auto-accept → enroll immediately ──────────────────────────────────────
  const { error: joinError } = await supabase
    .from('class_members')
    .insert({ class_id: cls.id, student_id: user.id })

  if (joinError) {
    if (joinError.code === '23505') {
      return NextResponse.json({ message: 'Already enrolled', class: cls })
    }
    console.error('[join] insert error:', joinError)
    return NextResponse.json({ error: joinError.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Joined!', class: cls })
}

// ── GET /api/classes/join ─────────────────────────────────────────────────────
// Validate a join code and return class info (used during signup preview).
// Uses admin client so unauthenticated users can preview during registration.

export async function GET(request: NextRequest) {
  const code = new URL(request.url).searchParams.get('code')
  if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 })

  const supabase = await createAdminClient()

  const { data: cls } = await supabase
    .from('classes')
    .select('id, name, grade, auto_accept, teacher:profiles!teacher_id(name)')
    .ilike('join_code', code.trim())
    .single()

  if (!cls) return NextResponse.json({ error: 'Invalid code' }, { status: 404 })

  return NextResponse.json({ class: cls })
}
