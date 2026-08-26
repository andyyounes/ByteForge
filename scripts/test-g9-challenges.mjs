// Verifies every Grade 9 pseudocode challenge in public/lessons/grade9.html.
//
// grade9.html's CHALLENGES pool had NO permanent coverage before this script
// (test-g9-missions.mjs covers grade9-missions.html — a different page with a
// different engine). These challenges run real Cambridge pseudocode through
// grade9.html's own embedded Interpreter and judge res.output, exactly like
// IGCSE Y2 and the AS/A-Level labs.
//
// Three tests per challenge:
//   1. the unmodified starter runs without the interpreter throwing
//      (a student's very first Run must never crash),
//   2. the starter does NOT already satisfy its own check()
//      (otherwise the challenge is completable without doing anything),
//   3. a hand-authored reference solution DOES satisfy check()
//      (otherwise the challenge is impossible / the check is wrong).
//
// The reference solutions are written from each challenge's own task text and
// hints, and are keyed by "mod/name" so they can't silently drift out of sync
// with the challenge list by index.
import { readFileSync } from 'fs'

const html = readFileSync('c:/Users/user/Downloads/ICT website/public/lessons/grade9.html', 'utf8')

const s1 = html.indexOf('const KEYWORDS = new Set([')
const e1 = html.indexOf('CodeMirror.defineSimpleMode')
const Interpreter = new Function(html.slice(s1, e1) + '\nreturn Interpreter')()

const s2 = html.indexOf('const CHALLENGES = [')
const m  = html.slice(s2).match(/\r?\n\]\r?\n/)
const ctx = html.slice(s2, s2 + m.index + m[0].indexOf(']') + 1)
const { CHALLENGES } = new Function(ctx + '\nreturn { CHALLENGES }')()

// ── Reference solutions, keyed by `${mod}/${name}` ───────────────────────────
// { code, inputs } — inputs mirror the comma-separated INPUT box on the page.
const SOLUTIONS = {
  'W6/Temperature Converter': {
    inputs: ['100'],
    code: `DECLARE celsius    : REAL
DECLARE fahrenheit : REAL
INPUT celsius
fahrenheit ← (celsius * 9 / 5) + 32
OUTPUT fahrenheit`,
  },

  'W6/Leap Year Checker': {
    inputs: ['2000'],
    code: `DECLARE year : INTEGER
INPUT year
IF (year MOD 4 = 0 AND year MOD 100 <> 0) OR year MOD 400 = 0 THEN
   OUTPUT "Leap year"
ELSE
   OUTPUT "Not a leap year"
ENDIF`,
  },

  'W7/Password Strength': {
    inputs: [],
    code: `DECLARE password : STRING
DECLARE length   : INTEGER
DECLARE valid    : BOOLEAN
password ← "SecurePass1!"
length   ← LENGTH(password)
valid    ← length >= 8
IF length >= 12 THEN
   OUTPUT "Strong"
ELSEIF length >= 8 THEN
   OUTPUT "OK"
ELSE
   OUTPUT "Weak"
ENDIF`,
  },

  'W7/Array & FOR': {
    inputs: [],
    code: `DECLARE scores : ARRAY[1:5] OF INTEGER
DECLARE i     : INTEGER
DECLARE total : INTEGER
scores[1] ← 72
scores[2] ← 85
scores[3] ← 91
scores[4] ← 68
scores[5] ← 79
total ← 0
FOR i ← 1 TO 5
   OUTPUT scores[i]
   total ← total + scores[i]
NEXT i
OUTPUT total`,
  },

  'W8/PrintBorder Procedure': {
    inputs: [],
    code: `PROCEDURE PrintBorder(width : INTEGER)
   DECLARE line : STRING
   DECLARE i    : INTEGER
   line ← ""
   FOR i ← 1 TO width
      line ← line & "*"
   NEXT i
   OUTPUT line
ENDPROCEDURE

CALL PrintBorder(5)
CALL PrintBorder(10)`,
  },

  'W8/Clamp Function': {
    inputs: [],
    code: `FUNCTION Clamp(value : INTEGER, minVal : INTEGER, maxVal : INTEGER) RETURNS INTEGER
   IF value < minVal THEN
      RETURN minVal
   ENDIF
   IF value > maxVal THEN
      RETURN maxVal
   ENDIF
   RETURN value
ENDFUNCTION

OUTPUT Clamp(15, 1, 10)
OUTPUT Clamp(-5, 0, 100)
OUTPUT Clamp(50, 1, 100)`,
  },

  'W9/Trace & Fix': {
    inputs: [],
    code: `DECLARE n     : INTEGER
DECLARE count : INTEGER
n     ← 2
count ← 0
WHILE count < 5 DO
   OUTPUT n
   n     ← n + 2
   count ← count + 1
ENDWHILE`,
  },

  'W9/Factorial Function': {
    inputs: [],
    code: `FUNCTION Factorial(n : INTEGER) RETURNS INTEGER
   DECLARE result : INTEGER
   DECLARE i      : INTEGER
   result ← 1
   FOR i ← 1 TO n
      result ← result * i
   NEXT i
   RETURN result
ENDFUNCTION

OUTPUT Factorial(5)
OUTPUT Factorial(0)`,
  },

  'W11/Bubble Sort': {
    inputs: [],
    code: `DECLARE arr  : ARRAY[1:6] OF INTEGER
DECLARE i    : INTEGER
DECLARE j    : INTEGER
DECLARE temp : INTEGER
arr[1] ← 64
arr[2] ← 34
arr[3] ← 25
arr[4] ← 12
arr[5] ← 22
arr[6] ← 11
FOR i ← 1 TO 5
   FOR j ← 1 TO 6 - i
      IF arr[j] > arr[j + 1] THEN
         temp       ← arr[j]
         arr[j]     ← arr[j + 1]
         arr[j + 1] ← temp
      ENDIF
   NEXT j
NEXT i
FOR i ← 1 TO 6
   OUTPUT arr[i]
NEXT i`,
  },

  'W12/Binary Search': {
    inputs: [],
    code: `DECLARE data : ARRAY[1:10] OF INTEGER
data[1]  ← 2
data[2]  ← 5
data[3]  ← 8
data[4]  ← 11
data[5]  ← 16
data[6]  ← 22
data[7]  ← 30
data[8]  ← 41
data[9]  ← 55
data[10] ← 70

FUNCTION BinarySearch(target : INTEGER) RETURNS INTEGER
   DECLARE lo  : INTEGER
   DECLARE hi  : INTEGER
   DECLARE mid : INTEGER
   lo ← 1
   hi ← 10
   WHILE lo <= hi DO
      mid ← (lo + hi) DIV 2
      IF data[mid] = target THEN
         RETURN mid
      ENDIF
      IF data[mid] < target THEN
         lo ← mid + 1
      ELSE
         hi ← mid - 1
      ENDIF
   ENDWHILE
   RETURN -1
ENDFUNCTION

OUTPUT BinarySearch(22)
OUTPUT BinarySearch(99)`,
  },
}

