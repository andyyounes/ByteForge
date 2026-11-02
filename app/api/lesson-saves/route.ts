// @ts-nocheck
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── GET /api/lesson-saves?lesson=<key> ───────────────────────────────────────
// Returns all saves for the authenticated student for the given lesson key.
// Called from static lesson pages on page load to restore challenge state.

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const lesson = new URL(request.url).searchParams.get('lesson')
  if (!lesson) return NextResponse.json({ error: 'lesson param required' }, { status: 400 })

  const { data: saves, error } = await supabase
    .from('lesson_saves')
    .select('challenge_idx, challenge_id, passed, code, save_data, xp_earned, saved_at')
    .eq('student_id', user.id)
    .eq('lesson_key', lesson)

  if (error) {
    console.error('[lesson-saves GET]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ saves: saves ?? [] })
}

// Notifies a student and their teacher of a real exam result. Runs as the
// student's own session (RLS: notifications.send_notifications requires
// created_by = auth.uid()), so it can insert a row for the teacher too —
// same "write your own thing, targeted at someone else" pattern as
// class_join_requests.
async function notifyExamResult(
  supabase: any,
  studentId: string,
  lesson: string,
  challengeId: string,
  passed: boolean,
) {
  const { data: profile } = await supabase.from('profiles').select('name').eq('id', studentId).single()
  const studentName = profile?.name ?? 'A student'

  const resultWord = passed ? 'passed' : 'did not pass'
  const examLabel = `${lesson} exam`

  await supabase.from('notifications').insert({
    user_id: studentId,
    created_by: studentId,
    type: 'exam_result',
    title: passed ? 'Exam passed' : 'Exam submitted',
    body: passed
      ? `You passed the ${examLabel}. Nice work!`
      : `You submitted the ${examLabel} but it didn't pass yet — you can try again.`,
    data: { lesson, challengeId, passed },
  })

  // Find this student's teacher(s) via their class membership.
  const { data: memberships } = await supabase
    .from('class_members')
    .select('class_id')
    .eq('student_id', studentId)

  const classIds = (memberships ?? []).map((m: { class_id: string }) => m.class_id)
  if (!classIds.length) return

  const { data: classes } = await supabase
    .from('classes')
    .select('teacher_id')
    .in('id', classIds)

  const teacherIds = [...new Set((classes ?? []).map((c: { teacher_id: string }) => c.teacher_id))]

  for (const teacherId of teacherIds) {
    await supabase.from('notifications').insert({
      user_id: teacherId,
      created_by: studentId,
      type: 'exam_result',
      title: 'Student exam result',
      body: `${studentName} ${resultWord} the ${examLabel}.`,
      data: { lesson, challengeId, passed, studentId, studentName },
    })
  }
}

// ── POST /api/lesson-saves ────────────────────────────────────────────────────
// Writes a save record. Called when a student passes a challenge or when the
// workspace is autosaved.
//
// Body fields:
//   lesson        string   lesson key, e.g. 'grade7'
//   challengeIdx  number?  legacy 0-based challenge index, or -1 for workspace
//                          autosave. Still required (kept for back-compat with
//                          any caller that hasn't migrated) — pass -1 when only
//                          challengeId identifies a real challenge.
//   challengeId   string?  stable per-challenge id (e.g. 'g1s1') — preferred
//                          over challengeIdx for real challenge saves. Progress
//                          keyed by id survives challenges being inserted
//                          anywhere in a lesson's list; index-keyed progress
//                          does not (see supabase/lesson_saves_challenge_id.sql).
//   passed        boolean  true if the challenge was completed this call
//   code          string?  student code/pseudocode text
//   saveData      object?  arbitrary JSON (blockly XML, pixel art grid, etc.)
//   xpEarned      number?  XP to award on the student's FIRST pass of this challenge

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { lesson, challengeIdx, challengeId = null, passed, code, saveData, xpEarned = 0 } = body

  if (!lesson || challengeIdx === undefined) {
    return NextResponse.json({ error: 'lesson and challengeIdx required' }, { status: 400 })
  }

  // ID-keyed real-challenge row: select-then-write instead of upsert(), since
  // the (student_id, lesson_key, challenge_id) uniqueness is a partial index
  // (challenge_id IS NOT NULL) and supabase-js's upsert() onConflict can't
  // express that partial predicate as a conflict target.
  if (challengeId) {
    const { data: existingRow } = await supabase
      .from('lesson_saves')
      .select('id, passed, xp_earned')
      .eq('student_id', user.id)
      .eq('lesson_key', lesson)
      .eq('challenge_id', challengeId)
      .maybeSingle()

    const shouldAwardXp = passed && xpEarned > 0 && !existingRow?.passed

    const row = {
      student_id:    user.id,
      lesson_key:    lesson,
      challenge_idx: null,
      challenge_id:  challengeId,
      // `passed` is monotonic — a stage that was already passed must stay
      // passed. This save call is also used for plain code-draft autosaves
      // (passed left false, or the current unsolved state) so a student who
      // reopens an already-completed stage and keeps tinkering doesn't
      // silently un-complete it the next time they press Run.
      passed:        !!passed || !!existingRow?.passed,
      code:          code   ?? null,
      save_data:     saveData ?? null,
      xp_earned:     Math.max(xpEarned ?? 0, existingRow?.xp_earned ?? 0),
      saved_at:      new Date().toISOString(),
    }

    const { error: writeError } = existingRow
      ? await supabase.from('lesson_saves').update(row).eq('id', existingRow.id)
      : await supabase.from('lesson_saves').insert(row)

    if (writeError) {
      console.error('[lesson-saves POST] id-keyed write:', writeError)
      return NextResponse.json({ error: writeError.message }, { status: 500 })
    }

    if (shouldAwardXp) {
      const { data: profile } = await supabase.from('profiles').select('xp').eq('id', user.id).single()
      if (profile) await supabase.from('profiles').update({ xp: profile.xp + xpEarned }).eq('id', user.id)
    }

    // Exam submissions (identified the same way grade-progress.ts does —
    // tabSwitches only ever appears on an isExam save) notify both the
    // student and their teacher with the result, once per real attempt.
    if (saveData && typeof saveData.tabSwitches === 'number') {
      await notifyExamResult(supabase, user.id, lesson, challengeId, !!passed)
    }

    return NextResponse.json({ ok: true, xpAwarded: shouldAwardXp ? xpEarned : 0 })
  }

  // ── Legacy index-keyed path (workspace autosave, challenge_idx = -1, and
  // any caller that hasn't migrated to challengeId yet) ────────────────────
  let shouldAwardXp = false
  let existing: { passed: boolean; xp_earned: number } | null = null
  if (challengeIdx >= 0) {
    const { data } = await supabase
      .from('lesson_saves')
      .select('passed, xp_earned')
      .eq('student_id', user.id)
      .eq('lesson_key', lesson)
      .eq('challenge_idx', challengeIdx)
      .maybeSingle()
    existing = data
    shouldAwardXp = !!passed && xpEarned > 0 && !existing?.passed   // only award if not previously passed
  }

  const { error: upsertError } = await supabase
    .from('lesson_saves')
    .upsert(
      {
        student_id:    user.id,
        lesson_key:    lesson,
        challenge_idx: challengeIdx,
        // Same monotonic rule as the id-keyed path above — a code-draft
        // autosave on an already-passed challenge must not un-complete it.
        passed:        !!passed || !!existing?.passed,
        code:          code   ?? null,
        save_data:     saveData ?? null,
        xp_earned:     Math.max(xpEarned ?? 0, existing?.xp_earned ?? 0),
        saved_at:      new Date().toISOString(),
      },
      { onConflict: 'student_id,lesson_key,challenge_idx' }
    )

  if (upsertError) {
    console.error('[lesson-saves POST] upsert:', upsertError)
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  if (shouldAwardXp) {
    const { data: profile } = await supabase.from('profiles').select('xp').eq('id', user.id).single()
    if (profile) await supabase.from('profiles').update({ xp: profile.xp + xpEarned }).eq('id', user.id)
  }

  return NextResponse.json({ ok: true, xpAwarded: shouldAwardXp ? xpEarned : 0 })
}
