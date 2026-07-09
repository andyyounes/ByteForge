// ============================================================
//  ByteForge — XP & Level system helpers
//  Formula must stay in sync with the SQL generated column:
//  GREATEST(1, floor(sqrt(xp::float / 80))::int + 1)
// ============================================================

import type { XpBarInfo } from '@/types'

// ── Level calculation ─────────────────────────────────────────────────────────

/** Level from a raw XP number. Matches the DB generated column exactly. */
export function xpToLevel(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(xp / 80)) + 1)
}

/** Total XP required to *reach* the given level (i.e. the level's floor). */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  return Math.pow(level - 1, 2) * 80
}

/** Total XP required to *reach* the next level above `currentLevel`. */
export function xpForNextLevel(currentLevel: number): number {
  return xpForLevel(currentLevel + 1)
}

// ── XP bar state ──────────────────────────────────────────────────────────────

/**
 * Returns progress-bar data for a given raw XP total.
 *
 * @example
 * xpBar(200) → { pct: 56, current: 40, next: 80, remaining: 40 }
 */
export function xpBar(xp: number): XpBarInfo {
  const level    = xpToLevel(xp)
  const current  = xp - xpForLevel(level)           // XP into current level
  const next     = xpForNextLevel(level) - xpForLevel(level)  // XP span of current level
  const remaining= next - current                    // XP needed for next level
  const pct      = next > 0 ? Math.min(100, Math.round((current / next) * 100)) : 100

  return { pct, current, next, remaining }
}

// ── Title / rank labels ───────────────────────────────────────────────────────

const LEVEL_TITLES: readonly string[] = [
  // 1-5
  'Bit Beginner', 'Binary Apprentice', 'Ternary Apprentice', 'Logic Explorer', 'Byte Builder',
  // 6-10
  'Algorithm Analyst', 'Data Detective', 'Loop Legend', 'Function Forger', 'Byte Forger',
  // 11-15
  'Stack Scholar', 'Recursion Ranger', 'OOP Oracle', 'Network Ninja', 'Compiler Craftsman',
  // 16-20
  'Bit Wizard', 'Code Sage', 'Logic Master', 'Algorithm Architect', 'ByteForge Champion',
]

/** Flavour title for a given level (caps at highest defined). */
export function levelTitle(level: number): string {
  const idx = Math.min(level - 1, LEVEL_TITLES.length - 1)
  return LEVEL_TITLES[Math.max(0, idx)]
}

// ── XP reward helpers ─────────────────────────────────────────────────────────

/** XP multiplier based on difficulty (1–4). */
export function difficultyMultiplier(difficulty: 1 | 2 | 3 | 4): number {
  return [1, 1.25, 1.6, 2][difficulty - 1]
}

/** Base XP for an exercise attempt given difficulty and whether it passed. */
export function exerciseXp(
  baseReward: number,
  difficulty: 1 | 2 | 3 | 4,
  passed: boolean,
  attemptNumber: number
): number {
  if (!passed) return 0
  const mult    = difficultyMultiplier(difficulty)
  // Diminishing returns after the first pass: 50% for 2nd+
  const attempt = attemptNumber <= 1 ? 1 : 0.5
  return Math.round(baseReward * mult * attempt)
}
