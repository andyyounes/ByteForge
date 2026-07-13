# ByteForge Curriculum Ladder — Grades 6–9

**One coherent path: Grade 6 → 7 → 8 → 9 → IGCSE 0478 → AS/A Level 9618**

Each year = 3 terms × ~12 weeks × 2 hours ≈ **36 weeks / 72 hours** (Grade 9 runs 30 weeks
to leave revision space before IGCSE entry).

---

## Pedagogical foundations (why the ladder is shaped this way)

1. **PRIMM (Predict–Run–Investigate–Modify–Make).** Validated in a 13-school study with
   493 students aged 11–14: students taught with PRIMM outperformed controls, and teachers
   reported it works across mixed-ability classes. Every ByteForge lesson for G6–8 starts
   from *reading and predicting* working code before writing any — this is why our lesson
   pages give starter code, not blank editors.
2. **Use → Modify → Create.** Each module's exercises are sequenced: run a finished
   example, change one thing, then build your own. The Code Lab "starter with TODOs"
   pattern is exactly this.
3. **Block → text bridge (the G7→G8 transition).** Research shows dropping students
   straight into text syntax overloads working memory. Grade 6 is blocks-only, Grade 7
   transitions mid-year (blocks → text-primary → text-only), Grade 8 is text-first with
   block "translations" shown for the first term only.
4. **Spiral curriculum.** Big ideas appear early in concrete form and return deeper:
   binary appears as a game in G6, a light intro in G8, and rigorously in G9 (then IGCSE).
   Files/data: G8 first contact → G9 depth → IGCSE mastery.
5. **Concrete → abstract (ages 11–14 = the Piagetian transition).** G6–7 anchor every
   concept in something visible (turtle drawings, sprites, games). Abstraction (pseudocode,
   trace tables, complexity) is deferred to G9 when formal-operational thinking is reliable.
6. **Retrieval + gamification.** XP, streaks, badges and daily quests aren't decoration —
   they schedule retrieval practice. Every module ends with a mixed-review challenge that
   resurfaces earlier concepts for bonus XP.

**Standards anchor:** Cambridge Lower Secondary Computing (0860) five strands —
Computational Thinking · Programming · Managing Data · Networks & Digital Communication ·
Computer Systems — mapped per grade below, feeding IGCSE CS (0478).

---

## The ladder at a glance

| Grade | Age | Theme | Medium | Year outcome |
|-------|-----|-------|--------|--------------|
| 6 | 11–12 | **The Pattern Explorer** | Blocks only | An animated interactive story/game built in blocks |
| 7 | 12–13 | **The Game Maker** *(existing spec)* | Blocks → text | An original named 2D game, shipped |
| 8 | 13–14 | **The App Builder** | Python (text-first) | A data-driven Python app with saved data |
| 9 | 14–15 | **The Deep Diver** *(existing spec)* | Pseudocode + Python | CS theory foundations + full Python project → ready for IGCSE |

---

# THE ADVENTURE MAP — progression system for Grades 6–8

Every grade's year is a **winding level map** (Candy-Crush / Duolingo / Code.org style):
a snake path of small stages the student physically moves along. One mechanic, three
different worlds so no year feels like a repeat:

| Grade | Map theme | Medium | Difficulty |
|-------|-----------|--------|------------|
| 6 | 🏝 **Creator Island** (The Creator Quest) | commands → blocks | discover |
| 7 | 🌌 **Game Maker Galaxy** (existing 10 modules re-skinned as worlds) | blocks → text | build |
| 8 | 🏙 **Builder City** (App Builder as districts) | Python text | engineer |

**Map rules (all grades):**
- The path is made of **stages** (5–15 min each). A stage = one playable challenge.
- Stages grant **1–3 stars** (works / works efficiently / bonus twist) + XP.
- Worlds end in a **BOSS stage** (bigger build, no hints) that unlocks the next world's gate.
- The student's **OBS-01 avatar walks the path**; current position visible to teacher.
- Locked stages show silhouettes (curiosity pull); completed worlds show a trophy.
- Optional side-paths: micro:bit versions of stages, bonus hard stages for fast finishers.

---

# GRADE 6 — "The Creator Quest" (v3)

