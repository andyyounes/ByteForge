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
