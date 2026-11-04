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

## Phase 1 — Make a lesson loadable with zero internet (PWA asset caching)
- [ ] Add a Service Worker (`public/sw.js`) that precaches each grade's
      lesson HTML + its same-origin JS (`public/js/*.js`)
- [ ] Figure out the CDN-script problem: grade8/9 load CodeMirror/Pyodide
      from `cdnjs.cloudflare.com` / `cdn.jsdelivr.net` — cross-origin, so
      caching them needs either `{mode:'no-cors'}` opaque caching or
      vendoring those libraries into `public/` ourselves (more reliable,
      avoids opaque-response pitfalls, but is its own small chunk of work
      per library). Pyodide's own runtime is tens of MB — worth checking
      actual size before committing to fully caching it per grade.
- [ ] Register the service worker (likely from a shared snippet each
      lesson page includes, plus the Next.js app shell)
- [ ] Decide: cache lessons eagerly (all grades, on first dashboard visit)
      or lazily (only the grade/lessons a student actually opens)? Lazy is
      less total download but means the FIRST open of each new lesson
      still needs internet once.
- [ ] Real test: open a lesson once online, kill the network entirely
      (not just throttle), hard-refresh — must load and be fully usable

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

## Phase 3 — Stop silently losing progress when a save fails offline
- [ ] Replace `lesson-saves.js`'s catch-and-drop with: on fetch failure,
      write the save payload into a local queue (IndexedDB — survives a
      reload, unlike an in-memory array)
- [ ] On page load, on the browser's `online` event, and periodically
      while online, flush the queue: retry each pending save in order,
      drop it from the queue once the server confirms
      - Monotonic save semantics (`passed` only ever goes true, `xp_earned`
        is `Math.max`'d) already make the server tolerant of saves
        replaying late/out of real-time order — confirm this holds once
        actually exercised by a real queued-and-delayed save, don't just
        assume it
- [ ] A small, unobtrusive "N changes waiting to sync" indicator — not
      scary, just honest, so a student/teacher isn't confused by progress
      that looks saved locally but hasn't reached the server yet
- [ ] Decide: does the teacher dashboard need any "this student has
      unsynced local progress" signal, or is eventual-consistency with no
      visible marker fine?

## Phase 4 — Testing & rollout
- [ ] Manual test matrix: cold-start offline (never visited before) /
      mid-lesson wifi drop / reconnect-and-sync / multiple queued saves
      replaying in order
- [ ] Ship Phase 1 + 3 first — biggest real value (a lesson survives a
      wifi drop, progress isn't silently lost), lowest risk (no auth
      changes). Evaluate before deciding whether Phase 2 is actually
      worth its risk.

## Log
- 2026-11-04: created this file after investigating the real architecture
  — the engines already run offline-capable, so this is NOT a rewrite,
  it's three specific gaps (asset caching, auth-check resilience, save
  retry queue). Scoped into 4 phases, Phase 2 flagged as needing explicit
  buy-in before starting since it touches auth. Not yet started on any
  phase — this file is the plan, pending the user's decision on scope
  (see Phase 2's open question) before writing code.
