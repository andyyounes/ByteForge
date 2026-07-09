/**
 * POST /api/classes/request — student requests to join via teacher's email
 *                             (no class code needed; teacher picks the class
 *                              when approving).
 * GET  /api/classes/request — student's own requests + their status.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendEmail, joinRequestEmailHtml } from '@/lib/email'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { teacherEmail, grade } = await request.json() as { teacherEmail?: string; grade?: string }
  if (!teacherEmail?.trim()) {
    return NextResponse.json({ error: 'Teacher email required' }, { status: 400 })
  }

  const admin = await createAdminClient()

  // Look up the teacher by email — exact match, teachers only.
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
    .from('class_join_requests')
    .insert({
      student_id: user.id,
      teacher_id: teacher.id,
      class_id:   null,               // teacher decides which class
      grade:      grade?.trim() || null,
      status:     'pending',
    })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ pending: true, message: 'Request already sent', teacher: teacher.name })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Email the teacher (failures are non-fatal)
  if (teacher.email) {
    const { data: student } = await admin
      .from('profiles')
      .select('name, email')
      .eq('id', user.id)
      .maybeSingle()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    await sendEmail({
      to:      teacher.email,
      subject: `🔔 ${student?.name ?? 'A student'} asked to join your class`,
      html:    joinRequestEmailHtml({
        teacherName:  teacher.name ?? 'there',
        studentName:  student?.name ?? 'A student',
        studentEmail: student?.email ?? user.email ?? '',
        grade:        grade?.trim() || null,
        className:    null,
        dashboardUrl: `${appUrl}/teacher/dashboard`,
      }),
    })
  }

  return NextResponse.json({ pending: true, message: 'Request sent', teacher: teacher.name })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()
  const { data: requests } = await admin
    .from('class_join_requests')
    .select('id, status, grade, created_at, class:classes(name), teacher:profiles!teacher_id(name)')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return NextResponse.json({ requests: requests ?? [] })
}