**36 weeks × 2h = 72h · 12 worlds · ~50 stages · commands → drag-and-drop blocks**

The exact progression: robots first (no code at all), then drag-and-drop, then colors/
shapes/arithmetic, loops, turtle, pixels, ciphers, music, dance, games, AI — ending in a
free project. Concepts stack: every world uses the previous worlds' skills.

| # | World | Weeks | Stages | What happens | New concepts |
|---|-------|-------|--------|--------------|--------------|
| 1 | 🤖 Robot Road | 3 | 5 + boss | Guide a robot through mazes with arrow commands only — no code yet. Fewer commands = more stars. Boss: 3-maze gauntlet + design a maze for a classmate | Sequencing, exact instructions, efficiency, debugging |
| 2 | 🧩 Block Basics | 2 | 4 + boss | Same robot, but now commands are **drag-and-drop blocks**; longer programs, first deliberate bugs to fix | Programs as editable artefacts, reading code |
| 3 | 🎨 Color & Shape Lab | 3 | 5 + boss | RGB sliders (light mixing, 0–255), coordinates, drawing shapes by block-code; sizes/positions/angles = **arithmetic smuggled in** (half of 480? angle for a hexagon?) | Values, coordinates, +−×÷ in code, random |
| 4 | 🔁 Loop Land | 3 | 5 + boss | Repeat-blocks: friendship bracelets patterns, tiled art, countdowns; spot-the-repeat in music & nature; nested-loop peek | Loops, patterns, decomposition |
| 5 | 🐢 Turtle Island | 3 | 5 + boss | Loops + arithmetic = art: square → polygon (angle = 360÷n!) → star → spiral → mandala in their own palette | Applying loops+math together |
| 6 | 🖼 Pixel Caves | 2 | 4 + boss | Images are grids of numbers; pixel art by coordinates; binary card game; boss: hidden pixel message | Data representation, binary as a game |
| 7 | 🕵️ Cipher City | 2 | 4 + boss | Caesar cipher wheel: encode, decode, then CRACK a message without the key (frequency of E); boss: escape-room decode chain | Algorithms on letters, brute force idea |
| 8 | 🎵 Music Studio | 3 | 5 + boss | Web-Audio beat grid: a drum loop IS a loop; melody maker; layering tracks; remix a classmate; boss: publish a 30-sec track | Loops in time, events, layering |
| 9 | 💃 Dance Party | 3 | 4 + boss | Code.org Dance-Party formula: character moves on key events, background reacts to the beat (their own Music Studio track!) | Events, state changes, timing |
| 10 | 🕹 Game Corner | 4 | 6 + boss | Build a real mini-game step by step: sprite control → falling objects → catch detection → score variable → lives → speed-up. Boss: **their own game**, play-tested by the class | Variables, decisions, collision, game loop |
| 11 | 🧠 AI World | 3 | 5 + boss | Teach-the-machine classifier (sort → train → watch it guess → fool it); "what's inside" — a neural network as layers of tiny voters (visual, no math); **prompt engineering**: writing instructions for the AI tutor is algorithm design for humans+machines — best-prompt contest | ML training data, NN intuition, prompt craft, AI limits/bias |
| 12 | 🚀 The Final Quest | 4 | project | Pick any world and go big (game / track+dance video / maze pack / art collection / AI experiment); plan → build → showcase gallery; Python peek teaser for Grade 7 | Project skills, presenting |

**Stage math:** 12 worlds ≈ 52 stages + 11 bosses + 1 project = a node on the map roughly
every 40 minutes of class time — always something to finish and something locked ahead.

**Badges:** one per world (Robot Trainer, Block Builder, Color Mixer, Loop Legend, Turtle
Master, Pixel Miner, Code Breaker, Beat Maker, Choreographer, Game Maker Jr, AI Whisperer)
→ **Year 6 Creator** trophy.

**0860 strands:** CT ✔(W1,2,4,7) · Programming ✔(W2–5,8–10) · Data ✔(W3,6,9) ·
Networks/e-safety ✔(woven into W1 + publishing etiquette in W8–12) · Systems ✔(W6, micro:bit side-path).

