/**
 * GET /api/unit-exams?classId=xxx&chapterNum=1
 *
 * Returns the approved unit exam for a chapter.
 * Students only see approved exams. Teachers see any status.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const classId    = req.nextUrl.searchParams.get('classId')
  const chapterNum = req.nextUrl.searchParams.get('chapterNum')

  if (!classId || !chapterNum)
    return NextResponse.json({ error: 'classId and chapterNum required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()

  // Check if requester is teacher or enrolled student
  const [teacherCheck, memberCheck] = await Promise.all([
    supabase.from('classes').select('id').eq('id', classId).eq('teacher_id', user.id).maybeSingle(),
    supabase.from('class_members').select('class_id').eq('class_id', classId).eq('student_id', user.id).maybeSingle(),
  ])

  const isTeacher = !!teacherCheck.data
  const isMember  = !!memberCheck.data

  if (!isTeacher && !isMember)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const query = admin
    .from('unit_exams')
    .select('id, title, chapter_label, status, content, created_at')
    .eq('class_id', classId)
    .eq('chapter_num', parseInt(chapterNum))
    .maybeSingle()

  const { data: exam, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Students only see approved exams
  if (!isTeacher && exam?.status !== 'approved')
    return NextResponse.json({ exam: null })

  return NextResponse.json({ exam })
}

/**
 * GET /api/unit-exams/all?classId=xxx
 * Returns all exams for a class (teacher-only, any status)
 */
export async function POST(req: NextRequest) {
  // Used to batch-fetch all exam statuses for BookLessonsPanel
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'teacher')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { classId } = await req.json().catch(() => ({})) as { classId?: string }
  if (!classId) return NextResponse.json({ error: 'classId required' }, { status: 400 })

  const { data: cls } = await supabase
    .from('classes').select('id').eq('id', classId).eq('teacher_id', user.id).single()
  if (!cls) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = await createAdminClient()
  const { data: exams } = await admin
    .from('unit_exams')
    .select('id, chapter_num, chapter_label, title, status, content, created_at')
    .eq('class_id', classId)
    .order('chapter_num', { ascending: true })

  return NextResponse.json({ exams: exams ?? [] })
}
