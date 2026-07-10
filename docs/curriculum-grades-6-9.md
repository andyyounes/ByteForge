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

# GRADE 6 — "The Creator Studio" (NEW — v2)

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

# GRADE 7 — "The Game Maker" (EXISTING — unchanged)

36 weeks, 10 modules: Variables & State → Conditionals → Functions → Keyboard → Mouse →
Collision → Game State → Game Design → Strings → Capstone. Blocks (M1–2) → text-primary
(M3–5) → text-only (M6–10). *Validated against the ladder: correct placement — it consumes
G6's events/variables/decisions in block form and hands G8 a student who has written real
text code inside a game loop.*

---

# GRADE 8 — "The App Builder" (NEW)

**36 weeks × 2h = 72h · Python, text-first · from games to useful programs**

Identity: G7 made things fun; G8 makes things *useful*. Real Python in a real editor,
working with real data. First term shows block-equivalents alongside text (transition
scaffold), then blocks disappear forever.

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
| M5 Strings & Validation | 3 | Slicing, methods, checking user input; username/password validator mini-project | new challenges |
| M6 Files & Data | 4 | Reading/writing text files, CSV, mean/max/min, drawing a chart from real data | new challenges |
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
- Cambridge Lower Secondary Computing (0860) curriculum framework — five strands,
  stages 7–9 progression
