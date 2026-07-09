// @ts-nocheck
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { pickDailyChallengeConcept, calculateStreak } from '@/lib/adaptive'
import type { ConceptMastery, DailyChallenge, MasteryMap, Profile } from '@/types'

// â”€â”€ GET /api/daily-challenge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Returns today's daily challenge for the authed student.
// Creates one if it doesn't exist yet.

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date().toISOString().slice(0, 10)

  // Check for existing challenge
  const { data: existing } = await supabase
    .from('daily_challenges')
    .select('*')
    .eq('student_id', user.id)
    .eq('date', today)
    .maybeSingle<DailyChallenge>()

  if (existing) return NextResponse.json({ challenge: existing })

  // Create new challenge based on mastery state
  const { data: masteries } = await supabase
    .from('concept_mastery')
    .select('*')
    .eq('student_id', user.id)

  const masteryMap: MasteryMap = {}
  for (const row of (masteries ?? []) as ConceptMastery[]) {
    masteryMap[row.concept_id] = row
  }

  const { conceptId, xpReward } = pickDailyChallengeConcept(masteryMap)

  const { data: challenge, error } = await supabase
    .from('daily_challenges')
    .insert({
      student_id:   user.id,
      date:         today,
      concept_id:   conceptId,
      xp_reward:    xpReward,
      completed:    false,
      completed_at: null,
    })
    .select()
    .single<DailyChallenge>()

  if (error) {
    console.error('[GET /api/daily-challenge]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ challenge })
}

// â”€â”€ POST /api/daily-challenge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Mark today's challenge as complete and award XP.

const CompleteSchema = z.object({
  challengeId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = CompleteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { challengeId } = parsed.data

  const { data: challenge } = await supabase
    .from('daily_challenges')
    .select('*')
    .eq('id', challengeId)
    .eq('student_id', user.id)
    .single<DailyChallenge>()

  if (!challenge) return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
  if (challenge.completed) return NextResponse.json({ challenge, alreadyDone: true })

  // Mark complete
  await supabase
    .from('daily_challenges')
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq('id', challengeId)

  // Award XP + update streak
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  if (profile) {
    const { streak, longest_streak, last_active_date } = calculateStreak(
      profile.streak,
      profile.longest_streak,
      profile.last_active_date
    )
    await supabase
      .from('profiles')
      .update({
        xp:               profile.xp + challenge.xp_reward,
        streak,
        longest_streak,
        last_active_date,
      })
      .eq('id', user.id)
  }

  return NextResponse.json({ challenge: { ...challenge, completed: true }, xpGained: challenge.xp_reward })
}

