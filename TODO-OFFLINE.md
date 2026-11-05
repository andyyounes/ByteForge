# Making ByteForge work with no internet

Goal (user request, 2026-11-04): most students genuinely don't have internet
most of the time — make the app work entirely offline.

## The actual starting point (good news)

This is NOT a from-scratch rebuild. Investigated the real architecture first:

- Every lesson page (`public/lessons/grade*.html`) is a **static file**,
  explicitly excluded from `middleware.ts`'s matcher (see the comment there:
  "`/lessons` is excluded so that static HTML lesson pages bypass auth").
  No server round-trip is needed to USE a lesson once it's loaded.
- Blockly (Grade 6/7), the Python engine (Pyodide, Grade 8/9), and the real
  HTML/CSS/JS editor (Grade 8) all run **entirely client-side** — writing
  code, running it, and grading it (`check()`) all happen in the browser,
  zero network calls.
- `public/js/lesson-saves.js`'s `load()`/`save()` already catch network
  failures silently (see its own doc comment: "lessons keep working
  offline / in dev without Supabase") — a student can already do a whole
  lesson with no internet RIGHT NOW, the progress just currently gets
  silently dropped instead of saved anywhere.

So the real gaps are three specific, separable things, not "everything":

1. **First load needs internet** — opening a lesson page for the first
   time (or after a hard refresh) still has to fetch the HTML/JS/CSS/
   Pyodide-WASM files over the network. No caching exists today.
2. **Reaching the lesson at all needs internet** — the student dashboard
   (the Next.js app, not the static lesson pages) goes through
   `middleware.ts`, which calls `supabase.auth.getUser()` — a real network
   call — on every navigation. No internet = bounced to /login even with
   a perfectly valid cached session.
3. **A failed save is lost forever, not retried** — `lesson-saves.js`
   logs a warning and moves on. Nothing remembers a save needs to happen
   again once connectivity returns.

## Status key
- [x] done (built, verified live)
- [~] partial / needs a revisit
- [ ] not started

## Phase 1 — Make a lesson loadable with zero internet (PWA asset caching) ✅ DONE
- [x] `public/sw.js` — NOT a fixed precache list in the end (rejected that
      approach once actually investigated: Pyodide lazily fetches dozens of
      files depending on what a script imports, so hand-listing them would
      be guesswork that silently goes stale). Instead: cache-first with
      network-fallback-and-fill, scoped to `/lessons/`, `/js/`, `/images/`,
      `/resources/` same-origin + the CDN origins actually used
      (cdnjs.cloudflare.com, cdn.jsdelivr.net, unpkg.com). Whatever a lesson
      actually requests the first time it's opened online gets cached as a
      side effect — this also answers the "eager vs lazy" question below:
      it's inherently lazy, per-lesson, no manual list to maintain.
- [x] CDN-script problem: used `{mode:'no-cors'}` opaque caching, not
      vendoring — opaque responses can't be inspected but CAN be stored and
      replayed byte-for-byte, which is all offline loading needs; vendoring
      would've been pure extra maintenance for no real benefit here.
- [x] Registered via `public/js/sw-register.js`, included on the 9 real
      curriculum pages (a-level, as-level, grade6/7/8/9, grade9-missions,
      igcse-y1/y2) right after their existing `../js/lang.js` tag — the
      other 14 files under public/lessons/ are smaller standalone tool/demo
      pages, not the main curriculum; lower priority, not done yet.
- [x] Eager vs lazy — resolved above: lazy by construction, not a separate
      decision to make.
- [x] Real test, DONE PROPERLY: loaded grade7.html once online, reloaded
      (a SW never controls the page that first registered it — only the
      NEXT navigation), confirmed 19 entries actually cached (the HTML
      itself, CodeMirror, Blockly, every same-origin JS). Then used CDP's
      Network.emulateNetworkConditions({offline:true}) — a REAL network
      cut, not just throttling — and reloaded again: page loaded fully,
      Blockly's SVG workspace AND toolbox rendered, CodeMirror rendered,
      no browser error page. This is the real thing working, not a shell.

**Known limitation, not yet addressed:** cache-first means a page keeps
serving whatever got cached on that first visit until `CACHE_NAME` in
sw.js is bumped — a content update (e.g. the exam-level-detail rewrites)
won't reach an already-cached browser until that happens. Acceptable
tradeoff for now (a slightly-stale cached lesson beats no lesson at all
with zero connectivity), but worth a real cache-versioning strategy later
if staleness becomes a real complaint.

## Phase 2 — Reach the dashboard with no internet
**Flagged as the sensitive one — this loosens an auth check, worth an
explicit go-ahead before touching it, not just plowing in.**
- [ ] `middleware.ts` currently redirects to /login the instant
      `supabase.auth.getUser()`'s network call fails, even when the
      failure is "no internet" rather than "session genuinely invalid/
      expired." Supabase JWTs are self-contained (carry their own `exp`
      claim) — decode and check expiry client-side as a fallback when the
      network call itself fails, rather than always treating "couldn't
      reach Supabase" as "not logged in."
