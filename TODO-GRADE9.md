# Grade 9 — Flowcharts/Loops rebuild + answer() → real variable inspection

Goal (user request, 2026-11-09): Grade 9's flowchart section teaches
if/else decisions but genuinely never teaches loops (FOR/WHILE/DO-UNTIL)
despite being the natural place for it; the one place loops DO show up is
disconnected turtle-graphics shape missions, not flowcharts; a lot of
missions feel "weirdly shaped" (the turtle geometry, not pedagogy); the
`answer()` submission mechanic is clunky and used on nearly every mission;
and the split-panel layout doesn't match Grade 8's (IDE on one side,
output + variable table + challenge on the other).

User's decisions (via AskUserQuestion, 2026-11-09):
- **Keep** the turtle-graphics shape missions (Square Patrol, Staircase,
  Spiral Scan, Comet Chain) as-is — they're a legitimate fun application
  of loops, not the problem.
- **Add** new flowchart → pseudocode → Python loop missions (FOR/WHILE/
  DO-UNTIL/REPEAT-UNTIL), same style as the existing `flowg1`-`flowg18`
  if/else missions, with real trace tables.
- **Replace** the `answer()` mechanic with a proper check UI: run the
  code, show real output/variable state, grade from that — no typing
  `answer(...)` by hand. This is the bigger of the two engineering
  changes and unlocks everything else (new loop missions should use the
  NEW mechanic, not the old one).

## What's actually there today (confirmed by reading the file, not assumed)

- `public/lessons/grade9-missions.html` (447KB/6731 lines) is the real
  "Mission IDE" — `public/lessons/grade9.html` (108KB/2058 lines) is a
  SEPARATE, unrelated textbook-style track (U1-U6 book chapters, OS/
  networking/cybercrime/web-dev, "fill-in" exercises) — not where any of
  this user feedback applies. All work here is in `grade9-missions.html`.
- `flowg1` through `flowg18` (`FOUNDATIONS 3 · FLOWGORITHM` /
  `FLOWGORITHM PRACTICE` / `FLOWGORITHM PRACTICE 2`) — 18 missions, every
  single one is a flowchart with exactly ONE `IF/ELSE` decision (odd/even,
  pass/fail, largest-of-three, prime check, GCD, factorial, Armstrong
  number, decimal-to-binary...). **None contain a loop.** Confirmed by
  reading every mission's `diagram:`/`starter:` — all share the identical
  shape: assign a hardcoded value → one Decision diamond → two Output
  branches → `answer()`.
- The ONLY loop content is `PHASE 1 · LOOPS` (`learn-loops-p1`, `p1m4`-
  `p1m7`) — 4 missions, turtle-graphics shape-drawing (Square/Staircase/
  Spiral/Comet), command-based (`forward()`/`left()`/`right()`), no
  flowchart, no trace table, no FOR vs WHILE vs DO-UNTIL comparison at
  all. Genuinely a different skill (spatial/geometric) taught with a
  different mechanic (turtle commands, not `answer()`), nowhere near the
  flowchart section.
