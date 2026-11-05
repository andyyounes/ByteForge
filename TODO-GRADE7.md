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

- [ ] cb1 — Computer Basics: What Is a Computer? (5 stages, quiz)
- [ ] cb2 — Computer Basics: Files & Storage (5 stages, quiz)
- [ ] cb3 — Spotting Scams (5 stages, quiz)
- [ ] cb4 — Phishing & Fake Logins (5 stages, quiz)
- [ ] cb5 — Prompt Generation (stages, quiz)
- [ ] cb6 — "Stay Smart Online" Guide (stages, project)
- [~] st1 — Story Studio 1: Page Basics (6 stages) — already decent on
      review (specific requirements, real examples), needs a second look
      for live-visual additions and translation; not yet converted
- [ ] st2 — Story Studio 2: Style It (stages)
- [ ] st3 — Story Studio 3: Make It Click (stages)
- [ ] st4 — Story Studio 4: Remember Things (stages)
- [ ] st5 — Story Studio 5: Choose a Path (stages)
- [ ] sc1 — Block Arcade 1: Sprites & the Stage (stages)
- [ ] sc2 — Block Arcade 2: Motion & Repeat (stages)
- [ ] sc3 — Block Arcade 3: Events (stages)
- [ ] sc4 — Block Arcade 4: Variables (stages)
- [ ] sc5 — Block Arcade 5: If/Else (stages)
- [ ] g1 — Sprite Start (stages)
- [ ] g2 — Variables & State (stages)
- [ ] g3 — Decisions (stages)
- [ ] g4 — My Blocks (stages)
- [ ] g5 — Player Control (stages)
- [ ] g6 — Collision & Physics (stages)
- [ ] g7w — Game States (stages)
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
  converted. Translation mechanism for non-quiz stages doesn't exist
  yet (quiz stages already have one via G7_RU_QUIZ) — needs building
  as part of the first non-quiz stage actually touched. Not yet
  started on real conversion work — this file is the tracker, picking
  up cb1 next session.
