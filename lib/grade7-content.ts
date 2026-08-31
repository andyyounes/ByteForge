// Server-only. Extracts the REAL WORLDS array AND the separate
// CHALLENGE_LESSON explainer content straight out of the live
// public/lessons/grade7.html — same technique as lib/grade6-content.ts.
//
// Grade 7's stages carry REAL check() functions (unlike Grade 6's pure-data
// stages) — those are never sent to the browser. NextResponse.json's
// underlying JSON.stringify silently drops function-valued properties, so
// a stage's check() logic never round-trips to the client and can never be
// edited or overwritten by an override; only the genuinely safe, editable
// fields (name/xp/text/hints/questions/etc.) ever reach the teacher UI.
//
// Never import this from a client component — it uses `fs`.
import { readFileSync } from 'fs'
import path from 'path'

export interface Grade7World {
  id:     string
  name:   string
  sub:    string
  live?:  boolean
  stages: Record<string, unknown>[]
}

export interface ChallengeLesson {
  title: string
  html:  string
}

export interface Grade7Content {
  worlds:           Grade7World[]
  challengeLessons: Record<string, ChallengeLesson>
}

export function getGrade7Content(): Grade7Content {
  const html = readFileSync(path.join(process.cwd(), 'public', 'lessons', 'grade7.html'), 'utf8')
  const s = html.indexOf('const WORLDS = [')
  const e = html.indexOf('const STAGE_INDEX')
  const ctx = html.slice(s, e)
  const { WORLDS, CHALLENGE_LESSON } = new Function(ctx + '\nreturn { WORLDS, CHALLENGE_LESSON }')() as
    { WORLDS: Grade7World[]; CHALLENGE_LESSON: Record<string, ChallengeLesson> }
  return { worlds: WORLDS, challengeLessons: CHALLENGE_LESSON }
}

// ── Merge overrides onto the base worlds/lessons ─────────────────────────────
export interface OverrideRow {
  scope:         'world' | 'stage' | 'lesson'
  target_id:     string
  override_data: Record<string, unknown>
}

export function applyOverrides(content: Grade7Content, overrides: OverrideRow[]): Grade7Content {
  const worldOverrides  = new Map(overrides.filter(o => o.scope === 'world').map(o => [o.target_id, o.override_data]))
  const stageOverrides  = new Map(overrides.filter(o => o.scope === 'stage').map(o => [o.target_id, o.override_data]))
  const lessonOverrides = new Map(overrides.filter(o => o.scope === 'lesson').map(o => [o.target_id, o.override_data]))

  const worlds = content.worlds.map(w => {
    const wo = worldOverrides.get(w.id)
    const mergedWorld: Grade7World = wo ? { ...w, ...wo, stages: w.stages } : w
    const mergedStages = mergedWorld.stages.map(s => {
      const id = s.id as string
      const so = stageOverrides.get(id)
      return so ? { ...s, ...so } : s
    })
    return { ...mergedWorld, stages: mergedStages }
  })

  const challengeLessons: Record<string, ChallengeLesson> = {}
  for (const [id, lesson] of Object.entries(content.challengeLessons)) {
    const lo = lessonOverrides.get(id)
    challengeLessons[id] = lo ? { ...lesson, ...lo } as ChallengeLesson : lesson
  }
  for (const [id, data] of lessonOverrides) {
    if (!challengeLessons[id]) challengeLessons[id] = data as unknown as ChallengeLesson
  }

  return { worlds, challengeLessons }
}