- `requireCode: { re: /pattern/, msg }` is how EVERY mission (turtle and
  data alike) stops a student from hardcoding the final result — it
  regex-checks the student's actual code for the expected real logic
  (e.g. `n MOD 2 = 0`) before accepting whatever `answer()` reported. This
  is a reasonable goal (don't let a student fake it), but `answer()`
  itself as the REPORTING mechanism is what's clunky.
- The split layout (`.main { grid-template-columns:1fr 1fr }`) puts
  `.left` = canvas/scene + brief + console + lesson, `.right` = editor
  ONLY. For `type:'data'` missions the canvas is irrelevant (never drawn
  to) and there is NO variable table anywhere — `.console` is a scrolling
  text log, not a structured trace. This is backwards from both Grade
  8's convention (IDE prominent, output/challenge on the other side) and
  from what the user asked for.
- Concept-mastery mapping (`G9M_MISSION_CONCEPT_OVERRIDE`) already has a
  real `g9-flowcharts-loops` concept — but it's only wired to `flow-p1`/
  `flow-p2`/`flow-code` (the earlier, simpler flowchart-reading missions),
  NOT to any of `flowg1`-`flowg18`. Another real, previously undetected
  gap to fix alongside the content work, not a separate task.

## The actual engine mechanism (read directly, for whoever picks this up)

- `runMission()` dispatches by `mission.type`: `'battle'` →
  `runBattleMission()`, `'data'` → `runDataMission()`, else → the turtle
  path (unchanged by this work).
- `runDataMission()` (~line 6043) calls `execPythonData()` (Pyodide) or
  `execPseudo(code, mission, dataEnvFor(mission))` (the custom pseudocode
  interpreter), gets back `{ ok, answer, outputs }`, and checks it with
  `evalDataSuccess(mission, res.answer)` — a numeric-tolerance or
  case-insensitive string match against `mission.answer`.
- `execPseudo()` (~line 4171) already tracks every variable in
  `scopes[0]` (a plain object — the top-level scope) as it executes. For
  a `type:'data'` mission, `fns.answer = v => { answerVal = v }` is the
  ONLY thing `answer()` actually does — it's just one more assignment
  into a closure variable. **`scopes[0]` already has everything a
  variable table needs; it was just never returned.** The data-mission
  return (~line 4538) is `return { ok: true, answer: answerVal, outputs }`
  — add `vars: { ...scopes[0] }` here (filtered to drop any
  injected/non-student keys) and the pseudocode side of variable
  exposure is close to free.
- `execPythonData()` (Pyodide, ~line 4619) needs the equivalent: after
  running the student's code, read back the relevant globals from the
  Pyodide namespace (`pyodide.globals.toJs()` or iterating named
  variables) instead of relying solely on whatever was passed to a
  Python-side `answer()` shim. Not yet investigated in detail — do this
  first, since it's the other half of "both languages, same mechanic."

## Plan (phases — do NOT try to do this all at once)

### Phase 1 — Engine: expose real variable state, stop requiring answer()
1. `execPseudo()`: return `vars` (the final top-level scope) for
   `type:'data'` missions.
2. `execPythonData()`: same, from Pyodide's globals.
3. Design the NEW mission-check shape to replace `answer: 'Odd'` +
   `requireCode` — e.g. `checkVars: { result: 'Odd' }` (one or more
   variable names + expected final values), so a mission's starter code
   can just be `result = "Even"` / `result = "Odd"` as the natural last
   line of the if/else, no special function call at all. `requireCode`
   stays (still needed to stop hardcoding the literal), just drop the
   `answer()` wrapper around it.
4. Build the **Variable Table** UI — a real table (name | value),
   populated from `res.vars` after a Run, shown on the non-editor side.
5. Rework the split layout for `type:'data'` missions specifically (NOT
   the turtle missions, which legitimately need the canvas): IDE on one
   side, **variable table + console output + challenge brief** on the
   other — the exact shape the user asked for, matching Grade 8.
6. Migrate `flowg1`-`flowg18` (and the earlier `cb1`-`cb9`/variables
   intro missions that also use `answer()`) onto the new mechanic. This
   touches every one of those mission definitions — expect to do this in
   batches, verifying with `scripts/test-g9-missions.mjs` after each
   batch, same discipline as the Grade 7/8 content passes.
7. Fix the `G9M_MISSION_CONCEPT_OVERRIDE` gap for `flowg1`-`flowg18`
   while touching these missions anyway.

### Phase 2 — Content: real loop missions in the flowchart section
Add new `flowg`-style missions (flowchart diagram → pseudocode `FOR`/
`WHILE`/`REPEAT...UNTIL` → Python `for`/`while`) using the Phase 1
mechanic from the start (no point building them on the old `answer()`
shape). Needs, at minimum:
- A FOR-loop flowchart (e.g. sum 1 to N, or print a times table) with a
  real trace table (iteration | variable values each pass).
- A WHILE-loop flowchart (condition-checked-first) — genuinely different
  from FOR, needs its own explainer (runs 0+ times vs FOR's fixed count).
- A DO-UNTIL/REPEAT-UNTIL flowchart (condition-checked-after) — the
  Cambridge-pseudocode construct, distinct from WHILE (runs 1+ times).
- A short "FOR vs WHILE vs REPEAT-UNTIL — which one and why" comparison,
  matching the `learn-loops-p1`-style theory-panel pattern already used
  elsewhere in this file.
Keep the existing turtle Phase 1 Loops missions (`p1m4`-`p1m7`) exactly
as they are — this is additive, in the flowchart section specifically.

### Phase 3 — Polish
- Re-check concept-mastery mapping for the new missions.
- Re-run `scripts/test-g9-missions.mjs` and `scripts/test-g9-challenges.mjs`
  fully once Phases 1-2 are done.

## Status key
- [ ] not started · [~] in progress · [x] done

## Work log
- [x] Phase 1.1 — expose `vars` from `execPseudo()` for data missions
- [x] Phase 1.2 — expose `vars` from `execPythonData()` (Pyodide globals)
- [x] Phase 1.3 — design `checkVars`-style mission check shape
- [x] Phase 1.4 — build the Variable Table UI component
- [~] Phase 1.5 — rework the split layout for `type:'data'` missions —
      `.left` already had diagram+brief+console with `.right` as the
      pure IDE (`.main{1fr 1fr}`); the Variable Table was added into
      that existing `.left` flow (inside `#data-wrap`, below the
      diagram) rather than a full layout rebuild, since the shape
      asked for (IDE one side, output+variables+challenge the other)
      was already close — judge whether this is sufficient once real
      missions are migrated and it's seen with real content, before
      doing further layout surgery.
- [ ] Phase 1.6 — migrate flowg1-18 + cb1-9 off `answer()`
- [x] Phase 1.7 — fix `G9M_MISSION_CONCEPT_OVERRIDE` for flowg1-18
      (done alongside Phase 2, since the new missions needed mapping
      too and flowg1-18 were sitting right there unmapped)
- [x] Phase 2 — REPEAT-UNTIL interpreter support + 2 new missions —
      **correction to this file's original Phase 2 plan**: flowg15-18
      already contained real loops (WHILE for GCD/Armstrong/prime,
      FOR for factorial) and `learn-pseudo-control` already compared
      FOR vs WHILE — the first read of this file only checked
      flowg1/flowg2 in full and wrongly generalized "no loops at all"
      to all 18. What was genuinely, completely missing was
      REPEAT-UNTIL — not in any mission, not in the comparison lesson,
      and not in the interpreter itself. See the Log for what was
      actually built.
- [x] Phase 3 — final verification pass over everything built so far
      (Phase 1 + Phase 2): `scripts/test-g9-missions.mjs`,
      `test-g9-challenges.mjs`, `npx tsc --noEmit`, `npx eslint` on the
      touched route file, full `npm run verify`, and a clean `git
      status` — all pass, nothing uncommitted. This covers Phase 1's
      engine work and Phase 2's REPEAT-UNTIL content; it does NOT yet
      cover Phase 1.6 (migrating flowg1-18 onto checkVars), which is
      still unstarted — re-run this pass again once that's done.

- 2026-11-09: created this file after a full read-through of
  `grade9-missions.html` confirmed every point of the user's feedback
  (no loops in the flowchart section at all; loops only exist as
  disconnected turtle shapes; `answer()` is purely a reporting shim
  around a value the pseudocode interpreter already tracks in
  `scopes[0]`; the data-mission layout never had a variable table and
  wastes half the screen on an unused canvas). User confirmed via
  AskUserQuestion: keep turtle shapes + add trace-table loops; replace
  `answer()` with a real variable-inspection check. Not started yet —
  this is genuinely Grade-8-TODO-sized work; next step is Phase 1.1/1.2
  (the engine groundwork everything else depends on).
- 2026-11-09 (continued): built Phase 1.1-1.4. `execPseudo()` and
  `execPythonData()` both now return `vars` (a diff against each
  mission's injected baseline keys) for `type:'data'` missions; a new
  `#data-wrap-vars` Variable Table UI renders them; `evalDataSuccess()`
  gained a `mission.checkVars: { name: expected }` path that reads the
  table directly, no `answer()` needed, kept alongside the untouched
  legacy `mission.answer` path (two separate params, not a reshaped
  `res`, so no existing caller/test needed to change). Verified live via
  scripted Electron/CDP against `flowg1`: pseudocode's Variable Table
  correctly shows `n=7` after a legacy run, and the new `checkVars`
  mechanic correctly handles right-answer/wrong-answer/never-set-the-
  variable, each with real messaging naming the specific variable.
  Could NOT live-verify the Python/Pyodide side in this sandbox
  (dynamic WASM import failed under Electron/CDP for reasons unrelated
  to this change — the same CDN URL is reachable by plain curl); the
  Pyodide globals diff uses the same `py.globals.toJs()` API the
  existing, already-working Python paths rely on, but treat it as
  unverified live until checked in a real browser.
  `node scripts/test-g9-missions.mjs` (all pass) + `test-g9-challenges.mjs`
  (141 passed) + full `npm run verify` — all clean. No mission content
  touched yet. Next: Phase 1.6 — migrate `flowg1`-`flowg18` onto
  `checkVars`, batch by batch, verifying after each batch.
- 2026-11-09 (continued, Phase 2): re-reading flowg15-18 in full (not
  just by title, the mistake the original Phase 2 plan made) found
  they already use real WHILE/FOR loops with proper diagrams, and
  `learn-pseudo-control` already teaches FOR vs WHILE. The real,
  total gap was `REPEAT-UNTIL` — added it to `execPseudo()` (body
  always runs ≥1 time, condition on the `UNTIL` line checked AFTER
  each pass, opposite sense from WHILE), to CodeMirror's keyword
  highlighting, and to `learn-pseudo-control`'s theory (a genuine
  FOR/WHILE/REPEAT-UNTIL comparison table: checked-when, minimum
  runs, when to use each). Added two new missions on the `checkVars`
  mechanic from Phase 1 (no `answer()` at all): `flowg19` ("Doubling
  Until Over" — a clean single-loop intro) and `flowg20boss`
  ("Digital Root" — WHILE nested inside REPEAT-UNTIL, a real
  capstone reusing the digit-peeling pattern from Armstrong/
  decimal-to-binary). Caught a real bug while testing flowg19's own
  reference solution: its starter code's commented-out TODO used the
  display-only `×` symbol instead of the tokenizer's actual `*`
  operator — would have thrown a cryptic "Cannot read: × 2" at any
  student who uncommented it as written; fixed before it ever shipped.
  Also closed Phase 1.7 while here: `flowg1`-`flowg20boss` (20
  missions) were never in `G9M_MISSION_CONCEPT_OVERRIDE` — completing
  any of them never counted toward `g9-flowcharts-loops` mastery; all
  20 are mapped now. Bumped `TOTAL_MISSIONS` 126→128 in the
  `g9-progress` API route. Verified: `execPseudo`'s new REPEAT branch
  directly (basic loop, runs-at-least-once-even-if-already-true,
  unmatched-UNTIL error), both new missions' reference solutions via
  `scripts/test-g9-missions.mjs` (added to `DATA_REF`, plus a
  hardcode-without-a-real-loop negative test), and the full UI flow
  live via scripted Electron/CDP (diagram renders, hints show, the
  Variable Table populates with real values, Submit unlocks on a
  correct run) for both new missions. Full test suites + tsc + `npm
  run verify` clean throughout.
  **Known gap, not fixed**: `flowg15`-`flowg18` (and now `flowg19`/
  `flowg20boss`) have no Russian translation in `grade9-ru.js` — a
  pre-existing gap for this whole mission type, flagged rather than
  silently expanding this task to cover it.
  Next: Phase 1.6 (migrate `flowg1`-`flowg18` onto `checkVars`, which
  is now also the established pattern Phase 2's new missions used) —
  or user may redirect elsewhere first.
