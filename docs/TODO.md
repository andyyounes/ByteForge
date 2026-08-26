# ByteForge — Improvements Backlog

## Content
- [x] Grade 6 harder challenges: W1 got Triple Star (par 26) + The Labyrinth (par 24);
      W2 got The Spiral (10 chips) + Star Snake (8 chips). Still open: ★★★-only secret world.
- [x] Grade 6 World 3 — Color & Shape Lab (RGB mixer, 5 stages + Rainbow Gauntlet boss).
- [x] Grade 6 World 4 — Loop Land built (6 stages: 5 + boss w/ 2 mazes), reusing
      World 2's exact maze+repeat-chip engine at bigger scale, themed as bracelets/
      tiles/countdown/rhythm. Closes both 0860-audit additions for this world:
      flowchart notation (predict-the-route framing in the goal text) and a
      nested-loop peek (boss goal text, explicitly deferred to Grade 7 since the
      engine only supports flat repeats). Every maze verified programmatically
      (par values now covered by scripts/test-g6-maze.mjs's own test suite, not
      just a scratch check) and live via Playwright — W4S1 solves in a perfect
      3-star run, the full boss (incl. its star pickup) completes to "BOSS
      DEFEATED!". Zero regressions on the 18 pre-existing W1/W2 maze checks.
- [ ] Grade 6: build remaining worlds — Turtle Island, Pixel Caves, Cipher City,
      Music Studio (Web Audio), Dance Party, Game Corner, AI World, Final Quest.
      (World-boss unlock + per-stage engines are in place; each new world = a
      stage list + a mini-game engine like the color mixer, or the same maze
      engine again like Loop Land, whichever fits the world's actual content.)
- [x] Grade 7 wiring started: Game Maker Galaxy map live for Worlds 1-3 (Sprite
      Start, Variables & State, Decisions) in grade7.html, reusing the existing
      Blockly + x-ray CodeMirror bridge (already implements the spec's Term 1
      "read the code" arc) and quest-map.js.
- [x] Grade 7 G4 — My Blocks built: added a "Functions" toolbox category via
      Blockly's built-in PROCEDURE custom-category (no hand-rolled blocks
      needed) plus hasFunction/needsFunction detection wired into the
      existing check dispatcher. 3 stages: spawnEnemy(x,y), shoot(x,y,isBig)
      with if/else inside the function, and a boss combining jump() with an
      animated gravity loop — opens with the 0860-audit's pseudocode prompt.
      While verifying live, found and fixed a real pre-existing bug: the
      animated-mode draw-call counter was built AFTER capturing update()'s
      closure, so it was dead code — every animated boss (G1/G2/G3, not just
      this new one) was silently never getting shapes counted for
      validation. Fixed and regression-tested all three pre-existing bosses.
- [x] Grade 7 G5 — Player Control built: arrow-key movement, a mouse-following
      reticle, and a boss combining both (opens with the PAN/LAN/WAN
      networking aside from the 0860 realignment). Found and fixed two more
      real bugs while verifying live: animated-mode never tracked hasIf/
      hasVar at all (needsIf/needsVar could never pass for any animated
      stage, ever — extended it with the same regex approach as hasFunction),
      and a genuine CSS layout bug where a long-enough challenge description
      could collapse the CodeMirror editor to 0px height (fixed with
      max-height + scroll on .ch-header).
- [x] Grade 7 G6 — Collision & Physics built: hitbox detection via the
      distance formula, gravity/bounce physics, and a Breakout clone boss
      with a real linear search (a list of bricks checked one at a time,
      contrasted with why that gets slow at scale — hooks toward Grade 8's
      binary search). Worlds 7-10 still stubbed locked — next up is G7 Game
      States (needs the firewalls/antivirus/echo-check addition from the
      0860 realignment).
- [x] Grade 8 wiring started: Builder City map live for Modules 1-4 (From Blocks
      to Text, Choices & Loops - both new; Functions, Lists - rehomed pre-existing
      Pyodide challenges) in grade8.html. Modules 5-10 stubbed locked.
