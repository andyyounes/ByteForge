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
  id:           string
  name:         string
  xp:           number
  moduleId:     string
  moduleName:   string
  isAssessment: boolean   // a real test (e.g. Grade 8's Knowledge Check) — its
                          // actual score (not just pass/fail) is surfaced to
                          // the teacher, read straight off the stage's own
                          // isAssessment flag so nothing here is hardcoded to
                          // one specific stage id.
  isExam:       boolean   // a real hands-on exam (e.g. Grade 8's Recipe Page
                          // exam) — no screen recording (a page can't force
                          // or silently run it, and it raises real privacy
                          // questions for minors); instead the page itself
                          // tracks tab-switch count and periodic code
                          // snapshots as a lighter-weight integrity signal,
                          // surfaced here the same stage-flag-driven way.
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

function build(lessonKey: string, modulesRaw: { id: string; name: string; live?: boolean; stages: { id: string; name?: string; title?: string; xp?: number; isAssessment?: boolean; isExam?: boolean }[] }[]): GradeMeta {
  const modules: ModuleInfo[] = modulesRaw
    .filter(m => m.live !== false)
    .map(m => ({
      id:   m.id,
      name: m.name,
      stages: m.stages.map(s => ({
        id:           s.id,
        name:         s.name ?? s.title ?? s.id,
        xp:           s.xp ?? 0,
        moduleId:     m.id,
        moduleName:   m.name,
        isAssessment: s.isAssessment ?? false,
        isExam:       s.isExam ?? false,
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
export interface ModuleProgress {
  id:    string
  name:  string
  done:  number   // stages this student has passed in the module
  total: number
}

// A real test's actual result — distinct from ordinary pass/fail, since an
// assessment's score matters even on a failed/incomplete attempt.
export interface AssessmentResult {
  stageId:     string
  stageName:   string
  score:       number
  total:       number
  passed:      boolean
  attemptedAt: string | null   // ISO timestamp
}

// A hands-on exam's integrity signal — no screen recording (a page can't
// force or silently run it, and recording minors raises real privacy
// questions a school must sign off on first); instead the page itself
// tracks tab-switch count/duration and how many distinct code snapshots
// it saw, so a solution that appeared fully-formed in one jump reads
// differently from one that was genuinely built up over the exam.
export interface ExamResult {
  stageId:             string
  stageName:           string
  passed:              boolean
  tabSwitches:         number
  awaySeconds:         number
  snapshotCount:       number
  examDurationSeconds: number
  attemptedAt:         string | null   // ISO timestamp
}

export interface StudentGradeProgress {
  studentId:       string
  name:            string
  stagesPassed:    number
  stagesTotal:     number
  currentModule:   string | null   // null once every module is complete
  modules:         ModuleProgress[]   // per-chapter breakdown, in teaching order
  lastStageName:   string | null
  lastActive:      string | null   // ISO timestamp
  assessments:     AssessmentResult[]   // real tests this student has attempted
  exams:           ExamResult[]        // real hands-on exams this student has attempted
}

export function summarizeStudent(
  meta: GradeMeta,
  studentId: string,
  name: string,
  rows: {
    challenge_id: string | null
    passed: boolean
    saved_at: string
    save_data?: {
      score?: number; total?: number
      tabSwitches?: number; awaySeconds?: number; snapshotCount?: number; examDurationSeconds?: number
    } | null
  }[]
): StudentGradeProgress {
  const passedIds = new Set(rows.filter(r => r.passed && r.challenge_id && meta.byId.has(r.challenge_id)).map(r => r.challenge_id!))

  // Assessment stages record a real row on EVERY attempt (see grade8.html's
  // isAssessment branch in checkQuiz()), so the LATEST row per stage id is
  // this student's most recent real attempt, pass or fail.
  const assessments: AssessmentResult[] = []
  for (const [stageId, stage] of meta.byId) {
    if (!stage.isAssessment) continue
    const attempts = rows.filter(r => r.challenge_id === stageId && r.save_data && typeof r.save_data.score === 'number')
    if (!attempts.length) continue
    const latest = attempts.reduce((a, b) => (a.saved_at > b.saved_at ? a : b))
    assessments.push({
      stageId,
      stageName:   stage.name,
      score:       latest.save_data!.score!,
      total:       latest.save_data!.total ?? 0,
      passed:      latest.passed,
      attemptedAt: latest.saved_at,
    })
  }

  // Exam stages — same "every attempt, pass or fail" rule as assessments
  // (see grade8.html's isExam branch in checkWebChallenge()), identified
  // by tabSwitches being a real number rather than score (assessments and
  // exams can share a lesson_key/table without colliding on this check).
  const exams: ExamResult[] = []
  for (const [stageId, stage] of meta.byId) {
    if (!stage.isExam) continue
    const attempts = rows.filter(r => r.challenge_id === stageId && r.save_data && typeof r.save_data.tabSwitches === 'number')
    if (!attempts.length) continue
    const latest = attempts.reduce((a, b) => (a.saved_at > b.saved_at ? a : b))
    exams.push({
      stageId,
      stageName:           stage.name,
      passed:               latest.passed,
      tabSwitches:          latest.save_data!.tabSwitches!,
      awaySeconds:          latest.save_data!.awaySeconds ?? 0,
      snapshotCount:        latest.save_data!.snapshotCount ?? 0,
      examDurationSeconds:  latest.save_data!.examDurationSeconds ?? 0,
      attemptedAt:          latest.saved_at,
    })
  }

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

  const modules: ModuleProgress[] = meta.modules.map(m => ({
    id:    m.id,
    name:  m.name,
    done:  m.stages.filter(s => passedIds.has(s.id)).length,
    total: m.stages.length,
  }))

  return {
    studentId,
    name,
    stagesPassed:  passedIds.size,
    stagesTotal:   meta.total,
    currentModule,
    modules,
    lastStageName: lastRow?.challenge_id ? (meta.byId.get(lastRow.challenge_id)?.name ?? null) : null,
    lastActive:    lastRow?.saved_at ?? null,
    assessments,
    exams,
  }
}
