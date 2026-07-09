// @ts-nocheck
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { generateExercises } from '@/lib/gemini'

// â”€â”€ Request validation schema â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const GenerateSchema = z.object({
  topic_id:   z.string().uuid(),
  topic_name: z.string().min(1).max(200),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  type:       z.enum(['binary-cards','pseudocode','ide','blockly','flowchart','algo-viz','multiple-choice','short-answer']),
  language:   z.string().max(50).optional(),
  count:      z.number().int().min(1).max(10).default(3),
})

// â”€â”€ POST /api/generate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Auth guard
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Role guard â€” only teachers
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Parse + validate body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = GenerateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const req = parsed.data

  try {
    const exercises = await generateExercises(req)
    return NextResponse.json({ exercises, count: exercises.length })
  } catch (err: unknown) {
    console.error('[/api/generate]', err)
    return NextResponse.json(
      { error: (err as Error)?.message ?? 'AI generation failed' },
      { status: 500 }
    )
  }
}