- [x] Grade 8 M5 — Strings & Validation built (3 stages: string methods/slicing
      via a messy-username cleanup, a real password validator, and the Caesar
      cipher coded for real — the payoff of Grade 6's cipher-wheel spiral).
      Verified live through Pyodide.
- [x] Grade 8 M6 — Files & Data built, with genuine virtual-filesystem file
      I/O added to grade8.html (a new `files` field per stage gets written
      into Pyodide's real FS before each run — open("x.csv") is a real file
      read, not simulated). 4 stages: reading a CSV register, mean/max/min/
      count stats, binary search over a sorted name list, and linking two
      CSVs by a shared id column (relational-database idea). Verified live
      through actual Pyodide file reads.
- [x] Grade 8 M7 — Inside the Machine built. 3 stages: storage units + binary
      (spiral from Grade 6's binary cards, bin() to see real representation),
      images-as-numbers (grayscale via RGB averaging, spirals from Pixel Caves
      and M4's Rainbow Row), and compiler-vs-interpreter (the 0860-audit
      addition — students catch a deliberate error in try/except and observe
      partial output already printed, proving line-by-line interpretation;
      Fetch-Decode-Execute introduced as a one-paragraph teaser per spec).
      Verified live.
- [x] Grade 8 M8 — The Connected World built. 2 stages: packet switching/
      protocols (split a message into numbered packets, shuffle arrival
      order, reassemble correctly - concretely shows why TCP/IP needs
      sequence numbers; star-topology aside) and a real HTML profile page
      generated by Python f-strings. Caught and fixed a real content bug
      while verifying live: the starter's "arrived" list only included 5 of
      6 packets, permanently dropping the last chunk - fixed and re-verified
      the message reconstructs exactly.
- [x] Grade 8 M9 — Interactive Apps built. Closes the biggest gap from the
      0860 audit: trace tables + explicit syntax/logic/runtime error naming
      (previously absent before Grade 9). 4 stages: fix three distinct-error
      functions (labelled by comment), trace a running total via loop print
      statements, an app_state-driven canvas app (menu/running/results per
      the module's original spec), and a capstone combining a guarded score
      calc with state-driven screens. Verified live, trace-table arithmetic
      checked correct across all 6 rows.
- [x] Grade 8 M10 — Capstone: Data App built, completing "The App Builder"
      (10/10 modules live). A quiz app with saved high scores integrating
      the whole year's skills — file I/O (including real file WRITING for
      the first time, not just reading), guarded division, loops. 4 stages:
      load a quiz from CSV, score answers with a zero-guard, write+read back
      a high-score file, then a full capstone combining all three, closing
      with a Big Data discussion per the 0860 audit. Verified live including
      confirming Pyodide's virtual FS supports real writes with zero extra
      engineering. **Grade 8 is now fully built end to end.**
- [ ] Expand A Level Code Lab sets (5 → 10 per category) + more full past papers.
- [ ] Past-paper PDF importer (teacher uploads a real Paper 4 → lab category, verbatim).

## Gamification
- [x] Streak flame (in quest bar) + daily quest chest (5 steps/day = +30 XP). AS/A only.
- [ ] XP chests with variable rewards.
- [ ] Weekly class leaderboard (reset Mondays).
- [ ] OBS-01 cosmetics unlocked by level.
- [ ] Badge gallery with locked silhouettes (user_achievements table exists).
- [x] Rusty nodes (spaced repetition): stars >14 days old go amber on the Journey
      path; re-fighting the boss refreshes them. AS/A only.
- [ ] Legendary bosses: re-fight a beaten practice boss at a stricter threshold
      (85%+ with fewer attempts) for a gold crown on the path node.
- [x] Wrong-answer bank → 🩹 Revision Boss world on the Journey path (misses from
      match-up / quick checks / checkpoints; pass = +40 XP, terms leave the bank).
- [x] Watch tracking v2: cumulative playtime (scrubbing no longer counts).

## Learning quality
- [ ] AI-marked practice: replace the keyword scorer with a Groq call against the
      mark scheme (route through /api/ai-check) — boss-fight damage gets fair.
- [ ] LessonQuest + Journey path for IGCSE Y1/Y2 (engines are page-agnostic).
- [ ] Streak shields (miss one day without losing the flame) + weekly quests.

## Platform
- [x] Quest progress → server (lesson_saves row `<pk>-quest`): steps, stars,
      checkpoints, streak, daily, wrong-answer bank. Pull-merge on lesson open,
      debounced push + 60s heartbeat. (Code Lab exercise saves still local-only.)
- [x] Map unification: grade6/7/8/9-missions + igcse-y1/y2 all now use
      quest-map.js's `layout:'path'` (previously only AS/A Level). Fixed the
      "flash the first lesson before showing the map" bug present across all
      of them (grade9-missions had it hardcoded `open` in static markup).
- [x] Fixed a critical TDZ crash on as-level.html/a-level.html: every logged-out
      visitor hit "Cannot access X before initialization" because the init
      IIFE's only `await` sat inside an `if (me)` block, so it ran fully
      synchronously and outran later `const`/`let` declarations. Fixed with an
      unconditional `await null` as the first line of the IIFE.
- [x] Applied the long-dormant `supabase/past_papers.sql` migration to the live
      DB (file existed in-repo, was never run — every class's Past Papers tab
      was 500ing).
- [x] Fixed "Book Lessons" tab showing on every class type: it's 100% AS/A
      Level content (default-lessons.json is Cambridge 9618 chapters 1-29
      only), but ClassTabs.tsx rendered it unconditionally — Grade 6-9 and
      IGCSE teachers saw a nonsensical AS-Level chapter list. Now gated to
      `classType.id === 'as-level' || 'a-level'` (tab visibility, panel
      render, and the Resources-tab nudge banner).
- [x] Fixed "Chapter Exams"/"Cambridge Papers" quick-links on the student
      dashboard appearing for every grade: Chapter Exams only ever has
      content for AS/A Level (ties to the Book Lessons upload, now gated to
      those two types), and "Cambridge Papers" was a misleading label for
      Grade 6-9 even though the underlying Past Papers feature is generic.
      Now gated/relabeled by grade.
- [x] Fixed a class-creation bug where the Year/Grade dropdown in
      CreateClassModal was fully independent of the selected class-type
      button: a teacher could end up with level='grade9' but grade='10' (or
      any mismatch). The student dashboard picks lesson content purely off
      the numeric `grade` column, so this silently showed "IGCSE Year 1 —
      Theory" to students in what the teacher's own view still correctly
      called a Grade 9 class. Dropdown now only offers valid grades per type.
- [x] Fixed cross-grade leakage in the student dashboard's "Up Next"/Pathways
      widgets: conceptsForGrade/pathwaysForGrade used a cumulative filter, so
      a Grade 9 student saw Grade 6/7/8's own concepts and pathways (Artist's
      Toolkit, Game Maker, Systems Builder) mixed into their suggestions.
      Grade-tagged concepts/pathways are now exclusive to their own grade.
- [x] Added a new `type:'blank'` (fill-in-the-blank) theory-practice exercise
      type to AS Level and A Level's Code Lab (previously only mcq/short/
      convert/ai existed). Renders a monospace pseudocode block with inline
      inputs per gap, each checked independently (case-insensitive, accepts
      alternate answers) with green/red per-blank coloring on submit. Added
      6 real-life-scenario exercises (banking login, shop discount loop,
      coffee-shop queue, fitness-app validator, delivery-app recursion,
      banking withdrawal exception guard) instead of abstract examples, per
      explicit user request. Not yet in IGCSE Y1/Y2 or Grade 9-13 lower
      grades — those don't have this theory-practice system at all.
- [ ] Cosmetic-only: each class type's teacher-facing "Syllabus" preview
      (lib/class-types.ts `syllabus` field, shown in Resources tab) is
      hand-written marketing copy and doesn't mirror the actual built map
      content (e.g. Grade 6 syllabus says "Artist's Toolkit" while the live
      map is Robot Road → Block Basics → Color Lab). Not a functional bug,
      but worth reconciling if a teacher notices the mismatch.
- [ ] Teacher gradebook: per-class exercise/stage completion grid.
- [ ] Timed mock-exam mode for the past-paper categories.
- [ ] Interpreter: short-circuit AND/OR (removes the flag-pattern workaround).
- [ ] Resend: verify a domain so teacher emails deliver beyond the owner inbox.
- [ ] Kill or automate the `lessons/` mirror (manual copies will drift).
- [ ] `npm run verify` bundling all test scripts (lesson JS parse, lab, challenges, mazes).
- [ ] Push repo to GitHub; deploy to Vercel.
- [ ] Preload Pyodide in the background when the Code Lab opens.
