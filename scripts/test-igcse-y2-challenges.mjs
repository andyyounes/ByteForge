// Verifies every IGCSE Y2 challenge's check(code, res) — unlike Y1 (a free-
// typed text answer per exercise) and Grade 8 (regex over Python source), Y2
// runs real Cambridge pseudocode through its own embedded Interpreter and
// checks res.output (matching AS/A-Level's Code Lab pattern). No hand-authored
// reference solutions exist for these yet (unlike test-al-lab.mjs's SOLUTIONS
// map), so this does the same zero-authoring test Grade 8 got: every
// challenge's own starter (given as an intentionally incomplete TODO stub)
// must NOT satisfy its own check() when actually run through the interpreter.
// Also confirms every starter runs without the interpreter throwing at all —
// a real student's first Run should never crash on an unmodified starter.
import { readFileSync } from 'fs'

const html = readFileSync('c:/Users/user/Downloads/ICT website/public/lessons/igcse-y2.html', 'utf8')
const s1 = html.indexOf('const KEYWORDS = new Set([')
const e1 = html.indexOf('CodeMirror.defineSimpleMode') // Interpreter class + its parseParams/splitArgs/etc.
                                                        // helpers all live before this; CodeMirror itself isn't
const Interpreter = new Function(html.slice(s1, e1) + '\nreturn Interpreter')()

const s2 = html.indexOf('const CHALLENGES=[')
const m = html.slice(s2).match(/\r?\n\]\r?\n/)
const ctx = html.slice(s2, s2 + m.index + m[0].indexOf(']') + 1)
const { CHALLENGES } = new Function(ctx + '\nreturn { CHALLENGES }')()

console.log(`Found ${CHALLENGES.length} IGCSE Y2 challenges.\n`)

let pass = 0, fail = 0, skipped = 0
for (const ch of CHALLENGES) {
  const label = `${ch.mod}/${ch.name}`
  // Only the (undefined-type) real pseudocode-writing challenges have a
  // starter that runs through the interpreter — 'lesson' (embedded book
  // pages), 'fill'/'identify' (plain-text answer, checked like IGCSE Y1's
  // ANSWERS pattern) and 'complete' challenges have no code/starter at all
  // and are validated by their own check(answerString) signature instead.
  if (!ch.starter) {
    // 'fill' / 'identify' / 'complete' challenges take a plain typed answer
    // string, checked directly by ch.check(ans) — no interpreter involved.
    // 'lesson' bubbles (embedded static pages) have no check() at all.
    if (typeof ch.check === 'function' && (ch.type === 'fill' || ch.type === 'identify' || ch.type === 'complete')) {
      let blankOk = false, junkOk = false
      try { blankOk = !ch.check('') } catch { blankOk = true /* throwing on blank is an acceptable rejection */ }
      // Deliberately not an English word/phrase (unlike IGCSE Y1's junk
      // string) — several fill-in checks here are loose substring regexes
      // (e.g. /finite|.../), and "definitely" itself contains "finite".
      try { junkOk = !ch.check('xqz9988774kwv') } catch { junkOk = true }
      if (blankOk && junkOk) { pass++; console.log(`✓ ${label} — correctly rejects blank and garbage answers`) }
      else {
        fail++
        console.log(`✗ ${label} — ${!blankOk ? 'a BLANK answer passes check()' : 'a nonsense answer passes check()'}`)
      }
    } else {
      skipped++
    }
    continue
  }
  let res
  try {
    res = new Interpreter().run(ch.starter.replace(/<-/g, '←'), [])
  } catch (e) {
    fail++
    console.log(`✗ ${label} — starter crashes the interpreter: ${e?.message ?? JSON.stringify(e)}`)
    continue
  }
  pass++
  console.log(`✓ ${label} — starter runs without crashing`)

  if (!ch.check(ch.starter, res)) { pass++; console.log(`✓ ${label} — starter TODO stub correctly does not pass yet`) }
  else { fail++; console.log(`✗ ${label} — starter code already satisfies check() before the student does anything`) }
}

// Regression coverage for the parseIf() single-line ELSE/THEN limitation
// found during the initial test-coverage push (docs/TODO.md) and since
// fixed via expandInlineIf(): inline trailing content after THEN/ELSE on
// the same physical line must actually run, not be silently dropped.
const inlineIfCases = [
  { label: 'inline THEN, no ELSE',           code: 'x ← 10\nIF x > 5 THEN OUTPUT "big"\nOUTPUT "done"',            expect: ['big', 'done'] },
  { label: 'inline ELSE after multi-line IF', code: 'x ← 2\nIF x > 5 THEN\n   OUTPUT "big"\nELSE OUTPUT "small"\nENDIF', expect: ['small'] },
  { label: 'fully inline IF/THEN/ELSE/ENDIF', code: 'x ← 2\nIF x > 5 THEN OUTPUT "big" ELSE OUTPUT "small" ENDIF',  expect: ['small'] },
  { label: 'fully inline, true branch + trailing code', code: 'x ← 10\nIF x > 5 THEN OUTPUT "big" ELSE OUTPUT "small" ENDIF\nOUTPUT "after"', expect: ['big', 'after'] },
  { label: 'inline IF nested inside a FOR loop', code: 'FOR i ← 1 TO 3\n  IF i = 2 THEN OUTPUT "two" ELSE OUTPUT i ENDIF\nNEXT i', expect: ['1', 'two', '3'] },
  { label: 'ELSE as a literal word inside a string is not mis-split', code: 'OUTPUT "please ELSE choose wisely"', expect: ['please ELSE choose wisely'] },
]
for (const { label, code, expect } of inlineIfCases) {
  try {
    const { output } = new Interpreter().run(code, [])
    if (JSON.stringify(output) === JSON.stringify(expect)) { pass++; console.log(`✓ inline-IF: ${label}`) }
    else { fail++; console.log(`✗ inline-IF: ${label} — expected ${JSON.stringify(expect)}, got ${JSON.stringify(output)}`) }
  } catch (e) {
    fail++
    console.log(`✗ inline-IF: ${label} — interpreter threw: ${e?.message ?? JSON.stringify(e)}`)
  }
}

