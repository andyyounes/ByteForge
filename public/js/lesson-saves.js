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
 *
 *   // A page with TWO independent tracks (e.g. AS/A Level: Paper 1 theory +
 *   // Paper 2 challenges) loads both and reads each back by name — every
 *   // read function takes an optional lessonKey; omitted, it defaults to
 *   // whichever lesson was loaded most recently (unchanged behaviour for
 *   // every single-track page):
 *   await LessonSaves.load('as-paper1-theory')
 *   await LessonSaves.load('as-paper2')
 *   LessonSaves.completedIds('as-paper1-theory').forEach(...)
 *   LessonSaves.completedIds('as-paper2').forEach(...)
 */
const LessonSaves = (() => {
  'use strict'

  const _byLesson = {}   // lessonKey -> save rows (or undefined if never loaded)
  let _lastKey = null     // most recently load()ed lessonKey — the read-function default

  // ── Offline save queue ────────────────────────────────────────────────────
  // save() used to just log a warning and drop the write on a failed fetch —
  // meaning a wifi drop mid-lesson silently lost whatever was being saved at
  // that exact moment, with nothing to retry it later. Every failed save now
  // goes into an IndexedDB queue instead (survives a reload, unlike an
  // in-memory array) and gets replayed in order once the connection is back.
  //
  // Saves are monotonic by design (a challenge_id row's `passed` only ever
  // goes true, `xp_earned` only ever increases via Math.max — see
  // app/api/lesson-saves/route.ts) specifically so a queued save replaying
  // late, possibly out of real-time order against OTHER devices' saves,
  // can never silently undo real progress.
  const DB_NAME = 'bf-offline-queue'
  const STORE   = 'pending'
  let _dbPromise = null

  function _openDb() {
    if (_dbPromise) return _dbPromise
    _dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') { reject(new Error('no indexedDB')); return }
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => {
        req.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror   = () => reject(req.error)
    })
    return _dbPromise
  }

  async function _queueSave(payload) {
    try {
      const db = await _openDb()
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite')
        tx.objectStore(STORE).add({ payload, queuedAt: Date.now() })
        tx.oncomplete = resolve
        tx.onerror    = () => reject(tx.error)
      })
      _refreshIndicator()
    } catch (e) {
      // IndexedDB itself unavailable (very old browser, private-mode quota,
      // etc.) — nothing left to do but accept the original silent-drop
      // behaviour this is meant to improve on.
      console.warn('[LessonSaves] could not queue offline save:', e.message)
    }
  }

  async function _allQueued() {
    try {
      const db = await _openDb()
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly')
        const req = tx.objectStore(STORE).getAll()
        req.onsuccess = () => resolve(req.result)
        req.onerror   = () => reject(req.error)
      })
    } catch {
      return []
    }
  }

  async function _removeQueued(id) {
    try {
      const db = await _openDb()
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite')
        tx.objectStore(STORE).delete(id)
        tx.oncomplete = resolve
        tx.onerror    = () => reject(tx.error)
      })
    } catch (e) {
      console.warn('[LessonSaves] could not remove a flushed queue entry:', e.message)
    }
  }

  let _flushing = false
  // Replays queued saves in order (oldest first) — stops at the first one
  // that still fails rather than skipping it, so a genuinely-offline student
  // doesn't have every single queued save race the network and fail one by
  // one; the next trigger (an 'online' event, the periodic timer) just
  // tries again from where it left off.
  async function flushQueue() {
    if (_flushing) return
    _flushing = true
    try {
      const entries = await _allQueued()
      for (const entry of entries) {
        try {
          const res = await fetch('/api/lesson-saves', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(entry.payload),
          })
          if (!res.ok && res.status !== 401) throw new Error('HTTP ' + res.status)
          await _removeQueued(entry.id)
        } catch (e) {
          console.warn('[LessonSaves] flush stopped — still offline?', e.message)
          break
        }
      }
    } finally {
      _flushing = false
      _refreshIndicator()
    }
  }

  // Returns how many saves are still waiting to reach the server — a page
  // can poll this to show a small "N changes waiting to sync" indicator.
  async function pendingCount() {
    return (await _allQueued()).length
  }

  // ── Pending-sync indicator ───────────────────────────────────────────────
  // A small fixed badge, built once here so every lesson page gets it for
  // free instead of each of the ~11 lesson HTML files wiring up its own copy.
  // Shows "N changes waiting to sync" while the offline queue is non-empty,
  // and removes itself the moment it drains.
  let _indicatorEl = null
  function _renderIndicator(count) {
    if (typeof document === 'undefined' || !document.body) return
    if (count <= 0) {
      if (_indicatorEl) { _indicatorEl.remove(); _indicatorEl = null }
      return
    }
    if (!_indicatorEl) {
      _indicatorEl = document.createElement('div')
      _indicatorEl.id = 'bf-sync-indicator'
      _indicatorEl.style.cssText = `
        position:fixed; bottom:14px; right:14px; z-index:9999;
        background:#1b1f2b; color:#e8e8f0; font:12px/1.4 -apple-system,BlinkMacSystemFont,
        'Segoe UI',sans-serif; padding:7px 13px; border-radius:20px;
        box-shadow:0 2px 10px rgba(0,0,0,.25); pointer-events:none; opacity:.92;
      `
      document.body.appendChild(_indicatorEl)
    }
    _indicatorEl.textContent = `⏳ ${count} change${count === 1 ? '' : 's'} waiting to sync`
  }
  async function _refreshIndicator() {
    _renderIndicator(await pendingCount())
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => { flushQueue() })
    // Also try shortly after every page load — covers the case where the
    // student was back online for a while before ever opening this page
    // again (the 'online' event only fires on the transition, not on load).
    setTimeout(() => { flushQueue(); _refreshIndicator() }, 1500)
    // Periodic safety net while the tab stays open and online — catches a
    // save that failed for a reason OTHER than "offline" (a brief server
    // blip), without needing a real online/offline transition to retry it.
    setInterval(() => { if (navigator.onLine !== false) flushQueue() }, 30000)
  }

  // ── load ────────────────────────────────────────────────────────────────────
  // Fetches all saves for this lesson from the server.
  // Call once per lesson key during page init; await it before restoring state.
  async function load(lessonKey) {
    _lastKey = lessonKey
    try {
      const res = await fetch(`/api/lesson-saves?lesson=${encodeURIComponent(lessonKey)}`)
      if (res.status === 401) { _byLesson[lessonKey] = []; return [] }   // not logged in — skip silently
      if (!res.ok) { console.warn('[LessonSaves] load error', res.status); _byLesson[lessonKey] = []; return [] }
      const json = await res.json()
      _byLesson[lessonKey] = json.saves ?? []
      return _byLesson[lessonKey]
    } catch (e) {
      console.warn('[LessonSaves] load failed (offline?):', e.message)
      _byLesson[lessonKey] = []
      return []
    }
  }

  // ── save ────────────────────────────────────────────────────────────────────
  // Writes one save row. Fire-and-forget — errors are logged, not thrown.
  //
  // lessonKey     string          e.g. 'grade7', 'grade9', 'as-paper1-theory'
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
    const payload = {
      lesson:       lessonKey,
      // The API still requires challengeIdx to be present (back-compat);
      // -1 there just means "not index-keyed" whenever challengeId is set.
      challengeIdx: isIdKeyed ? -1 : challengeKey,
      challengeId:  isIdKeyed ? challengeKey : null,
      passed, code, saveData, xpEarned,
    }
    // navigator.onLine === false is a fast, reliable "definitely offline"
    // signal — skip straight to queuing instead of waiting out a fetch that
    // can take a while to time out on some browsers/OSes when there's
    // genuinely no connection at all.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      await _queueSave(payload)
      return
    }
    try {
      const res = await fetch('/api/lesson-saves', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      // A real HTTP response (even an error one) means the request reached
      // the server — nothing a retry would fix differently, so only a
      // genuine network failure (the catch below) queues for later.
      if (!res.ok && res.status !== 401) {
        console.warn('[LessonSaves] save error', res.status)
      }
    } catch (e) {
      console.warn('[LessonSaves] save failed, queued for retry:', e.message)
      await _queueSave(payload)
    }
  }

  function _rows(lessonKey) {
    const key = lessonKey || _lastKey
    return _byLesson[key] || null
  }

  // ── completedSet ────────────────────────────────────────────────────────────
  // Legacy: returns a Set<number> of challenge indices that were previously
  // passed via the old index-keyed path. Prefer completedIds() in any page
  // that saves by challenge id.
  function completedSet(lessonKey) {
    const rows = _rows(lessonKey)
    if (!rows) return new Set()
    return new Set(rows.filter(s => s.passed && s.challenge_idx != null && s.challenge_idx >= 0).map(s => s.challenge_idx))
  }

  // ── completedIds ────────────────────────────────────────────────────────────
  // Returns a Set<string> of challenge ids that were previously passed.
  // Must call load() first.
  function completedIds(lessonKey) {
    const rows = _rows(lessonKey)
    if (!rows) return new Set()
    return new Set(rows.filter(s => s.passed && s.challenge_id).map(s => s.challenge_id))
  }

  // ── savedWorkspace ──────────────────────────────────────────────────────────
  // Returns the save_data object from the workspace-level save (challenge_idx = -1),
  // or null if no workspace has been autosaved yet.
  function savedWorkspace(lessonKey) {
    const rows = _rows(lessonKey)
    if (!rows) return null
    const ws = rows.find(s => s.challenge_idx === -1)
    return ws ? ws.save_data : null
  }

  // ── savedCode ───────────────────────────────────────────────────────────────
  // Returns the code string from the workspace-level save (challenge_idx = -1),
  // or null if not saved.
  function savedCode(lessonKey) {
    const rows = _rows(lessonKey)
    if (!rows) return null
    const ws = rows.find(s => s.challenge_idx === -1)
    return ws ? ws.code : null
  }

  // ── codeFor ─────────────────────────────────────────────────────────────────
  // Returns the last-saved code/draft for ONE specific challenge id, whether or
  // not it was ever passed — so a page can restore a student's in-progress (or
  // already-correct) work instead of always resetting to the starter code.
  // Returns null if nothing was ever saved for that id. Must call load() first.
  function codeFor(challengeId, lessonKey) {
    const rows = _rows(lessonKey)
    if (!rows) return null
    const row = rows.find(s => s.challenge_id === challengeId)
    return row ? row.code : null
  }

  // ── saveDataFor ─────────────────────────────────────────────────────────────
  // Returns the save_data object for ONE specific challenge id, or null if
  // nothing was ever saved for it. Used e.g. to resume a persisted exam timer
  // budget across sessions (examDurationSeconds carried over from the last
  // save, not reset to 0 on every reopen). Must call load() first.
  function saveDataFor(challengeId, lessonKey) {
    const rows = _rows(lessonKey)
    if (!rows) return null
    const row = rows.find(s => s.challenge_id === challengeId)
    return row ? row.save_data : null
  }

  return { load, save, completedSet, completedIds, savedWorkspace, savedCode, codeFor, saveDataFor, flushQueue, pendingCount }
})()
