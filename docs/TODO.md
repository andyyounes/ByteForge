# ByteForge — Improvements Backlog

## Content
- [x] Grade 6 harder challenges: W1 got Triple Star (par 26) + The Labyrinth (par 24);
      W2 got The Spiral (10 chips) + Star Snake (8 chips). Still open: ★★★-only secret world.
- [x] Grade 6 World 3 — Color & Shape Lab (RGB mixer, 5 stages + Rainbow Gauntlet boss).
- [ ] Grade 6: build remaining worlds — Loop Land, Turtle Island, Pixel Caves,
      Cipher City, Music Studio (Web Audio), Dance Party, Game Corner, AI World,
      Final Quest. (World-boss unlock + per-stage engines are in place; each new
      world = a stage list + a mini-game engine like the color mixer.)
- [x] Grade 7 wiring started: Game Maker Galaxy map live for Worlds 1-3 (Sprite
      Start, Variables & State, Decisions) in grade7.html, reusing the existing
      Blockly + x-ray CodeMirror bridge (already implements the spec's Term 1
      "read the code" arc) and quest-map.js. Worlds 4-10 stubbed locked on the
      map. Next: G4 My Blocks (needs custom-block/function support in the
      toolbox), then G5-G10 content + boss builds.
- [x] Grade 8 wiring started: Builder City map live for Modules 1-4 (From Blocks
      to Text, Choices & Loops - both new; Functions, Lists - rehomed pre-existing
      Pyodide challenges) in grade8.html. Modules 5-10 stubbed locked. Next:
      M5 Strings & Validation (the Caesar cipher in real code).
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
