// ============================================================
//  ByteForge — Concept Graph, Pathways & Achievements
//
//  Grade 6  — "The Artist's Toolkit"  (10 modules, g6-*)
//  Grade 7  — "The Game Maker"         (10 modules, g7-*)
//  Grade 8+ — Theory / IGCSE / A-Level (single concepts)
//
//  Theory concepts (binary, CPU, networking …) are gradeMin:9+
//  so they never appear in Grade 6–8 students' pools.
// ============================================================

import type { Concept, Pathway, Achievement, MasteryMap } from '@/types'

// ── Concepts ──────────────────────────────────────────────────────────────────

export const CONCEPTS: Concept[] = [

  // ══════════════════════════════════════════════════════════════════════════
  //  GRADE 6 — "The Creator Quest"
  //  Sequential modules power the pathway skill-tree view; all now link to
  //  the live grade6.html Adventure Map (12-world build), matching how
  //  Grade 7's concepts already point at grade7.html. gradeMin:6 — only
  //  Grade 6 students see these.
  // ══════════════════════════════════════════════════════════════════════════
  { id:'g6-pixels',     name:'M1 · Pixels & Color',           icon:'◼', color:'#f97316', tier:0, xGroup:4,  prerequisites:[],               difficulty:1, gradeMin:6, estimatedMinutes:60, learningModes:['grade6','pixel-grid'],          tags:['grade6','visual'],    lessonUrl:'/lessons/grade6.html' },
  { id:'g6-turtle',     name:'M2 · Meet the Turtle',           icon:'▷', color:'#22c55e', tier:1, xGroup:9,  prerequisites:['g6-pixels'],    difficulty:1, gradeMin:6, estimatedMinutes:60, learningModes:['grade6','blockly-turtle'],      tags:['grade6','drawing'],   lessonUrl:'/lessons/grade6.html' },
  { id:'g6-loops',      name:'M3 · Loops & Repetition',        icon:'↺', color:'#22c55e', tier:2, xGroup:7,  prerequisites:['g6-turtle'],    difficulty:1, gradeMin:6, estimatedMinutes:75, learningModes:['grade6','blockly-turtle'],      tags:['grade6','loops'],     lessonUrl:'/lessons/grade6.html' },
  { id:'g6-animation',  name:'M4 · Animation & Movement',      icon:'▶', color:'#06b6d4', tier:3, xGroup:7,  prerequisites:['g6-loops'],     difficulty:2, gradeMin:6, estimatedMinutes:75, learningModes:['grade6','canvas-code'],         tags:['grade6','animation'], lessonUrl:'/lessons/grade6.html' },
  { id:'g6-patterns',   name:'M5 · Patterns & Nested Loops',   icon:'⊞', color:'#f97316', tier:4, xGroup:4,  prerequisites:['g6-animation'], difficulty:2, gradeMin:6, estimatedMinutes:75, learningModes:['grade6','blockly-turtle'],      tags:['grade6','patterns'],  lessonUrl:'/lessons/grade6.html' },
  { id:'g6-color-vars', name:'M6 · Color & Variables',         icon:'◉', color:'#f97316', tier:5, xGroup:6,  prerequisites:['g6-patterns'],  difficulty:2, gradeMin:6, estimatedMinutes:60, learningModes:['grade6','pixel-grid'],          tags:['grade6','variables'], lessonUrl:'/lessons/grade6.html' },
  { id:'g6-random',     name:'M7 · Randomness',                 icon:'⁈', color:'#eab308', tier:6, xGroup:5,  prerequisites:['g6-color-vars'],difficulty:2, gradeMin:6, estimatedMinutes:60, learningModes:['grade6','canvas-code'],         tags:['grade6','random'],    lessonUrl:'/lessons/grade6.html' },
  { id:'g6-debug',      name:'M8 · Debugging & Fixing',         icon:'⊘', color:'#a855f7', tier:7, xGroup:1,  prerequisites:['g6-random'],    difficulty:2, gradeMin:6, estimatedMinutes:60, learningModes:['grade6','blockly-turtle'],      tags:['grade6','debug'],     lessonUrl:'/lessons/grade6.html' },
  { id:'g6-story',      name:'M9 · Storytelling with Code',     icon:'⬡', color:'#06b6d4', tier:8, xGroup:1,  prerequisites:['g6-debug'],     difficulty:3, gradeMin:6, estimatedMinutes:90, learningModes:['grade6','canvas-code'],         tags:['grade6','creative'],  lessonUrl:'/lessons/grade6.html' },
  { id:'g6-capstone',   name:'M10 · Year Capstone',             icon:'★', color:'#eab308', tier:9, xGroup:0,  prerequisites:['g6-story'],     difficulty:3, gradeMin:6, estimatedMinutes:90, learningModes:['grade6','canvas-code'],         tags:['grade6','capstone'],  lessonUrl:'/lessons/grade6.html' },

  // ══════════════════════════════════════════════════════════════════════════
  //  GRADE 7 — "The Game Maker"
  //  Sequential modules. All link to grade7.html (block + code hybrid editor).
  //  gradeMin:7 — only Grade 7+ students see these.
  //
  //  Spec: 10 modules / 36 weeks / 72 hours
  //  Tool: Block+Code hybrid — blocks primary M1–2, text primary M3–5, text-only M6–10
  // ══════════════════════════════════════════════════════════════════════════
  { id:'g7-variables',    name:'M1 · Variables & State',         icon:'▣', color:'#06b6d4', tier:0, xGroup:5,  prerequisites:[],                   difficulty:1, gradeMin:7, estimatedMinutes:60, learningModes:['grade7','canvas-code'],  tags:['grade7','game'],     lessonUrl:'/lessons/grade7.html' },
  { id:'g7-conditionals', name:'M2 · Conditionals',              icon:'⑂', color:'#3b82f6', tier:1, xGroup:10, prerequisites:['g7-variables'],     difficulty:1, gradeMin:7, estimatedMinutes:75, learningModes:['grade7','canvas-code'],  tags:['grade7','game'],     lessonUrl:'/lessons/grade7.html' },
  { id:'g7-functions',    name:'M3 · Functions',                  icon:'ƒ', color:'#8b5cf6', tier:2, xGroup:8,  prerequisites:['g7-conditionals'],  difficulty:2, gradeMin:7, estimatedMinutes:60, learningModes:['grade7','canvas-code'],  tags:['grade7','game'],     lessonUrl:'/lessons/grade7.html' },
  { id:'g7-keyboard',     name:'M4 · Keyboard Input',             icon:'◁', color:'#06b6d4', tier:3, xGroup:8,  prerequisites:['g7-functions'],     difficulty:2, gradeMin:7, estimatedMinutes:60, learningModes:['grade7','canvas-code'],  tags:['grade7','game'],     lessonUrl:'/lessons/grade7.html' },
  { id:'g7-mouse',        name:'M5 · Mouse & Click Events',       icon:'◉', color:'#3b82f6', tier:4, xGroup:5,  prerequisites:['g7-keyboard'],      difficulty:2, gradeMin:7, estimatedMinutes:60, learningModes:['grade7','canvas-code'],  tags:['grade7','game'],     lessonUrl:'/lessons/grade7.html' },
  { id:'g7-collision',    name:'M6 · Collision Detection',        icon:'⊛', color:'#ef4444', tier:5, xGroup:7,  prerequisites:['g7-mouse'],         difficulty:3, gradeMin:7, estimatedMinutes:75, learningModes:['grade7','canvas-code'],  tags:['grade7','game'],     lessonUrl:'/lessons/grade7.html' },
  { id:'g7-gamestate',    name:'M7 · Score, Lives & Game State',  icon:'⊕', color:'#22c55e', tier:6, xGroup:6,  prerequisites:['g7-collision'],     difficulty:3, gradeMin:7, estimatedMinutes:60, learningModes:['grade7','canvas-code'],  tags:['grade7','game'],     lessonUrl:'/lessons/grade7.html' },
  { id:'g7-design',       name:'M8 · Designing a Game',           icon:'◈', color:'#eab308', tier:7, xGroup:2,  prerequisites:['g7-gamestate'],     difficulty:3, gradeMin:7, estimatedMinutes:75, learningModes:['grade7','canvas-code'],  tags:['grade7','game'],     lessonUrl:'/lessons/grade7.html' },
  { id:'g7-strings',      name:'M9 · Strings & Text',             icon:'⌘', color:'#f97316', tier:8, xGroup:2,  prerequisites:['g7-design'],        difficulty:3, gradeMin:7, estimatedMinutes:60, learningModes:['grade7','canvas-code'],  tags:['grade7','game'],     lessonUrl:'/lessons/grade7.html' },
  { id:'g7-capstone',     name:'M10 · Year Capstone',             icon:'★', color:'#eab308', tier:9, xGroup:1,  prerequisites:['g7-strings'],       difficulty:4, gradeMin:7, estimatedMinutes:90, learningModes:['grade7','game','canvas-code'],  tags:['grade7','capstone'], lessonUrl:'/lessons/grade7.html' },

  // Semester 1 (Story Studio, st1-st5) and Semester 2 (Block Arcade, sc1-sc5)
  // — added when those worlds were built. Story Studio is genuinely new
  // territory (real HTML/CSS/JS-flavoured page-building, not covered by any
  // of the game-focused concepts above), so it gets its own concepts rather
  // than a misleading map onto an unrelated one. prerequisites:[] since
  // Story Studio runs BEFORE Game Maker in the actual semester order.
  { id:'g7-web-structure',   name:'Story Studio — Structure & Style', icon:'📰', color:'#16a34a', tier:10, xGroup:3, prerequisites:[], difficulty:1, gradeMin:7, estimatedMinutes:60, learningModes:['grade7','canvas-code'], tags:['grade7','web'], lessonUrl:'/lessons/grade7.html' },
  { id:'g7-web-interactive', name:'Story Studio — Behaviour & Logic', icon:'👆', color:'#ca8a04', tier:11, xGroup:4, prerequisites:['g7-web-structure'], difficulty:2, gradeMin:7, estimatedMinutes:75, learningModes:['grade7','canvas-code'], tags:['grade7','web'], lessonUrl:'/lessons/grade7.html' },

  // ══════════════════════════════════════════════════════════════════════════
  //  GRADE 8 — "The App Builder" — 10 modules (M1-M10), mirroring grade8.html's
  //  own MODULES array. Only 2 of these 10 concepts existed before — the other
  //  8 modules had real, gradeable content but nothing to report mastery
  //  against, so completing them could never move a student's real dashboard.
  //  prerequisites chain linearly, matching the module order students see.
  // ══════════════════════════════════════════════════════════════════════════
  { id:'g8-text',          name:'M1 · From Blocks to Text',   icon:'🔤', color:'#3b82f6', tier:5, xGroup:0, prerequisites:[],                   difficulty:2, gradeMin:8, estimatedMinutes:35, learningModes:['grade8'],                tags:['grade8','programming'], lessonUrl:'/lessons/grade8.html' },
  { id:'g8-loops',         name:'M2 · Choices & Loops',        icon:'🚦', color:'#3b82f6', tier:5, xGroup:1, prerequisites:['g8-text'],           difficulty:2, gradeMin:8, estimatedMinutes:35, learningModes:['grade8'],                tags:['grade8','programming'], lessonUrl:'/lessons/grade8.html' },
  { id:'functions-params', name:'M3 · Functions & Parameters', icon:'ƒ',  color:'#3b82f6', tier:5, xGroup:4, prerequisites:['g8-loops'],          difficulty:3, gradeMin:8, estimatedMinutes:35, learningModes:['grade8','canvas-code'],  tags:['grade8','programming'], lessonUrl:'/lessons/grade8.html' },
  { id:'lists-data',       name:'M4 · Lists & Arrays',         icon:'≡',  color:'#3b82f6', tier:5, xGroup:5, prerequisites:['functions-params'], difficulty:3, gradeMin:8, estimatedMinutes:35, learningModes:['grade8','canvas-code'],  tags:['grade8','programming'], lessonUrl:'/lessons/grade8.html' },
  { id:'g8-strings',       name:'M5 · Strings & Validation',   icon:'✂️', color:'#3b82f6', tier:5, xGroup:6, prerequisites:['lists-data'],        difficulty:3, gradeMin:8, estimatedMinutes:35, learningModes:['grade8'],                tags:['grade8','programming'], lessonUrl:'/lessons/grade8.html' },
  { id:'g8-files',         name:'M6 · Files & Data',           icon:'🗂', color:'#3b82f6', tier:5, xGroup:7, prerequisites:['g8-strings'],        difficulty:3, gradeMin:8, estimatedMinutes:45, learningModes:['grade8'],                tags:['grade8','programming'], lessonUrl:'/lessons/grade8.html' },
  { id:'g8-hardware',      name:'M7 · Inside the Machine',     icon:'⚙️', color:'#06b6d4', tier:5, xGroup:8, prerequisites:['g8-files'],          difficulty:2, gradeMin:8, estimatedMinutes:35, learningModes:['grade8'],                tags:['grade8','hardware'],    lessonUrl:'/lessons/grade8.html' },
  { id:'g8-web',           name:'M8 · The Connected World',    icon:'🌐', color:'#06b6d4', tier:5, xGroup:9, prerequisites:['g8-hardware'],       difficulty:2, gradeMin:8, estimatedMinutes:30, learningModes:['grade8'],                tags:['grade8','networking'],  lessonUrl:'/lessons/grade8.html' },
  { id:'g8-apps',          name:'M9 · Interactive Apps',       icon:'🖥',  color:'#3b82f6', tier:6, xGroup:0, prerequisites:['g8-web'],            difficulty:3, gradeMin:8, estimatedMinutes:45, learningModes:['grade8'],                tags:['grade8','programming'], lessonUrl:'/lessons/grade8.html' },
  { id:'g8-capstone',      name:'M10 · Capstone: Data App',    icon:'🏆', color:'#eab308', tier:6, xGroup:1, prerequisites:['g8-apps'],           difficulty:3, gradeMin:8, estimatedMinutes:60, learningModes:['grade8'],                tags:['grade8','capstone'],    lessonUrl:'/lessons/grade8.html' },

  // Semester 1 (Web Story, ws1-ws5) — real HTML/CSS/JS text-code story
  // project, genuinely distinct from g8-web (M8, which is internet/
  // networking THEORY, not DOM/JS programming). prerequisites:[] since
  // Web Story runs at the start of the year, before the M1-M10 sequence.
  { id:'g8-web-story', name:'Web Story — Interactive Page Project', icon:'📗', color:'#16a34a', tier:4, xGroup:2, prerequisites:[], difficulty:2, gradeMin:8, estimatedMinutes:75, learningModes:['grade8'], tags:['grade8','web'], lessonUrl:'/lessons/grade8.html' },

  // ══════════════════════════════════════════════════════════════════════════
  //  GRADE 9 — "The Deep Diver"
  //  3 Terms × 10 Weeks × 2 Hours = 60 hours
  //
  //  Term 1 (Wk 1–10):  Think & Plan   — unplugged → binary → hex → flowcharts
  //                                        → pseudocode → data types → procedures
  //                                        → trace tables → algorithms preview
  //  Term 2 (Wk 11–20): Go Deeper      — sorting → searching → cybersecurity
  //                                        → hardware → micro:bit → AI → Python intro
  //  Term 3 (Wk 21–30): Build & Create — Python properly → files → data viz
  //                                        → AI in Python → capstone project
  //
  //  gradeMin:9 — concepts appear for Grade 9 students only.
  //  All link to /lessons/grade9.html unless a separate page is more appropriate.
  // ══════════════════════════════════════════════════════════════════════════

  // ── Term 1: Think & Plan ──────────────────────────────────────────────────
  { id:'g9-cpu-model',      name:'W1 · The Human Computer',       icon:'🖥️', color:'#06b6d4', tier:0, xGroup:0, prerequisites:[],                  difficulty:1, gradeMin:9, estimatedMinutes:60, learningModes:['grade9','text'],               tags:['grade9','hardware'],         lessonUrl:'/lessons/grade9.html' },
  { id:'g9-binary',         name:'W2 · Binary Numbers',           icon:'⚫', color:'#3b82f6', tier:1, xGroup:1, prerequisites:['g9-cpu-model'],    difficulty:1, gradeMin:9, estimatedMinutes:60, learningModes:['grade9','binary-cards'],        tags:['grade9','numbers'],          lessonUrl:'/lessons/grade9.html' },
  { id:'g9-hex',            name:'W3 · Hexadecimal',              icon:'🔢', color:'#eab308', tier:2, xGroup:2, prerequisites:['g9-binary'],       difficulty:2, gradeMin:9, estimatedMinutes:60, learningModes:['grade9','binary-cards'],        tags:['grade9','numbers'],          lessonUrl:'/lessons/grade9.html' },
  { id:'g9-flowcharts',     name:'W4 · Flowcharts',               icon:'📊', color:'#22c55e', tier:3, xGroup:3, prerequisites:['g9-hex'],          difficulty:1, gradeMin:9, estimatedMinutes:60, learningModes:['grade9','flowchart'],           tags:['grade9','algorithms'],       lessonUrl:'/lessons/grade9.html' },
  { id:'g9-flowcharts-loops',name:'W5 · Flowcharts & Loops',      icon:'🔀', color:'#22c55e', tier:4, xGroup:3, prerequisites:['g9-flowcharts'],   difficulty:2, gradeMin:9, estimatedMinutes:60, learningModes:['grade9','flowchart'],           tags:['grade9','algorithms'],       lessonUrl:'/lessons/grade9.html' },
  { id:'g9-pseudocode',     name:'W6 · Pseudocode Foundations',   icon:'📝', color:'#a855f7', tier:5, xGroup:4, prerequisites:['g9-flowcharts-loops'],difficulty:2,gradeMin:9,estimatedMinutes:60, learningModes:['grade9','pseudocode'],          tags:['grade9','pseudocode'],       lessonUrl:'/lessons/grade9.html' },
  { id:'g9-declarations',   name:'W7 · Data Types & Declarations',icon:'📋', color:'#a855f7', tier:6, xGroup:4, prerequisites:['g9-pseudocode'],   difficulty:2, gradeMin:9, estimatedMinutes:60, learningModes:['grade9','pseudocode'],          tags:['grade9','pseudocode'],       lessonUrl:'/lessons/grade9.html' },
  { id:'g9-procedures',     name:'W8 · Procedures & Functions',   icon:'ƒ',  color:'#a855f7', tier:7, xGroup:5, prerequisites:['g9-declarations'], difficulty:3, gradeMin:9, estimatedMinutes:60, learningModes:['grade9','pseudocode'],          tags:['grade9','pseudocode'],       lessonUrl:'/lessons/grade9.html' },
  { id:'g9-trace-tables',   name:'W9 · Trace Tables',             icon:'🔬', color:'#a855f7', tier:8, xGroup:5, prerequisites:['g9-procedures'],   difficulty:3, gradeMin:9, estimatedMinutes:60, learningModes:['grade9','pseudocode'],          tags:['grade9','pseudocode'],       lessonUrl:'/lessons/grade9.html' },
  { id:'g9-term1-review',   name:'W10 · Term 1 Review',           icon:'📌', color:'#eab308', tier:9, xGroup:4, prerequisites:['g9-trace-tables'], difficulty:2, gradeMin:9, estimatedMinutes:60, learningModes:['grade9','pseudocode'],          tags:['grade9','review'],           lessonUrl:'/lessons/grade9.html' },

  // ── Term 2: Go Deeper ─────────────────────────────────────────────────────
  { id:'g9-sort',           name:'W11 · Sorting Algorithms',      icon:'🫧', color:'#a855f7', tier:10, xGroup:0, prerequisites:['g9-term1-review'],difficulty:3, gradeMin:9, estimatedMinutes:60, learningModes:['grade9','algo-viz','pseudocode'],tags:['grade9','algorithms'],       lessonUrl:'/lessons/grade9.html' },
  { id:'g9-search',         name:'W12 · Searching Algorithms',    icon:'🔍', color:'#a855f7', tier:11, xGroup:0, prerequisites:['g9-sort'],        difficulty:3, gradeMin:9, estimatedMinutes:60, learningModes:['grade9','algo-viz','pseudocode'],tags:['grade9','algorithms'],       lessonUrl:'/lessons/grade9.html' },
  { id:'g9-cybersecurity',  name:'W13–14 · Cybersecurity',        icon:'🔐', color:'#ef4444', tier:12, xGroup:1, prerequisites:['g9-search'],      difficulty:2, gradeMin:9, estimatedMinutes:120,learningModes:['grade9','pseudocode'],          tags:['grade9','security'],         lessonUrl:'/lessons/grade9.html' },
  { id:'g9-hardware',       name:'W15 · Hardware Deep Dive',      icon:'⚙️', color:'#06b6d4', tier:13, xGroup:2, prerequisites:['g9-cybersecurity'],difficulty:2,gradeMin:9, estimatedMinutes:60, learningModes:['grade9','text'],               tags:['grade9','hardware'],         lessonUrl:'/lessons/grade9.html' },
  { id:'g9-microbit',       name:'W16 · Physical Computing',      icon:'📟', color:'#22c55e', tier:14, xGroup:2, prerequisites:['g9-hardware'],    difficulty:2, gradeMin:9, estimatedMinutes:60, learningModes:['grade9'],                      tags:['grade9','physical'],         lessonUrl:'/lessons/grade9.html' },
  { id:'g9-ai-concepts',    name:'W17 · AI: What It Is',          icon:'🤖', color:'#8b5cf6', tier:15, xGroup:3, prerequisites:['g9-microbit'],    difficulty:2, gradeMin:9, estimatedMinutes:60, learningModes:['grade9','text'],               tags:['grade9','ai'],               lessonUrl:'/lessons/grade9.html' },
  { id:'g9-ai-algorithms',  name:'W18 · AI: Algorithms Behind It',icon:'🧠', color:'#8b5cf6', tier:16, xGroup:3, prerequisites:['g9-ai-concepts'], difficulty:3, gradeMin:9, estimatedMinutes:60, learningModes:['grade9','pseudocode'],          tags:['grade9','ai','algorithms'],  lessonUrl:'/lessons/grade9.html' },
  { id:'g9-python-intro',   name:'W19 · Python: First Code',      icon:'🐍', color:'#f97316', tier:17, xGroup:4, prerequisites:['g9-ai-algorithms'],difficulty:2,gradeMin:9, estimatedMinutes:60, learningModes:['grade9','ide'],                tags:['grade9','python'],           lessonUrl:'/lessons/grade9.html' },
  { id:'g9-python-build',   name:'W20 · Python: Building',        icon:'🐍', color:'#f97316', tier:18, xGroup:4, prerequisites:['g9-python-intro'],difficulty:3,gradeMin:9, estimatedMinutes:60, learningModes:['grade9','ide'],                tags:['grade9','python'],           lessonUrl:'/lessons/grade9.html' },
  { id:'g9-term2-review',   name:'W20 · Term 2 Checklist',        icon:'✅', color:'#eab308', tier:19, xGroup:3, prerequisites:['g9-python-build'],difficulty:2,gradeMin:9, estimatedMinutes:30, learningModes:['grade9'],                      tags:['grade9','review'],           lessonUrl:'/lessons/grade9.html' },

  // ── Term 3: Build & Create ────────────────────────────────────────────────
  { id:'g9-python-files',   name:'W21 · Python: Files & Data',    icon:'📂', color:'#f97316', tier:20, xGroup:0, prerequisites:['g9-term2-review'],difficulty:3,gradeMin:9, estimatedMinutes:60, learningModes:['grade9','ide'],                tags:['grade9','python'],           lessonUrl:'/lessons/grade9.html' },
  { id:'g9-python-lists',   name:'W22–23 · Lists & Dictionaries', icon:'📋', color:'#f97316', tier:21, xGroup:0, prerequisites:['g9-python-files'],difficulty:3,gradeMin:9, estimatedMinutes:120,learningModes:['grade9','ide'],                tags:['grade9','python'],           lessonUrl:'/lessons/grade9.html' },
  { id:'g9-error-handling', name:'W23 · Functions & Error Handling',icon:'⚠️',color:'#f97316',tier:22, xGroup:0, prerequisites:['g9-python-lists'],difficulty:3,gradeMin:9, estimatedMinutes:60, learningModes:['grade9','ide'],                tags:['grade9','python'],           lessonUrl:'/lessons/grade9.html' },
  { id:'g9-data-viz',       name:'W24–25 · Data Visualisation',   icon:'📊', color:'#22c55e', tier:23, xGroup:1, prerequisites:['g9-error-handling'],difficulty:3,gradeMin:9,estimatedMinutes:120,learningModes:['grade9','ide'],               tags:['grade9','python','data'],    lessonUrl:'/lessons/grade9.html' },
  { id:'g9-ai-python',      name:'W26–27 · AI in Python',         icon:'🤖', color:'#8b5cf6', tier:24, xGroup:2, prerequisites:['g9-data-viz'],    difficulty:4, gradeMin:9, estimatedMinutes:120,learningModes:['grade9','ide'],                tags:['grade9','ai','python'],      lessonUrl:'/lessons/grade9.html' },
  { id:'g9-project-start',  name:'W28 · Project: Plan & Build',   icon:'🚀', color:'#eab308', tier:25, xGroup:3, prerequisites:['g9-ai-python'],   difficulty:4, gradeMin:9, estimatedMinutes:60, learningModes:['grade9','ide'],                tags:['grade9','capstone'],         lessonUrl:'/lessons/grade9.html' },
  { id:'g9-project-refine', name:'W29 · Project: Refine & Test',  icon:'🔧', color:'#eab308', tier:26, xGroup:3, prerequisites:['g9-project-start'],difficulty:4,gradeMin:9, estimatedMinutes:60, learningModes:['grade9','ide'],                tags:['grade9','capstone'],         lessonUrl:'/lessons/grade9.html' },
  { id:'g9-capstone',       name:'W30 · Year Showcase',            icon:'★',  color:'#eab308', tier:27, xGroup:3, prerequisites:['g9-project-refine'],difficulty:4,gradeMin:9,estimatedMinutes:60, learningModes:['grade9','ide'],               tags:['grade9','capstone'],         lessonUrl:'/lessons/grade9.html' },

  // ══════════════════════════════════════════════════════════════════════════
  //  THEORY — Hardware, Data Representation, Networking
  //  gradeMin:9 or 10 so these never appear for Grade 6/7/8 students.
  // ══════════════════════════════════════════════════════════════════════════

  // ── Tier 0 — Foundations (IGCSE intro) ────────────────────────────────────
  { id:'computer-basics',   name:'What is a Computer?',      icon:'💻', color:'#06b6d4', tier:0, xGroup:0, prerequisites:[], difficulty:1, gradeMin:10, estimatedMinutes:15, learningModes:['text'],                  tags:['foundations','hardware'],  lessonUrl:'/student/concept/computer-basics' },
  { id:'input-output',      name:'Input, Output & Storage',  icon:'💾', color:'#06b6d4', tier:0, xGroup:1, prerequisites:[], difficulty:1, gradeMin:10, estimatedMinutes:15, learningModes:['text'],                  tags:['foundations','hardware'],  lessonUrl:'/student/concept/input-output' },
  { id:'decimal-system',    name:'The Decimal System',       icon:'🔟', color:'#3b82f6', tier:0, xGroup:2, prerequisites:[], difficulty:1, gradeMin:10, estimatedMinutes:15, learningModes:['text'],                  tags:['numbers','foundations'],   lessonUrl:'/student/concept/decimal-system' },
  { id:'binary-intro',      name:'Introduction to Binary',   icon:'⚫', color:'#3b82f6', tier:0, xGroup:3, prerequisites:[], difficulty:1, gradeMin:10, estimatedMinutes:20, learningModes:['text','binary-cards'],   tags:['numbers','foundations'],   lessonUrl:'/student/concept/binary-intro' },

  // ── Tier 1 — Hardware & Networking ────────────────────────────────────────
  { id:'secondary-storage', name:'Secondary Storage',        icon:'📀', color:'#06b6d4', tier:1, xGroup:0, prerequisites:['computer-basics'],                    difficulty:1, gradeMin:10, estimatedMinutes:20, learningModes:['text'],                  tags:['hardware'],                lessonUrl:'/student/concept/secondary-storage' },
  { id:'networking-basics', name:'Network Basics',           icon:'🌐', color:'#06b6d4', tier:1, xGroup:1, prerequisites:['computer-basics'],                    difficulty:2, gradeMin:10, estimatedMinutes:30, learningModes:['text'],                  tags:['hardware','networking'],   lessonUrl:'/student/concept/networking-basics' },
  { id:'cpu-basics',        name:'CPU Components',           icon:'⚙️', color:'#06b6d4', tier:1, xGroup:2, prerequisites:['computer-basics','binary-intro'],     difficulty:2, gradeMin:10, estimatedMinutes:30, learningModes:['text'],                  tags:['hardware'],                lessonUrl:'/student/concept/cpu-basics' },
  { id:'logic-gates',       name:'Logic Gates',              icon:'🔮', color:'#a855f7', tier:1, xGroup:3, prerequisites:['binary-intro'],                       difficulty:2, gradeMin:10, estimatedMinutes:30, learningModes:['text'],                  tags:['logic'],                   lessonUrl:'/student/concept/logic-gates' },
  { id:'flowchart-basics',  name:'Flowchart Basics',         icon:'📊', color:'#22c55e', tier:1, xGroup:4, prerequisites:['computer-basics'],                    difficulty:1, gradeMin:9,  estimatedMinutes:20, learningModes:['text','flowchart'],      tags:['algorithms'],              lessonUrl:'/lessons/flowchart.html' },
  { id:'html-css-basics',   name:'HTML & CSS Basics',        icon:'🌍', color:'#f97316', tier:1, xGroup:5, prerequisites:['computer-basics'],                    difficulty:2, gradeMin:10, estimatedMinutes:45, learningModes:['ide'],                   tags:['web'],                     lessonUrl:'/lessons/ide.html' },
  { id:'binary-to-decimal', name:'Binary → Decimal',         icon:'🔄', color:'#3b82f6', tier:1, xGroup:6, prerequisites:['binary-intro','decimal-system'],      difficulty:1, gradeMin:9,  estimatedMinutes:25, learningModes:['binary-cards'],          tags:['numbers'],                 lessonUrl:'/lessons/binary-cards.html' },
  { id:'decimal-to-binary', name:'Decimal → Binary',         icon:'🔁', color:'#3b82f6', tier:1, xGroup:7, prerequisites:['binary-intro','decimal-system'],      difficulty:2, gradeMin:9,  estimatedMinutes:25, learningModes:['binary-cards'],          tags:['numbers'],                 lessonUrl:'/lessons/binary-cards.html' },
  { id:'ascii-unicode',     name:'ASCII & Unicode',          icon:'🔤', color:'#3b82f6', tier:1, xGroup:8, prerequisites:['binary-intro'],                       difficulty:2, gradeMin:10, estimatedMinutes:25, learningModes:['text'],                  tags:['numbers','data'],          lessonUrl:'/student/concept/ascii-unicode' },

  // ── Tier 2 — Deeper Hardware + Algorithms intro ───────────────────────────
  { id:'memory-types',        name:'RAM, ROM & Cache',       icon:'🧠', color:'#06b6d4', tier:2, xGroup:0, prerequisites:['cpu-basics'],                         difficulty:2, gradeMin:10, estimatedMinutes:25, learningModes:['text'],                 tags:['hardware'],                lessonUrl:'/student/concept/memory-types' },
  { id:'logic-circuits',      name:'Logic Circuits',         icon:'⚡', color:'#a855f7', tier:2, xGroup:1, prerequisites:['logic-gates'],                        difficulty:3, gradeMin:10, estimatedMinutes:40, learningModes:['text'],                 tags:['logic'],                   lessonUrl:'/student/concept/logic-circuits' },
  { id:'binary-addition',     name:'Binary Addition',        icon:'➕', color:'#3b82f6', tier:2, xGroup:2, prerequisites:['binary-to-decimal','decimal-to-binary'],difficulty:2,gradeMin:9, estimatedMinutes:30, learningModes:['binary-cards'],         tags:['numbers'],                 lessonUrl:'/lessons/binary-cards.html' },
  { id:'hex-intro',           name:'Hexadecimal Intro',      icon:'🔢', color:'#eab308', tier:2, xGroup:3, prerequisites:['binary-to-decimal'],                  difficulty:2, gradeMin:9,  estimatedMinutes:25, learningModes:['text','binary-cards'],  tags:['numbers'],                 lessonUrl:'/lessons/binary-cards.html' },
  { id:'blockly-intro',       name:'Visual Block Coding',    icon:'🧱', color:'#22c55e', tier:2, xGroup:4, prerequisites:['flowchart-basics'],                   difficulty:1, gradeMin:9,  estimatedMinutes:25, learningModes:['blockly'],              tags:['programming'],             lessonUrl:'/lessons/blockly.html' },
  { id:'flowchart-decisions', name:'Flowcharts & Decisions', icon:'🔀', color:'#22c55e', tier:2, xGroup:5, prerequisites:['flowchart-basics'],                   difficulty:2, gradeMin:9,  estimatedMinutes:25, learningModes:['flowchart'],            tags:['algorithms'],              lessonUrl:'/lessons/flowchart.html' },
  { id:'pseudocode-intro',    name:'Pseudocode Basics',      icon:'📝', color:'#22c55e', tier:2, xGroup:6, prerequisites:[],                                     difficulty:2, gradeMin:9,  estimatedMinutes:30, learningModes:['grade9','pseudocode'],   tags:['algorithms','pseudocode'], lessonUrl:'/lessons/grade9.html' },
  { id:'compression',         name:'Data Compression',       icon:'⊟', color:'#a855f7', tier:2, xGroup:9, prerequisites:['ascii-unicode'],                       difficulty:2, gradeMin:10, estimatedMinutes:25, learningModes:['compression'],          tags:['data'],                    lessonUrl:'/lessons/compression.html' },
  { id:'cpu-pipeline',        name:'CPU Pipeline',           icon:'⊞', color:'#06b6d4', tier:2, xGroup:10,prerequisites:['cpu-basics'],                          difficulty:2, gradeMin:10, estimatedMinutes:25, learningModes:['cpu-pipeline'],         tags:['hardware'],                lessonUrl:'/lessons/cpu-pipeline.html' },

  // ── Tier 3 — Algorithms & advanced data ──────────────────────────────────
  { id:'boolean-algebra',   name:'Boolean Algebra',          icon:'∧',  color:'#a855f7', tier:3, xGroup:0, prerequisites:['logic-circuits'],                    difficulty:3, gradeMin:10, estimatedMinutes:45, learningModes:['text'],                  tags:['logic'],                   lessonUrl:'/student/concept/boolean-algebra' },
  { id:'twos-complement',   name:"Two's Complement",         icon:'⊖',  color:'#3b82f6', tier:3, xGroup:1, prerequisites:['binary-addition'],                   difficulty:3, gradeMin:10, estimatedMinutes:35, learningModes:['text','binary-cards'],   tags:['numbers'],                 lessonUrl:'/lessons/binary-cards.html' },
  { id:'hex-binary',        name:'Hex ↔ Binary',             icon:'↔️', color:'#eab308', tier:3, xGroup:2, prerequisites:['hex-intro'],                         difficulty:2, gradeMin:9,  estimatedMinutes:20, learningModes:['binary-cards'],          tags:['numbers'],                 lessonUrl:'/lessons/binary-cards.html' },
  { id:'hex-colors',        name:'Hex Colour Codes',         icon:'🎨', color:'#eab308', tier:3, xGroup:3, prerequisites:['hex-intro'],                         difficulty:1, gradeMin:9,  estimatedMinutes:20, learningModes:['text'],                  tags:['numbers','web'],           lessonUrl:'/student/concept/hex-colors' },
  { id:'blockly-loops',     name:'Blockly Loops',            icon:'🔃', color:'#22c55e', tier:3, xGroup:4, prerequisites:['blockly-intro','flowchart-decisions'],difficulty:2, gradeMin:9,  estimatedMinutes:30, learningModes:['blockly'],               tags:['programming'],             lessonUrl:'/lessons/blockly.html' },
  { id:'pseudocode-loops',  name:'Loops in Pseudocode',      icon:'🔁', color:'#22c55e', tier:3, xGroup:5, prerequisites:['pseudocode-intro'],                  difficulty:2, gradeMin:9,  estimatedMinutes:30, learningModes:['grade9','pseudocode'],   tags:['algorithms','pseudocode'], lessonUrl:'/lessons/grade9.html' },
  { id:'python-intro',      name:'Python Basics',            icon:'🐍', color:'#f97316', tier:3, xGroup:6, prerequisites:['pseudocode-intro'],                  difficulty:2, gradeMin:10, estimatedMinutes:40, learningModes:['ide'],                   tags:['programming','python'],    lessonUrl:'/lessons/ide.html' },

  // ── Tier 4 ────────────────────────────────────────────────────────────────
  { id:'pseudocode-arrays',   name:'Arrays in Pseudocode',  icon:'📦', color:'#22c55e', tier:4, xGroup:0, prerequisites:['pseudocode-loops'],                   difficulty:3, gradeMin:9,  estimatedMinutes:35, learningModes:['grade9','pseudocode'],   tags:['algorithms','pseudocode'], lessonUrl:'/lessons/grade9.html' },
  { id:'search-linear',       name:'Linear Search',         icon:'🔍', color:'#a855f7', tier:4, xGroup:1, prerequisites:['pseudocode-loops'],                   difficulty:2, gradeMin:9,  estimatedMinutes:25, learningModes:['grade9','algo-viz'],     tags:['algorithms'],              lessonUrl:'/lessons/grade9.html' },
  { id:'python-loops',        name:'Python Loops',          icon:'🐍', color:'#f97316', tier:4, xGroup:2, prerequisites:['python-intro'],                       difficulty:2, gradeMin:10, estimatedMinutes:35, learningModes:['ide'],                   tags:['programming','python'],    lessonUrl:'/lessons/ide.html' },
  { id:'javascript-basics',   name:'JavaScript Basics',     icon:'🟨', color:'#f97316', tier:4, xGroup:3, prerequisites:['html-css-basics','python-intro'],      difficulty:3, gradeMin:10, estimatedMinutes:50, learningModes:['ide'],                   tags:['programming','web'],       lessonUrl:'/lessons/ide.html' },

  // ── Tier 5 ────────────────────────────────────────────────────────────────
  { id:'search-binary',        name:'Binary Search',        icon:'🎯', color:'#a855f7', tier:5, xGroup:0, prerequisites:['search-linear','pseudocode-arrays'],   difficulty:3, gradeMin:9,  estimatedMinutes:30, learningModes:['pseudocode','algo-viz'], tags:['algorithms'],              lessonUrl:'/lessons/algo-viz.html' },
  { id:'sort-bubble',          name:'Bubble Sort',          icon:'🫧', color:'#a855f7', tier:5, xGroup:1, prerequisites:['pseudocode-loops','pseudocode-arrays'], difficulty:3, gradeMin:9,  estimatedMinutes:35, learningModes:['grade9','algo-viz'],     tags:['algorithms'],              lessonUrl:'/lessons/grade9.html' },
  { id:'data-structures-intro',name:'Stacks & Queues',      icon:'📚', color:'#a855f7', tier:5, xGroup:2, prerequisites:['pseudocode-arrays'],                   difficulty:3, gradeMin:10, estimatedMinutes:40, learningModes:['pseudocode','algo-viz'], tags:['algorithms'],              lessonUrl:'/lessons/algo-viz.html' },
  { id:'python-functions',     name:'Python Functions',     icon:'🐍', color:'#f97316', tier:5, xGroup:3, prerequisites:['python-loops'],                        difficulty:3, gradeMin:10, estimatedMinutes:40, learningModes:['ide'],                   tags:['programming','python'],    lessonUrl:'/lessons/ide.html' },

  // ── Tier 6 ────────────────────────────────────────────────────────────────
  { id:'sort-insertion', name:'Insertion Sort',             icon:'📥', color:'#a855f7', tier:6, xGroup:0, prerequisites:['sort-bubble'],                         difficulty:3, gradeMin:10, estimatedMinutes:35, learningModes:['pseudocode','algo-viz'], tags:['algorithms'],              lessonUrl:'/lessons/algo-viz.html' },
  { id:'python-lists',   name:'Python Lists & Dicts',       icon:'📋', color:'#f97316', tier:6, xGroup:1, prerequisites:['python-functions'],                    difficulty:3, gradeMin:10, estimatedMinutes:40, learningModes:['ide'],                   tags:['programming','python'],    lessonUrl:'/lessons/ide.html' },
  { id:'sql-basics',     name:'SQL Queries',                icon:'🗄️', color:'#f97316', tier:6, xGroup:2, prerequisites:['data-structures-intro','python-intro'], difficulty:3, gradeMin:10, estimatedMinutes:45, learningModes:['ide'],                   tags:['programming','data'],      lessonUrl:'/lessons/ide.html' },
  { id:'oop-concepts',   name:'Object-Oriented Programming',icon:'🏗️', color:'#f97316', tier:6, xGroup:3, prerequisites:['python-functions'],                    difficulty:4, gradeMin:10, estimatedMinutes:55, learningModes:['ide'],                   tags:['programming','python'],    lessonUrl:'/lessons/ide.html' },
  { id:'recursion',      name:'Recursion',                  icon:'🌀', color:'#a855f7', tier:6, xGroup:4, prerequisites:['python-functions','data-structures-intro'],difficulty:4,gradeMin:10,estimatedMinutes:50,learningModes:['pseudocode','ide'],    tags:['algorithms','python'],     lessonUrl:'/lessons/pseudocode.html' },

  // ── Tier 7 ────────────────────────────────────────────────────────────────
  { id:'sort-merge', name:'Merge Sort',                     icon:'🔀', color:'#a855f7', tier:7, xGroup:0, prerequisites:['sort-insertion'],                      difficulty:4, gradeMin:10, estimatedMinutes:45, learningModes:['pseudocode','algo-viz'], tags:['algorithms'],              lessonUrl:'/lessons/algo-viz.html' },

  // ── Tier 8 ────────────────────────────────────────────────────────────────
  { id:'algorithms-complexity', name:'Algorithm Complexity',icon:'📈', color:'#a855f7', tier:8, xGroup:0, prerequisites:['sort-merge','search-binary'],           difficulty:4, gradeMin:10, estimatedMinutes:50, learningModes:['text','pseudocode'],    tags:['algorithms'],              lessonUrl:'/student/concept/algorithms-complexity' },

  // ── IGCSE-specific (0478 Paper 1/2) — no equivalent concept existed yet ────
  { id:'igcse-security', name:'Network Security & Ethics', icon:'🔐', color:'#06b6d4', tier:2, xGroup:11, prerequisites:['networking-basics'],                  difficulty:2, gradeMin:10, estimatedMinutes:30, learningModes:['text'],                  tags:['security','networking'],   lessonUrl:'/lessons/igcse-y1.html' },
  { id:'igcse-params',   name:"Passing Parameters (BYVAL/BYREF)", icon:'📤', color:'#22c55e', tier:4, xGroup:12, prerequisites:['pseudocode-arrays'],           difficulty:3, gradeMin:10, estimatedMinutes:30, learningModes:['pseudocode'],             tags:['algorithms','pseudocode'], lessonUrl:'/lessons/igcse-y2.html' },
  { id:'igcse-files',    name:'File Handling in Pseudocode', icon:'📁', color:'#22c55e', tier:4, xGroup:13, prerequisites:['pseudocode-arrays'],                difficulty:3, gradeMin:10, estimatedMinutes:30, learningModes:['pseudocode'],             tags:['algorithms','pseudocode'], lessonUrl:'/lessons/igcse-y2.html' },
]

