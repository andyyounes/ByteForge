// @ts-nocheck
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { gradeToStageId } from '@/lib/stage-config'
import { initialMasteryMap } from '@/lib/mastery'

// ── POST /api/onboarding ─────────────────────────────────────────────────────
//
// Called when a student completes the onboarding grade-selection screen.
// Sets the student's grade + stage and confirms placement so the middleware
// stops redirecting them to /onboarding.
//
// Body: { grade: string }   e.g. "7", "10", "12"

const Schema = z.object({
  grade: z.string().regex(/^\d+$/).transform(Number),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const gradeNum = parsed.data.grade
  const stage    = gradeToStageId(String(gradeNum))

  // Update profile: set grade, stage, and confirm placement
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ grade: String(gradeNum), stage, placement_confirmed: true })
    .eq('id', user.id)

  if (profileError) {
    console.error('[POST /api/onboarding] profile update:', profileError)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  // Seed initial mastery map if not already present
  const { data: existingMastery } = await supabase
    .from('concept_mastery')
    .select('concept_id')
    .eq('student_id', user.id)
    .limit(1)

  if (!existingMastery || existingMastery.length === 0) {
    const masteryRows = initialMasteryMap(user.id)
    for (let i = 0; i < masteryRows.length; i += 20) {
      await supabase.from('concept_mastery').insert(masteryRows.slice(i, i + 20))
    }
  }

  return NextResponse.json({ stage, grade: gradeNum })
}
