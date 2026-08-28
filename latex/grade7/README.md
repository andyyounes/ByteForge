# Grade 7 — Teacher Presentations (LaTeX/Beamer)

One Beamer deck per Game Maker chapter (20 total), meant to be **presented by
the teacher for ~8-10 minutes before students open the platform** and start
the hands-on practice in `grade7.html`. This is a teacher-only tool — none of
this content (videos, real-world examples, discovery prompts) is duplicated
into the student-facing app.

Generated from `scripts/build-grade7-latex.mjs`. To change content, edit that
script's `DECKS` object and re-run:

```
node scripts/build-grade7-latex.mjs
```

## Compiling

**No LaTeX distribution is installed in the dev environment these files were
written in** (no `pdflatex`/`xelatex`/`latexmk`) — these `.tex` files have
been checked for balanced `\begin`/`\end` pairs and correct character
escaping, but they have **not** been compiled to PDF here. Compile with:

- **Overleaf** (easiest, no install): create a new project, upload a `.tex`
  file, hit Recompile.
- **Local TeX install**: [MiKTeX](https://miktex.org/) (Windows) or
  [TeX Live](https://tug.org/texlive/). Then, from this folder:
  ```
  latexmk -pdf st1.tex
  ```
  or, without latexmk:
  ```
  pdflatex st1.tex
  pdflatex st1.tex   # run twice — Beamer needs a second pass for navigation
  ```

Each chapter compiles independently (`st1.tex`, `st2.tex`, ... `g10.tex` — 20
files, matching the 20 Game Maker chapters: Story Studio 1-5, Block Arcade
1-5, G1-G10).

## Deck structure (every chapter, same shape)

1. Title slide
2. Today's Plan — the stages students will complete, plus the BOSS
3. One slide per key concept (same explanations already taught in-app, kept
   consistent with `CHALLENGE_LESSON` in `grade7.html`) — many now include a
   **TikZ diagram** (coordinate grids, state machines, function call
   diagrams, distance/Pythagoras, traffic-light branches, etc.) and/or a
   **Worked Example** on its own following slide (one frame per idea, kept
   light on purpose — see the compiling note below on why).
4. **Real-World Example** — a concrete, everyday analogy to open discussion,
   including real Minecraft ties where they genuinely fit (F3 coordinates,
   the `/function` command, mob AI chase/patrol, redstone logic gates,
   hunger/health bars, crafting-recipe parameters, and more).
5. **Watch** — a suggested video *topic* to search for together, not a
   hardcoded link. A specific YouTube ID was deliberately NOT guessed here —
   an earlier Grade 9 video ID guessed from memory turned out to be broken,
   so pick and vet a real video yourselves before projecting it live.
6. **Let Them Discover** — one or more open-ended prompts/mini-activities for
   the class to talk through before touching the platform (some chapters —
   currently G1 — spread 2-3 across the deck instead of just one).
7. Your Turn — hands off to the real hands-on practice in the map

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
