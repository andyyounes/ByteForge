// ============================================================
//  ByteForge — Mastery scoring & status transitions
//  Pure TypeScript — no Supabase imports (works in any context)
// ============================================================

import type { ConceptMastery, MasteryStatus, MasteryMap, Profile } from '@/types'
import { CONCEPTS, conceptById, prereqsMet, ACHIEVEMENTS } from '@/lib/concepts'

// ── Mastery score formula ─────────────────────────────────────────────────────
//
//  Score is computed from the student's recent accuracy history (last 10 attempts).
//  Weights: recency-weighted moving average × consistency bonus − forgetting penalty
//
//  0–100 scale:
//    0–29   → 'started'
//   30–59   → 'practicing'
//   60–84   → 'practicing' (strong)
//   85+     → 'mastered'

const MASTERY_THRESHOLDS = {
  started:    0,
  practicing: 30,
  mastered:   85,
} as const

/**
 * Recompute the mastery score from a raw accuracy history array (1=correct, 0=wrong).
 * Uses an exponential moving average weighted toward recency.
 */
export function computeMasteryScore(accuracyHistory: number[]): number {
  if (accuracyHistory.length === 0) return 0

  const last10 = accuracyHistory.slice(-10)
  const n      = last10.length

  // Exponential weights: most recent attempt gets highest weight
  let weightedSum = 0
  let totalWeight = 0
  last10.forEach((correct, i) => {
    const weight = Math.pow(1.4, i)   // i=0 is oldest, i=n-1 is newest
    weightedSum += correct * weight
    totalWeight += weight
  })

  const accuracy = weightedSum / totalWeight    // 0–1

  // Consistency bonus: +5 if all last 5 correct, +10 if all last 8 correct
  const last5  = last10.slice(-5)
  const last8  = last10.slice(-8)
  let bonus = 0
  if (last5.length === 5  && last5.every(Boolean))  bonus += 5
  if (last8.length === 8  && last8.every(Boolean))  bonus += 10

  // Attempt scaling: score is dampened until student has ≥4 attempts
  const attemptScale = Math.min(1, n / 4)

  const raw = accuracy * 100 * attemptScale + bonus
  return Math.min(100, Math.round(raw))
}

/**
 * Given a mastery score, return the MasteryStatus it represents.
 * Does NOT check prerequisites — that is handled by `recalculateAvailability`.
 */
export function scoreToStatus(score: number): MasteryStatus {
  if (score >= MASTERY_THRESHOLDS.mastered)   return 'mastered'
  if (score >= MASTERY_THRESHOLDS.practicing)  return 'practicing'
  if (score > 0)                               return 'started'
  return 'available'   // 0 score with no attempts → available
}

// ── Attempt recording ─────────────────────────────────────────────────────────

export interface AttemptResult {
  updatedMastery: ConceptMastery
  newlyMastered:  boolean
  scoreChange:    number
}

/**
 * Record a new attempt on a concept and return the updated ConceptMastery record.
 * Call this in the `/api/progress` route handler.
 */
export function recordAttempt(
  current: ConceptMastery,
  correct: boolean,
  timeSpentMs: number,
  weaknesses: string[] = []
): AttemptResult {
  const prevScore = current.mastery_score

  const newHistory = [...current.accuracy_history, correct ? 1 : 0]
  const newScore   = computeMasteryScore(newHistory)
  const newStatus  = scoreToStatus(newScore)
  // Never regress from 'mastered' once reached
  const finalStatus: MasteryStatus =
    current.status === 'mastered' && newStatus !== 'mastered'
      ? 'mastered'
      : newStatus

  const updatedMastery: ConceptMastery = {
    ...current,
    mastery_score:    newScore,
    status:           finalStatus,
    attempts:         current.attempts + 1,
    correct_attempts: current.correct_attempts + (correct ? 1 : 0),
    accuracy_history: newHistory.slice(-20),  // keep last 20 to cap storage
    weaknesses:       weaknesses.length ? weaknesses : current.weaknesses,
    time_spent_ms:    current.time_spent_ms + timeSpentMs,
    last_practiced:   new Date().toISOString(),
  }

  return {
    updatedMastery,
    newlyMastered: finalStatus === 'mastered' && current.status !== 'mastered',
    scoreChange:   newScore - prevScore,
  }
}