// ── Run ──────────────────────────────────────────────────────────────────────
console.log(`Found ${CHALLENGES.length} Grade 9 challenges.\n`)

let n = 0, pass = 0, fail = 0
const t = (ok, label) => {
  n++
  if (ok) { pass++; console.log(`Test ${String(n).padStart(2)}  ✓ ${label}`) }
  else    { fail++; console.log(`Test ${String(n).padStart(2)}  ✗ ${label}`) }
}

const run = (code, inputs) => new Interpreter().run(code.replace(/<-/g, '←'), inputs)

for (const ch of CHALLENGES) {
  const label = `${ch.mod}/${ch.name}`

  // 1. starter must not crash
  let res = null
  try {
    res = run(ch.starter, (SOLUTIONS[label]?.inputs) ?? [])
    t(true, `${label} — starter runs without crashing`)
  } catch (e) {
    t(false, `${label} — starter CRASHES: ${e?.message ?? JSON.stringify(e)}`)
  }

  // 2. starter must not already pass
  if (res) {
    let already = false
    try { already = !!ch.check(ch.starter, res) } catch { already = false }
    t(!already, `${label} — starter stub ${already ? 'ALREADY SATISFIES check() before any student edit' : 'correctly does not pass yet'}`)
  }

  // 3. reference solution must pass
  const sol = SOLUTIONS[label]
  if (!sol) {
    t(false, `${label} — NO reference solution authored for this challenge`)
    continue
  }
  try {
    const r = run(sol.code, sol.inputs)
    let ok = false
    try { ok = !!ch.check(sol.code, r) } catch (e) { ok = false }
    t(ok, `${label} — reference solution ${ok ? 'passes check()' : `FAILS check(); output was ${JSON.stringify(r.output)}`}`)
  } catch (e) {
    t(false, `${label} — reference solution CRASHES: ${e?.message ?? JSON.stringify(e)}`)
  }
}

