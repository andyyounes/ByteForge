# Grade 8 — Teacher Presentations (LaTeX/Beamer)

One Beamer deck per App Builder chapter (15 total), meant to be presented by
the teacher for ~8-10 minutes before students open `grade8.html` and start
the hands-on practice. Same pattern as `../grade7/README.md` — teacher-only,
no content duplicated into the student-facing app.

Generated from `scripts/build-grade8-latex.mjs`. To change content, edit
that script's `DECKS` object and re-run:

```
node scripts/build-grade8-latex.mjs
```

The 15 chapters, in teaching order: `ws1`-`ws5` (Web Story — Semester 1,
real JS text code) then `m1`-`m10` (App Builder proper — real Python via
Pyodide; note `m9w`, not `m9`, matching the id used in `grade8.html`).

## Compiling

**No LaTeX distribution is installed in the dev environment these files
were written in** — these `.tex` files have been checked for balanced
`\begin`/`\end` pairs, balanced braces, and balanced `$...$` math
delimiters, but they have **not** been compiled to PDF here. Compile with
Overleaf (upload a `.tex` file plus the `images/` folder alongside it) or a
local TeX install — see `../grade7/README.md` for the full instructions
(identical process, different folder).

## Deck structure (every chapter, same shape as Grade 7)

1. Title slide
2. Today's Plan
3. One slide per key concept, **as real bullet points** (`itemize`), kept
   consistent with `CHALLENGE_LESSON` in `grade8.html` — worked examples
   fold in as an extra bullet on the same slide, some with a TikZ diagram
   (array-as-boxes, function-call diagrams, if/else branches, binary-search
   array, a 3-state machine).
4. Real-World Examples — a bullet list, including real Minecraft ties
   where they genuinely fit (the `/function` command, the enchanting
   table's real Caesar-style letter substitution, inventory sorting,
   world-save files as binary data).
5. Image (9 of 15 chapters) — a real, downloaded, verified, credited photo.
   No "suggested video" slide anywhere, same as Grade 7.
6. Let Them Discover — one or more open-ended prompts.
7. Your Turn.

## Colour scheme (bright, per arc of the course)

- **Web Story** (`ws*`): warm orange (`orange!85!red`)
- **App Builder proper** (`m*`): green (`green!55!teal`, matching Builder
  City's own map accent colour)

Same automatic per-id-prefix theming as Grade 7 (`sectionFor()` in the
generator) — title bar, frame titles, block colours, and triangle bullet
markers all pick up the arc's accent.

## Images

See `images/CREDITS.md` for the full author/license table. 3 files
(`js.png`, `gear.jpg`, `traffic.jpg`) are copies of the same
already-verified Grade 7 images, reused because they genuinely fit here
too. The other 5 (`python.png`, `floppy.jpg`, `circuit.jpg`, `padlock.jpg`,
`atm.jpg`) were newly sourced for Grade 8 and verified the same way: fetched
via Wikimedia's `Special:FilePath`, checked with `file` for a genuine image
signature, and viewed directly to confirm the content matches the topic.
6 of 15 chapters (`ws4`, `ws5`, `m4`, `m5`, `m6`, `m10`) have no image —
no well-fitting real photo was sourced for them, so they rely on their
diagram/discovery content instead of a forced, weakly-fitting one.

## Diagrams need not be pixel-perfect to trust blindly

Same caveat as Grade 7: no local LaTeX compiler here, so the TikZ diagrams
(including `m6`'s `\foreach`-driven binary-search array, which needs
`pgffor` — loaded automatically by `tikz`, no extra package required) have
NOT been visually verified by actually rendering them. Nudge coordinates in
`scripts/build-grade8-latex.mjs` and regenerate rather than hand-editing
the generated `.tex` files.