// ── 2D arrays and file handling ──────────────────────────────────────────────
// Both were outright broken, and both are taught by challenges in this file:
//   * 2D DECLARE was never implemented (the regex is 1D-only), so the variable
//     became null and Challenge 1's OWN HINTS crashed with
//     "Cannot read properties of null (reading '_data')". The expression parser
//     already had a 2D read path keyed on _base2, but nothing ever set _base2.
//   * OPENFILE unconditionally reset `lines` to [], so the
//     write -> CLOSEFILE -> re-open FOR READ pattern that Challenge 6's text,
//     all three hints and its own supplied starter line instruct discarded
//     everything just written, making it unsolvable as taught.
//   * Array WRITES were unchecked while reads threw, so a[0] silently vanished
//     and a[99] silently grew the array — an off-by-one in a stack or sort
//     challenge passed instead of erroring.
const engineCases = [
  { label: '2D: declare, write and read back',
    code: 'DECLARE grid : ARRAY[1:3, 1:3] OF INTEGER\ngrid[2,3] ← 6\nOUTPUT grid[2,3]', expect: ['6'] },
  { label: '2D: no space after the comma in the bounds',
    code: 'DECLARE g : ARRAY[1:3,1:3] OF INTEGER\ng[1,1] ← 7\nOUTPUT g[1,1]', expect: ['7'] },
  { label: '2D: nested FOR fill',
    code: 'DECLARE g : ARRAY[1:2, 1:2] OF INTEGER\nDECLARE r : INTEGER\nDECLARE c : INTEGER\nFOR r ← 1 TO 2\n  FOR c ← 1 TO 2\n    g[r,c] ← r * c\n  NEXT c\nNEXT r\nOUTPUT g[2,2]', expect: ['4'] },
  { label: 'files: re-opening FOR READ preserves what was written',
    code: 'DECLARE l : STRING\nOPENFILE "d.txt" FOR WRITE\nWRITEFILE "d.txt","Alpha"\nWRITEFILE "d.txt","Beta"\nCLOSEFILE "d.txt"\nOPENFILE "d.txt" FOR READ\nREADFILE "d.txt", l\nOUTPUT l\nREADFILE "d.txt", l\nOUTPUT l', expect: ['Alpha', 'Beta'] },
  { label: 'files: opening FOR WRITE still truncates',
    code: 'DECLARE l : STRING\nOPENFILE "d.txt" FOR WRITE\nWRITEFILE "d.txt","Old"\nCLOSEFILE "d.txt"\nOPENFILE "d.txt" FOR WRITE\nWRITEFILE "d.txt","New"\nCLOSEFILE "d.txt"\nOPENFILE "d.txt" FOR READ\nREADFILE "d.txt", l\nOUTPUT l', expect: ['New'] },
  { label: '1D arrays still work after the 2D change',
    code: 'DECLARE a : ARRAY[1:3] OF INTEGER\na[2] ← 5\nOUTPUT a[2]', expect: ['5'] },
]
for (const { label, code, expect } of engineCases) {
  try {
    const { output } = new Interpreter().run(code.replace(/<-/g, '←'), [])
    const ok = JSON.stringify(output) === JSON.stringify(expect)
    if (ok) { pass++; console.log(`✓ ${label}`) }
    else { fail++; console.log(`✗ ${label} — expected ${JSON.stringify(expect)}, got ${JSON.stringify(output)}`) }
  } catch (e) {
    fail++
    console.log(`✗ ${label} — interpreter threw: ${e?.message ?? JSON.stringify(e)}`)
  }
}
// Out-of-bounds WRITES must now throw rather than silently corrupting state.
for (const { label, code } of [
  { label: 'array write past the upper bound is rejected', code: 'DECLARE a : ARRAY[1:3] OF INTEGER\na[99] ← 9' },
  { label: 'array write below the lower bound is rejected', code: 'DECLARE a : ARRAY[1:3] OF INTEGER\na[0] ← 9' },
]) {
  try {
    new Interpreter().run(code, [])
    fail++; console.log(`✗ ${label} — no error raised`)
  } catch { pass++; console.log(`✓ ${label}`) }
}

console.log(`\n${pass} passed, ${fail} failed (${skipped} non-code challenges skipped — no interpreter starter to run).`)
if (fail > 0) process.exit(1)
console.log('all IGCSE Y2 challenge starters run cleanly and are genuinely incomplete')
console.log('2D arrays, file re-reads and array write bounds all behave correctly')
console.log('inline IF/THEN/ELSE/ENDIF on a single physical line is correctly handled')
