# Grade 7 — Teacher Presentations (LaTeX/Beamer)

One short presentation per LESSON (not per week) across all 20 Game Maker
chapters — meant to be presented by the teacher for a few minutes before
students open the platform and start that specific day's hands-on practice
in `grade7.html`. This is a teacher-only tool — none of this content
(images, real-world examples, discovery prompts) is duplicated into the
student-facing app.

Generated from `scripts/build-grade7-latex.mjs`. To change content, edit
that script's `DECKS` object and re-run:

```
node scripts/build-grade7-latex.mjs
```

## Folder layout

Each chapter is its own subfolder, one file per lesson:

```
latex/grade7/
  st1/
    lesson0-overview.tex   <- the whole week: plan, real-world example, image, discovery prompts
    lesson1.tex            <- Front Page
    lesson2.tex            <- Say More
    lesson3.tex            <- Chapter One
    lesson4.tex            <- Read More
    lesson5.tex            <- Call to Action
    lessonBoss.tex         <- BOSS: Ship the Front Page
  st2/
    ...
  images/                  <- shared image files + CREDITS.md (see below)
```

**Which file do I teach today?** Open `lesson0-overview.tex` once at the
start of the week to see the whole plan and set up the real-world/image/
discovery framing — then, each subsequent lesson, open just that day's
`lessonN.tex` (or `lessonBoss.tex` for the boss day). Each lesson file is a
short, standalone deck: a title slide, the concept for that specific stage
(with a diagram and/or worked example where one exists), and a closing
slide sending students to that SPECIFIC challenge in the platform.

The 20 chapters, in teaching order: `st1`-`st5` (Story Studio), `sc1`-`sc5`
(Block Arcade), `g1`-`g10` (Game Maker proper — note `g7w`/`g9w`, not
`g7`/`g9`, matching the ids used in `grade7.html` itself).

## Compiling

**No LaTeX distribution is installed in the dev environment these files
were written in** (no `pdflatex`/`xelatex`/`latexmk`) — these `.tex` files
have been checked for balanced `\begin`/`\end` pairs, balanced braces, and
balanced `$...$` math delimiters, but they have **not** been compiled to
PDF here. Compile with:

- **Overleaf** (easiest, no install): create a new project, upload a
  chapter's whole folder (or just the one lesson file you need plus
  `../images/` if that lesson has one), hit Recompile.
- **Local TeX install**: [MiKTeX](https://miktex.org/) (Windows) or
  [TeX Live](https://tug.org/texlive/). From inside a chapter folder
  (e.g. `latex/grade7/st1/`):
  ```
  latexmk -pdf lesson1.tex
  ```
  or, without latexmk:
  ```
  pdflatex lesson1.tex
  pdflatex lesson1.tex   # run twice — Beamer needs a second pass for navigation
  ```
  Lesson files reference images as `../images/...`, so keep each chapter
  folder's relative position to `images/` intact (don't move a lone
  `lessonN.tex` file somewhere else without bringing `../images/` along,
  or without fixing that path).

## Lesson content, per file

- **`lesson0-overview.tex`** (once, at the start of the week): This Week's
  Plan (lesson-by-lesson list + the boss), a Real-World Example, an Image
  (where one exists — see below), one or more Let Them Discover prompts,
  and a list of which file to open on which day.
- **`lessonN.tex`** / **`lessonBoss.tex`** (one per teaching day): a title
  slide naming that lesson and its specific stage, the concept explanation
  (many now include a **TikZ diagram** — coordinate grids, state machines,
  function-call diagrams, distance/Pythagoras, traffic-light branches,
  etc.), a **Worked Example** on its own following slide where one exists
  (kept on a separate frame from the diagram deliberately — no local LaTeX
  compiler here to catch overflow), and a closing slide sending students to
  that SPECIFIC challenge (not just "the chapter").

## Images, not videos

Per explicit instruction, there is no "suggested video" slide anywhere in
these decks. 13 of the 20 chapters instead have a real, downloaded,
verified, credited image (Wikimedia Commons) in their `lesson0-overview.tex`
— see `images/CREDITS.md` for the full author/license table. The other 7
chapters (`st5`, `sc1`, `sc5`, `g1`, `g2`, `g9w`, `g10`) rely on their
existing TikZ diagram or (for `g1`) the live coordinate-cursor tool instead
of a forced, weakly-fitting photo.

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
genuinely live demo rather than a static image, since that's inherently
interactive and can't live inside a compiled PDF. Referenced from `g1`'s
`lesson0-overview.tex` discovery slide.

## Diagrams need not be pixel-perfect to trust blindly

Since there's no local LaTeX compiler in this environment, the TikZ
diagrams have NOT been visually verified by actually rendering them. If a
diagram looks wrong or overlaps oddly once you compile, that's expected as
a possibility — nudge the coordinates in `scripts/build-grade7-latex.mjs`
and regenerate rather than hand-editing the generated `.tex` files (they'll
be overwritten next run).
