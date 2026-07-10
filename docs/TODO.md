# ByteForge — Improvements Backlog

## Content
- [ ] **Grade 6: harder challenges.** Current Robot Road / Block Basics stages land well but
      top students clear them fast. Add per-world "bonus hard" side-stages (tighter pars,
      bigger mazes, command limits, no-repeat runs), and a ★★★-only secret world.
- [ ] Grade 6: build remaining worlds — Color & Shape Lab (RGB mixer), Loop Land,
      Turtle Island, Pixel Caves, Cipher City, Music Studio (Web Audio), Dance Party,
      Game Corner, AI World, Final Quest.
- [ ] Grade 7 / Grade 8 curriculum decision pending — quest maps ready to wire once decided
      (shared engine `public/js/quest-map.js` already supports it).
- [ ] Expand A Level Code Lab sets (5 → 10 per category) + more full past papers.
- [ ] Past-paper PDF importer (teacher uploads a real Paper 4 → lab category, verbatim).

## Gamification
- [ ] Streak flame in XP strip + streak shields (weekly).
- [ ] Daily quests (daily_challenges table exists, unused).
- [ ] XP chests with variable rewards.
- [ ] Weekly class leaderboard (reset Mondays).
- [ ] OBS-01 cosmetics unlocked by level.
- [ ] Badge gallery with locked silhouettes (user_achievements table exists).

## Platform
- [ ] Code Lab / quest progress → server (lesson_saves) so it survives device changes.
- [ ] Teacher gradebook: per-class exercise/stage completion grid.
- [ ] Timed mock-exam mode for the past-paper categories.
- [ ] Interpreter: short-circuit AND/OR (removes the flag-pattern workaround).
- [ ] Resend: verify a domain so teacher emails deliver beyond the owner inbox.
- [ ] Kill or automate the `lessons/` mirror (manual copies will drift).
- [ ] `npm run verify` bundling all test scripts (lesson JS parse, lab, challenges, mazes).
- [ ] Push repo to GitHub; deploy to Vercel.
- [ ] Preload Pyodide in the background when the Code Lab opens.
