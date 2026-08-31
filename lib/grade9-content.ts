// Server-only. Extracts the REAL MISSIONS array, TIERS (the 24 chapters that
// actually drive the map — a SEPARATE structure from MISSIONS, grouping
// mission ids), and MISSION_LESSON straight out of the live
// public/lessons/grade9-missions.html.
//
// Grade 9's shape is genuinely different from Grade 6/7/8:
//  - There's no per-module "stages" array — MISSIONS is one flat list of 76
//    missions, and TIERS separately groups mission IDS into 24 named
//    chapters. A tier has no own id field, so its ARRAY INDEX (stable —
//    order never changes) is used as the override key, not its name (a
//    name-keyed override would silently orphan itself the moment a teacher
//    renamed a tier and then tried to edit it again).
//  - A `type:'learn'` mission carries its OWN inline lesson content
//    (`learn.theory`/`learn.terms`) — already part of its editable JSON, no
//    separate lookup needed. Other mission types (data/battle/flowchart) get
//    their explainer from MISSION_LESSON, same {title,html} shape as Grade
//    6/7/8's separate lesson objects.
//  - Missions carry real functions too (e.g. a battle enemy's adaptive
//    `attack: ctx => ...`), nested inside `battle.enemies[i].attack` rather
//    than a top-level `check()` — NextResponse.json/JSON.stringify drops
//    function-valued properties at ANY depth, so this is still safe by
//    construction, same guarantee as Grade 7/8's stripped check().
//
// EXTRACTION QUIRK: unlike Grade 6/7/8 (whose WORLDS/MODULES sit right next
// to their lesson object, nothing else in between), roughly 2000 lines of
// real page logic (bot AI, win/lose screens, rendering functions) sit
// textually BETWEEN MISSION_LESSON and TIERS in the file. That code is only
// ever *executed* from inside function bodies (safe — function
// declarations don't run at parse time) EXCEPT for a couple of genuine
// top-level DOM calls (e.g. wiring up a canvas context immediately on
// script load) that throw in a plain Node `document`-less context. A
// permissive stub (any property access on a stubbed document/window
// returns another stubbed no-op) survives those without needing to know in
// advance what they touch.
//
// Never import this from a client component — it uses `fs`.
import { readFileSync } from 'fs'
import path from 'path'

export interface Mission {
  id:    string
  type:  string
  title: string
  emoji?: string
  xp?:   number
  phase?: string
  [key: string]: unknown
}

export interface Tier {
  name: string
  ids:  string[]
}

export interface MissionLesson {
  title: string
  html:  string
}

export interface Grade9Content {
  tiers:          Tier[]
  missions:       Record<string, Mission>
  missionLessons: Record<string, MissionLesson>
}

const DOM_STUB = `
function __fakeEl() {
  return new Proxy(function(){}, {
    get(t, prop) {
      if (prop === 'style') return new Proxy({}, { get: () => '', set: () => true })
      if (prop === 'classList') return { add(){}, remove(){}, toggle(){}, contains: () => false }
      if (prop === 'dataset') return {}
      return __fakeEl()
    },
    apply() { return __fakeEl() },
  })
}
const document = new Proxy({}, { get(t, prop) {
  if (prop === 'body' || prop === 'documentElement') return __fakeEl()
  return () => __fakeEl()
}})
const window = globalThis
const localStorage = { getItem: () => null, setItem() {}, removeItem() {} }
`

export function getGrade9Content(): Grade9Content {
  const html = readFileSync(path.join(process.cwd(), 'public', 'lessons', 'grade9-missions.html'), 'utf8')
  const s = html.indexOf('const MISSIONS = [')
  const tiersStart = html.indexOf('const TIERS = [')
  const e = html.indexOf('\n]', tiersStart) + 2
  const ctx = html.slice(s, e)
  const { MISSIONS, TIERS, MISSION_LESSON } = new Function(DOM_STUB + ctx + '\nreturn { MISSIONS, TIERS, MISSION_LESSON }')() as
    { MISSIONS: Mission[]; TIERS: Tier[]; MISSION_LESSON: Record<string, MissionLesson> }

  const missions: Record<string, Mission> = {}
  for (const m of MISSIONS) missions[m.id] = m

  return { tiers: TIERS, missions, missionLessons: MISSION_LESSON }
}

// ── Merge overrides onto the base content ────────────────────────────────────
// scope='world' → target_id is a TIER's array index as a string (tiers have
// no own id field, and their name isn't stable once edited);
// scope='stage' → target_id is a mission id; scope='lesson' → same.
export interface OverrideRow {
  scope:         'world' | 'stage' | 'lesson'
  target_id:     string
  override_data: Record<string, unknown>
}

export function applyOverrides(content: Grade9Content, overrides: OverrideRow[]): Grade9Content {
  const tierOverrides    = new Map(overrides.filter(o => o.scope === 'world').map(o => [o.target_id, o.override_data]))
  const missionOverrides = new Map(overrides.filter(o => o.scope === 'stage').map(o => [o.target_id, o.override_data]))
  const lessonOverrides  = new Map(overrides.filter(o => o.scope === 'lesson').map(o => [o.target_id, o.override_data]))

  // Keyed by ARRAY INDEX, not name — a tier has no own id field, and using
  // its (possibly already-renamed) name as the key would mean a second edit
  // after a rename targets a different key than the first, silently
  // creating an orphaned duplicate override row instead of updating it.
  // Index is stable across saves since tier order never changes.
  const tiers = content.tiers.map((t, i) => {
    const to = tierOverrides.get(String(i))
    return to ? { ...t, ...to, ids: t.ids } : t   // never let an override touch which missions belong to a tier
  })

  const missions: Record<string, Mission> = {}
  for (const [id, m] of Object.entries(content.missions)) {
    const mo = missionOverrides.get(id)
    missions[id] = mo ? { ...m, ...mo } : m
  }

  const missionLessons: Record<string, MissionLesson> = {}
  for (const [id, lesson] of Object.entries(content.missionLessons)) {
    const lo = lessonOverrides.get(id)
    missionLessons[id] = lo ? { ...lesson, ...lo } as MissionLesson : lesson
  }
  for (const [id, data] of lessonOverrides) {
    if (!missionLessons[id]) missionLessons[id] = data as unknown as MissionLesson
  }

  return { tiers, missions, missionLessons }
}
