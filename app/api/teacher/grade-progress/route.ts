/**
 * GET /api/teacher/grade-progress?classId=x&grade=grade6|grade7|grade8
 *
 * Per-student progress for a Grade 6/7/8 class — the same idea as
 * /api/teacher/g9-progress, generalised. Reads the real module/stage
 * metadata straight out of the live public/lessons/*.html files (see
 * lib/grade-progress.ts) so it can never silently drift from the actual
 * shipped curriculum, and reads lesson_saves rows keyed by challenge_id
 * (Grades 6-8 are id-keyed, unlike Grade 9's index-keyed missions).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getGradeMeta, summarizeStudent } from '@/lib/grade-progress'

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

async function teacherOwnsClass(classId: string, userId: string) {
  const admin = await createAdminClient()
  const { data } = await admin
    .from('classes').select('id').eq('id', classId).eq('teacher_id', userId).maybeSingle()
  return !!data
}

export async function GET(req: NextRequest) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const classId = req.nextUrl.searchParams.get('classId')
  const grade   = req.nextUrl.searchParams.get('grade')
  if (!classId) return NextResponse.json({ error: 'classId required' }, { status: 400 })
  if (grade !== 'grade6' && grade !== 'grade7' && grade !== 'grade8') {
    return NextResponse.json({ error: "grade must be 'grade6', 'grade7', or 'grade8'" }, { status: 400 })
  }

  if (!(await teacherOwnsClass(classId, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = await createAdminClient()

  const { data: memberships } = await admin
    .from('class_members').select('student_id').eq('class_id', classId)
  const studentIds = (memberships ?? []).map((m: { student_id: string }) => m.student_id)
  if (!studentIds.length) return NextResponse.json({ students: [] })

  let meta
  try {
    meta = getGradeMeta(grade)
  } catch (e) {
    console.error('[grade-progress] failed to extract curriculum metadata', e)
    return NextResponse.json({ error: 'Failed to load curriculum data' }, { status: 500 })
  }

  const [{ data: profiles }, { data: saves }] = await Promise.all([
    admin.from('profiles').select('id, name').in('id', studentIds),
    admin.from('lesson_saves')
      .select('student_id, challenge_id, passed, saved_at, save_data')
      .eq('lesson_key', meta.lessonKey)
      .in('student_id', studentIds),
  ])

  const byStudent = new Map<string, typeof saves>()
  for (const row of saves ?? []) {
    const list = byStudent.get(row.student_id) ?? []
    list.push(row)
    byStudent.set(row.student_id, list)
  }

  const students = (profiles ?? []).map((p: { id: string; name: string }) =>
    summarizeStudent(meta, p.id, p.name, byStudent.get(p.id) ?? [])
  )

  return NextResponse.json({ students, totalStages: meta.total })
}
