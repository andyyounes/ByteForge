/**
 * POST /api/teacher/exam-reopen — a teacher re-opens a student's submitted
 * hands-on exam (e.g. Grade 8's recipe page) so they can keep editing.
 * Body: { studentId, lessonKey, challengeId }.
 *
 * Clears save_data.submitted, the flag grade8.html's submitExam() sets and
 * checks before locking the editors read-only — see lockExamEditing() /
 * selectChallenge() there.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { studentId, lessonKey, challengeId } = body as {
    studentId?: string; lessonKey?: string; challengeId?: string
  }
  if (!studentId || !lessonKey || !challengeId) {
    return NextResponse.json({ error: 'studentId, lessonKey and challengeId are required' }, { status: 400 })
  }

  // Only a teacher who actually teaches this student (via a shared class)
  // may re-open their exam.
  const { data: memberships } = await supabase
    .from('class_members')
    .select('class_id')
    .eq('student_id', studentId)
  const classIds = (memberships ?? []).map(m => m.class_id)
  if (!classIds.length) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: ownedClasses } = await supabase
    .from('classes')
    .select('id')
    .in('id', classIds)
    .eq('teacher_id', user.id)
  if (!ownedClasses || !ownedClasses.length) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: row } = await supabase
    .from('lesson_saves')
    .select('id, save_data')
    .eq('student_id', studentId)
    .eq('lesson_key', lessonKey)
    .eq('challenge_id', challengeId)
    .maybeSingle()
  if (!row) return NextResponse.json({ error: 'No exam attempt found for this student yet' }, { status: 404 })

  const saveData = (row.save_data ?? {}) as Record<string, unknown>

  const { error } = await supabase
    .from('lesson_saves')
    .update({ save_data: { ...saveData, submitted: false } })
    .eq('id', row.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
