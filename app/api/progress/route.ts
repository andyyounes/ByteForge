// @ts-nocheck
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { recordAttempt, recalculateAvailability, checkNewAchievements } from '@/lib/mastery'
import { calculateStreak } from '@/lib/adaptive'
import { exerciseXp, conceptCompletionXp } from '@/lib/xp'
import { conceptById, stageToGrade } from '@/lib/concepts'
import type { ConceptMastery, MasteryMap, Profile, UserAchievement } from '@/types'

// â”€â”€ Request schema â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const ProgressSchema = z.object({
  exercise_id:   z.string().uuid().optional(),
  lesson_id:     z.string().uuid().optional(),
  concept_id:    z.string(),
  correct:       z.boolean(),
  time_spent_ms: z.number().int().min(0).max(3_600_000),
  weaknesses:    z.array(z.string()).default([]),
  code:          z.string().optional(),
  output:        z.string().optional(),
  score:         z.number().min(0).max(100).optional(),
})

// â”€â”€ POST /api/progress â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = ProgressSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { concept_id, correct, time_spent_ms, weaknesses, exercise_id, lesson_id, code, output, score } = parsed.data

  // â”€â”€ Fetch existing mastery record â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  let { data: existingRow } = await supabase
    .from('concept_mastery')
    .select('*')
    .eq('student_id', user.id)
    .eq('concept_id', concept_id)
    .single<ConceptMastery>()

  // Self-healing instead of a hard 404: a student onboarded before a concept
  // existed (or before it was added to a lesson page's own progress-reporting
  // code) has no row for it yet. lib/concepts.ts is the single source of
  // truth for every concept that should exist, so if concept_id is real,
  // create the row now rather than silently dropping the student's progress —
  // that is exactly the failure mode that made Grade 7/8 report nothing to
  // the real dashboard for months.
  if (!existingRow) {
    const concept = conceptById(concept_id)
    if (!concept) {
      return NextResponse.json({ error: 'Unknown concept_id' }, { status: 404 })
    }
    const { data: inserted, error: insertError } = await supabase
      .from('concept_mastery')
      .insert({
        student_id:       user.id,
        concept_id,
        mastery_score:    0,
        status:           concept.prerequisites.length === 0 ? 'available' : 'locked',
        attempts:         0,
        correct_attempts: 0,
        accuracy_history: [],
        weaknesses:       [],
        time_spent_ms:    0,
        last_practiced:   null,
      })
      .select('*')
      .single<ConceptMastery>()
    if (insertError || !inserted) {
      console.error('[POST /api/progress] backfill insert failed:', insertError)
      return NextResponse.json({ error: 'Concept mastery record not found' }, { status: 404 })
    }
    existingRow = inserted
  }

  // â”€â”€ Compute updated mastery â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // First-ever attempt at this concept — used below to award concept-completion
  // XP exactly once per concept (grade-differentiated), guarding against a
  // student re-triggering the same challenge's progress report repeatedly.
  const isFirstAttemptAtConcept = existingRow.attempts === 0

  const { updatedMastery, newlyMastered, scoreChange } = recordAttempt(
    existingRow,
    correct,
    time_spent_ms,
    weaknesses
  )

  // â”€â”€ Fetch all mastery rows to recalculate availability â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { data: allMasteries } = await supabase
    .from('concept_mastery')
    .select('*')
    .eq('student_id', user.id)

  const masteryMap: MasteryMap = {}
  for (const row of (allMasteries ?? []) as ConceptMastery[]) {
    masteryMap[row.concept_id] = row
  }
  masteryMap[concept_id] = updatedMastery

  const recalculated = recalculateAvailability(masteryMap)

  // â”€â”€ Fetch current profile for XP/streak calculation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // â”€â”€ XP reward â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  let xpGained = 0
  if (exercise_id && correct) {
    const { data: exercise } = await supabase
      .from('exercises')
      .select('xp_reward, difficulty')
      .eq('id', exercise_id)
      .single()

    if (exercise) {
      // Count previous successful attempts
      const { count } = await supabase
        .from('progress')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', user.id)
        .eq('exercise_id', exercise_id)
        .eq('passed', true)

      xpGained = exerciseXp(
        exercise.xp_reward,
        exercise.difficulty,
        correct,
        (count ?? 0) + 1
      )
    }
  }

  // Concept-only report (Grade 6-9, IGCSE, AS/A Level lesson pages — no
  // exercises table row to look up xp_reward from). Award a grade-differentiated
  // amount once per concept, otherwise these calls granted ~0 XP despite
  // correctly updating mastery/status.
  if (!exercise_id && correct && isFirstAttemptAtConcept) {
    xpGained += conceptCompletionXp(stageToGrade(profile.stage))
  }

  // Mastery achievement bonus
  if (newlyMastered) xpGained += 25

  // â”€â”€ Streak update â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { streak, longest_streak, last_active_date } = calculateStreak(
    profile.streak,
    profile.longest_streak,
    profile.last_active_date
  )

  // â”€â”€ Write to DB (in parallel where possible) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const updates: Promise<unknown>[] = []

  // 1. Update the concept_mastery row
  updates.push(
    supabase
      .from('concept_mastery')
      .update({
        mastery_score:    updatedMastery.mastery_score,
        status:           updatedMastery.status,
        attempts:         updatedMastery.attempts,
        correct_attempts: updatedMastery.correct_attempts,
        accuracy_history: updatedMastery.accuracy_history,
        weaknesses:       updatedMastery.weaknesses,
        time_spent_ms:    updatedMastery.time_spent_ms,
        last_practiced:   updatedMastery.last_practiced,
      })
      .eq('student_id', user.id)
      .eq('concept_id', concept_id)
  )

  // 2. Bulk-update newly unlocked concepts
  const newlyAvailable = Object.entries(recalculated)
    .filter(([id, m]) =>
      id !== concept_id &&
      m.status === 'available' &&
      masteryMap[id]?.status === 'locked'
    )
    .map(([id]) => id)

  if (newlyAvailable.length > 0) {
    updates.push(
      supabase
        .from('concept_mastery')
        .update({ status: 'available' })
        .eq('student_id', user.id)
        .in('concept_id', newlyAvailable)
    )
  }

  // 3. Insert progress record
  updates.push(
    supabase.from('progress').insert({
      student_id:     user.id,
      exercise_id:    exercise_id ?? null,
      lesson_id:      lesson_id   ?? null,
      completed:      correct,
      score:          score ?? null,
      code:           code  ?? null,
      output:         output ?? null,
      passed:         correct,
      attempt_number: updatedMastery.attempts,
      submitted_at:   new Date().toISOString(),
    })
  )

  // 4. Update profile XP + streak
  updates.push(
    supabase
      .from('profiles')
      .update({
        xp:               profile.xp + xpGained,
        streak,
        longest_streak,
        last_active_date,
      })
      .eq('id', user.id)
  )

  await Promise.all(updates)

  // â”€â”€ Achievement check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { data: existingAchievements } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('student_id', user.id)

  const alreadyUnlocked = new Set(
    (existingAchievements ?? []).map((a: { achievement_id: string }) => a.achievement_id)
  )

  const updatedProfile = { ...profile, xp: profile.xp + xpGained, streak, longest_streak }
  const newAchievements = checkNewAchievements(
    { ...masteryMap, [concept_id]: updatedMastery },
    updatedProfile,
    alreadyUnlocked
  )

  if (newAchievements.length > 0) {
    await supabase.from('user_achievements').insert(
      newAchievements.map(a => ({
        student_id:     user.id,
        achievement_id: a.id,
        unlocked_at:    new Date().toISOString(),
        xp_earned:      a.xp,
      }))
    )
    // Award achievement XP
    const bonusXp = newAchievements.reduce((s, a) => s + a.xp, 0)
    if (bonusXp > 0) {
      await supabase
        .from('profiles')
        .update({ xp: updatedProfile.xp + bonusXp })
        .eq('id', user.id)
    }
  }

  return NextResponse.json({
    masteryScore:   updatedMastery.mastery_score,
    masteryStatus:  updatedMastery.status,
    newlyMastered,
    scoreChange,
    xpGained,
    newlyAvailable,
    newAchievements: newAchievements.map(a => ({ id: a.id, name: a.name, icon: a.icon, xp: a.xp })),
  })
}

