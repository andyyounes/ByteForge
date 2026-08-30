// Server-only. Extracts the REAL, complete Grade 6 WORLDS array straight out
// of the live public/lessons/grade6.html — same eval technique already used
// by scripts/test-g6-maze.mjs and lib/grade-progress.ts, but keeping every
// raw field (grid, target, par, goal, ...) instead of just id/name/xp, since
// the teacher editor needs the full stage shape to edit and preview it.
//
// Grade 6's stage objects are pure data (no functions) — confirmed by reading
// every W*_STAGES array — so this is safe to JSON-serialize and send to the
// browser, unlike Grade 7/8/9 whose stages carry real check() functions.
//
// Never import this from a client component — it uses `fs`.
import { readFileSync } from 'fs'
import path from 'path'

export interface Grade6World {
  id:     string
  name:   string
  sub:    string
  live?:  boolean
  stages: Record<string, unknown>[]
}

export function getGrade6Worlds(): Grade6World[] {
  const html = readFileSync(path.join(process.cwd(), 'public', 'lessons', 'grade6.html'), 'utf8')
  const s = html.indexOf('const W1_STAGES = [')
  const e = html.indexOf('// ── Real progress: bridge')
  const ctx = html.slice(s, e)
  const { WORLDS } = new Function(ctx + '\nreturn { WORLDS }')() as { WORLDS: Grade6World[] }
  return WORLDS
}

// ── Merge overrides onto the base worlds ─────────────────────────────────────
// Shallow-merges each override's fields onto the matching world/stage object.
// A world-scope override never touches its `stages` array (that's only ever
// edited stage-by-stage) — merging {stages: [...]} in from a world override
// would silently blow away every other stage's edits.
export interface OverrideRow {
  scope:         'world' | 'stage'
  target_id:     string
  override_data: Record<string, unknown>
}

export function applyOverrides(worlds: Grade6World[], overrides: OverrideRow[]): Grade6World[] {
  const worldOverrides = new Map(overrides.filter(o => o.scope === 'world').map(o => [o.target_id, o.override_data]))
  const stageOverrides = new Map(overrides.filter(o => o.scope === 'stage').map(o => [o.target_id, o.override_data]))

  return worlds.map(w => {
    const wo = worldOverrides.get(w.id)
    const mergedWorld: Grade6World = wo ? { ...w, ...wo, stages: w.stages } : w
    const mergedStages = mergedWorld.stages.map(s => {
      const id = s.id as string
      const so = stageOverrides.get(id)
      return so ? { ...s, ...so } : s
    })
    return { ...mergedWorld, stages: mergedStages }
  })
}
