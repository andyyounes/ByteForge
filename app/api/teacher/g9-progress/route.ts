/**
 * Teacher view into Grade 9 Mission IDE progress (per-student).
 *
 * GET /api/teacher/g9-progress?classId=x — teacher-only, must own the class.
 *
 * Reads the same lesson_saves rows the static grade9-missions.html page
 * writes via /api/lesson-saves — no new table. Mission passes use
 * challenge_idx 0..N; the tournament bot/lock/last-result state rides the
 * standard workspace row at challenge_idx -1 (save_data), same convention
 * every other lesson page uses for autosave.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// grade9-missions.html's MISSIONS array length — challenge_idx values at or
// past this are NOT real missions, they're the one-time tournament XP
// markers (BOT_LOCK_IDX = MISSIONS.length, CHAMPION_IDX = +1). Keep this in
// sync if missions are added/removed; a stale (too-low) value only makes a
// couple of achievement rows miscount as missions, it can't crash anything.
const TOTAL_MISSIONS = 38

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

export async function GET(req: NextRequest) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const classId = req.nextUrl.searchParams.get('classId')
  if (!classId) return NextResponse.json({ error: 'classId required' }, { status: 400 })

  if (!(await teacherOwnsClass(classId, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = await createAdminClient()

  const { data: memberships } = await admin
    .from('class_members').select('student_id').eq('class_id', classId)
  const studentIds = (memberships ?? []).map((m: { student_id: string }) => m.student_id)
  if (!studentIds.length) return NextResponse.json({ students: [] })

  const [{ data: profiles }, { data: saves }] = await Promise.all([
    admin.from('profiles').select('id, name').in('id', studentIds),
    admin.from('lesson_saves')
      .select('student_id, challenge_idx, passed, code, xp_earned, save_data, saved_at')
      .eq('lesson_key', 'grade9-missions')
      .in('student_id', studentIds),
  ])

  const byStudent = new Map<string, typeof saves>()
  for (const row of saves ?? []) {
    const list = byStudent.get(row.student_id) ?? []
    list.push(row)
    byStudent.set(row.student_id, list)
  }

  const students = (profiles ?? []).map((p: { id: string; name: string }) => {
    const rows = byStudent.get(p.id) ?? []
    const missionRows = rows.filter(r => r.challenge_idx >= 0 && r.challenge_idx < TOTAL_MISSIONS)
    const passed = missionRows.filter(r => r.passed)
    const highestPassedIdx = passed.reduce((m, r) => Math.max(m, r.challenge_idx), -1)
    const workspace = rows.find(r => r.challenge_idx === -1)
    const ws = (workspace?.save_data as Record<string, unknown>) ?? {}
    const lastAttempt = missionRows.reduce(
      (latest, r) => (!latest || r.saved_at > latest.saved_at ? r : latest),
      null as (typeof missionRows)[number] | null
    )

    return {
      studentId:      p.id,
      name:           p.name,
      missionsPassed: passed.length,
      currentIdx:     highestPassedIdx + 1,
      botLocked:      !!ws.botLocked,
      botLang:        ws.botLang ?? null,
      botCode:        ws.botLocked ? (ws.botLang === 'ps' ? ws.botCodePs : ws.botCodePy) ?? null : null,
      lastBracket:    ws.lastBracket ?? null,
      lastMission:    lastAttempt ? { idx: lastAttempt.challenge_idx, passed: lastAttempt.passed, savedAt: lastAttempt.saved_at } : null,
    }
  })

  return NextResponse.json({ students })
}
