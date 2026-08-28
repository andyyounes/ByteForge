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
   consistent with `CHALLENGE_LESSON` in `grade7.html`)
4. **Real-World Example** — a concrete, everyday analogy to open discussion
5. **Watch** — a suggested video *topic* to search for together, not a
   hardcoded link. A specific YouTube ID was deliberately NOT guessed here —
   an earlier Grade 9 video ID guessed from memory turned out to be broken,
   so pick and vet a real video yourselves before projecting it live.
6. **Let Them Discover** — an open-ended prompt/mini-activity for the class
   to talk through before touching the platform
7. Your Turn — hands off to the real hands-on practice in the map
