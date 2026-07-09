// @ts-nocheck
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { gradeToStageId } from '@/lib/stage-config'
import { initialMasteryMap } from '@/lib/mastery'
import type { StageId } from '@/types'

// â”€â”€ Placement quiz scoring â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//
// The placement quiz has 5 sections (18 questions total):
//   section_1 â†’ computer fundamentals       (grade 7)
//   section_2 â†’ number systems              (grade 8)
//   section_3 â†’ algorithms + pseudocode     (grade 9)
//   section_4 â†’ programming + data structs  (IGCSE Year 1)
//   section_5 â†’ recursion + OOP + stacks    (AS Level)
//
// The recommended stage is the highest section where the student scored â‰¥ 50%.

const SECTION_STAGE_MAP: Record<string, StageId> = {
  section_1: ‘grade7’,
  section_2: ‘grade8’,
  section_3: ‘grade9’,
  section_4: ‘igcse_y1’,
  section_5: ‘as_level’,
}

function recommendStage(sectionScores: Record<string, number>): StageId {
  // Find highest section where score â‰¥ 50%
  const sections = [‘section_5’, ‘section_4’, ‘section_3’, ‘section_2’, ‘section_1’]
  for (const s of sections) {
    if ((sectionScores[s] ?? 0) >= 50) {
      return SECTION_STAGE_MAP[s] ?? ‘grade7’
    }
  }
  return ‘grade6’
}

// â”€â”€ Validation schema â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const QuizSchema = z.object({
  answers: z.record(z.string()),   // questionId â†’ chosen answer
})

// Simple answer key lookup â€” in production this would be in a DB table
// For now, hardcoded for demo purposes.
const ANSWER_KEY: Record<string, { section: string; correct: string }> = {
  q1_1: { section:'section_1', correct:'a' }, q1_2: { section:'section_1', correct:'b' },
  q1_3: { section:'section_1', correct:'c' }, q1_4: { section:'section_1', correct:'a' },
  q2_1: { section:'section_2', correct:'b' }, q2_2: { section:'section_2', correct:'c' },
  q2_3: { section:'section_2', correct:'a' }, q2_4: { section:'section_2', correct:'b' },
  q3_1: { section:'section_3', correct:'c' }, q3_2: { section:'section_3', correct:'a' },
  q3_3: { section:'section_3', correct:'b' }, q3_4: { section:'section_3', correct:'c' },
  q4_1: { section:'section_4', correct:'a' }, q4_2: { section:'section_4', correct:'b' },
  q4_3: { section:'section_4', correct:'c' },
  // Section 5 — AS/A Level (recursion, OOP, stacks)
  q5_1: { section:'section_5', correct:'a' }, // base case terminates recursion
  q5_2: { section:'section_5', correct:'b' }, // encapsulation bundles data + methods
  q5_3: { section:'section_5', correct:'c' }, // stack uses LIFO ordering
}

function scoreQuiz(answers: Record<string, string>): {
  sectionScores:    Record<string, number>
  recommendedStage: StageId
} {
  const sectionCorrect: Record<string, number> = {}
  const sectionTotal:   Record<string, number> = {}

  for (const [qId, answer] of Object.entries(answers)) {
    const entry = ANSWER_KEY[qId]
    if (!entry) continue
    const s = entry.section
    sectionTotal[s]   = (sectionTotal[s]   ?? 0) + 1
    sectionCorrect[s] = (sectionCorrect[s] ?? 0) + (answer === entry.correct ? 1 : 0)
  }

  const sectionScores: Record<string, number> = {}
  for (const s of Object.keys(sectionTotal)) {
    sectionScores[s] = Math.round((sectionCorrect[s] / sectionTotal[s]) * 100)
  }

  return { sectionScores, recommendedStage: recommendStage(sectionScores) }
}

// â”€â”€ POST /api/placement â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = QuizSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { answers } = parsed.data
  const { sectionScores, recommendedStage } = scoreQuiz(answers)

  // Save placement quiz result
  const { data: quiz, error: quizError } = await supabase
    .from('placement_quizzes')
    .insert({
      student_id:        user.id,
      answers,
      section_scores:    sectionScores,
      recommended_stage: recommendedStage,
      status:            'pending',
    })
    .select()
    .single()

  if (quizError) {
    console.error('[POST /api/placement]', quizError)
    return NextResponse.json({ error: quizError.message }, { status: 500 })
  }

  // Auto-confirm if no teacher oversight (can be changed to 'pending' for teacher review)
  const stage = recommendedStage

  // Update profile stage
  await supabase
    .from('profiles')
    .update({ stage, placement_confirmed: true })
    .eq('id', user.id)

  // Confirm the quiz record
  await supabase
    .from('placement_quizzes')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
    .eq('id', quiz.id)

  // Seed initial mastery map for the student
  const { data: existingMastery } = await supabase
    .from('concept_mastery')
    .select('concept_id')
    .eq('student_id', user.id)
    .limit(1)

  if (!existingMastery || existingMastery.length === 0) {
    const masteryRows = initialMasteryMap(user.id)
    // Insert in batches to avoid row limit
    for (let i = 0; i < masteryRows.length; i += 20) {
      await supabase.from('concept_mastery').insert(masteryRows.slice(i, i + 20))
    }
  }

  return NextResponse.json({
    stage,
    sectionScores,
    recommendedStage,
    quizId: quiz.id,
  })
}

