// Verifies the Cambridge pseudocode interpreters embedded in as-level.html and
// a-level.html. Both share a lineage with igcse-y2.html and grade9.html, and
// the SAME defects kept turning up in each copy — so every case below is run
// against BOTH files, and any future divergence between them fails here.
//
// Each case corresponds to a real, confirmed defect:
//   * 2D arrays were entirely unimplemented. The DECLARE regex is 1D-only, so
//     `DECLARE g : ARRAY[1:2,1:3] OF INTEGER` silently declared nothing and the
//     next line failed with "Variable 'g' not declared". There was no 2D write
//     path, and the read path parsed only ONE index — so `g[2,3]` returned the
//     whole ROW and OUTPUT printed it as "0,0,6". Both courses TEACH 2D arrays
//     (adjacency matrices, matrix multiplication), so shipped exercises were
//     unrunnable.
//   * MID / SUBSTRING / ASC / CHR are mandated 9618 functions and were missing.
//     The authors worked around the gap in content rather than fixing it —
//     a-level's Caesar exercise is literally titled "no ASC/CHR".
//   * Array WRITES were unchecked while reads threw: a[0] wrote to JS index -1
//     and vanished; a[99] silently grew the array. Off-by-one errors — the
//     commonest student mistake in these sorting/list exercises — corrupted
//     state instead of erroring.
//   * MOD by zero returned NaN silently while DIV correctly threw.
//   * Unrecognised statements were console.warn'd and SKIPPED, so whole
//     unimplemented families (CASE OF, file handling, CLASS) ran to completion
//     producing no output and no error at all.
import { readFileSync } from 'fs'

const ROOT = 'c:/Users/user/Downloads/ICT website'

function loadInterpreter(file) {
  const html = readFileSync(`${ROOT}/public/lessons/${file}`, 'utf8')
  const s1 = html.indexOf('const KEYWORDS = new Set([')
  const e1 = html.indexOf('CodeMirror.defineSimpleMode')
  if (s1 < 0 || e1 < 0) throw new Error(`interpreter not found in ${file}`)
  return new Function(html.slice(s1, e1) + '\nreturn Interpreter')()
}

let n = 0, pass = 0, fail = 0
const t = (ok, label) => {
  n++
  if (ok) { pass++; console.log(`Test ${String(n).padStart(3)}  ✓ ${label}`) }
  else    { fail++; console.log(`Test ${String(n).padStart(3)}  ✗ ${label}`) }
}