**New widgets needed:** robot-maze (W1–2), rgb-mixer (W3), music-lab step sequencer (W8),
cipher wheel (W7), teach-machine + NN-layers visual (W11), the Adventure Map itself.

---

## Grade 7 & 8 on the map (differentiation, no repeats)

- **G7 Game Maker Galaxy:** the existing 10 modules become 10 worlds (~45 stages). Same
  map mechanic, but stages transition blocks → text mid-year and every boss is a playable
  game increment. Concepts G6 met visually (variables, events, decisions) return **in text
  code at game depth** — spiral, not repeat.
- **G8 Builder City:** districts instead of worlds (~45 stages), all-Python: Syntax
  Street → Loop District → Function Quarter → List Lane → String Market → Data Docks
  (files/CSV) → Machine Hall (binary/hardware) → Net Bridge (internet+HTML) → App Tower
  (capstone). G6's cipher returns as *code you write*; G6's music/AI return as Python
  projects. Bosses are working programs, not puzzles.

**36 weeks × 2h = 72h · blocks only · ten creative studios, each shipping something showable**

Identity: this year is a tour of *studios* — art, music, animation, games, robots, AI —
and code is the paintbrush in every one. The CS concepts (sequence, loops, events,
variables, decisions, data) are woven through the studios instead of being the headline.
Modelled on what demonstrably hooks this age group: Code.org's Dance Party & Minecraft
hours, AI for Oceans, Chrome Music Lab, Lightbot-style robot puzzles, Scratch stories.

**Session format:** Hour 1 = studio skill (PRIMM on a tiny example) · Hour 2 = free build
in that studio, shared to the class gallery. Every studio ends with a "publish" moment.

### Term 1 — See the Code (W1–12)
| Studio | Weeks | What they make | CS concepts smuggled in | Platform asset |
|--------|-------|----------------|------------------------|----------------|
| 🤖 S1 Robot School | 3 | Guide a virtual robot through mazes (Lightbot-style); design mazes for classmates | Sequencing, exact instructions, debugging | **new: robot-maze widget** |
| 🎨 S2 Color Lab | 3 | Mix light! RGB sliders → their own palette; colour-by-code pixel art; name a colour after yourself | Numbers as values (0–255), coordinates, hex peek | **new: RGB mixer**, pixel-grid ✔ |
| 🐢 S3 Turtle Art Studio | 4 | Geometric art posters: polygons → stars → spirals → mandala, in their Color Lab palette | Loops, repetition, decomposition | blockly-turtle ✔ |
| 🖼 S4 Pixel & Secret Codes | 2 | Pixel art + binary card game — "images are secretly numbers"; hide a message in binary | Binary as a game (spiral seed for G8/9) | pixel-grid ✔, binary-cards ✔ |

### Term 2 — Make It Alive (W13–24)
| Studio | Weeks | What they make | CS concepts | Platform asset |
|--------|-------|----------------|-------------|----------------|
| 🎵 S5 Music Studio | 4 | Beat grid + melody maker (Chrome-Music-Lab-style step sequencer); loops = drum patterns, a "song" is an algorithm; remix a classmate's track | Loops, patterns, events, layering | **new: music-lab widget (Web Audio)** |
| 💃 S6 Dance & Animation Party | 4 | Code a dancing character to a beat (Dance Party-style): moves on key-press, costume changes, backgrounds react to "music" | Events, sequences of states, timing | blockly.html + canvas |
| 🕹 S7 Game Corner | 4 | Catch-the-star mini-game: score counter, lives, speed-up | Variables, decisions (if touching / if score >), win/lose | blockly.html |

### Term 3 — Smart & Shared (W25–36)
| Studio | Weeks | What they make | CS concepts | Platform asset |
|--------|-------|----------------|-------------|----------------|
| 🧠 S8 Teach the Machine | 3 | AI-for-Oceans-style trainer: sort examples to teach a classifier, watch it guess, break it with tricky examples | What AI is/isn't, training data, bias (age-appropriate) | **new: teach-machine widget** |
| 📊 S9 Data Detectives | 3 | Class survey → tally → bar chart → "headline discovery" poster; chart their own XP history | Data collection, representation, questions | **new: chart widget** |
| 🚀 S10 Capstone Studio | 4 | Choose ANY studio and go big: a game, an animated story, a music video with dancing sprite, a robot maze pack, an art collection | Everything, by choice | all of the above |
| 🎬 Showcase + Python Peek | 2 | Gallery day, awards; "your blocks written as Python" teaser for Grade 7 | Transition seed | new |