// ── Pathways ──────────────────────────────────────────────────────────────────

export const PATHWAYS: Pathway[] = [
  // ── Grade 6 ───────────────────────────────────────────────────────────────
  {
    id: 'path-artist',
    name: "Artist's Toolkit",
    icon: '◼',
    color: '#f97316',
    conceptIds: ['g6-pixels','g6-turtle','g6-loops','g6-animation','g6-patterns','g6-color-vars','g6-random','g6-debug','g6-story','g6-capstone'],
    tier: 'Grade 6',
  },
  // ── Grade 7 ───────────────────────────────────────────────────────────────
  {
    id: 'path-gamemaker',
    name: 'Game Maker',
    icon: '◎',
    color: '#06b6d4',
    conceptIds: ['g7-variables','g7-conditionals','g7-functions','g7-keyboard','g7-mouse','g7-collision','g7-gamestate','g7-design','g7-strings','g7-capstone'],
    tier: 'Grade 7',
  },
  // ── Grade 8 ───────────────────────────────────────────────────────────────
  {
    id: 'path-systems',
    name: 'Systems Builder',
    icon: '⊞',
    color: '#3b82f6',
    conceptIds: ['g8-text','g8-loops','functions-params','lists-data','g8-strings','g8-files','g8-hardware','g8-web','g8-apps','g8-capstone'],
    tier: 'Grade 8',
  },
  // ── General pathways (Grade 9+) ───────────────────────────────────────────
  {
    id: 'path-visual',
    name: 'Visual Coder',
    icon: '🧱',
    color: '#22c55e',
    conceptIds: ['computer-basics','input-output','flowchart-basics','blockly-intro','flowchart-decisions','blockly-loops','pseudocode-intro','pseudocode-loops'],
    tier: 'Grade 9',
  },
  {
    id: 'path-numbers',
    name: 'Number Systems',
    icon: '🔢',
    color: '#3b82f6',
    conceptIds: ['decimal-system','binary-intro','binary-to-decimal','decimal-to-binary','binary-addition','twos-complement','hex-intro','hex-binary','hex-colors','ascii-unicode'],
    tier: 'Grade 9–10',
  },
  {
    id: 'path-algorithms',
    name: 'Algorithm Architect',
    icon: '⚙️',
    color: '#a855f7',
    conceptIds: ['flowchart-basics','flowchart-decisions','pseudocode-intro','pseudocode-loops','pseudocode-arrays','search-linear','search-binary','sort-bubble','sort-insertion','sort-merge','data-structures-intro','algorithms-complexity'],
    tier: 'Grade 9–10',
  },
  {
    id: 'path-python',
    name: 'Python Programmer',
    icon: '🐍',
    color: '#f97316',
    conceptIds: ['pseudocode-intro','python-intro','python-loops','python-functions','python-lists','oop-concepts','recursion'],
    tier: 'Grade 10–AS Level',
  },
  {
    id: 'path-web',
    name: 'Web Creator',
    icon: '🌍',
    color: '#06b6d4',
    conceptIds: ['computer-basics','html-css-basics','hex-colors','javascript-basics','sql-basics'],
    tier: 'Grade 10–AS Level',
  },
]