// ── Negative cases: a WRONG answer must be rejected ──────────────────────────
// Guards against checks that are too loose to distinguish right from wrong.
const negatives = [
  {
    label: 'Leap Year Checker rejects the inverted answer ("Not a leap year" for 2000)',
    challenge: 'W6/Leap Year Checker',
    inputs: ['2000'],
    // Logic inverted: prints "Not a leap year" for a year that IS a leap year.
    // "Not a leap year" CONTAINS the substring "leap year", so a .includes()
    // check would wrongly accept this.
    code: `DECLARE year : INTEGER
INPUT year
IF (year MOD 4 = 0 AND year MOD 100 <> 0) OR year MOD 400 = 0 THEN
   OUTPUT "Not a leap year"
ELSE
   OUTPUT "Leap year"
ENDIF`,
  },
  {
    label: 'Bubble Sort rejects the unsorted array',
    challenge: 'W11/Bubble Sort',
    inputs: [],
    code: `DECLARE arr : ARRAY[1:6] OF INTEGER
DECLARE i : INTEGER
arr[1] ← 64
arr[2] ← 34
arr[3] ← 25
arr[4] ← 12
arr[5] ← 22
arr[6] ← 11
FOR i ← 1 TO 6
   OUTPUT arr[i]
NEXT i`,
  },
  {
    label: 'Binary Search rejects a hardcoded wrong index',
    challenge: 'W12/Binary Search',
    inputs: [],
    code: `OUTPUT 3
OUTPUT 3`,
  },
]
for (const neg of negatives) {
  const ch = CHALLENGES.find(c => `${c.mod}/${c.name}` === neg.challenge)
  if (!ch) { t(false, `${neg.label} — challenge "${neg.challenge}" not found`); continue }
  try {
    const r = run(neg.code, neg.inputs)
    let accepted = false
    try { accepted = !!ch.check(neg.code, r) } catch { accepted = false }
    t(!accepted, `${neg.label}${accepted ? ' — WRONG ANSWER WAS ACCEPTED' : ''}`)
  } catch (e) {
    // A crash is an acceptable rejection for a deliberately-wrong submission.
    t(true, `${neg.label} (rejected via error)`)
  }
}

// ── Interpreter regression cases ─────────────────────────────────────────────
// Both of these were silently broken in grade9.html until this suite caught
// them (identical to defects previously found and fixed in igcse-y2.html).
const interpCases = [
  // splitOnSemicolons — `a ← 1; b ← 2` previously ran only the first statement.
  { label: 'semicolons: two assignments on one line both run',
    code: 'DECLARE a : INTEGER\nDECLARE b : INTEGER\na ← 1; b ← 2\nOUTPUT a\nOUTPUT b', expect: ['1', '2'] },
  { label: 'semicolons: array fills chained on one line all apply',
    code: 'DECLARE arr : ARRAY[1:3] OF INTEGER\narr[1]←7; arr[2]←8; arr[3]←9\nOUTPUT arr[1]\nOUTPUT arr[2]\nOUTPUT arr[3]', expect: ['7', '8', '9'] },
  { label: 'semicolons: a ; inside a string literal is not a split point',
    code: 'OUTPUT "one; two"', expect: ['one; two'] },
  // expandInlineIf — inline trailing content after THEN/ELSE was dropped.
  { label: 'inline-IF: inline THEN, no ELSE',
    code: 'DECLARE x : INTEGER\nx ← 10\nIF x > 5 THEN OUTPUT "big"\nOUTPUT "done"', expect: ['big', 'done'] },
  { label: 'inline-IF: fully inline IF/THEN/ELSE/ENDIF',
    code: 'DECLARE x : INTEGER\nx ← 2\nIF x > 5 THEN OUTPUT "big" ELSE OUTPUT "small" ENDIF', expect: ['small'] },
  { label: 'inline-IF: inline IF nested inside a FOR loop',
    code: 'DECLARE i : INTEGER\nFOR i ← 1 TO 3\n  IF i = 2 THEN OUTPUT "two" ELSE OUTPUT i ENDIF\nNEXT i', expect: ['1', 'two', '3'] },
  { label: 'inline-IF: ELSE as a literal word in a string is not mis-split',
    code: 'OUTPUT "please ELSE choose wisely"', expect: ['please ELSE choose wisely'] },
  // Array bounds — the "Invalid array length" DECLARE destructuring bug.
  { label: 'arrays: DECLARE ARRAY[1:5] allocates without crashing',
    code: 'DECLARE a : ARRAY[1:5] OF INTEGER\na[5] ← 42\nOUTPUT a[5]', expect: ['42'] },
  { label: 'arrays: a non-1 lower bound is honoured',
    code: 'DECLARE a : ARRAY[3:6] OF INTEGER\na[3] ← 11\na[6] ← 22\nOUTPUT a[3]\nOUTPUT a[6]', expect: ['11', '22'] },
]
for (const c of interpCases) {
  try {
    const { output } = run(c.code, [])
    const ok = JSON.stringify(output) === JSON.stringify(c.expect)
    t(ok, `${c.label}${ok ? '' : ` — expected ${JSON.stringify(c.expect)}, got ${JSON.stringify(output)}`}`)
  } catch (e) {
    t(false, `${c.label} — CRASHED: ${e?.message ?? JSON.stringify(e)}`)
  }
}

console.log(`\n${pass} passed, ${fail} failed, ${n} tests total.`)
if (fail > 0) process.exit(1)
console.log('every Grade 9 challenge runs cleanly, is genuinely incomplete, and is genuinely solvable')