**Optional hardware track:** any studio can swap its Hour-2 build for **micro:bit**
(MakeCode simulator works with zero hardware; real kits if the school buys them) —
S5 music on the micro:bit speaker, S7 game with tilt controls, S8 clap-sensor.

**Badges:** Robot Trainer (S1) · Color Mixer (S2) · Turtle Master (S3) · Code Breaker (S4) ·
Beat Maker (S5) · Choreographer (S6) · Game Maker Jr (S7) · AI Teacher (S8) ·
Data Detective (S9) · Studio Star (S10) · **Year 6 Creator** (all ten).

**0860 strand coverage:** CT ✔(S1,S3,S7) · Programming ✔(S3,S5–S7,S10) · Data ✔(S2,S4,S9) ·
Networks/Digital comms ✔(publishing & gallery etiquette, e-safety woven into S1 week 1) ·
Systems ✔(S4, micro:bit track).

**New widgets to build (all feasible in-platform):** robot-maze.html (canvas grid +
move/turn blocks), rgb color mixer (three sliders + live swatch + hex), music-lab.html
(Web Audio API step sequencer — no libraries needed), teach-machine sorter (drag-to-train,
simple nearest-neighbour under the hood), bar-chart builder.

---

# GRADE 7 — "The Game Maker" (v2 — researched 2026-07)

**36 weeks × 2h = 72h · Game Maker Galaxy · blocks → hybrid → text, inside games**

Identity: one year, one promise — *you will ship real games*. Every world ends in a
playable boss build (the MakeCode-Arcade model: each unit = a working game increment).
Concepts G6 met visually (variables, events, decisions) return at game depth — spiral.

**The transition is a bridge, not a cliff.** The systematic-review evidence on
block→text transition favours *dual-modality* environments (block and text views of
the same program, EduBlocks/Mindplus-style) over a hard jump; Raspberry Pi's KS3
curriculum keeps Year 7 in Scratch and only opens Python late in Year 8. So G7 runs a
three-phase modality arc — earlier than RPF because the games context carries it, but
never a cliff:

- **Term 1 — Read the Code (blocks + 🩻 x-ray):** build in blocks; an always-on "x-ray
  pane" shows the equivalent text code live. Students *read* text all term without
  writing it.
- **Term 2 — Speak the Code (dual-view):** block ↔ text toggle on the same program;
  edits allowed in either view. Parson's-style "reassemble the text" warmups.
- **Term 3 — Own the Code (text-first):** text editor is primary; block view remains
  as a reference crutch that quietly stops being needed.

### Term 1 — Read the Code (W1–12)
| World | Weeks | What they build | CS concepts | Boss build |
|-------|-------|-----------------|-------------|-----------|
| 🚀 G1 Sprite Start | 2 | Sprites, x/y coordinates, motion, costumes | Coordinates, sequences | Bouncing DVD-logo toy |
| 🎚 G2 Variables & State | 3 | Score, health, timers, speed-ups | Variables, assignment, update loops | Clicker game with upgrades |
| 🚦 G3 Decisions | 4 | Touching? Score > 10? Out of bounds? | Conditionals, boolean logic, game rules | Dodge-the-asteroids |
| 🧰 G4 My Blocks | 3 | jump(), shoot(), spawnEnemy() — powers you define | Functions, parameters, decomposition | Platformer vertical slice |