// ── Achievement helper functions ──────────────────────────────────────────────

function masteredCount(masteryMap: MasteryMap): number {
  return Object.values(masteryMap).filter(c => c.status === 'mastered').length
}

function isMastered(masteryMap: MasteryMap, id: string): boolean {
  return masteryMap[id]?.status === 'mastered'
}

function attempts(masteryMap: MasteryMap, ...ids: string[]): number {
  return ids.reduce((sum, id) => sum + (masteryMap[id]?.attempts ?? 0), 0)
}

function pathwayComplete(masteryMap: MasteryMap, pathwayId: string): boolean {
  const p = PATHWAYS.find(pw => pw.id === pathwayId)
  if (!p) return false
  return p.conceptIds.every(id => isMastered(masteryMap, id))
}

// ── Achievements ──────────────────────────────────────────────────────────────

export const ACHIEVEMENTS: Achievement[] = [
  // ── Universal ────────────────────────────────────────────────────────────
  { id:'first-concept',    name:'First Step',              icon:'🌱', description:'Master your very first concept',                xp:50,   check:(m)=>masteredCount(m)>=1 },
  { id:'flip-10',          name:'Card Shark',               icon:'🃏', description:'Complete 10 binary card challenges',            xp:75,   check:(m)=>attempts(m,'binary-to-decimal','decimal-to-binary')>=10 },
  { id:'streak-3',         name:'On a Roll',                icon:'🔥', description:'Maintain a 3-day learning streak',              xp:100,  check:(_m,p)=>(p.streak??0)>=3 },
  { id:'streak-7',         name:'Week Warrior',             icon:'🔥', description:'Maintain a 7-day learning streak',              xp:250,  check:(_m,p)=>(p.streak??0)>=7 },
  { id:'streak-30',        name:'Unstoppable',              icon:'⚡', description:'Maintain a 30-day learning streak',             xp:1000, check:(_m,p)=>(p.streak??0)>=30 },
  { id:'concept-5',        name:'High Five',                icon:'🖐', description:'Master 5 concepts',                            xp:100,  check:(m)=>masteredCount(m)>=5 },
  { id:'concept-10',       name:'Decade',                   icon:'🎯', description:'Master 10 concepts',                           xp:300,  check:(m)=>masteredCount(m)>=10 },
  { id:'concept-25',       name:'Quarter Century',          icon:'💎', description:'Master 25 concepts',                           xp:750,  check:(m)=>masteredCount(m)>=25 },
  { id:'level-5',          name:'Level 5',                  icon:'⭐', description:'Reach level 5',                               xp:0,    check:(_m,p)=>(p.level??1)>=5 },
  { id:'level-10',         name:'Byte Forger',              icon:'🏆', description:'Reach level 10',                              xp:0,    check:(_m,p)=>(p.level??1)>=10 },

  // ── Grade 6 — Artist's Toolkit ───────────────────────────────────────────
  { id:'g6-first-pixel',   name:'First Pixel',              icon:'◼',  description:'Complete M1 — Pixels & Color',                xp:50,   check:(m)=>isMastered(m,'g6-pixels') },
  { id:'g6-turtle-wr',     name:'Turtle Wrangler',          icon:'▷',  description:'Complete M2 — Meet the Turtle',               xp:75,   check:(m)=>isMastered(m,'g6-turtle') },
  { id:'g6-looper',        name:'Loop Starter',             icon:'↺',  description:'Complete M3 — Loops & Repetition',            xp:75,   check:(m)=>isMastered(m,'g6-loops') },
  { id:'g6-animator',      name:'Animator',                 icon:'▶',  description:'Complete M4 — Animation & Movement',          xp:100,  check:(m)=>isMastered(m,'g6-animation') },
  { id:'g6-pattern-mk',    name:'Pattern Maker',            icon:'⊞',  description:'Complete M5 — Patterns & Nested Loops',       xp:100,  check:(m)=>isMastered(m,'g6-patterns') },
  { id:'g6-var-wizard',    name:'Variable Wizard',          icon:'◉',  description:'Complete M6 — Color & Variables',             xp:100,  check:(m)=>isMastered(m,'g6-color-vars') },
  { id:'g6-chaos',         name:'Chaos Artist',             icon:'⁈',  description:'Complete M7 — Randomness',                    xp:100,  check:(m)=>isMastered(m,'g6-random') },
  { id:'g6-bug-sq',        name:'Bug Squasher',             icon:'⊘',  description:'Complete M8 — Debugging & Fixing',            xp:100,  check:(m)=>isMastered(m,'g6-debug') },
  { id:'g6-storyteller',   name:'Storyteller',              icon:'⬡',  description:'Complete M9 — Storytelling with Code',        xp:150,  check:(m)=>isMastered(m,'g6-story') },
  { id:'g6-graduate',      name:'Year 6 Graduate',          icon:'★',  description:'Complete the Grade 6 Year Capstone',          xp:500,  check:(m)=>isMastered(m,'g6-capstone') },
  { id:'pathway-artist',   name:"The Artist",               icon:'◉',  description:"Complete the Artist's Toolkit pathway",       xp:400,  check:(m)=>pathwayComplete(m,'path-artist') },

  // ── Grade 7 — Game Maker ─────────────────────────────────────────────────
  { id:'g7-var-keeper',    name:'Variable Keeper',          icon:'▣',  description:'Complete M1 — Variables & State',              xp:50,   check:(m)=>isMastered(m,'g7-variables') },
  { id:'g7-logic-gate',    name:'Logic Gate',               icon:'⑂',  description:'Complete M2 — Conditionals',                   xp:75,   check:(m)=>isMastered(m,'g7-conditionals') },
  { id:'g7-fn-builder',    name:'Function Builder',         icon:'ƒ',  description:'Complete M3 — Functions',                      xp:75,   check:(m)=>isMastered(m,'g7-functions') },
  { id:'g7-key-handler',   name:'Key Handler',              icon:'◁',  description:'Complete M4 — Keyboard Input',                 xp:100,  check:(m)=>isMastered(m,'g7-keyboard') },
  { id:'g7-mouse-master',  name:'Mouse Master',             icon:'◉',  description:'Complete M5 — Mouse & Click Events',           xp:100,  check:(m)=>isMastered(m,'g7-mouse') },
  { id:'g7-collision-exp', name:'Collision Expert',         icon:'⊛',  description:'Complete M6 — Collision Detection',            xp:125,  check:(m)=>isMastered(m,'g7-collision') },
  { id:'g7-game-arch',     name:'Game Architect',           icon:'⊕',  description:'Complete M7 — Score, Lives & Game State',      xp:125,  check:(m)=>isMastered(m,'g7-gamestate') },
  { id:'g7-designer',      name:'Game Designer',            icon:'◈',  description:'Complete M8 — Designing a Game',               xp:150,  check:(m)=>isMastered(m,'g7-design') },
  { id:'g7-str-wizard',    name:'String Wizard',            icon:'⌘',  description:'Complete M9 — Strings & Text',                 xp:150,  check:(m)=>isMastered(m,'g7-strings') },
  { id:'g7-graduate',      name:'Year 7 Graduate',          icon:'★',  description:'Complete the Grade 7 Year Capstone',           xp:500,  check:(m)=>isMastered(m,'g7-capstone') },
  { id:'pathway-gamemaker',name:'The Game Maker',           icon:'◎',  description:'Complete the Game Maker pathway',              xp:350,  check:(m)=>pathwayComplete(m,'path-gamemaker') },

  // ── Grade 8 — Systems Builder ────────────────────────────────────────────
  { id:'function-forge',   name:'Function Forge',           icon:'ƒ',  description:'Master Functions & Parameters',              xp:150,  check:(m)=>isMastered(m,'functions-params') },
  { id:'data-wizard',      name:'Data Wizard',              icon:'≡',  description:'Master Lists & Arrays',                      xp:150,  check:(m)=>isMastered(m,'lists-data') },
  { id:'pathway-systems',  name:'Systems Builder',          icon:'⊞',  description:'Complete the Systems Builder pathway',       xp:400,  check:(m)=>pathwayComplete(m,'path-systems') },

  // ── Theory / IGCSE ───────────────────────────────────────────────────────
  { id:'binary-beast',     name:'Binary Beast',             icon:'⚫', description:'Master all core number system concepts',        xp:200,  check:(m)=>['binary-intro','binary-to-decimal','decimal-to-binary','binary-addition','hex-intro'].every(id=>isMastered(m,id)) },
  { id:'logic-wizard',     name:'Logic Wizard',             icon:'🔮', description:'Master Boolean Algebra',                       xp:150,  check:(m)=>isMastered(m,'boolean-algebra') },
  { id:'sort-master',      name:'Sort It Out',              icon:'📊', description:'Master all three sorting algorithms',          xp:200,  check:(m)=>['sort-bubble','sort-insertion','sort-merge'].every(id=>isMastered(m,id)) },
  { id:'search-master',    name:'Search Expert',            icon:'🔍', description:'Master both search algorithms',                xp:150,  check:(m)=>['search-linear','search-binary'].every(id=>isMastered(m,id)) },
  { id:'first-python',     name:'Pythonista',               icon:'🐍', description:'Master Python Basics',                         xp:100,  check:(m)=>isMastered(m,'python-intro') },
  { id:'web-builder',      name:'Web Builder',              icon:'🌍', description:'Master HTML & CSS Basics',                     xp:100,  check:(m)=>isMastered(m,'html-css-basics') },
  { id:'flowchart-ace',    name:'Flowchart Ace',            icon:'📊', description:'Master Flowchart Basics',                      xp:75,   check:(m)=>isMastered(m,'flowchart-basics') },
  { id:'pathway-visual',   name:'Visual Thinker',           icon:'🧱', description:'Complete the Visual Coder pathway',           xp:300,  check:(m)=>pathwayComplete(m,'path-visual') },
  { id:'pathway-numbers',  name:'Number Nerd',              icon:'🔢', description:'Complete the Number Systems pathway',         xp:300,  check:(m)=>pathwayComplete(m,'path-numbers') },
]

