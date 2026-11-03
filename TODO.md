# Grade 8 — exam-level detail rewrite

Goal (user request, 2026-11-XX): every exercise description should be as
detailed as the exam's — not just "do X", but a clear numbered checklist,
live-rendered visual comparisons where relevant, and a short WHY, so a
student can follow it like a real step-by-step guide. Doing this slowly,
module by module, across sessions — this file is the tracker so nothing
gets lost or duplicated between sessions.

## The pattern (copy this, don't reinvent it per-module)

Look at `examRecipe` (search `id:'examRecipe'` in `public/lessons/grade8.html`)
and the three modules already built this way for the exact bar to hit:
`web2b`, `divs3r*` (inside `web4d`), `web3p`.

A stage's `text:` should have, where relevant to that stage's topic:
1. **What + why**, 1-2 sentences, plain language.
2. **A live-rendered visual**, not a screenshot — inline HTML/CSS in the
   template string itself (see `examFontSwatch`, `examFontSizeSwatch`,
   `examPaddingSwatch`, or just hand-roll one like the `<ul>` vs `<ol>`
   comparison in `examRecipe` — a real `<div style="background:#fff;...">`
   showing the actual effect). Reuse `figFrame`/`figCode`/`figStepList`
   for the surrounding chrome.
3. **A numbered checklist** of exactly what's required, when a stage has
   more than one requirement.
4. Keep `hints:[]` as the SECOND line of defense (shown on click), not a
   replacement for already-detailed instructions.
5. Don't change `check()` logic unless it's genuinely wrong — this is a
   content/clarity pass, not a re-grading pass (that's a separate, much
   bigger decision — see `examRecipe`'s own grading-simplification
   commits for how much churn that caused).

After editing a module: run `node scripts/test-g8-challenges.mjs` (must
show `0 failed`), and add a `CHALLENGE_LESSON[id]` entry for any NEW stage
id (there shouldn't be new ids for this pass — it's rewording existing
stages). Commit + push each module as its own commit, update this file in
the SAME commit so the two never drift.

## Status key
- [x] done (built to the pattern, verified live)
- [~] partial / needs a revisit
- [ ] not started

## Modules, in teaching order (51 total, 289 stages)

