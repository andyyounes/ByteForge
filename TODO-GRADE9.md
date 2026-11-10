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
- 2026-11-10 (Phase 4, new — user request): "add flowgorithm exercises,
  drag and drop, and editing like double-click → select variable name,
  select data type or array size, for loops, while/do loops, if else."
  Reading the file for this surfaced something unplanned: a COMPLETE
  drag-and-drop flowchart builder already existed (`type:'flowchart'`,
  `renderFlowchartBubble`/`addShape`/`runFlowchart`/`checkFlowchart`,
  real execution + Flowgorithm-style output grading) — just never used
  by a single mission. Built:
  - The double-click structured editor itself (the actual ask): a
    modal per shape type — Declare gets variable name + data type
    select + an "is array" checkbox revealing a size field; Assign
    gets target + expression; Decision/While/Repeat get a left/
    operator/right condition composer; For gets variable/start/end;
    Output gets an expression field. Saving writes the SAME label
    string format `runFlowchart()` already parsed (e.g. "Integer n",
    "n = 1 to 10") — no engine rewrite needed, just a friendlier way
    to produce the existing format.
  - A `repeat` shape type (checked-after, opposite sense from While),
    matching Phase 2's interpreter-level REPEAT-UNTIL.
  - Real array support in the shape-graph's OWN expression engine
    (`fcEval`/`fcExecAssign` gained `arr[i]` read/write, 1-based) —
    previously nonexistent; Declare now actually respects its type
    and array size (every declare used to hardcode `vars[name] = 0`
    regardless of what was written).
  - Draft persistence (second half of this request, "don't forget to
    save their work") — a built-but-unfinished flowchart had NEVER
    been saved anywhere before this; closing the mission or reloading
    just lost it. Added `fcSaveDraft()`/`fcLoadDraft()` mirroring the
    existing code-draft pattern exactly (localStorage + LessonSaves,
    debounced), called after every mutation (add/delete/drag-end/
    connect/structured-edit-save). Reopening now restores the
    student's real work; Clear now confirms and genuinely wipes the
    saved draft too.
  - Six new missions ("different walkthroughs"), phase "BUILD A
    FLOWCHART": `fcb1` (declare/assign/output), `fcb2` (arrays),
    `fcb3` (For), `fcb4` (While), `fcb5` (Repeat-Until — same sum,
    inverted condition, reinforcing the checked-after distinction),
    `fcb6boss` (For+Decision nested, even-numbers-only capstone).
    Registered in TIERS + concept mapping; `TOTAL_MISSIONS` 128→134.
  Verified live via scripted Electron/CDP: the array engine (declare+
  FOR-fill+nested-FOR-read), While vs Repeat on the IDENTICAL graph
  shape with only the condition inverted (both give the same correct
  sum — confirms the semantic is really opposite, not just relabeled),
  the editor's prefill/save roundtrip for every shape type, graceful
  out-of-bounds array errors, the full save/restore/wipe draft cycle,
  and all 6 new missions built from their own minimal solution and
  checked via the real `checkFlowchart()` — caught and fixed one real
  bug this way (`fcb6boss`'s shape/connection minimums were set higher
  than its own correct minimal solution). Full G9 suites + tsc +
  eslint + `npm run verify` clean throughout.
  Still outstanding, unchanged: Phase 1.6 (migrate `flowg1`-`flowg18`
  onto `checkVars`), and these 6 new missions have no Russian
  translation either (same flagged gap as flowg15-20).

## Phase 5 — OUTPUT checking + enforced DECLARE (2026-11-10, user feedback on a screenshot)

User was looking at `flow-p1` live and reported three things in one
message: don't use `answer()`, there's no button to reach the next
mission, and we don't enforce declaring a variable. A later message
added: don't bake the answer into starter-code TODO comments, and
Flowgorithm's own source/sample files are a legitimate place to pull
real flowchart examples from for future content. All real, and the
first three turned out to share one root cause — see the Phase 5
commit ("Grade 9 Phase 5: real OUTPUT checking + enforced DECLARE, 23
missions") for the full detail. Summary:

- **OUTPUT-based checking** (`mission.expectedOutput`) replaces
  `answer()` for all 23 flowchart-to-code missions whose own diagrams
  end in a real Output shape (`flow-p1`, `flow-code`, `flowg1`-
  `flowg20boss`) — checks `res.outputs` (real `OUTPUT`/`print()`
  output, Python's added via a new Pyodide `setStdout` capture)
  instead of a special reporting function. `flowg3`/`5`/`6`/`flowgboss`
  were also redesigned to OUTPUT once per loop iteration instead of
  building one comma-joined string — simpler AND more honest to their
  own diagrams.
- **Real DECLARE enforcement** — `execPseudo()` now actually parses
  `DECLARE name : TYPE` (scalar) and `DECLARE name[size] : TYPE`
  (array) as real syntax, and assignment now requires the variable to
  already be declared. Scoped via `mission.requireDeclare` (NOT a
  blanket change) after measuring the real blast radius first: turning
  it on globally broke `cb1` ("Foundations 4: Your First Code"), which
  deliberately teaches the informal "assignment alone creates it"
  model as its own first lesson on variables — so a blanket change
  would have broken that content's actual teaching point, not just
  syntax. Set on the 23 migrated missions + `p3m1`-`p3m5`.
- **The "no next mission button" report wasn't a separate bug** — the
  win overlay and its buttons already worked; the student just never
  reached that screen because the old `answer()`/skip-declare
  combination never let them genuinely pass. Confirmed live: once
  `flow-p1` is solved correctly, Submit shows a working win screen
  with a real, visible "Next mission →" button.
- Rewrote every touched starter's TODO comments to describe WHAT to do
  instead of the literal solution commented out (several had been
  giving the whole answer away).

**Deferred, not silently dropped** — tracked here for whoever picks
this back up:
1. **Russian translation for `type:'data'` missions** — `openMission()`
   never had any RU lookup for `m.brief`/hints/diagram at all (a
   structural gap predating this session, affecting ALL `flow-p1`
   through `flowg20boss` plus the new `fcb1`-`fcb6boss` builder
   missions), unlike the `learn`/`quiz`/`cards` bubble types which
   already have real RU wiring via `g9Ru()`/`applyBubbleLang`. Needs
   the same kind of mechanism (a `G9_RU_DATA`-shaped map in
   `grade9-ru.js` + a lookup wired into `openMission`'s `m-brief`
   assignment) before any of this content can actually be translated.
2. **The "commented-out full answer" TODO style still exists** on the
   ~40 other `type:'data'` missions this phase didn't touch (`cb1`-
   `cb9`, `cbboss`/`cbboss2`/`cbboss3`, `p0m1`-`p0m8`/`p0m5c`,
   `p0bm1`-`p0bm6`/`p0bboss`, `p0boss`, `p4m1`-`p4m5`/`p4m7`/`p4boss`)
   — same fix pattern as Phase 5, just not applied there yet.
3. **A function reference/guide** — there's no panel anywhere listing
   what `MOD`/`DIV`/`STR`/`INT`/`REAL`/`LENGTH`/`ROUND`/`SUM` etc.
   actually do; a student has to infer it from hints alone.
4. **FOR-loop content needs a genuine easy→hard progression** — user's
   own words: "start simple, like printing numbers, for 1 to 5, then
   printing more numbers, then printing only even or odd numbers from
   1 to 100 — progressive, not jumping straight to a harder mission."
   `flowg3` (1-5) → `flowg4`/`flowg6` (1-10) → `flowg12` (1-50) is
   already somewhat graded, but hasn't been reviewed specifically
   against this ask.
5. **Flowgorithm's own source/sample files** are a real, legitimate
   source for future flowchart content — worth using instead of
   hand-designing every new mission from scratch, per the user's own
   suggestion.

## Phase 6 — layout/navigation parity with Grade 8 (2026-11-10)

User asked to make Grade 9's mission screen look/work like Grade 8's
instead of its own mirrored layout. Scoped via AskUserQuestion to
"layout + key navigation pieces," not a full pixel-for-pixel port.

- Editor moved to the LEFT (Grade 8's side), challenge/output/console
  stacked on the right — done via CSS `order` on the grid items, no
  DOM reorder, so no JS selector needed to change.
- Added a compact "Mission N of M" Prev/Next stepper scoped to the
  current TIERS group, matching Grade 8's `ch-nav-strip`.
- Added an always-visible "Complete the mission to continue →"
  footer, matching Grade 8's `ch-footer` — enables once the mission
  has real stars, falls back to `winNext()`'s tier-boundary logic.

Verified live: editor bounding rect confirmed at x=0 (left), nav
strip reads correctly for a mid-tier mission, footer starts disabled
and `stepMission()` genuinely navigates. Full regression (134
missions, 141 challenge tests, tsc, `npm run verify`) clean.

**Deliberately not ported** (outside the confirmed scope): Grade 8's
collapsible full challenge-list toggle, its per-challenge lesson-panel
visual chrome, and its exam-specific UI (not applicable to Grade 9's
mission model).

## Phase 7 — Flowgorithm visual fidelity + functions (2026-11-10, IN PROGRESS)

User flagged two real gaps after seeing the live site next to the
actual Flowgorithm desktop app:

1. **No "challenge words → design your own flowchart" step.** Today
   `flowg1`-`flowg20` give a FINISHED flowchart and ask the student to
   transform it into code; `fcb1`-`fcb6boss` (the drag-and-drop
   builder) give a spec so prescriptive it already names every shape
   to use. Neither one is "here's a problem in English, you decide
   the structure." Scoped via AskUserQuestion: add a NEW tier of
   builder missions after `fcb6boss` that are genuine word problems
   (no shapes/structure given away) — `fcb1`-`fcb6boss` stay as-is
   (they teach the TOOL). NOT STARTED — still need to design ~6
   missions (single decision → for-only → while-only → nested
   decision → decision-in-loop → boss combining all three), remembering
   the builder has no Input shape (only Output), so values must be
   hardcoded via Assign, and grading is real execution
   (`req.expectedOutput` against `runFlowchart()`'s actual output, not
   just a shape/connection count) — see `checkFlowchart()`.

2. **The static "Flowchart to Code" diagrams didn't look like real
   Flowgorithm.** Confirmed against Flowgorithm's own shapes legend
   (a Wikimedia reference image) that For/While/Do share one hexagon
   shape (not a diamond), and that the legend has no Yes/No text
   anywhere — only the separate If/decision diamond implies that.
   Fixed so far:
   - `fcLoopHTML` now draws the real hexagon (same clip-path as the
     builder's own `.fc-shape[data-type="for"]`), with a "↻ back to
     top" loop-back instead of invented Yes/No text.
   - `fcBranchHTML` now draws real connector lines (a tick out of the
     diamond, down into each branch column) instead of floating
     "YES ↓" text — verified live on `flowg7`'s 3-chained-decision
     diagram, reads as an actual flowchart now, not a vertical list.
   Both changes are shared rendering functions, so they apply to
   every mission that calls them with no per-mission edits needed.
   Each change needs a `public/sw.js` `CACHE_NAME` bump in the SAME
   commit (confirmed via `TODO-GRADE9.md`'s own Phase-change-tracking:
   forgot it once already on the very first of these edits) —
   currently at `bf-offline-v4`.

**Resequencing + new word-problem tier — DONE (2026-11-10).** User
asked directly: "why don't we have flowchart exercises before that?"
(i.e. before the 20-mission read-a-finished-flowchart gauntlet), then
"rewrite foundations 3 all 3-4 of them." Shipped in one pass:
- `fcb1`-`fcb6boss` (the drag-and-drop builder) **moved** from dead
  last in Foundations 3 to right after the shapes/tracing intro
  (`flow-p1`/`flow-p2`), before `flow-code`/`flowg1`-`20boss` — a
  student now builds one with their own hands before reading 20+.
- New tier **`fcw1`-`fcw6boss`** ("DESIGN YOUR OWN"): genuine word
  problems with NO structure handed over (unlike `fcb1`-`6boss`'s
  prescriptive specs), built in the same canvas, placed at the very
  end of Foundations 3. Progression: single decision (`fcw1`) → for
  loop only (`fcw2`) → while loop only (`fcw3`) → chained decisions
  (`fcw4`) → decision-inside-loop + counter (`fcw5`) → boss combining
  all of it (`fcw6boss`). Every one of these 6 solutions was verified
  for real by hand-building its shape/connection graph and running it
  through the actual `runFlowchart()` engine in a Node vm sandbox
  (not just eyeballing the expected numbers) — all 6 match their
  `expectedOutput` exactly.
- `TIERS` updated to match (tier split + 2 new entries); `app/api/
  teacher/g9-progress/route.ts`'s `TOTAL_MISSIONS` bumped 134→140 (6
  new real missions) — `test-g9-missions.mjs` catches this drift on
  its own if it's ever missed again.
- `public/sw.js` bumped to `bf-offline-v5` (same cache-bump discipline
  as every other change in this phase).

User explicitly asked for the OTHER THREE items below in stages
(AskUserQuestion). Still open, in priority order:
- **Run-and-animate**: add a ▶ Run button to these static diagrams
  that steps through the ALREADY-FINISHED flowchart shape by shape,
  highlighting the active shape and showing variable values live —
  like Flowgorithm's own playback. Blocked on a real design decision:
  today's diagrams are composed HTML strings (`fcShapeHTML`/
  `fcDiagram`/`fcBranchHTML`/`fcLoopHTML`), not an executable
  `{shapes, connections}` graph like the builder's `_fcShapes`/
  `_fcConns` — animating step-by-step needs that structured form (or
  a parallel data model) so `runFlowchart()`'s logic can drive it.
- **Drag-and-drop puzzle conversion** (later, user's own words: "in
  stages"): turn the hardest of these static-diagram missions into
  assembly puzzles instead, reusing the builder.
- **Functions/procedures reinforcement**, scoped via AskUserQuestion
  to BOTH: (a) a proper Call/Procedure shape in the drag-and-drop
  builder (double-bar box, matching Flowgorithm's own legend) with
  new missions that define-and-call a function, and (b) separate
  function-focused missions in the regular Python/Pseudocode code
  track (parameters, return values) — neither started yet.