// ── Graph utility functions ───────────────────────────────────────────────────

/** Look up a concept by id. Returns undefined if not found. */
export function conceptById(id: string): Concept | undefined {
  return CONCEPTS.find(c => c.id === id)
}

// ── Grade helpers ─────────────────────────────────────────────────────────────

/** Map a StageId string to the highest grade number accessible. */
export function stageToGrade(stage: string): number {
  const map: Record<string, number> = {
    grade6:   6,
    grade7:   7,
    grade8:   8,
    grade9:   9,
    igcse:    10,   // legacy — maps to same content as igcse_y1
    igcse_y1: 10,
    igcse_y2: 11,
    as_a:     12,   // legacy — maps to same content as as_level
    as_level: 12,
    a_level:  13,
  }
  return map[stage] ?? 13
}

/**
 * All concepts visible to a student at this grade.
 *
 * A concept tagged with a specific `gradeN` (its own dedicated, self-contained
 * curriculum — e.g. Grade 6's Creator Quest, Grade 8's rehomed Systems Builder
 * challenges) is exclusive to that grade: a Grade 9 student has already moved
 * past Grade 6/7/8's own map and shouldn't see their concepts resurface here.
 * Concepts with no gradeN tag are the older shared foundational pool (pseudocode,
 * search/sort, etc.) meant to build up cumulatively from their gradeMin onward.
 */
