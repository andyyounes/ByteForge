// @ts-nocheck
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { gradeToStageId } from '@/lib/stage-config'
import { initialMasteryMap } from '@/lib/mastery'

// ── GET /api/placement/auto ──────────────────────────────────────────────────
//
// Auto-places grade 6–9 students without requiring a placement quiz.
// Called by the middleware when it detects an unconfirmed student whose
// grade falls in the 6–9 range.
//
// Steps:
//   1. Look up the student's grade from their profile.
//   2. Map grade → stage using gradeToStageId().
//   3. Update the profile with the inferred stage + placement_confirmed = true.
//   4. Seed the initial concept-mastery rows (same as POST /api/placement).
//   5. Redirect to /student/dashboard.

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Fetch grade + current confirmation status
  const { data: profile } = await supabase
    .from('profiles')
    .select('grade, placement_confirmed')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If already confirmed (e.g. double redirect), go straight to dashboard
  if (profile.placement_confirmed) {
    return NextResponse.redirect(new URL('/student/dashboard', request.url))
  }

  // Infer stage from grade
  const stage = gradeToStageId(profile.grade ?? '7')

  // Confirm placement
  await supabase
    .from('profiles')
    .update({ stage, placement_confirmed: true })
    .eq('id', user.id)

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

  return NextResponse.redirect(new URL('/student/dashboard', request.url))
}
