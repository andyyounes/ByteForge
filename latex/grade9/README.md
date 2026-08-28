# Grade 9 — Teacher Presentations (LaTeX/Beamer)

One Beamer deck per Grade 9 chapter (24 total — every entry in the `TIERS`
array in `grade9-missions.html`: Foundations 1-7 plus their capstones, then
Tier 1-3 of Phase 1, all of Phase 2, and all of Phase 3), meant to be
presented by the teacher before students open `grade9-missions.html` and
fly the missions themselves. Same teacher-only pattern as
`../grade7/README.md` and `../grade8/README.md`, with three deliberate
differences per direct feedback:

1. **Deeper** — more concept coverage per chapter than Grade 7/8 got.
2. **Bullet points, not paragraphs** — every explanation slide is a real
   `itemize` list, not a wall of prose.
3. **Colorful and kid-friendly** — a different bright accent colour per
   major section of the course (see below), and several chapters carry
   TWO real-world images instead of one.

Generated from `scripts/build-grade9-latex.mjs`. To change content, edit
that script's `DECKS` object and re-run:

```
node scripts/build-grade9-latex.mjs
```

## The 24 chapters, in teaching order

`f1` (What Is a Computer?) → `f2` (Binary, unplugged) → `f3` (Your First
Code) → `f3boss` → `f4` (Binary in Code & Logic) → `f5` (Images) →
`f45boss` → `f6` (Flowcharts) → `f7` (Flight Computer) → `f7boss` → `t1`
(Sequencing) → `t2` (Loops) → `t3` (Signals & Decisions) → `p1boss` →
`p2tut` (Battles tutorial) → `p2fn` (Functions Required) → `p2state`
(State Tracking) → `p2multi` (Multiple Enemies) → `p2adapt` (Adaptive AI)
→ `p2boss` → `p3read` (Read & Report) → `p3decide` (One Decision) →
`p3strategy` (Full Strategy) → `p3boss` (Phase 3 Capstone).

File names are short codes, not the exact TIERS ids — check each `.tex`
file's `\title{}` (or this list) to confirm which chapter is which.

## Colour scheme (bright, per section)

- **Foundations 1-7 + their capstones**: hot pink/red (`magenta!70!red`)
- **Phase 1 (Tiers 1-3 + capstone)**: bright blue (`blue!70!cyan`)
- **Phase 2 (battles)**: fiery red-orange (`red!80!orange`)
- **Phase 3 (data)**: teal-green (`green!60!teal`)

Each `.tex` file sets its own `\setbeamercolor` block based on which
section it belongs to (`preambleFor()` in the generator) — title bar,
frame title bar, block colours, and bullet markers (triangle-style) all
pick up the accent colour, so each section visually reads as its own
"world" on top of the standard Beamer Madrid layout.

## Compiling

**No LaTeX distribution is installed in the dev environment these files
were written in** — checked for balanced `\begin`/`\end` pairs, balanced
braces, and balanced `$...$` math delimiters, but NOT compiled to PDF
here. Compile with Overleaf (upload a `.tex` file plus the `images/`
folder alongside it) or a local TeX install — see `../grade7/README.md`
for full instructions (identical process, different folder).

## Deck structure (every chapter, same shape)

1. Title slide
2. Today's Missions — the real mission names for this chapter
3. Several concept slides, EACH a bullet list (not a paragraph) covering
   the chapter's ideas in real depth
4. Real-World Examples — a bullet list of concrete real-world ties
   (several chapters get 2, not just 1)
5. Image(s) — 9 of 24 chapters have at least one real, downloaded,
   verified, credited photo; a couple have two. No "suggested video"
   slide anywhere, same as Grade 7/8.
6. Let Them Discover — one or more open-ended prompts
7. Your Turn

## Images

See `images/CREDITS.md` for the full author/license table. 3 files are
reused from the already-verified Grade 7/8 image sets (traffic lights,
circuit board, keyboard); the other 6 (a real CPU, playing cards, a camera
sensor, a Space Shuttle launch, an Atari joystick, a bar chart) were newly
sourced for Grade 9 and verified the same way: fetched via Wikimedia's
`Special:FilePath`, checked with `file` for a genuine image signature, and
viewed directly to confirm the content matches the topic.

## Diagrams need not be pixel-perfect to trust blindly

Same caveat as Grade 7/8: no local LaTeX compiler here. Nudge coordinates
in `scripts/build-grade9-latex.mjs` and regenerate rather than hand-editing
the generated `.tex` files.
