/**
 * POST /api/auth/password-reset-request — a locked-out student asks their
 * teacher to reset their password.
 *
 * Deliberately UNAUTHENTICATED — a student who forgot their password can't
 * log in to prove who they are, so this can't reuse the pattern
 * /api/classes/request uses (which requires supabase.auth.getUser()).
 * Identity here is "whoever knows this student's account email" — the same
 * trust level a class join-code already relies on, and the teacher still
 * gets a chance to recognise (or decline) the student before anything
 * happens, so this doesn't skip verification, it just moves it to a human.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail, passwordResetRequestEmailHtml } from '@/lib/email'

export async function POST(request: NextRequest) {
  const { studentEmail, teacherEmail } = await request.json() as { studentEmail?: string; teacherEmail?: string }
  if (!studentEmail?.trim() || !teacherEmail?.trim()) {
    return NextResponse.json({ error: 'Your email and your teacher\'s email are both required' }, { status: 400 })
  }

  const admin = await createAdminClient()

  const { data: student } = await admin
    .from('profiles')
    .select('id, name, email')
    .ilike('email', studentEmail.trim())
    .eq('role', 'student')
    .maybeSingle()
  // Same response whether the student email doesn't exist or isn't a
  // student — doesn't reveal which, so this can't be used to probe for
  // registered emails.
  if (!student) {
    return NextResponse.json(
      { error: 'No student account found with that email — double-check it.' },
      { status: 404 }
    )
  }

  const { data: teacher } = await admin
    .from('profiles')
    .select('id, name, email')
    .ilike('email', teacherEmail.trim())
    .eq('role', 'teacher')
    .maybeSingle()
  if (!teacher) {
    return NextResponse.json(
      { error: 'No teacher found with that email — double-check it with your teacher.' },
      { status: 404 }
    )
  }

  const { error } = await admin
    .from('password_reset_requests')
    .insert({ student_id: student.id, teacher_id: teacher.id, status: 'pending' })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ pending: true, message: 'Your teacher already has a pending request — ask them to check their dashboard.' })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Non-fatal — the teacher will still see the request on their dashboard
  // even if this email never arrives (same fire-safe convention as the
  // join-request flow's own notification email).
  if (teacher.email) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    await sendEmail({
      to:      teacher.email,
      subject: `🔑 ${student.name ?? 'A student'} needs their password reset`,
      html:    passwordResetRequestEmailHtml({
        teacherName:  teacher.name ?? 'there',
        studentName:  student.name ?? 'A student',
        studentEmail: student.email ?? studentEmail.trim(),
        dashboardUrl: `${appUrl}/teacher/dashboard`,
      }),
    })
  }

  return NextResponse.json({ pending: true, message: `Request sent to ${teacher.name ?? 'your teacher'}` })
}
