/**
 * GET /api/student/past-papers?classId=...
 *
 * Returns all assigned past papers for the student's class,
 * along with the student's own submission (if any) for each.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const classId = req.nextUrl.searchParams.get('classId')
  if (!classId) return NextResponse.json({ error: 'classId required' }, { status: 400 })

  // Verify student is a member of this class
  const { data: membership } = await supabase
    .from('class_members')
    .select('student_id')
    .eq('class_id', classId)
    .eq('student_id', user.id)
    .single()
  if (!membership) return NextResponse.json({ error: 'Not a member of this class' }, { status: 403 })

  const admin = await createAdminClient()

  const [{ data: papers }, { data: submissions }] = await Promise.all([
    admin
      .from('past_papers')
      .select('id, title, year, session, paper_num, total_marks, due_date, questions')
      .eq('class_id', classId)
      .eq('assigned', true)
      .order('created_at', { ascending: false }),
    admin
      .from('past_paper_submissions')
      .select('past_paper_id, score, total_marks, feedback, submitted_at')
      .eq('student_id', user.id)
      .eq('class_id', classId),
  ])

  const subMap = Object.fromEntries(
    (submissions ?? []).map(s => [s.past_paper_id, s])
  )

  const result = (papers ?? []).map(p => ({
    ...p,
    submission: subMap[p.id] ?? null,
  }))

  return NextResponse.json({ papers: result })
}
