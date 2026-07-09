// ============================================================
//  ByteForge — Stage configuration
//  6 curriculum stages with accent colours & grade ranges
// ============================================================

import type { StageConfig, StageId } from '@/types'

// All student stages share the same amber/yellow accent so every grade's
// dashboard looks visually consistent.  Teacher accounts get a separate
// orange accent set in StageAccentProvider / AppShell.
const STUDENT_ACCENT     = '#eab308'   // amber — matches --yellow / --amber
const STUDENT_ACCENT_DIM = '#ca8a04'

export const STAGE_CONFIGS: StageConfig[] = [
  {
    id:         'grade6',
    label:      'Grade 6',
    shortLabel: 'Gr 6',
    accent:     STUDENT_ACCENT,
    accentDim:  STUDENT_ACCENT_DIM,
    gradeMin:   6,
    gradeMax:   6,
  },
  {
    id:         'grade7',
    label:      'Grade 7',
    shortLabel: 'Gr 7',
    accent:     STUDENT_ACCENT,
    accentDim:  STUDENT_ACCENT_DIM,
    gradeMin:   7,
    gradeMax:   7,
  },
  {
    id:         'grade8',
    label:      'Grade 8',
    shortLabel: 'Gr 8',
    accent:     STUDENT_ACCENT,
    accentDim:  STUDENT_ACCENT_DIM,
    gradeMin:   8,
    gradeMax:   8,
  },
  {
    id:         'grade9',
    label:      'Grade 9',
    shortLabel: 'Gr 9',
    accent:     STUDENT_ACCENT,
    accentDim:  STUDENT_ACCENT_DIM,
    gradeMin:   9,
    gradeMax:   9,
  },
  // ── Legacy stages (kept for existing students — do not remove) ──────────────
  {
    id:         'igcse',
    label:      'IGCSE',
    shortLabel: 'IGCSE',
    accent:     STUDENT_ACCENT,
    accentDim:  STUDENT_ACCENT_DIM,
    gradeMin:   10,
    gradeMax:   11,
  },
  {
    id:         'as_a',
    label:      'AS / A Level',
    shortLabel: 'AS/A',
    accent:     STUDENT_ACCENT,
    accentDim:  STUDENT_ACCENT_DIM,
    gradeMin:   12,
    gradeMax:   13,
  },

  // ── New granular tracks (Grade 10–13) ────────────────────────────────────
  {
    id:         'igcse_y1',
    label:      'IGCSE Year 1',
    shortLabel: 'IGCSE 1',
    accent:     STUDENT_ACCENT,
    accentDim:  STUDENT_ACCENT_DIM,
    gradeMin:   10,
    gradeMax:   10,
  },
  {
    id:         'igcse_y2',
    label:      'IGCSE Year 2',
    shortLabel: 'IGCSE 2',
    accent:     STUDENT_ACCENT,
    accentDim:  STUDENT_ACCENT_DIM,
    gradeMin:   11,
    gradeMax:   11,
  },
  {
    id:         'as_level',
    label:      'AS Level',
    shortLabel: 'AS',
    accent:     STUDENT_ACCENT,
    accentDim:  STUDENT_ACCENT_DIM,
    gradeMin:   12,
    gradeMax:   12,
  },
  {
    id:         'a_level',
    label:      'A Level',
    shortLabel: 'A Lvl',
    accent:     STUDENT_ACCENT,
    accentDim:  STUDENT_ACCENT_DIM,
    gradeMin:   13,
    gradeMax:   13,
  },
]

/** Fast O(1) lookup by stage id */
export const STAGE_MAP = new Map<StageId, StageConfig>(
  STAGE_CONFIGS.map(s => [s.id, s])
)

/** Get stage config for a given id (throws if not found — should never happen). */
export function getStageConfig(id: StageId): StageConfig {
  const cfg = STAGE_MAP.get(id)
  if (!cfg) throw new Error(`Unknown stage id: ${id}`)
  return cfg
}

/** Infer the most appropriate StageId for a numeric grade string (e.g. "9"). */
export function gradeToStageId(grade: string): StageId {
  const g = parseInt(grade, 10)
  if (isNaN(g)) return 'grade7'
  if (g <= 6)   return 'grade6'
  if (g === 7)  return 'grade7'
  if (g === 8)  return 'grade8'
  if (g === 9)  return 'grade9'
  if (g === 10) return 'igcse_y1'
  if (g === 11) return 'igcse_y2'
  if (g === 12) return 'as_level'
  return 'a_level'    // grade 13+
}

/** Default stage for brand new accounts (Grade 7 — placement quiz sets the real one). */
export const DEFAULT_STAGE: StageId = 'grade7'