// Cases that must produce exact output.
const OUTPUT_CASES = [
  ['2D: declare, write and read one cell',
   'DECLARE g : ARRAY[1:2, 1:3] OF INTEGER\ng[2,3] ← 6\nOUTPUT g[2,3]', ['6']],
  ['2D: no space after the comma in the bounds',
   'DECLARE g : ARRAY[1:2,1:2] OF INTEGER\ng[1,1] ← 7\nOUTPUT g[1,1]', ['7']],
  ['2D: nested FOR fill reads back correctly',
   'DECLARE g : ARRAY[1:2, 1:2] OF INTEGER\nDECLARE r : INTEGER\nDECLARE c : INTEGER\n' +
   'FOR r ← 1 TO 2\n  FOR c ← 1 TO 2\n    g[r,c] ← r * c\n  NEXT c\nNEXT r\nOUTPUT g[2,2]', ['4']],
  ['2D: a row is not returned when both indices are given',
   'DECLARE g : ARRAY[1:2, 1:3] OF INTEGER\ng[1,2] ← 5\nOUTPUT g[1,2]', ['5']],
  ['MID is 1-based',            'OUTPUT MID("ABCDEF", 2, 3)', ['BCD']],
  ['SUBSTRING is 1-based',      'OUTPUT SUBSTRING("ABCDEF", 1, 3)', ['ABC']],
  ['ASC returns a code point',  'OUTPUT ASC("A")', ['65']],
  ['CHR returns a character',   'OUTPUT CHR(66)', ['B']],
  ['CHR(ASC(x)) round-trips',   'OUTPUT CHR(ASC("Z"))', ['Z']],
  ['1D arrays still work',      'DECLARE a : ARRAY[1:3] OF INTEGER\na[2] ← 5\nOUTPUT a[2]', ['5']],
  ['1D non-1 lower bound',      'DECLARE a : ARRAY[3:5] OF INTEGER\na[3] ← 1\na[5] ← 9\nOUTPUT a[3]\nOUTPUT a[5]', ['1', '9']],
  ['DIV still truncates',       'OUTPUT 7 DIV 2', ['3']],
  ['MOD still works',           'OUTPUT 7 MOD 2', ['1']],

  // BYREF write-back must happen on BOTH call forms. The bare-call path used
  // to evaluate arguments to values only and skip the write-back that the
  // `CALL ` path performs, so `DoubleByRef(x)` left x unchanged while
  // `CALL DoubleByRef(x)` doubled it — the bare form silently taught that
  // BYREF does nothing, the exact opposite of the lesson beside it.
  ['BYREF writes back via CALL',
   `PROCEDURE Dbl(BYREF n : INTEGER)
   n ← n * 2
ENDPROCEDURE
DECLARE x : INTEGER
x ← 10
CALL Dbl(x)
OUTPUT x`, ['20']],
  ['BYREF writes back via a bare call too',
   `PROCEDURE Dbl(BYREF n : INTEGER)
   n ← n * 2
ENDPROCEDURE
DECLARE x : INTEGER
x ← 10
Dbl(x)
OUTPUT x`, ['20']],
  ['BYVAL still does NOT write back (bare call)',
   `PROCEDURE Dbl(BYVAL n : INTEGER)
   n ← n * 2
ENDPROCEDURE
DECLARE x : INTEGER
x ← 10
Dbl(x)
OUTPUT x`, ['10']],
]

// Cases that must RAISE — silence here means corrupt state or a lost error.
const THROW_CASES = [
  ['array write past the upper bound is rejected', 'DECLARE a : ARRAY[1:3] OF INTEGER\na[99] ← 9'],
  ['array write below the lower bound is rejected', 'DECLARE a : ARRAY[1:3] OF INTEGER\na[0] ← 9'],
  ['2D write out of bounds is rejected',            'DECLARE g : ARRAY[1:2, 1:2] OF INTEGER\ng[9,1] ← 1'],
  ['MOD by zero raises instead of yielding NaN',    'OUTPUT 5 MOD 0'],
  ['DIV by zero raises',                            'OUTPUT 5 DIV 0'],
  ['an unsupported statement raises instead of being silently skipped',
   'FLOOBLE 1 2 3\nOUTPUT "after"'],
]

for (const file of ['as-level.html', 'a-level.html']) {
  const Interpreter = loadInterpreter(file)
  const run = code => new Interpreter().run(code.replace(/<-/g, '←'), [])
  console.log(`\n── ${file} ──`)

  for (const [label, code, expect] of OUTPUT_CASES) {
    try {
      const { output } = run(code)
      const ok = JSON.stringify(output) === JSON.stringify(expect)
      t(ok, `${file}: ${label}${ok ? '' : ` — expected ${JSON.stringify(expect)}, got ${JSON.stringify(output)}`}`)
    } catch (e) {
      t(false, `${file}: ${label} — threw: ${e?.message ?? JSON.stringify(e)}`)
    }
  }
  for (const [label, code] of THROW_CASES) {
    try { run(code); t(false, `${file}: ${label} — NO error raised`) }
    catch { t(true, `${file}: ${label}`) }
  }
}

console.log(`\n${pass} passed, ${fail} failed, ${n} tests total.`)
if (fail > 0) process.exit(1)
console.log('AS and A Level interpreters agree and handle 2D arrays, 9618 string functions,')
console.log('array bounds, MOD 0 and unsupported statements correctly')