export function conceptsForGrade(grade: number): Concept[] {
  return CONCEPTS.filter(c => {
    const gradeTag = c.tags.find(t => /^grade[6-9]$/.test(t))
    if (gradeTag) return gradeTag === `grade${grade}`
    return (c.gradeMin ?? 0) <= grade
  })
}

/** Parse a pathway's `tier` string (e.g. "Grade 6", "Grade 9–10", "Grade 10–AS Level")
 *  into an inclusive [minGrade, maxGrade] range. */
function tierRange(tier: string | undefined): [number, number] {
  if (!tier) return [6, 6]
  const nums = tier.match(/\d+/g)?.map(Number) ?? []
  const min = nums[0] ?? 6
  if (nums.length >= 2) return [min, nums[1]]
  if (/AS Level/.test(tier)) return [min, 12]
  if (/A Level/.test(tier))  return [min, 13]
  return [min, min]
}

/**
 * All pathways visible to a student at this grade — inclusive of the pathway's
 * full tier range, not just "at or below" the tier's starting grade (which
 * previously let e.g. a Grade-6-only pathway leak into every higher grade).
 */
export function pathwaysForGrade(grade: number): typeof PATHWAYS {
  return PATHWAYS.filter(p => {
    const [min, max] = tierRange(p.tier)
    return grade >= min && grade <= max
  })
}

