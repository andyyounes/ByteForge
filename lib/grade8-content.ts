// Server-only. Extracts the REAL MODULES array AND the separate
// CHALLENGE_LESSON explainer content straight out of the live
// public/lessons/grade8.html — same technique as lib/grade7-content.ts.
// See that file's comment for why stage check() functions are never sent
// to the browser (NextResponse.json/JSON.stringify silently drops them).
//
// Never import this from a client component — it uses `fs`.
import { readFileSync } from 'fs'
import path from 'path'

export interface Grade8Module {
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

export interface Grade8Content {
  modules:          Grade8Module[]
  challengeLessons: Record<string, ChallengeLesson>
}

export function getGrade8Content(): Grade8Content {
  const html = readFileSync(path.join(process.cwd(), 'public', 'lessons', 'grade8.html'), 'utf8')
  // Starting the slice at 'const MODULES = [' itself is NOT enough — several
  // stages (Colors & Shading's web3 quizzes, the palette-driven challenges)
  // reference COLOR_PALETTE/swatchChip/isAllowedColor/colorBrightness/etc,
  // which are defined BEFORE the MODULES declaration. Missing them makes
  // this whole function throw ReferenceError the instant it evaluates any
  // stage using them — this is exactly the bug a teacher hit live (the
  // /api/teacher/grade8-content route surfaces it as "Failed to load
  // curriculum data"). scripts/test-g8-challenges.mjs already had to make
  // this same fix for the same reason — reusing its exact start marker.
  const s = html.indexOf('// ── Colors & Shading — shared palette data')
  const e = html.indexOf('const STAGE_INDEX')
  const ctx = html.slice(s, e)
  const { MODULES, CHALLENGE_LESSON } = new Function(ctx + '\nreturn { MODULES, CHALLENGE_LESSON }')() as
    { MODULES: Grade8Module[]; CHALLENGE_LESSON: Record<string, ChallengeLesson> }
  return { modules: MODULES, challengeLessons: CHALLENGE_LESSON }
}

// ── Merge overrides onto the base modules/lessons ────────────────────────────
export interface OverrideRow {
  scope:         'world' | 'stage' | 'lesson'   // 'world' scope reused for module-level fields
  target_id:     string
  override_data: Record<string, unknown>
}

export function applyOverrides(content: Grade8Content, overrides: OverrideRow[]): Grade8Content {
  const moduleOverrides = new Map(overrides.filter(o => o.scope === 'world').map(o => [o.target_id, o.override_data]))
  const stageOverrides  = new Map(overrides.filter(o => o.scope === 'stage').map(o => [o.target_id, o.override_data]))
  const lessonOverrides = new Map(overrides.filter(o => o.scope === 'lesson').map(o => [o.target_id, o.override_data]))

  const modules = content.modules.map(m => {
    const mo = moduleOverrides.get(m.id)
    const mergedModule: Grade8Module = mo ? { ...m, ...mo, stages: m.stages } : m
    const mergedStages = mergedModule.stages.map(s => {
      const id = s.id as string
      const so = stageOverrides.get(id)
      return so ? { ...s, ...so } : s
    })
    return { ...mergedModule, stages: mergedStages }
  })

  const challengeLessons: Record<string, ChallengeLesson> = {}
  for (const [id, lesson] of Object.entries(content.challengeLessons)) {
    const lo = lessonOverrides.get(id)
    challengeLessons[id] = lo ? { ...lesson, ...lo } as ChallengeLesson : lesson
  }
  for (const [id, data] of lessonOverrides) {
    if (!challengeLessons[id]) challengeLessons[id] = data as unknown as ChallengeLesson
  }

  return { modules, challengeLessons }
}