- [ ] Decide how far this goes: just let an already-authenticated student
      KEEP their current dashboard session when wifi drops mid-visit
      (low risk), vs. let a student open the app cold with zero internet
      and land on a dashboard they haven't loaded this session (needs the
      dashboard's own data cached too — bigger scope, see Phase 1's
      "cache eagerly" question).
- [ ] Open question for the user: is dashboard-offline actually needed,
      or is "once you're in a lesson, dropped wifi doesn't kick you out
      mid-lesson" (which Phase 1 + 3 alone already mostly deliver) enough?
      Worth deciding before building this phase, since it's the riskiest.

## Phase 3 — Stop silently losing progress when a save fails offline ✅ DONE
- [x] Replace `lesson-saves.js`'s catch-and-drop with: on fetch failure,
      write the save payload into a local queue (IndexedDB — survives a
      reload, unlike an in-memory array)
- [x] On page load, on the browser's `online` event, and periodically
      while online, flush the queue: retry each pending save in order,
      drop it from the queue once the server confirms
      - Monotonic save semantics confirmed tolerant of delayed replay —
        verified live (see the 2026-11-05 log entry below), not just
        assumed
- [~] `pendingCount()`/`flushQueue()` exposed, but no actual "N changes
      waiting to sync" UI built yet — smaller follow-up, not blocking
- [ ] Decide: does the teacher dashboard need any "this student has
      unsynced local progress" signal, or is eventual-consistency with no
      visible marker fine?

## Phase 4 — Testing & rollout
- [x] Cold-start offline tested for real (see Phase 1's log) — genuinely
      works after one prior online visit.
- [x] Queued-saves-replaying-in-order tested for real (see Phase 3) —
      stays queued while still failing, flushes cleanly once back online.
- [ ] Still untested: a genuine multi-hour/multi-day gap between queuing
      and flushing (everything so far was tested within one browser
      session) — low risk given IndexedDB persists across reloads by
      design, but worth a real check, not just an assumption.
- [x] Phase 1 + 3 shipped. Phase 2 (dashboard reachable with zero
      internet) still needs the user's explicit go-ahead — it's the one
      that loosens an auth check — before any work starts on it.

## Log
- 2026-11-04: created this file after investigating the real architecture
  — the engines already run offline-capable, so this is NOT a rewrite,
  it's three specific gaps (asset caching, auth-check resilience, save
  retry queue). Scoped into 4 phases, Phase 2 flagged as needing explicit
  buy-in before starting since it touches auth. Not yet started on any
  phase — this file is the plan, pending the user's decision on scope
  (see Phase 2's open question) before writing code.
- 2026-11-05: Phase 3 built and verified live (queue/replay all confirmed
  via a scripted CDP session with fetch monkey-patched to fail). Phase 1
  built and verified live — this is the headline result: a genuinely
  network-cut (not throttled) reload of a previously-visited lesson loads
  completely, Blockly workspace and CodeMirror editor both fully render.
  **Students can now actually do a lesson with zero internet, as long as
  they've opened that lesson at least once while online.** Phase 2
  (reaching the DASHBOARD with zero internet, not just a lesson already
  loaded) is the only piece left undecided — still needs an explicit
  go-ahead since it means loosening the auth middleware's own check.
