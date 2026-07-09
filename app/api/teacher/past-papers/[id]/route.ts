/**
 * PATCH /api/teacher/past-papers/[id]  — update (assign/unassign, edit due date, edit questions)
 * DELETE /api/teacher/past-papers/[id] — delete a paper
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function PATCH(
  req: NextRequest,
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

  const body = await req.json().catch(() => ({})) as {
    assigned?:   boolean
    dueDate?:    string | null
    questions?:  { num: number; stem: string; marks: number; ms: string }[]
    title?:      string
    year?:       string
    session?:    string
    paperNum?:   string
  }

  const admin = await createAdminClient()

  // Verify teacher owns this paper via class ownership
  const { data: paper } = await admin
    .from('past_papers')
    .select('id, class_id, questions')
    .eq('id', id)
    .single()
  if (!paper) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: cls } = await supabase
    .from('classes').select('id').eq('id', paper.class_id).eq('teacher_id', user.id).single()
  if (!cls) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const updates: Record<string, unknown> = {}
  if (body.assigned   !== undefined) updates.assigned    = body.assigned
  if (body.dueDate    !== undefined) updates.due_date    = body.dueDate
  if (body.title      !== undefined) updates.title       = body.title
  if (body.year       !== undefined) updates.year        = body.year
  if (body.session    !== undefined) updates.session     = body.session
  if (body.paperNum   !== undefined) updates.paper_num   = body.paperNum
  if (body.questions  !== undefined) {
    updates.questions    = body.questions
    updates.total_marks  = body.questions.reduce((s, q) => s + (q.marks ?? 0), 0)
  }

  const { data: updated, error } = await admin
    .from('past_papers')
    .update(updates)
    .eq('id', id)
    .select('id, title, year, session, paper_num, total_marks, due_date, assigned, created_at, questions')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ paper: updated })
}

export async function DELETE(
  req: NextRequest,
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

  const { data: paper } = await admin
    .from('past_papers')
    .select('id, class_id')
    .eq('id', id)
    .single()
  if (!paper) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: cls } = await supabase
    .from('classes').select('id').eq('id', paper.class_id).eq('teacher_id', user.id).single()
  if (!cls) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await admin.from('past_papers').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
