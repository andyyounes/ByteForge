# Grade 7 — exam-level detail rewrite (+ Russian translation)

Goal (user request, 2026-11-05): bring Grade 7's exercise descriptions up
to the same bar Grade 8 got (see `TODO.md`, now complete) — live visual
comparisons where it helps, numbered checklists, clear WHY, not just "do
X". **Every stage touched must also get a Russian translation** — this
was missed for most of Grade 8's pass and had to be caught after the
fact (see `TODO.md`'s own note + the `G8_RU_WEB` fix); do it as part of
each module this time, not as a separate forgotten step.

## Starting point — what's already there

Spot-checked `st1` (Story Studio 1) — it's already decent: specific
requirements, real examples in the hints, exact-text checks explained.
Not AS detailed as Grade 8 got (no live-rendered visual comparisons —
block-based "page" builder, not raw HTML/CSS, so a figFrame-style
example may or may not translate directly; judge per-module, don't force
it where it doesn't fit). Like Grade 8, assume stages may already be
decent and verify before rewriting — don't churn working content.

## Translation mechanism — READ THIS FIRST before editing any stage

- Quiz-type stages (`type:'quiz'`) already translate via `G7_RU_QUIZ` in
  `grade7-ru.js` (prompts/options/accepted answers) — cb1-cb6 are all
  quiz-type. Check `G7_RU_QUIZ[ch.id]` exists and covers whatever's
  edited; extend it if a quiz's wording changes.
- Non-quiz stages (`type:'page'`, Blockly/code stages) have **no
  translation layer at all** today — `document.getElementById('ch-text').innerHTML = ch.text`
  renders the raw English `text:` field directly (confirmed by reading
  the render call directly, ~line 3774). Before editing any non-quiz
  stage's `text:`, build the same mechanism Grade 8 got
  (`G8_RU_WEB` + the generalized `examStageText()` lookup, see
  `grade8.html`/`grade8-ru.js` and the "Russian-translate the content
  added in the TODO pass" commit) — a `G7_RU_WEB` map in `grade7-ru.js`
  + a small lookup function wired into that render line, keyed by
  stage id, same pattern. Build this ONCE (first non-quiz stage
  touched), reuse it after.

## Status key
- [x] done (content verified/converted AND translated where applicable)
- [~] content done, translation still pending
- [ ] not started

## Modules, in teaching order (28 total)

- [x] cb1 — Computer Basics: What Is a Computer? (5 stages, quiz) — WHY
      moved from hints into the visible text (same fix as Grade 8's
      py1-py5); full Russian translation added for all 5 stages via the
      new G7_RU_TEXT mechanism (built as part of this stage)
- [x] cb2 — Computer Basics: Files & Storage (5 stages, quiz) — content
      already clear; quiz Q&A were already translated in G7_RU_QUIZ
      from an earlier pass, only the ch.text intro was missing — added
      via G7_RU_TEXT
- [x] cb3 — Spotting Scams (5 stages, quiz) — same as cb2
- [x] cb4 — Phishing & Fake Logins (5 stages, quiz) — same as cb2
- [x] cb5 — Prompt Generation (5 stages, quiz) — same as cb2
- [x] cb6 — "Stay Smart Online" Guide (5 stages: cb6s1-4/cb6boss,
      chat+page project) — content already clear; added G7_RU_TEXT for
      all 5 (chatTask, the separate free-text prompt instructions
      panel, stays English — not translated anywhere on the platform,
      same as grade8's equivalent chat stages)
- [x] st1 — Story Studio 1: Page Basics (6 stages: st1s1-5, st1boss) —
      content already good on review (specific requirements, real
      examples in hints, exact-text checks) — left as-is, not forced
      into Grade 8's live-visual-comparison style since this is a
      block-based page builder, not raw HTML/CSS; translated all 6
      stages via G7_RU_TEXT
- [x] st2 — Story Studio 2: Style It (5 stages: st2s1-4, st2boss) —
      same verdict as st1 (already clear, left as-is); translated all
      5 stages via G7_RU_TEXT
- [x] st3 — Story Studio 3: Make It Click (5 stages: st3s1-4, st3boss) —
      already clear on review, left as-is; translated all 5 stages
- [x] st4 — Story Studio 4: Remember Things (5 stages: st4s1-4, st4boss) —
      already clear on review, left as-is; translated all 5 stages
- [x] st5 — Story Studio 5: Choose a Path (5 stages: st5s1-4, st5boss) —
      already clear on review, left as-is; translated all 5 stages
- [x] sc1 — Block Arcade 1: Sprites & the Stage (4 stages: sc1s1-3,
      sc1boss) — content already clear; translated all 4
- [x] sc2 — Block Arcade 2: Motion & Repeat (4 stages: sc2s1-3,
      sc2boss) — same, translated all 4
- [x] sc3 — Block Arcade 3: Events (4 stages: sc3s1-3, sc3boss) —
      same, translated all 4
- [x] sc4 — Block Arcade 4: Variables (4 stages: sc4s1-3, sc4boss) —
      same, translated all 4
- [x] sc5 — Block Arcade 5: If/Else (4 stages: sc5s1-3, sc5boss) —
      same, translated all 4
- [x] g1 — Sprite Start (6 stages: g1s1-5, g1boss) — already clear,
      translated all 6
- [x] g2 — Variables & State (5 stages: g2s1-4, g2boss) — same
- [x] g3 — Decisions (5 stages: g3s1-4, g3boss) — same
- [x] g4 — My Blocks (5 stages: g4s1-4, g4boss) — same
- [x] g5 — Player Control (5 stages: g5s1-4, g5boss) — same
- [x] g6 — Collision & Physics (5 stages: g6s1-4, g6boss) — same
- [x] g7w — Game States (5 stages: g7s1-4, g7boss) — same
- [ ] g8 — Smart NPCs (stages)
- [ ] g9w — Strings & Dialogue (stages)
- [ ] gsafe — Security Lab: Spot the Scam (stages)
- [ ] g10 — Design & Capstone (stages)
- [ ] g11 — Bonus: Simulation Lab (optional, stages)

(Exact stage counts to fill in as each module is actually opened —
listed as "(stages)" where not yet counted, to avoid guessing wrong
numbers into this file.)

## Log
- 2026-11-05: created this file, after closing the sequential-unlock
  bypass bug (separate fix, see the "Close the sequential-unlock
  bypass" commit). Spot-checked st1 — already reasonably good, not yet
  converted.
- 2026-11-05 (continued): built the missing ch.text translation layer
  — turns out it was needed for EVERY stage type, not just non-quiz
  ones as first assumed: G7_RU_QUIZ only ever translated quiz
  QUESTIONS, never the stage's own intro text, so a Russian-mode
  student was seeing an English intro above Russian questions even on
  already-translated quiz stages. Added window.G7_RU_TEXT (plain
  strings) + stageText() lookup wired into the render call and the
  BFLang.onChange re-render hook, same pattern as grade8.html's
  G8_RU_WEB/examStageText(). Converted cb1 (5 stages) as the first
  real module: WHY pulled from hints into visible text, full Russian
  translation for all 5. Verified live via a scripted CDP session —
  English and Russian both render correctly via BFLang.set(). Full
  npm run verify + npx tsc --noEmit clean. Next: st2 (or finish st1's
  second pass), then continue down the module list.
- 2026-11-08: reviewed st1 and st2 — both already clear and specific
  (numbered challenges, real example text in hints, exact-text checks
  spelled out), so left the English content as-is rather than forcing
  in Grade 8-style live visual comparisons (st1/st2 use a block-based
  page builder, not raw HTML/CSS, so that device doesn't map cleanly).
  Added full G7_RU_TEXT Russian translations for all 6 st1 stages and
  all 5 st2 stages, keeping exact-match literals ("My Story", "Read
  the next chapter", "Start Reading") in English since the check
  functions compare against those exact English strings. No engine
  changes needed — stageText()/G7_RU_TEXT lookup was already generic.
  npm run verify (all suites) + npx tsc --noEmit clean. Next: st3.
- 2026-11-08 (continued): st3, st4, st5 all reviewed — same verdict
  (already clear, specific, well-scaffolded — onclick handlers,
  variables, if/else all explained with real worked examples in the
  hints) — left English as-is, translated all 15 remaining stages
  (st3s1-4/st3boss, st4s1-4/st4boss, st5s1-4/st5boss) via G7_RU_TEXT.
  Story Studio (st1-st5, Semester 1) is now fully converted+translated.
  node scripts/test-g7-challenges.mjs (514 passed) + npx tsc --noEmit
  clean. Next: sc1 (Block Arcade 1), start of Semester 2.
- 2026-11-08 (continued): cb2-cb6 — discovered their quiz Q&A were
  already translated in G7_RU_QUIZ from an earlier session, just
  never the ch.text intro (the exact gap cb1 had). Added G7_RU_TEXT
  entries for all 25 remaining cb stages (cb2-cb6). All of Semester 1
  (cb1-cb6, st1-st5) is now fully converted + translated.
  node scripts/test-g7-challenges.mjs (514 passed) + npx tsc --noEmit
  clean. Next: sc1 (Block Arcade 1), start of Semester 2.
- 2026-11-08 (continued): sc1-sc5 (Block Arcade, 20 stages) — all
  already clear (coordinates, repeat loops, key events, variables,
  if/else, well-scaffolded with worked hint examples), left as-is,
  translated all 20 stages via G7_RU_TEXT. node scripts/test-g7-
  challenges.mjs (514 passed) + npx tsc --noEmit clean. Next: g1
  (Sprite Start), start of the Game Maker track (g1-g11).
- 2026-11-08 (continued): g1-g7w (Game Maker, 36 stages) — all
  already clear and well-scaffolded (coordinates, variables,
  if/else-if/else, custom functions with parameters, collision via
  distance formula and range checks, game-state machines), left as-is,
  translated all 36 stages via G7_RU_TEXT. node scripts/test-g7-
  challenges.mjs (514 passed) + npx tsc --noEmit clean. Next: g8
  (Smart NPCs).