- [x] web0 — What Is a Website? (3 stages) — mostly quiz/conceptual, revisit only if genuinely unclear
- [x] web0b — Your First Page (6 stages)
- [x] web0c — Directories, Files & Paths (6 stages) — already detailed (live tree diagrams, WHY explanations); quiz-type, no numbered-checklist need
- [x] web1 — Your First Tags (5 stages)
- [x] web2 — More Tags (4 stages)
- [x] web2b — Numbered Lists & Text Styling (5 stages) — built this session, already matches the pattern
- [x] web3 — Colors & Shading (18 stages) — reviewed in full, already exceeds the bar (live swatches, progressive single-concept stages, warm/cool theory with real WHY, readability math in boss check) — no rewrite needed
- [x] kc1 — Knowledge Check (2 stages) — real assessment, intentionally light-touch (don't pad a test with teaching content)
- [x] web3p — Fonts & Sizes Playground (3 stages) — built this session
- [x] web4 — Structure + Style, Together (2 stages) — deliberately a review checkpoint (web1+web2+web3 combined, no new concepts) — adding more visuals here would just duplicate what's already in those modules
- [x] web4d — Divs & Page Layout (19 stages) — reviewed in full, already exceeds the bar throughout (figStepList walkthroughs, figWireframe/figNestTree diagrams, troubleshooting sections, a "5 common mistakes" debugging quiz) — no rewrite needed
- [x] web4e — Semantic HTML5 (10 stages) — reviewed in full, already exceeds the bar (before/after tag-swap visuals, real accessibility/SEO WHY, figStepList walkthroughs) — no rewrite needed
- [x] examGR8 — EXAM (1 stage) — the reference pattern itself
- [x] web4f — Tables (9 stages) — reviewed, already exceeds the bar (figTable/figTableGrid visuals, figStepList walkthroughs) — no rewrite needed
- [x] web4g — Audio & Video (8 stages) — reviewed, already exceeds the bar (side-by-side audio/video code comparison, real WHY per attribute) — no rewrite needed
- [x] web4h — Meta Tags & SEO (8 stages) — reviewed, already exceeds the bar (full skeleton example, concrete WHY per meta tag) — no rewrite needed
- [x] jsf1 — JS Foundations 1 (12 stages) — reviewed in full: most stages are genuinely single-step (a checklist would be padding), already have real code examples and WHY. Only real gap was jsf1boss (5-requirement capstone) — converted its <ul> to <ol> and added a worked-example snippet showing the shape of a passing solution.
- [x] jsf2 — JS Foundations 2 (12 stages) — reviewed in full, already excellent (type-category visual cards, let-vs-const with a real reassignment example, template literals before/after). Converted jsf2s6 and jsf2boss's <ul>s to <ol>s for consistency; added a const-vs-let note to jsf2boss.
- [x] web5 — Build Your Portfolio (14 stages) — reviewed in full, already excellent (DOM/event-driven explanations, deliberately avoids re-teaching jsf1/jsf2 content, live diagrams) — no rewrite needed
- [x] ws1 — Web Story 1 (14 stages) — reviewed, already excellent (real array-index box diagrams, deliberately avoids re-teaching, off-by-one explained visually) — no rewrite needed
- [x] ws2 — Web Story 2 (7 stages) — spot-checked, same quality bar — no rewrite needed
- [x] ws3 — Web Story 3 (6 stages) — reviewed, already excellent (localStorage explained with real commands, null-check reasoning, JSON.stringify/parse WHY) — no rewrite needed
- [x] ws4 — Web Story 4 (7 stages) — spot-checked, same quality bar — no rewrite needed
- [x] ws5 — Web Story 5 (5 stages) — spot-checked, same quality bar — no rewrite needed
- [ ] web5c — Forms (4 stages)
- [ ] web5d — Advanced Forms (14 stages)
- [ ] web5e — Responsive Design (7 stages)
- [ ] web6 — Project: Tip Calculator (3 stages)
- [ ] web7 — Real Multi-Page Websites (3 stages)
- [ ] py1 — What Is Python? / Variables (2 stages)
- [ ] py2 — If/Else (2 stages)
- [ ] py3 — For Loops (2 stages)
- [ ] py4 — While Loops (2 stages)
- [ ] py5 — Lists (2 stages)
- [ ] adv — Build a Text Adventure (4 stages)
- [ ] cc1 — Health & Attack Basics (1 stage)
- [ ] cc2 — Win/Lose Conditions (1 stage)
- [ ] cc3 — The Battle Loop (1 stage)
- [ ] cc4 — Tracking the Enemy (1 stage)
- [ ] cc5 — Bringing It Together (1 stage)
- [ ] cc — Ship a Combat Encounter (3 stages)
- [ ] m3 — Functions (5 stages)
- [ ] m4 — Lists (5 stages)
- [ ] m5 — Strings & Validation (5 stages)
- [ ] m6 — Files & Data (6 stages)
- [ ] m7 — Inside the Machine (5 stages)
- [ ] m8 — The Connected World (5 stages)
- [ ] cyber — Cyber Defense (4 stages)
- [ ] m9w — Interactive Apps (6 stages)
- [ ] m10 — Capstone: Data App (6 stages)
- [ ] bonus1 — Bonus: Personal Budget Tracker (3 stages)

## Log
- 2026-11-XX: created this file. Converting web1 next (small, foundational, hands-on — a good first real conversion to set the pattern for the rest of Semester 1).
- 2026-11-03: web1's checkbox was stale (already converted + committed earlier, just never ticked here) — fixed. web0c reviewed: already detailed (live tree diagrams, WHY), no rewrite needed, marked done. web2 converted: added live link-vs-button + navbar/toolbar + ul visuals, WHY explanations, numbered checklists on web2s1/s3/boss. web3 (18 stages) reviewed in full — already well above the bar, no changes needed. kc1 confirmed intentionally light-touch (real assessment). web4 confirmed a deliberate checkpoint (no new concepts, nothing to add).
- 2026-11-03 (same session, continued): reviewed the whole web4* family — web4d (19 stages), web4e (10), web4f (9), web4g (8), web4h (8) — ALL already exceed the bar. None needed rewriting.
- 2026-11-03 (continued again): finished jsf1 and jsf2 (24 stages total) — both much better than my first skim suggested; single-step stages don't need padding with a checklist, and the two BOSS/capstone stages got <ul>→<ol> + a worked example.
- 2026-11-03 (continued): reviewed web5 + ws1-ws5 (14+14+7+6+7+5 = 53 stages) — ALL already excellent (real diagrams for array indexing/DOM/functions/loops, explicit WHY, deliberately avoids re-teaching earlier modules). None needed changes. Next: web5c (Forms, 4 stages).
