// Server-only. Extracts the REAL, complete Grade 6 WORLDS array AND the
// separate STAGE_LESSON explainer content straight out of the live
// public/lessons/grade6.html — same eval technique already used by
// scripts/test-g6-maze.mjs and lib/grade-progress.ts, but keeping every raw
// field (grid, target, par, goal, ...) instead of just id/name/xp, since the
// teacher editor needs the full shape to edit and preview it.
//
// STAGE_LESSON is a SEPARATE object from WORLDS — it's the real explainer
// text shown above a stage (e.g. "What's a sequence?"), distinct from the
// stage's own one-line `goal` field. The first version of this editor only
// exposed WORLDS/stage data, silently missing the actual lesson content a
// teacher would most want to edit.
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

export interface StageLesson {
  title: string
  html:  string
}

export interface Grade6Content {
  worlds:       Grade6World[]
  stageLessons: Record<string, StageLesson>
}

export function getGrade6Content(): Grade6Content {
  const html = readFileSync(path.join(process.cwd(), 'public', 'lessons', 'grade6.html'), 'utf8')
  const s = html.indexOf('const W1_STAGES = [')
  const e = html.indexOf('// ── Real progress: bridge')
  const ctx = html.slice(s, e)
  const { WORLDS, STAGE_LESSON } = new Function(ctx + '\nreturn { WORLDS, STAGE_LESSON }')() as
    { WORLDS: Grade6World[]; STAGE_LESSON: Record<string, StageLesson> }
  return { worlds: WORLDS, stageLessons: STAGE_LESSON }
}

// ── Merge overrides onto the base worlds/lessons ─────────────────────────────
// Shallow-merges each override's fields onto the matching world/stage/lesson
// object. A world-scope override never touches its `stages` array (that's
// only ever edited stage-by-stage) — merging {stages: [...]} in from a world
// override would silently blow away every other stage's edits.
export interface OverrideRow {
  scope:         'world' | 'stage' | 'lesson'
  target_id:     string
  override_data: Record<string, unknown>
}

export function applyOverrides(content: Grade6Content, overrides: OverrideRow[]): Grade6Content {
  const worldOverrides  = new Map(overrides.filter(o => o.scope === 'world').map(o => [o.target_id, o.override_data]))
  const stageOverrides  = new Map(overrides.filter(o => o.scope === 'stage').map(o => [o.target_id, o.override_data]))
  const lessonOverrides = new Map(overrides.filter(o => o.scope === 'lesson').map(o => [o.target_id, o.override_data]))

  const worlds = content.worlds.map(w => {
    const wo = worldOverrides.get(w.id)
    const mergedWorld: Grade6World = wo ? { ...w, ...wo, stages: w.stages } : w
    const mergedStages = mergedWorld.stages.map(s => {
      const id = s.id as string
      const so = stageOverrides.get(id)
      return so ? { ...s, ...so } : s
    })
    return { ...mergedWorld, stages: mergedStages }
  })

  const stageLessons: Record<string, StageLesson> = {}
  for (const [id, lesson] of Object.entries(content.stageLessons)) {
    const lo = lessonOverrides.get(id)
    stageLessons[id] = lo ? { ...lesson, ...lo } as StageLesson : lesson
  }
  // An override can also target a stage id that has NO existing lesson yet
  // (a stage previously "hides the lesson panel", per STAGE_LESSON's own
  // comment) — a teacher adding one for the first time should work too.
  for (const [id, data] of lessonOverrides) {
    if (!stageLessons[id]) stageLessons[id] = data as unknown as StageLesson
  }

  return { worlds, stageLessons }
}
