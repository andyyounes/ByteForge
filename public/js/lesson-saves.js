/*!
 * LessonSaves — syncs lesson progress to Supabase via /api/lesson-saves
 *
 * Works from static HTML lesson pages served on the same Next.js origin.
 * The browser's Supabase auth cookies are sent automatically (same-origin),
 * so no extra tokens are needed.
 *
 * Falls back silently if the user is unauthenticated or the API is unreachable,
 * so lessons keep working offline / in dev without Supabase.
 *
 * Usage
 * -----
 *   // On page load — restore previously saved state
 *   const saves = await LessonSaves.load('grade7')
 *   LessonSaves.completedIds().forEach(id => completed.add(STAGE_INDEX[id]))
 *
 *   // On challenge pass — key by the challenge's own stable id, NOT its
 *   // position in the array. Index-based saves silently corrupt when a new
 *   // challenge is inserted anywhere but the very end (see
 *   // supabase/lesson_saves_challenge_id.sql for why this changed).
 *   LessonSaves.save('grade7', 'g1s1', { passed: true, xpEarned: ch.xp, code: '...' })
 *
 *   // Periodic workspace autosave (Blockly XML, pixel grid, etc.) — still
 *   // uses the -1 sentinel; it's a single row per lesson, never per-challenge.
 *   LessonSaves.save('grade7', -1, { saveData: { xml: '...' } })
 *
 *   // On next page load — get last saved workspace
 *   const ws = LessonSaves.savedWorkspace()   // returns save_data object or null
 *   const code = LessonSaves.savedCode()      // returns code string or null
 */
const LessonSaves = (() => {
  'use strict'

  let _saves = null   // null = not yet loaded; [] = loaded but empty

  // ── load ────────────────────────────────────────────────────────────────────
  // Fetches all saves for this lesson from the server.
  // Call once during page init; await it before restoring state.
  async function load(lessonKey) {
    try {
      const res = await fetch(`/api/lesson-saves?lesson=${encodeURIComponent(lessonKey)}`)
      if (res.status === 401) { _saves = []; return [] }   // not logged in — skip silently
      if (!res.ok) { console.warn('[LessonSaves] load error', res.status); _saves = []; return [] }
      const json = await res.json()
      _saves = json.saves ?? []
      return _saves
    } catch (e) {
      console.warn('[LessonSaves] load failed (offline?):', e.message)
      _saves = []
      return []
    }
  }

  // ── save ────────────────────────────────────────────────────────────────────
  // Writes one save row. Fire-and-forget — errors are logged, not thrown.
  //
  // lessonKey     string          e.g. 'grade7', 'grade9', 'grade6-patterns'
  // challengeKey  string | number A challenge's stable `id` string (preferred —
  //                               survives new challenges being inserted
  //                               anywhere), or -1 for workspace autosave.
  //                               A plain number other than -1 still works for
  //                               any page that hasn't migrated to string ids,
  //                               but keying by position is fragile — see the
  //                               module comment above.
  // opts.passed    boolean   true if the challenge was just completed
  // opts.code      string?   student code or pseudocode
  // opts.saveData  object?   JSON (blockly XML, pixel grid, etc.)
  // opts.xpEarned  number?   XP to award on first-ever pass
  async function save(lessonKey, challengeKey, {
    passed   = false,
    code     = null,
    saveData = null,
    xpEarned = 0,
  } = {}) {
    const isIdKeyed = typeof challengeKey === 'string'
    try {
      await fetch('/api/lesson-saves', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson:       lessonKey,
          // The API still requires challengeIdx to be present (back-compat);
          // -1 there just means "not index-keyed" whenever challengeId is set.
          challengeIdx: isIdKeyed ? -1 : challengeKey,
          challengeId:  isIdKeyed ? challengeKey : null,
          passed, code, saveData, xpEarned,
        }),
      })
    } catch (e) {
      console.warn('[LessonSaves] save failed (silently ignoring):', e.message)
    }
  }

  // ── completedSet ────────────────────────────────────────────────────────────
  // Legacy: returns a Set<number> of challenge indices that were previously
  // passed via the old index-keyed path. Prefer completedIds() in any page
  // that saves by challenge id.
  function completedSet() {
    if (!_saves) return new Set()
    return new Set(_saves.filter(s => s.passed && s.challenge_idx != null && s.challenge_idx >= 0).map(s => s.challenge_idx))
  }

  // ── completedIds ────────────────────────────────────────────────────────────
  // Returns a Set<string> of challenge ids that were previously passed.
  // Must call load() first.
  function completedIds() {
    if (!_saves) return new Set()
    return new Set(_saves.filter(s => s.passed && s.challenge_id).map(s => s.challenge_id))
  }

  // ── savedWorkspace ──────────────────────────────────────────────────────────
  // Returns the save_data object from the workspace-level save (challenge_idx = -1),
  // or null if no workspace has been autosaved yet.
  function savedWorkspace() {
    if (!_saves) return null
    const ws = _saves.find(s => s.challenge_idx === -1)
    return ws ? ws.save_data : null
  }

  // ── savedCode ───────────────────────────────────────────────────────────────
  // Returns the code string from the workspace-level save (challenge_idx = -1),
  // or null if not saved.
  function savedCode() {
    if (!_saves) return null
    const ws = _saves.find(s => s.challenge_idx === -1)
    return ws ? ws.code : null
  }

  return { load, save, completedSet, completedIds, savedWorkspace, savedCode }
})()
