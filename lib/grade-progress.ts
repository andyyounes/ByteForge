// Server-only. Extracts each grade's module/stage metadata directly out of
// its live public/lessons/*.html file — the SAME "read the real source,
// eval the data array" technique scripts/test-g{6,7,8}-*.mjs already use for
// regression testing, reused here so the teacher progress panel can never
// silently drift out of sync with the actual shipped curriculum (a hardcoded
// second copy of module names/stage counts would).
//
// Never import this from a client component — it uses `fs` and reads from
// disk, so it only works in a Node.js server context (API routes).
import { readFileSync } from 'fs'
import path from 'path'

export interface StageInfo {
  id:         string
  name:       string
  xp:         number
  moduleId:   string
  moduleName: string
}

export interface ModuleInfo {
  id:     string
  name:   string
  stages: StageInfo[]
}

export interface GradeMeta {
  lessonKey: string        // the lesson_key saved rows use, e.g. 'grade7'
  modules:   ModuleInfo[]  // live modules, in teaching order
  byId:      Map<string, StageInfo>
  total:     number        // total real stages across all live modules
}

const LESSONS_DIR = path.join(process.cwd(), 'public', 'lessons')

function readHtml(file: string): string {
  return readFileSync(path.join(LESSONS_DIR, file), 'utf8')
}

function build(lessonKey: string, modulesRaw: { id: string; name: string; live?: boolean; stages: { id: string; name?: string; title?: string; xp?: number }[] }[]): GradeMeta {
  const modules: ModuleInfo[] = modulesRaw
    .filter(m => m.live !== false)
    .map(m => ({
      id:   m.id,
      name: m.name,
      stages: m.stages.map(s => ({
        id:         s.id,
        name:       s.name ?? s.title ?? s.id,
        xp:         s.xp ?? 0,
        moduleId:   m.id,
        moduleName: m.name,
      })),
    }))
  const byId = new Map<string, StageInfo>()
  let total = 0
  for (const m of modules) for (const s of m.stages) { byId.set(s.id, s); total++ }
  return { lessonKey, modules, byId, total }
}

let _cache: Partial<Record<'grade6' | 'grade7' | 'grade8', GradeMeta>> = {}

export function getGradeMeta(grade: 'grade6' | 'grade7' | 'grade8'): GradeMeta {
  if (_cache[grade]) return _cache[grade]!

  let meta: GradeMeta

  if (grade === 'grade6') {
    const html = readHtml('grade6.html')
    const s = html.indexOf('const W1_STAGES = [')
    const e = html.indexOf('// ── Real progress: bridge')
    const ctx = html.slice(s, e)
    const { WORLDS } = new Function(ctx + '\nreturn { WORLDS }')()
    meta = build('grade6-quest', WORLDS)
  } else if (grade === 'grade7') {
    const html = readHtml('grade7.html')
    const s = html.indexOf('const WORLDS = [')
    const e = html.indexOf('const STAGE_INDEX')
    const ctx = html.slice(s, e)
    const { WORLDS } = new Function(ctx + '\nreturn { WORLDS }')()
    meta = build('grade7', WORLDS)
  } else {
    const html = readHtml('grade8.html')
    // Starting at 'const MODULES = [' itself is NOT enough — several stages
    // (Colors & Shading's web3 quizzes) reference COLOR_PALETTE/swatchChip/
    // isAllowedColor/colorBrightness/etc, defined BEFORE the MODULES
    // declaration. Same fix already applied to lib/grade8-content.ts and
    // scripts/test-g8-challenges.mjs, for the same reason.
    const s = html.indexOf('// ── Colors & Shading — shared palette data')
    const e = html.indexOf('const CHALLENGES = MODULES')
    const ctx = html.slice(s, e)
    const { MODULES } = new Function(ctx + '\nreturn { MODULES }')()
    meta = build('grade8', MODULES)
  }

  _cache[grade] = meta
  return meta
}

// ── Per-student progress summary, given that student's lesson_saves rows ────
export interface StudentGradeProgress {
  studentId:       string
  name:            string
  stagesPassed:    number
  stagesTotal:     number
  currentModule:   string | null   // null once every module is complete
  lastStageName:   string | null
  lastActive:      string | null   // ISO timestamp
}

export function summarizeStudent(
  meta: GradeMeta,
  studentId: string,
  name: string,
  rows: { challenge_id: string | null; passed: boolean; saved_at: string }[]
): StudentGradeProgress {
  const passedIds = new Set(rows.filter(r => r.passed && r.challenge_id && meta.byId.has(r.challenge_id)).map(r => r.challenge_id!))

  let currentModule: string | null = null
  for (const m of meta.modules) {
    const allDone = m.stages.every(s => passedIds.has(s.id))
    if (!allDone) { currentModule = m.name; break }
  }

  const relevantRows = rows.filter(r => r.challenge_id && meta.byId.has(r.challenge_id))
  const lastRow = relevantRows.reduce(
    (latest, r) => (!latest || r.saved_at > latest.saved_at ? r : latest),
    null as (typeof relevantRows)[number] | null
  )

  return {
    studentId,
    name,
    stagesPassed:  passedIds.size,
    stagesTotal:   meta.total,
    currentModule,
    lastStageName: lastRow?.challenge_id ? (meta.byId.get(lastRow.challenge_id)?.name ?? null) : null,
    lastActive:    lastRow?.saved_at ?? null,
  }
}
