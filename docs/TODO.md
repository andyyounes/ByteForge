# ByteForge — Improvements Backlog

## Content
- [x] Grade 6 harder challenges: W1 got Triple Star (par 26) + The Labyrinth (par 24);
      W2 got The Spiral (10 chips) + Star Snake (8 chips). Still open: ★★★-only secret world.
- [x] Grade 6 World 3 — Color & Shape Lab (RGB mixer, 5 stages + Rainbow Gauntlet boss).
- [ ] Grade 6: build remaining worlds — Loop Land, Turtle Island, Pixel Caves,
      Cipher City, Music Studio (Web Audio), Dance Party, Game Corner, AI World,
      Final Quest. (World-boss unlock + per-stage engines are in place; each new
      world = a stage list + a mini-game engine like the color mixer.)
- [ ] Grade 7 / Grade 8 curriculum decision pending — quest maps ready to wire once decided
      (shared engine `public/js/quest-map.js` already supports it).
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
- [ ] Teacher gradebook: per-class exercise/stage completion grid.
- [ ] Timed mock-exam mode for the past-paper categories.
- [ ] Interpreter: short-circuit AND/OR (removes the flag-pattern workaround).
- [ ] Resend: verify a domain so teacher emails deliver beyond the owner inbox.
- [ ] Kill or automate the `lessons/` mirror (manual copies will drift).
- [ ] `npm run verify` bundling all test scripts (lesson JS parse, lab, challenges, mazes).
- [ ] Push repo to GitHub; deploy to Vercel.
- [ ] Preload Pyodide in the background when the Code Lab opens.
