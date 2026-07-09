/**
 * GET /api/teacher/past-papers/[id]/results
 *
 * Returns all student submissions for a past paper, joined with
 * student profile names. Teacher-only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'teacher')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = await createAdminClient()

  // Verify ownership
  const { data: paper } = await admin
    .from('past_papers')
    .select('id, class_id, total_marks, title')
    .eq('id', id)
    .single()
  if (!paper) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: cls } = await supabase
    .from('classes').select('id').eq('id', paper.class_id).eq('teacher_id', user.id).single()
  if (!cls) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Fetch submissions + student names
  const { data: submissions, error } = await admin
    .from('past_paper_submissions')
    .select('id, student_id, score, total_marks, feedback, answers, submitted_at')
    .eq('past_paper_id', id)
    .order('submitted_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!submissions?.length) return NextResponse.json({ results: [] })

  // Batch-fetch student names
  const studentIds = [...new Set(submissions.map(s => s.student_id))]
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, name, email')
    .in('id', studentIds)

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

  const results = submissions.map(sub => ({
    ...sub,
    student: profileMap[sub.student_id] ?? { name: 'Unknown', email: '' },
    pct: paper.total_marks > 0 ? Math.round((sub.score / paper.total_marks) * 100) : 0,
  }))

  return NextResponse.json({ results, paperTitle: paper.title, totalMarks: paper.total_marks })
}