/** All concepts that directly depend on the given concept id. */
export function dependents(id: string): Concept[] {
  return CONCEPTS.filter(c => c.prerequisites.includes(id))
}

/** True if all prerequisites of conceptId are in the given Set (practicing or mastered). */
export function prereqsMet(conceptId: string, practicingOrMastered: Set<string>): boolean {
  const c = conceptById(conceptId)
  if (!c) return false
  return c.prerequisites.every(p => practicingOrMastered.has(p))
}

/**
 * Compute SVG layout positions for all concepts.
 * Returns a Map: conceptId → { x, y }
 */
export function computeLayout(svgW: number, svgH: number): Map<string, { x: number; y: number }> {
  const tierSpacing = svgH / 11
  const positions   = new Map<string, { x: number; y: number }>()
  const byTier: Record<number, Concept[]> = {}

  CONCEPTS.forEach(c => {
    ;(byTier[c.tier] ??= []).push(c)
  })

  Object.entries(byTier).forEach(([tier, concepts]) => {
    const sorted = [...concepts].sort((a, b) => a.xGroup - b.xGroup)
    const count  = sorted.length
    sorted.forEach((c, i) => {
      const x = svgW * (i + 0.5) / count
      const y = 60 + Number(tier) * tierSpacing
      positions.set(c.id, { x, y })
    })
  })

  return positions
}

// ── Lookup maps (fast O(1) access) ────────────────────────────────────────────

/** Map from concept id → Concept */
export const CONCEPT_MAP = new Map(CONCEPTS.map(c => [c.id, c]))

/** Map from pathway id → Pathway */
export const PATHWAY_MAP = new Map(PATHWAYS.map(p => [p.id, p]))

/** Map from achievement id → Achievement */
export const ACHIEVEMENT_MAP = new Map(ACHIEVEMENTS.map(a => [a.id, a]))
