// @ts-nocheck
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// â”€â”€ POST /api/generate/approve â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Save AI-generated exercises to the DB as draft_status='pending'

const ApproveSchema = z.object({
  topic_id: z.string().uuid().nullable().optional(),
  class_id: z.string().uuid().optional(),
  syllabus_ref: z.string().max(300).optional(),
  exercises: z.array(z.object({
    title:          z.string(),
    description:    z.string(),
    type:           z.string(),
    difficulty:     z.union([z.literal(1),z.literal(2),z.literal(3),z.literal(4)]),
    xp_reward:      z.number(),
    config:         z.record(z.unknown()),
    starter_code:   z.string().optional(),
    hints:          z.array(z.string()).default([]),
  })).min(1).max(10),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = ApproveSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { topic_id, class_id, syllabus_ref, exercises } = parsed.data

  if (class_id) {
    const { data: cls } = await supabase
      .from('classes')
      .select('id')
      .eq('id', class_id)
      .eq('teacher_id', user.id)
      .single()

    if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })
  }

  const rows = exercises.map(ex => ({
    topic_id:      topic_id ?? null,
    unit_id:       null,        // assigned later when teacher approves
    title:         ex.title,
    type:          ex.type,
    difficulty:    ex.difficulty,
    xp_reward:     ex.xp_reward,
    description:   ex.description,
    config:        ex.config,
    starter_code:  ex.starter_code ?? null,
    hints:         ex.hints,
    sort_order:    0,
    unlock_trigger: 'completion' as const,
    unlocks_at:    null,
    draft_status:  'pending' as const,
    language:      null,
    syllabus_ref:  syllabus_ref ?? (class_id ? `class:${class_id}:topic:${topic_id ?? 'syllabus'}` : null),
  }))

  const { data, error } = await supabase.from('exercises').insert(rows).select('id')

  if (error) {
    console.error('[/api/generate/approve]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ count: data.length, ids: data.map((r: { id: string }) => r.id) })
}

