# ByteForge — Ideas not yet executed

A holding pen for things discussed but not built, so they don't get lost
between sessions. Not a commitment or a schedule — just a record of what's
been considered, why, and what it would actually take. When one of these
gets picked up for real, it should move into its own `TODO-*.md` (see
`TODO.md`, `TODO-GRADE7.md`, `TODO-OFFLINE.md` for the pattern) rather than
being expanded in place here.

## RoboLab — a robotics API + track for teaching kids robotics

Raised 2026-11-09. The newest idea here, and the most different from
everything else on the platform — every existing grade/track runs entirely
in the browser against a canvas or a text/Blockly editor; this one is about
*physical or simulated* robots, which is a genuinely different problem.

What it would likely need:
- **A simulated robot first, not real hardware.** No class has real robots
  on hand by default, and "robotics" taught through a browser can't drive
  an actual motor. The realistic shape is a canvas-based robot simulator —
  same idea as Grade 7's Block Arcade/Game Maker standing in for a real
  game engine with physics on a `<canvas>` — a simulated rover/arm with
  sensors (distance, line-following, bump) a student programs against.
- **"RoboLab API"** — a small, deliberately simplified command/sensor API
  (`robot.forward(cm)`, `robot.turn(deg)`, `robot.readDistance()`, etc.)
  that a student's code (Blockly blocks for younger grades, real
  Python/JS for older ones) calls against the simulator. This is the
  actual design work: picking an API shape realistic enough to resemble
  real robotics (and ideally map cleanly onto a real framework's
  concepts later) without drowning a beginner in ROS2's actual
  complexity.
- **ROS2 concepts, not a real ROS2 runtime.** A real ROS2 node graph
  (publishers/subscribers/services) can't run in a browser. The honest
  version is teaching the IDEAS of pub/sub messaging and nodes through a
  simplified simulated equivalent — e.g. a toy message bus the student's
  simulated robot uses — not "real" ROS2, and that should be stated
  plainly to students/parents rather than implied.
- **Physical hardware as a stretch goal, not the starting point** — if
  this ever gets real traction, a WebSerial/WebUSB bridge to something
  like a Raspberry Pi Pico or an actual small rover could let the exact
  same lessons drive a real machine, but that's a separate, much later
  phase with real cost (buying hardware for a class) and isn't needed to
  ship something genuinely useful first.
- Fits the existing content pattern: a new grade-shaped HTML file (own
  `WORLDS`/`MODULES` array, own `lesson_key`), reusing `LessonSaves`,
  `quest-map.js` unlocking, XP, and the teacher progress panel for free
  — same reuse story as the "standalone tracks" idea below.

## Standalone skill tracks (not grade-gated)

Raised 2026-11-08. Separate courses outside the Grade 6-9 / IGCSE / AS-A
Level sequence — HTML/CSS/JS from scratch, AI, Pandas, Python, LLMs,
Robotics (see RoboLab above), ROS2 — each starting from zero, for anyone,
not tied to a specific grade.

- Technically cheap to START: the lesson engine (Blockly + real code
  editor + quiz + chat stages, generic `lesson_saves` table, sequential
  unlock via `quest-map.js`) already generalizes — a new track is "a new
  file shaped like an existing grade's," which gets XP/progress/teacher
  panels for free.
- The real cost is curriculum authoring, not engineering — each track is
  roughly a from-scratch Grade-8-sized content project. Doing all of them
  at once isn't realistic; pick one pilot.
- Best pilot candidate: **HTML/CSS/JS from scratch** — reuses Grade 8's
  real code editor almost directly, lowest new-engine risk.
- Open question before building anything: is a track **teacher-assigned
  to a class** (today's model) or a **self-service elective** a student
  picks on their own? Changes the auth/enrollment shape more than it
  changes the lesson content itself. See the next idea — these two are
  related but not the same decision.

## Self-directed "Learning Path" catalog, by category

Raised 2026-11-08. Explicitly parked by the user ("not for now but it
would be a good track") — kept here for when it's picked back up, not
acted on.

- A catalog of courses grouped by category (Web Dev, AI/ML, Data,
  Robotics, etc.) that a student (or the user personally, as a learner)
  browses and enrolls in on their own — no teacher or class involved at
  all.
- This is a real architecture shift from today's platform: almost every
  existing surface (progress panels, stuck-points, teacher views) is
  gated by `classId` → a teacher owns a class → a class is assigned a
  grade/track. A self-directed path has none of that — it's personal to
  whoever picked it.
- No "explore/browse" page exists today; a student's dashboard currently
  only shows what their class was assigned. This needs a new student-
  facing surface, not just new content.
- Still-open question from the original discussion: is this **for
  students** (self-directed, alongside their normal class curriculum) or
  **for the platform owner personally**, as a separate learner account?
  Different builds depending on the answer.

## Rolling quiz-answer storage out to the remaining grades

Not really a "new idea" — concrete, scoped follow-up work from a shipped
feature (see the "Start storing quiz answers" / "Extend quiz-answer
storage to Grade 8" commits). Grade 7 and Grade 8 now record every quiz
attempt's actual given-vs-expected answer, not just pass/fail. Each other
grade has its **own** `checkQuiz()` implementation that needs the same
change applied individually:

- Grade 6
- Grade 9
- IGCSE Year 1 / Year 2
- AS Level / A Level

Each is a small, well-understood change (same shape as the Grade 7→8
port), just not yet done.

## Mac app code signing / notarization

Raised 2026-11-08, during the macOS desktop build work. The `.dmg` is
currently unsigned — macOS Gatekeeper shows an "unidentified developer"
warning on first open (workaround: right-click → Open, or allow it in
System Settings → Privacy & Security). Proper signing/notarization needs
a paid ($99/year) Apple Developer account. Worth doing only if the
Gatekeeper warning becomes a real adoption problem for actual users, not
preemptively.

## Offline Phase 2 — dashboard reachable with zero internet

Tracked in detail in `TODO-OFFLINE.md` (Phase 1 lesson-asset caching and
Phase 3 save-retry queue are done; Phase 2 is the one explicitly left
unstarted). Reaching the dashboard/login itself offline means loosening
`middleware.ts`'s Supabase auth check — the one piece of the offline work
with real security weight, which is why it's waiting on an explicit
decision rather than being built by default. See `TODO-OFFLINE.md` for
the actual phase breakdown; not duplicated here.
