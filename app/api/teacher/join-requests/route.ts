// @ts-nocheck
/**
 * GET   /api/teacher/join-requests — pending requests addressed to this teacher
 * PATCH /api/teacher/join-requests — approve (→ enroll + set level) or decline
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { gradeToStageId } from '@/lib/stage-config'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()
  const { data: requests } = await admin
    .from('class_join_requests')
    .select('id, grade, created_at, class_id, class:classes(id, name, grade), student:profiles!student_id(id, name, email)')
    .eq('teacher_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  return NextResponse.json({ requests: requests ?? [] })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { requestId, action, classId } = await request.json() as {
    requestId: string
    action:    'approve' | 'decline'
    classId?:  string    // required when the request has no class (teacher-email flow)
  }
  if (!requestId || !['approve', 'decline'].includes(action)) {
    return NextResponse.json({ error: 'requestId and action required' }, { status: 400 })
  }

  const admin = await createAdminClient()

  // Load the request and confirm it's addressed to this teacher
  const { data: req } = await admin
    .from('class_join_requests')
    .select('id, student_id, teacher_id, class_id, status')
    .eq('id', requestId)
    .maybeSingle()

  if (!req || req.teacher_id !== user.id) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }
  if (req.status !== 'pending') {
    return NextResponse.json({ error: 'Request already handled' }, { status: 409 })
  }

  if (action === 'decline') {
    await admin
      .from('class_join_requests')
      .update({ status: 'declined', reviewed_at: new Date().toISOString() })
      .eq('id', requestId)
    return NextResponse.json({ ok: true, status: 'declined' })
  }

  // ── Approve ────────────────────────────────────────────────────────────────
  const targetClassId = req.class_id ?? classId
  if (!targetClassId) {
    return NextResponse.json({ error: 'Pick a class to add this student to' }, { status: 400 })
  }

  // The target class must belong to this teacher
  const { data: cls } = await admin
    .from('classes')
    .select('id, name, grade')
    .eq('id', targetClassId)
    .eq('teacher_id', user.id)
    .maybeSingle()
  if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })

  // Enroll (ignore duplicate)
  const { error: memberError } = await admin
    .from('class_members')
    .insert({ class_id: cls.id, student_id: req.student_id })
  if (memberError && memberError.code !== '23505') {
    return NextResponse.json({ error: memberError.message }, { status: 500 })
  }

  // Class grade defines the student's level
  const gradeStr = (cls.grade ?? '').replace(/\D/g, '')
  if (gradeStr) {
    await admin
      .from('profiles')
      .update({ stage: gradeToStageId(gradeStr), placement_confirmed: true })
      .eq('id', req.student_id)
  }

  await admin
    .from('class_join_requests')
    .update({ status: 'approved', class_id: cls.id, reviewed_at: new Date().toISOString() })
    .eq('id', requestId)

  return NextResponse.json({ ok: true, status: 'approved', class: cls.name })
}
