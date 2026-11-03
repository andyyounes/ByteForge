# ByteForge

ByteForge is an interactive ICT/Computer Science learning platform for school students, spanning Grade 6 through A-Level. Students work through story-driven curricula with real code editors (Blockly, Python via Pyodide, and live HTML/CSS/JS), earn XP, and unlock new missions/worlds as they go. Teachers get their own accounts to manage classes.

## Curriculum overview

| Grade | Theme | Format |
|---|---|---|
| Grade 6 | "The Creator Quest" | Blockly, 12 worlds |
| Grade 7 | "The Game Maker" | Blockly, 10 worlds |
| Grade 8 | "The App Builder" | 3 semesters — real HTML/CSS/JS portfolio, Python text adventure, Python combat game |
| Grade 9 | "The Deep Diver" | Mission-based Python IDE, 76 missions across 24 chapters |
| IGCSE (Y1/Y2) | 0478 syllabus | Python missions and challenges |
| AS/A Level | 9618 syllabus | Theory, pseudocode, SQL, CPU pipeline, algorithms labs |

Each grade lives as a self-contained page under [public/lessons/](public/lessons/) (e.g. `grade8.html`), with its content defined in a `MODULES`/`MISSIONS` array and rendered by shared engine code in the same file.

## Desktop app

ByteForge is also packaged as a thin desktop shell around the live site — a
real app with its own icon, no browser tab or URL to remember. It still
needs an internet connection (it just opens the hosted site in its own
window); it does **not** bundle the backend, since that would mean shipping
Supabase's service-role key — full database access — inside every install.

Each launch starts logged out rather than remembering the last login, since
several students typically share one Windows account on a lab machine.

- **Download:** see the [Releases](../../releases) page for the latest
  Windows build.
- **Build it yourself:**
  ```bash
  npm run electron:dev          # try it locally
  npm run electron:build:win    # produce a Windows installer/app
  npm run electron:build:mac    # must be run on an actual Mac
  ```
- Source lives in [electron/](electron/) — `main.js` is the whole app; it
  just points a `BrowserWindow` at the deployed URL.

## Tech stack

- **Framework:** Next.js 15 / React 19 / TypeScript
- **Backend:** Supabase (auth + Postgres) for accounts, classes, and progress
- **In-browser Python:** Pyodide (no server-side execution)
- **Styling:** Tailwind CSS
- **AI features:** Groq / Google Generative AI SDKs

## Getting started

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

You'll need a `.env.local` with Supabase and any AI provider keys the app expects — see the code under [app/](app/) and [lib/](lib/) for the exact variable names in use.

## Testing

Each grade's challenge logic has an automated regression suite that checks every exercise's pass/fail predicate is neither vacuous (an empty answer shouldn't pass) nor too loose (a wrong answer shouldn't pass, a right one should).

```bash
npm run verify   # run every lesson's regression suite
npm test         # full test suite
```

See `scripts/test-*.mjs` for the per-grade suites.

## Project structure

```
app/                 Next.js routes (dashboard, auth, teacher/student views)
public/lessons/      One self-contained HTML file per grade/course
lib/                 Shared concepts, Supabase client, utilities
scripts/             Regression test suites (one per grade/course)
electron/            Desktop app shell (see "Desktop app" above)
```