// ── Availability recalculation ────────────────────────────────────────────────

/**
 * Recompute which concepts are 'available' for a student.
 * A concept is available when all its prerequisites are in 'practicing' or 'mastered'.
 * Locked concepts with unmet prereqs remain 'locked'.
 *
 * @param masteryMap  Current mastery map (conceptId → ConceptMastery)
 * @returns           Updated mastery map with corrected statuses
 */
export function recalculateAvailability(masteryMap: MasteryMap): MasteryMap {
  const practicingOrMastered = new Set(
    Object.entries(masteryMap)
      .filter(([, m]) => m.status === 'practicing' || m.status === 'mastered')
      .map(([id]) => id)
  )

  const updated: MasteryMap = { ...masteryMap }

  for (const concept of CONCEPTS) {
    const existing = updated[concept.id]

    // Skip already-started/practicing/mastered concepts
    if (existing && ['started', 'practicing', 'mastered'].includes(existing.status)) continue

    const meetsPrereqs = prereqsMet(concept.id, practicingOrMastered)

    if (existing) {
      // Transition locked → available when prereqs are now met
      if (existing.status === 'locked' && meetsPrereqs) {
        updated[concept.id] = { ...existing, status: 'available' }
      }
      // Transition available → locked if prereqs regressed (edge case)
      if (existing.status === 'available' && !meetsPrereqs && concept.prerequisites.length > 0) {
        updated[concept.id] = { ...existing, status: 'locked' }
      }
    }
  }

  return updated
}

/**
 * Build an initial MasteryMap for a new student.
 * Tier-0 concepts (no prerequisites) start as 'available'; everything else 'locked'.
 */
export function initialMasteryMap(studentId: string): ConceptMastery[] {
  const now = new Date().toISOString()
  return CONCEPTS.map(c => ({
    id:               crypto.randomUUID(),
    student_id:       studentId,
    concept_id:       c.id,
    mastery_score:    0,
    status:           (c.prerequisites.length === 0 ? 'available' : 'locked') as MasteryStatus,
    attempts:         0,
    correct_attempts: 0,
    accuracy_history: [],
    weaknesses:       [],
    time_spent_ms:    0,
    last_practiced:   null,
  }))
}

// ── Achievement checking ──────────────────────────────────────────────────────

/**
 * Check which achievements the student has newly unlocked.
 * Returns only achievements that are newly eligible (not already in `alreadyUnlocked`).
 */
export function checkNewAchievements(
  masteryMap:      MasteryMap,
  profile:         Profile,
  alreadyUnlocked: Set<string>
): typeof ACHIEVEMENTS[number][] {
  return ACHIEVEMENTS.filter(ach => {
    if (alreadyUnlocked.has(ach.id)) return false
    try {
      return ach.check(masteryMap, profile)
    } catch {
      return false
    }
  })
}

// ── Summary helpers ───────────────────────────────────────────────────────────

/** Count concepts by status for a student's mastery map. */
export function masteryStatusCounts(masteryMap: MasteryMap): Record<MasteryStatus, number> {
  const counts: Record<MasteryStatus, number> = {
    locked:     0,
    available:  0,
    started:    0,
    practicing: 0,
    mastered:   0,
  }
  for (const m of Object.values(masteryMap)) {
    counts[m.status] = (counts[m.status] ?? 0) + 1
  }
  return counts
}

/** Return the 3 weakest non-mastered concepts (lowest mastery score with attempts > 0). */
export function weakConcepts(masteryMap: MasteryMap, limit = 3): ConceptMastery[] {
  return Object.values(masteryMap)
    .filter(m => m.attempts > 0 && m.status !== 'mastered')
    .sort((a, b) => a.mastery_score - b.mastery_score)
    .slice(0, limit)
}