### Term 2 — Speak the Code (W13–24)
| World | Weeks | What they build | CS concepts | Boss build |
|-------|-------|-----------------|-------------|-----------|
| ⌨️ G5 Player Control | 3 | Keyboard + mouse input schemes, aiming | Events, input handling | Top-down shooter controls |
| 💥 G6 Collision & Physics | 3 | Hitboxes, bouncing, gravity, knockback | Collision detection, coordinate math | Breakout clone |
| 🎬 G7 Game States | 3 | Menu → playing → paused → game-over → win | State machines, program structure | Full game loop w/ screens |
| 🤖 G8 Smart NPCs | 3 | Enemies that chase, flee, patrol; a rule-based chatbot shopkeeper | Game AI: rules → state machines; AI literacy (what's *not* intelligent) | Enemy with 3 behaviours |

### Term 3 — Own the Code (W25–36)
| World | Weeks | What they build | CS concepts | Boss build |
|-------|-------|-----------------|-------------|-----------|
| 💬 G9 Strings & Dialogue | 3 | Player names, dialogue trees, high-score tables | Strings, concatenation, comparison | RPG dialogue scene |
| 🏆 G10 Design & Capstone | 7 | Design doc → prototype → playtest → iterate → ship their own game | Everything + refining programs from user feedback (CSTA practice) | **Their game, in the class arcade** |
| 🎪 Arcade Showcase | 2 | Class plays everyone's games, awards; "your game logic in Python" teaser | Transition seed for G8 | — |

**Badges:** Sprite Wrangler · State Keeper · Rule Maker · Block Smith · Controller ·
Physicist · Director · NPC Trainer · Wordsmith · **Game Maker** (capstone shipped).

**0860 strand coverage:** CT ✔(G3,G6,G7) · Programming ✔(G2–G10) · Data ✔(G2 state,
G9 high-scores) · Networks/comms ✔(gallery publishing, online-safety week in G1) ·
Systems ✔(input devices in G5; frames/game-loop timing in G6).

**Why an AI world in a games year:** the field is moving AI literacy into middle school
(Code.org is succeeding CS Discoveries with *AI Discoveries* for 2026–27). Game NPCs are
the honest way in at this age: students build rule-based "intelligence" themselves and
discover what it can't do — inoculation against AI magic-thinking, no black boxes.

---

# GRADE 8 — "The App Builder" (v2 — researched 2026-07)

**36 weeks × 2h = 72h · Python, text-first · from games to useful programs**

Identity: G7 made things fun; G8 makes things *useful*. Real Python in a real editor,
working with real data. First term shows block-equivalents alongside text (transition
scaffold), then blocks disappear forever.

*Research note:* full-Python in G8 matches the reference progressions — Raspberry Pi's
KS3 curriculum introduces Python at the end of Year 8 and runs "Python with sequences
of data" + data science in Year 9; our G8 = that Y8/Y9 material, reachable because G7
already banked a hybrid year of text-in-games. PRIMM (Predict-Run-Investigate-Modify-Make)
is the session skeleton throughout — it exists precisely for this stage of the transition.

**Session format:** Hour 1 = PRIMM cycle on the week's concept · Hour 2 = running project.
Running project each term is chosen from 3 options (voice & choice sustains motivation).

### Term 1 — Python Foundations (W1–12)
| Module | Weeks | Content | Platform asset |
|--------|-------|---------|----------------|
| M1 From Blocks to Text | 3 | Translate familiar G7 game snippets to Python; print/input/variables/types; error messages are clues, not punishments | grade8.html (Pyodide) ✔ |
| M2 Choices & Loops | 4 | if/elif/else, while, for-range — each taught by *predicting* canvas drawings before running | grade8.html canvas ✔ |
| M3 Functions | 3 | def, parameters, return; refactoring copy-paste into functions | grade8.html |
| M4 Lists | 2 | Creating, indexing, appending, looping a list; list + loop = superpower | grade8.html |

### Term 2 — Data & Systems (W13–24)
| Module | Weeks | Content | Platform asset |
|--------|-------|---------|----------------|
| M5 Strings & Validation | 3 | Slicing, methods, checking user input; username/password validator; **Caesar cipher in real code** (G6's cipher wheel, now yours to program — CSTA "model encryption") | new challenges |
| M6 Files & Data | 4 | Reading/writing text files, CSV, mean/max/min, drawing a chart from real data; AI peek: simple predictor over their own CSV (average-based — no black boxes) | new challenges |
| M7 Inside the Machine | 3 | Binary numbers (light — spiral from G6 cards, before G9 depth), storage units KB→TB, hardware tour, how images/sound are numbers | binary-cards, compression.html ✔ |
| M8 The Connected World | 2 | How the internet works (packets, IP, DNS — story level), staying safe, build a one-page HTML profile | new |

### Term 3 — Build & Automate (W25–36)
| Module | Weeks | Content | Platform asset |
|--------|-------|---------|----------------|
| M9 Interactive Apps | 4 | Canvas app with state: menu → running → results (pre-echo of G7 game state at higher level); OR micro:bit if hardware available | grade8.html |
| M10 Capstone: Data App | 6 | Plan → build → test a data-driven app: quiz with saved high-scores, class survey analyser, habit tracker, or own idea | grade8.html |
| Showcase | 2 | Demo day + written "how my program works" (pre-echo of G9 documentation habits) | — |

**Badges:** Translator (M1) · Flow Controller (M2) · Function Smith (M3) · List Wrangler (M4) ·
String Surgeon (M5) · Data Handler (M6) · Machine Whisperer (M7) · Net Navigator (M8) ·
App Builder (M9) · Year 8 Shipper (M10).

**0860 strand coverage:** CT ✔(M2,M3,M10) · Programming ✔(M1–M5,M9,M10) · Data ✔(M6) ·
Networks ✔(M8) · Systems ✔(M7).

---

# GRADE 9 — "The Deep Diver" (EXISTING — unchanged)

30 weeks, 3 terms: Think & Plan (unplugged→binary→hex→flowcharts→pseudocode→trace tables)
→ Go Deeper (sorting, searching, cyber, hardware, AI) → Build & Create (Python properly →
files → data viz → project). *Validated against the ladder: G8 graduates arrive already
writing Python, so G9's Term 1 pseudocode discipline lands on fertile ground, and Term 3
Python is consolidation + depth rather than first contact. Direct feed into IGCSE 0478.*

---

## Implementation gap list (what to build next, in order)

1. **Grade 6:** module structure on the dashboard (`g6-*` concepts), M1 e-safety lesson
   page, M8 data widget, challenge sets per module for blockly pages, badges.
2. **Grade 8:** module structure (`g8-*` concepts), M5/M6 challenge sets (strings, files,
   CSV — Pyodide supports all of it), M7 lesson content reusing binary/compression widgets,
   M8 mini-lessons + HTML sandbox, capstone brief pages, badges.
3. **Both:** port the OBS-01 tutor widget + XP strip to grade6/7/8 pages (age-tuned persona),
   per-module mixed-review challenges (retrieval), teacher progress view per module.

## Sources
- PRIMM research (Sentance et al.): primmportal.com/research; ACM SIGCSE'19 "Teachers'
  Experiences of using PRIMM to Teach Programming in School"
- Cambridge Lower Secondary Computing (0860) curriculum framework — five strands
  (Computational Thinking, Programming, Managing Data, Networks & Digital Communication,
  Computer Systems), stages 7–9, ages 11–14
- Raspberry Pi Foundation "The Computing Curriculum" KS3 (raspberrypi.org/curriculum/key-stage-3):
  Y7 all-Scratch (parts I & II), Python introduced end of Y8, "Python with sequences of
  data" + data science + cybersecurity in Y9 — reference point for our G7/G8 pacing
- "Supporting learners in the transition from block-based to text-based programming, a
  systematic review" (Computers & Education Open, 2025, sciencedirect.com/science/article/pii/S2590118425000280)
  — dual-modality/bridging environments beat hard jumps; basis for the G7 x-ray → dual-view →
  text-first arc (cf. EduBlocks, RPF's own "Scratch to Python" bridge course on FutureLearn)
- CSTA K-12 CS Standards Level 2, grades 6–8 (csteachers.org/k12standards): computing
  systems, networks, data & analysis, algorithms & programming, impacts; "model encryption",
  "refine programs based on feedback" → G8-M5 cipher, G7-G10 playtesting loop
- Code.org CS Discoveries (grades 6–10) unit themes (web, games/animations, data, physical
  computing, app design) and its 2026–27 successor **AI Discoveries** — evidence for
  project-per-unit structure and for adding age-appropriate AI literacy (G7 Smart NPCs world)
- Microsoft MakeCode Arcade educator curriculum (arcade.makecode.com/educators) — the
  "every unit ships a playable game increment" model behind G7's boss builds
