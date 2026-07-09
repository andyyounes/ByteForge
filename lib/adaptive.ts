// ============================================================
//  ByteForge — Adaptive engine
//  Pure TypeScript port of public/js/adaptive.js
//  No Supabase imports — all inputs are plain data objects
// ============================================================

import type { ConceptMastery, MasteryMap, Suggestion, PathwayProgress } from '@/types'
import { CONCEPTS, PATHWAYS, conceptsForGrade, pathwaysForGrade } from '@/lib/concepts'

// ── Next concepts to study ────────────────────────────────────────────────────

/**
 * Suggest up to `limit` concepts for the student to work on next.
 * Only concepts with gradeMin ≤ studentGrade are considered.
 *
 * Priority order:
 *   1. 'practicing' — closest to mastered (reinforce before new topics)
 *   2. 'started'    — in-progress (continue, sorted easiest first)
 *   3. 'available'  — unlocked but not yet started (easiest + lowest tier first)
 */
export function suggestNext(masteryMap: MasteryMap, limit = 4, studentGrade = 13): Suggestion[] {
  function mastery(conceptId: string): ConceptMastery | null {
    return masteryMap[conceptId] ?? null
  }

  // Restrict the concept pool to what this grade level can see
  const pool = conceptsForGrade(studentGrade)

  const practicing = pool
    .filter(c => mastery(c.id)?.status === 'practicing')
    .sort((a, b) => (mastery(b.id)!.mastery_score - mastery(a.id)!.mastery_score))

  const started = pool
    .filter(c => mastery(c.id)?.status === 'started')
    .sort((a, b) => a.difficulty - b.difficulty)

  const available = pool
    .filter(c => mastery(c.id)?.status === 'available')
    .sort((a, b) => {
      // Surface concepts that use this grade's dedicated interactive mode first
      // (e.g. learningModes includes 'grade7' → variables-visual shown before
      // theory concepts for Grade 7 students, even though it has a higher tier).
      const aGradeMode = a.learningModes.some(m => m === `grade${studentGrade}`) ? 0 : 1
      const bGradeMode = b.learningModes.some(m => m === `grade${studentGrade}`) ? 0 : 1
      if (aGradeMode !== bGradeMode) return aGradeMode - bGradeMode
      return a.difficulty - b.difficulty || a.tier - b.tier
    })

  const combined = [...practicing, ...started, ...available]

  return combined.slice(0, limit).map(concept => {
    const m = mastery(concept.id)
    let reason: string
    if (m?.status === 'practicing') {
      reason = `${m.mastery_score}% mastered — keep going!`
    } else if (m?.status === 'started') {
      reason = 'Continue where you left off'
    } else {
      reason = `Unlocked · ~${concept.estimatedMinutes} min`
    }
    return { concept, mastery: m, reason }
  })
}

// ── Pathway progress ──────────────────────────────────────────────────────────

/**
 * Compute progress for pathways relevant to this student's grade.
 * Returns one entry per applicable pathway sorted by percent complete (descending).
 */
export function pathwayProgress(masteryMap: MasteryMap, studentGrade = 13): PathwayProgress[] {
  const visiblePathways = pathwaysForGrade(studentGrade)
  return visiblePathways.map(pathway => {
    const total    = pathway.conceptIds.length
    const mastered = pathway.conceptIds.filter(id => masteryMap[id]?.status === 'mastered').length
    const started  = pathway.conceptIds.filter(id =>
      ['started', 'practicing', 'mastered'].includes(masteryMap[id]?.status ?? '')
    ).length
    const pct = total > 0 ? Math.round((mastered / total) * 100) : 0
    return { pathway, total, mastered, started, pct }
  }).sort((a, b) => b.pct - a.pct)
}

// ── Weak area detection ───────────────────────────────────────────────────────

/**
 * Return up to `limit` concepts where the student has attempted but still struggles
 * (accuracy below 60% with at least 2 attempts), sorted by accuracy ascending.
 */
export function detectWeaknesses(masteryMap: MasteryMap, limit = 3): ConceptMastery[] {
  return Object.entries(masteryMap)
    .map(([, m]) => m)
    .filter(m => {
      if (m.attempts < 2) return false
      if (m.status === 'mastered') return false
      const accuracy = m.attempts > 0 ? m.correct_attempts / m.attempts : 1
      return accuracy < 0.6
    })
    .sort((a, b) => {
      const accA = a.correct_attempts / a.attempts
      const accB = b.correct_attempts / b.attempts
      return accA - accB
    })
    .slice(0, limit)
}

// ── Daily challenge selection ─────────────────────────────────────────────────

/**
 * Pick the best concept for today's daily challenge.
 * Prefers 'practicing' concepts (near mastery); falls back to 'available'.
 * Returns conceptId + xpReward.
 */
export function pickDailyChallengeConcept(masteryMap: MasteryMap): {
  conceptId: string
  xpReward:  number
} {
  const suggestions = suggestNext(masteryMap, 8)
  const pick = suggestions[0]?.concept ?? CONCEPTS[0]
  return { conceptId: pick.id, xpReward: 75 }
}

// ── Streak helpers ────────────────────────────────────────────────────────────

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function yesterdayIso(): string {
  return new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
}

/**
 * Calculate new streak values based on the last active date.
 * Returns { streak, longest_streak } — caller persists to DB.
 */
export function calculateStreak(
  currentStreak:  number,
  longestStreak:  number,
  lastActiveDate: string | null
): { streak: number; longest_streak: number; last_active_date: string } {
  const today     = todayIso()
  const yesterday = yesterdayIso()

  let streak = currentStreak

  if (lastActiveDate === today) {
    // Already active today — no change
  } else if (lastActiveDate === yesterday) {
    streak++
  } else {
    // Gap in activity — reset
    streak = 1
  }

  const longest_streak = Math.max(longestStreak, streak)
  return { streak, longest_streak, last_active_date: today }
}
