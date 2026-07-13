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
- [ ] **Rusty nodes (spaced repetition):** checkpoint/boss stars fade after ~2 weeks;
      the Journey path shows a cracked node prompting a quick re-clear (Duolingo's
      strongest retention mechanic, and it directly serves exam revision).
- [ ] Legendary bosses: re-fight a beaten practice boss at a stricter threshold
      (85%+ with fewer attempts) for a gold crown on the path node.
- [ ] Wrong-answer bank: micro-check/checkpoint misses resurface in a weekly
      "revision boss" built from each student's own mistakes.
- [ ] Watch tracking v2: cumulative playtime instead of furthest-point, so
      scrubbing to the end doesn't count as watching.

## Learning quality
- [ ] AI-marked practice: replace the keyword scorer with a Groq call against the
      mark scheme (route through /api/ai-check) — boss-fight damage gets fair.
- [ ] LessonQuest + Journey path for IGCSE Y1/Y2 (engines are page-agnostic).

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
