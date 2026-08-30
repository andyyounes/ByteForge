# Grade 8 — Teacher Presentations (LaTeX/Beamer)

One Beamer deck per Grade 8 chapter (34 total), meant to be presented by
the teacher for ~8-10 minutes before students open `grade8.html` and start
the hands-on practice. Same pattern as `../grade7/README.md` — teacher-only,
no content duplicated into the student-facing app.

Generated from `scripts/build-grade8-latex.mjs`. To change content, edit
that script's `DECKS` object and re-run:

```
node scripts/build-grade8-latex.mjs
```

The 34 chapters, in teaching order, follow the current 3-semester rebuild:
`web0`-`web5` (Semester 1 — What Is a Website?, then real HTML/CSS/JS tags,
colors, a checkpoint, and the Portfolio project), `ws1`-`ws5` (Web Story —
the original real-JS arrays/objects/functions/localStorage/loop unit),
`py1`-`py5` and `adv` (Semester 2 — real Python variables, if/else, for
loops, while loops, lists, and the Text Adventure project), `m1`-`m10` plus
`cyber` (App Builder proper — the original real-Python-via-Pyodide unit;
note `m9w`, not `m9`, matching the id used in `grade8.html`), and `cc1`-`cc5`
plus `cc` (Semester 3, "Combat Coder" — health/attack, win/lose, the battle
loop, tracking a second character, a checkpoint, and the Combat Encounter
project).

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
5. Image (13 of 34 chapters) — a real, downloaded, verified, credited photo.
   No "suggested video" slide anywhere, same as Grade 7.
6. Let Them Discover — one or more open-ended prompts.
7. Your Turn.

## Colour scheme (bright, per arc of the course)

- **Web (Semester 1 + Web Story)** (`web*`/`ws*`): warm orange (`orange!85!red`)
- **Python (Semester 2)** (`py*`/`adv`): bright blue (`blue!65!cyan`)
- **App Builder proper** (`m*`): green (`green!55!teal`, matching Builder
  City's own map accent colour)
- **Cyber Defense** (`cyber`): serious red (`red!75!black`)
- **Combat Coder (Semester 3)** (`cc*`): crimson (`red!45!black`, distinct
  from Cyber Defense's red)

Same automatic per-id-prefix theming as Grade 7 (`sectionFor()` in the
generator) — title bar, frame titles, block colours, and triangle bullet
markers all pick up the arc's accent.

## Images

See `images/CREDITS.md` for the full author/license table. 4 files
(`js.png`, `gear.jpg`, `traffic.jpg`, `html5.png`) are copies of the same
already-verified Grade 7 images, reused because they genuinely fit here
too — `html5.png` newly copied over for `web1` (students' first real
`<h1>`/`<p>` tags — the same real HTML the logo already illustrates in
Grade 7). The other 5 (`python.png`, `floppy.jpg`, `circuit.jpg`,
`padlock.jpg`, `atm.jpg`) were newly sourced for Grade 8 and verified the
same way: fetched via Wikimedia's `Special:FilePath`, checked with `file`
for a genuine image signature, and viewed directly to confirm the content
matches the topic (`python.png`, already verified, is reused again for
`py1` — the first real Python chapter of Semester 2). 16 of the 18 new
Semester 1-3 chapters (`web0`, `web2`-`web5`, `py2`-`py5`, `adv`, `cc1`-`cc5`,
`cc`) have no image — no well-fitting real photo was sourced for them, so
they rely on their concept/diagram/discovery content instead of a forced,
weakly-fitting one, same discipline as the 6 pre-existing chapters without
one (`ws4`, `ws5`, `m4`, `m5`, `m6`, `m10`).

## Diagrams need not be pixel-perfect to trust blindly

Same caveat as Grade 7: no local LaTeX compiler here, so the TikZ diagrams
(including `m6`'s `\foreach`-driven binary-search array, which needs
`pgffor` — loaded automatically by `tikz`, no extra package required) have
NOT been visually verified by actually rendering them. Nudge coordinates in
`scripts/build-grade8-latex.mjs` and regenerate rather than hand-editing
the generated `.tex` files.
