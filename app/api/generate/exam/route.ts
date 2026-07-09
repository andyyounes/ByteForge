// @ts-nocheck
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { generateExamExercises } from '@/lib/gemini'
import type { ExerciseType } from '@/types'

const ExamGenerateSchema = z.object({
  topic_id:    z.string().uuid().nullable().optional(),
  topic_name:  z.string().min(1).max(1200),
  class_type:  z.string().min(1).max(40),
  paper:       z.string().min(1).max(160),
  paper_style: z.enum(['practice', 'exam-style', 'challenging']),
  difficulty:  z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  count:       z.number().int().min(1).max(10).default(5),
  class_id:    z.string().uuid(),
})

function exerciseTypeForPaper(paper: string, style: string): ExerciseType {
  const paperText = paper.toLowerCase()
  if (
    paperText.includes('paper 2') ||
    paperText.includes('paper 4') ||
    paperText.includes('programming') ||
    paperText.includes('practical')
  ) {
    return 'pseudocode'
  }

  return style === 'practice' ? 'multiple-choice' : 'short-answer'
}

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
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = ExamGenerateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const req = parsed.data

  const { data: cls } = await supabase
    .from('classes')
    .select('id')
    .eq('id', req.class_id)
    .eq('teacher_id', user.id)
    .single()

  if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })

  try {
    const type = exerciseTypeForPaper(req.paper, req.paper_style)
    const exercises = await generateExamExercises({ ...req, type })

    return NextResponse.json({
      exercises,
      count: exercises.length,
      type,
    })
  } catch (err: unknown) {
    console.error('[/api/generate/exam]', err)
    return NextResponse.json(
      { error: (err as Error)?.message ?? 'AI generation failed' },
      { status: 500 }
    )
  }
}
