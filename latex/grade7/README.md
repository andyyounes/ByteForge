# Grade 7 — Teacher Presentations (LaTeX/Beamer)

One Beamer deck per Grade 7 chapter (26 total), meant to be presented by
the teacher for ~8-10 minutes before students open `grade7.html` and start
the hands-on practice. This is a teacher-only tool — none of this content
(images, real-world examples, discovery prompts) is duplicated into the
student-facing app.

Generated from `scripts/build-grade7-latex.mjs`. To change content, edit
that script's `DECKS` object and re-run:

```
node scripts/build-grade7-latex.mjs
```

The 26 chapters, in teaching order: `cb1`-`cb6` (Computer Basics / Digital
Citizenship — added when the platform's curriculum grew this unit),
`st1`-`st5` (Story Studio), `sc1`-`sc5` (Block Arcade), `g1`-`g10` (Game
Maker proper — note `g7w`/`g9w`, not `g7`/`g9`, matching the ids used in
`grade7.html` itself).

## Compiling

**No LaTeX distribution is installed in the dev environment these files
were written in** (no `pdflatex`/`xelatex`/`latexmk`) — these `.tex` files
have been checked for balanced `\begin`/`\end` pairs, balanced braces, and
balanced `$...$` math delimiters, but they have **not** been compiled to
PDF here. Compile with:

- **Overleaf** (easiest, no install): create a new project, upload a
  `.tex` file plus the `images/` folder alongside it, hit Recompile.
- **Local TeX install**: [MiKTeX](https://miktex.org/) (Windows) or
  [TeX Live](https://tug.org/texlive/). From this folder:
  ```
  latexmk -pdf st1.tex
  ```
  or, without latexmk:
  ```
  pdflatex st1.tex
  pdflatex st1.tex   # run twice — Beamer needs a second pass for navigation
  ```

Each chapter compiles independently. Files reference images as
`images/...`, so keep `images/` alongside the `.tex` files.

## Deck structure (every chapter, same shape)

1. Title slide
2. Today's Plan — the stages students will complete, plus the BOSS
3. One slide per key concept, **as real bullet points** (`itemize`), not
   paragraphs — worked examples (where one exists) fold in as an extra
   bullet on the SAME slide for real added depth, rather than a separate
   thin frame. Many concepts also include a **TikZ diagram** (coordinate
   grids, state machines, function-call diagrams, distance/Pythagoras,
   traffic-light branches, etc.).
4. **Real-World Examples** — a bullet list of concrete, everyday analogies
   to open discussion, including real Minecraft ties where they genuinely
   fit (F3 coordinates, the `/function` command, mob AI chase/patrol,
   redstone logic gates, hunger/health bars, crafting-recipe parameters).
5. **Image** (14 of 26 chapters) — a real, downloaded, verified, credited
   photo (Wikimedia Commons) — see "Images, not videos" below. No
   "suggested video" slide anywhere in these decks.
6. **Let Them Discover** — one or more open-ended prompts/mini-activities
   for the class to talk through before touching the platform (some
   chapters — G1, G4, G8, st1, st5 — spread 2-3 across the deck).
7. Your Turn — hands off to the real hands-on practice in the map

## Colour scheme (bright, per arc of the course)

- **Story Studio** (`st*`): playful purple (`violet!70!purple`)
- **Block Arcade** (`sc*`): arcade orange (`orange!85!red`)
- **Game Maker proper** (`g*`): bright blue (`blue!70!cyan`)

Each `.tex` file picks its colour automatically from its id prefix
(`sectionFor()` in the generator) — title bar, frame titles, block
colours, and triangle-style bullet markers all pick up the arc's accent,
so each arc visually reads as its own "world" on top of Beamer's Madrid
layout, matching Grade 9's per-section theme.

## Images, not videos

Per explicit instruction, there is no "suggested video" slide anywhere in
these decks. 14 of the 26 chapters instead have a real, downloaded,
verified, credited image (Wikimedia Commons) — see `images/CREDITS.md` for
the full author/license table. `cb4` reuses Grade 8's already-credited
`padlock.jpg`. The other 12 chapters (`cb1`, `cb2`, `cb3`, `cb5`, `cb6`,
`st5`, `sc1`, `sc5`, `g1`, `g2`, `g9w`, `g10`) rely on their existing TikZ
diagram, judgment-call content, or (for `g1`) the live coordinate-cursor
tool instead of a forced, weakly-fitting photo.

Every image was verified before use: fetched via Wikimedia's
`Special:FilePath` redirect (confirms the file genuinely exists), checked
with `file` for a real image signature (not an HTML error page — this
caught a transient Wikimedia rate-limit on the first attempt, fixed by
retrying with a descriptive User-Agent header), and viewed directly to
confirm the content actually matches the topic (this caught one real
mismatch: `CSS_Logo.png` turned out to be an unrelated "Creative Storage
Solutions" company logo, not the CSS web-language logo — swapped for the
correct `CSS-Logo.png`).

## Live companion tool: the coordinate cursor

`public/lessons/grade7-coord-cursor.html` is a small standalone page for
G1 (Sprite Start) — project it and move the mouse over the grid for a live
(x, y) readout, the same 480x260 canvas and (20,20)-margined corners the
real challenges use. It answers "how do I even know where I am?" with a
genuinely live demo rather than a static diagram, since that's inherently
interactive and can't live inside a compiled PDF. Referenced directly from
`g1.tex`'s third discovery slide.

## Diagrams need not be pixel-perfect to trust blindly

Every `.tex` file here has been checked for balanced `\begin`/`\end` pairs,
balanced braces, and balanced `$...$` math delimiters — but since there's no
local LaTeX compiler in this environment, the TikZ diagrams have NOT been
visually verified by actually rendering them. If a diagram looks wrong or
overlaps oddly once you compile, that's expected as a possibility — nudge
the coordinates in `scripts/build-grade7-latex.mjs` and regenerate rather
than hand-editing the generated `.tex` files (they'll be overwritten next
run).
