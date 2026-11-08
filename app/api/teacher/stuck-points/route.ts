/**
 * GET /api/teacher/stuck-points?classId=x&grade=grade6|grade7|grade8
 *
 * Which stages are a real bottleneck for THIS class right now — not a
 * per-student breakdown (that's grade-progress's job), but an aggregate
 * across every student in the class: how many have reached a stage, and
 * of those, how many have actually passed it. A stage a lot of students
 * reach but few pass is exactly the "common wrong answer" signal the
 * platform can surface today without any new instrumentation — lesson_saves
 * already has one passed/failed row per student per challenge_id; this
 * just aggregates it instead of capturing new data.
 *
 * Returns every live stage with attempted > 0, sorted by stuck count
 * (attempted - passed) descending, so the worst bottleneck is first.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getGradeMeta } from '@/lib/grade-progress'

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

async function teacherOwnsClass(classId: string, userId: string) {
  const admin = await createAdminClient()
  const { data } = await admin
    .from('classes').select('id').eq('id', classId).eq('teacher_id', userId).maybeSingle()
  return !!data
}

export interface StuckPoint {
  stageId:    string
  stageName:  string
  moduleName: string
  attempted:  number   // students with any save row for this stage
  passed:     number
  stuck:      number   // attempted - passed
  stuckRate:  number   // stuck / attempted, 0-1
}

export async function GET(req: NextRequest) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const classId = req.nextUrl.searchParams.get('classId')
  const grade   = req.nextUrl.searchParams.get('grade')
  if (!classId) return NextResponse.json({ error: 'classId required' }, { status: 400 })
  if (grade !== 'grade6' && grade !== 'grade7' && grade !== 'grade8') {
    return NextResponse.json({ error: "grade must be 'grade6', 'grade7', or 'grade8'" }, { status: 400 })
  }

  if (!(await teacherOwnsClass(classId, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = await createAdminClient()

  const { data: memberships } = await admin
    .from('class_members').select('student_id').eq('class_id', classId)
  const studentIds = (memberships ?? []).map((m: { student_id: string }) => m.student_id)
  if (!studentIds.length) return NextResponse.json({ stuckPoints: [], studentCount: 0 })

  let meta
  try {
    meta = getGradeMeta(grade)
  } catch (e) {
    console.error('[stuck-points] failed to extract curriculum metadata', e)
    return NextResponse.json({ error: 'Failed to load curriculum data' }, { status: 500 })
  }

  const { data: saves } = await admin
    .from('lesson_saves')
    .select('student_id, challenge_id, passed')
    .eq('lesson_key', meta.lessonKey)
    .in('student_id', studentIds)

  // One row per (student, stage) — a student who re-saved the same stage
  // several times (common: autosave on every run) must only count once.
  const seen = new Map<string, { attempted: Set<string>; passed: Set<string> }>()
  for (const row of saves ?? []) {
    if (!row.challenge_id || !meta.byId.has(row.challenge_id)) continue
    let s = seen.get(row.challenge_id)
    if (!s) { s = { attempted: new Set(), passed: new Set() }; seen.set(row.challenge_id, s) }
    s.attempted.add(row.student_id)
    if (row.passed) s.passed.add(row.student_id)
  }

  const stuckPoints: StuckPoint[] = []
  for (const [stageId, { attempted, passed }] of seen) {
    const stage = meta.byId.get(stageId)!
    const attemptedCount = attempted.size
    const passedCount = passed.size
    if (attemptedCount === 0) continue
    stuckPoints.push({
      stageId,
      stageName:  stage.name,
      moduleName: stage.moduleName,
      attempted:  attemptedCount,
      passed:     passedCount,
      stuck:      attemptedCount - passedCount,
      stuckRate:  (attemptedCount - passedCount) / attemptedCount,
    })
  }

  stuckPoints.sort((a, b) => b.stuck - a.stuck || b.stuckRate - a.stuckRate)

  return NextResponse.json({ stuckPoints, studentCount: studentIds.length })
}
