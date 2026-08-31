// Server-only. Extracts the REAL CHALLENGES array + CHALLENGE_LESSON content
// straight out of the live public/lessons/igcse-y1.html / igcse-y2.html —
// same eval technique as lib/grade{6,7,8,9}-content.ts.
//
// Different again from every other grade: CHALLENGES is one FLAT array
// (no world/module container at all — just a `mod:'M1'` string tag per
// challenge, purely a label used for display/comments, not a real grouping
// object), and challenges have NO stable id field whatsoever — only
// `mod`+`name`, and CHALLENGE_LESSON is keyed by that compound
// 'mod/name' string. Renaming a challenge's `name` via an override would
// silently break that compound key on the NEXT edit (the exact Grade 9 tier
// pitfall) — so both stage and lesson overrides here are keyed by the
// challenge's ARRAY INDEX instead, and the lesson lookup is resolved
// server-side using each challenge's ORIGINAL (pre-rename) mod/name, then
// re-exposed to the client keyed by index too, so the client never has to
// reason about the compound key at all.
//
// Never import this from a client component — it uses `fs`.
import { readFileSync } from 'fs'
import path from 'path'

export interface IgcseChallenge {
  mod:  string
  name: string
  xp?:  number
  type?: string
  [key: string]: unknown
}

export interface IgcseLesson {
  title: string
  html:  string
}

export interface IgcseContent {
  challenges: IgcseChallenge[]
  lessons:    Record<string, IgcseLesson>   // keyed by challenge ARRAY INDEX (string), not the compound key
}

export type IgcseFile = 'igcse-y1' | 'igcse-y2'

export function getIgcseContent(file: IgcseFile): IgcseContent {
  const html = readFileSync(path.join(process.cwd(), 'public', 'lessons', `${file}.html`), 'utf8')
  // STAGE_INDEX is declared BEFORE CHALLENGE_LESSON in these two files
  // (the reverse of every other grade) — slice through CHALLENGE_LESSON's
  // own closing brace instead of assuming a fixed "next const" marker.
  const s = html.indexOf('const CHALLENGES')
  const lessonStart = html.indexOf('const CHALLENGE_LESSON')
  const e = html.indexOf('\n}', lessonStart) + 2
  const ctx = html.slice(s, e)
  const { CHALLENGES, CHALLENGE_LESSON } = new Function(ctx + '\nreturn { CHALLENGES, CHALLENGE_LESSON }')() as
    { CHALLENGES: IgcseChallenge[]; CHALLENGE_LESSON: Record<string, IgcseLesson> }

  const lessons: Record<string, IgcseLesson> = {}
  CHALLENGES.forEach((ch, i) => {
    const compoundKey = `${ch.mod}/${ch.name}`
    const lesson = CHALLENGE_LESSON[compoundKey]
    if (lesson) lessons[String(i)] = lesson
  })

  return { challenges: CHALLENGES, lessons }
}

// ── Merge overrides onto the base content ────────────────────────────────────
// scope='stage'  → target_id is the challenge's array INDEX (as a string)
// scope='lesson' → same — index, not the compound mod/name key
export interface OverrideRow {
  scope:         'stage' | 'lesson'
  target_id:     string
  override_data: Record<string, unknown>
}

export function applyOverrides(content: IgcseContent, overrides: OverrideRow[]): IgcseContent {
  const stageOverrides  = new Map(overrides.filter(o => o.scope === 'stage').map(o => [o.target_id, o.override_data]))
  const lessonOverrides = new Map(overrides.filter(o => o.scope === 'lesson').map(o => [o.target_id, o.override_data]))

  const challenges = content.challenges.map((ch, i) => {
    const so = stageOverrides.get(String(i))
    return so ? { ...ch, ...so } : ch
  })

  const lessons: Record<string, IgcseLesson> = {}
  for (const [idx, lesson] of Object.entries(content.lessons)) {
    const lo = lessonOverrides.get(idx)
    lessons[idx] = lo ? { ...lesson, ...lo } as IgcseLesson : lesson
  }
  for (const [idx, data] of lessonOverrides) {
    if (!lessons[idx]) lessons[idx] = data as unknown as IgcseLesson
  }

  return { challenges, lessons }
}
