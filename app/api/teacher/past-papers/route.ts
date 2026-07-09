/**
 * GET  /api/teacher/past-papers?classId=...   — list papers for a class
 * POST /api/teacher/past-papers               — create a new past paper
 *
 * Body (POST):
 *   { classId, title, year, session, paperNum, questions, dueDate? }
 *   questions: [{ num, stem, marks, ms }]
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'teacher')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const classId = req.nextUrl.searchParams.get('classId')
  if (!classId) return NextResponse.json({ error: 'classId required' }, { status: 400 })

  // Verify teacher owns class
  const { data: cls } = await supabase
    .from('classes').select('id').eq('id', classId).eq('teacher_id', user.id).single()
  if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })

  const admin = await createAdminClient()
  const { data: papers, error } = await admin
    .from('past_papers')
    .select('id, title, year, session, paper_num, total_marks, due_date, assigned, created_at, questions')
    .eq('class_id', classId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ papers: papers ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'teacher')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({})) as {
    classId?:   string
    title?:     string
    year?:      string
    session?:   string
    paperNum?:  string
    questions?: { num: number; stem: string; marks: number; ms: string }[]
    dueDate?:   string
  }

  const { classId, title, year, session, paperNum, questions = [], dueDate } = body

  if (!classId || !title) return NextResponse.json({ error: 'classId and title required' }, { status: 400 })

  // Verify teacher owns class
  const { data: cls } = await supabase
    .from('classes').select('id').eq('id', classId).eq('teacher_id', user.id).single()
  if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })

  const totalMarks = questions.reduce((s, q) => s + (q.marks ?? 0), 0)

  const admin = await createAdminClient()
  const { data: paper, error } = await admin
    .from('past_papers')
    .insert({
      class_id:    classId,
      teacher_id:  user.id,
      title,
      year:        year ?? '',
      session:     session ?? '',
      paper_num:   paperNum ?? '',
      questions,
      total_marks: totalMarks,
      due_date:    dueDate ?? null,
      assigned:    false,
    })
    .select('id, title, year, session, paper_num, total_marks, due_date, assigned, created_at, questions')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ paper })
}
