// Verifies every AS Level PSEUDO_SETS exercise in as-level.html is solvable:
// extracts PSEUDO_SETS + the interpreter from the page, runs a reference
// pseudocode solution for each exercise, and compares against
// ex.check.lines (for check.type === 'output_equals'). Exercises with
// check.type === 'ai' (free-form INPUT-driven answers) are skipped — there's
// no fixed expected output to compare against.
//
// This closes a real coverage gap: unlike A Level's Code Lab
// (test-al-lab.mjs) and Paper 4 challenges (test-p4-challenges.mjs), AS
// Level's own PSEUDO_SETS had no permanent regression test at all before
// this script — added alongside expanding ch13/ch15 from 4/3 exercises to
// 8/7 each (docs/TODO.md).
import { readFileSync } from 'fs'

const html = readFileSync('c:/Users/user/Downloads/ICT website/public/lessons/as-level.html', 'utf8')
const s1 = html.indexOf('const KEYWORDS = new Set([')
const e1 = html.indexOf('CodeMirror.defineSimpleMode')
const Interpreter = new Function(html.slice(s1, e1) + '\nreturn Interpreter')()

const s2 = html.indexOf('const PSEUDO_SETS = {')
const e2 = html.indexOf('const SQL_SCHEMA = [')
const { PSEUDO_SETS } = new Function(html.slice(s2, e2) + '\nreturn { PSEUDO_SETS }')()

// ── Reference solutions (keyed by exercise id) ────────────────────────────────
const SOLUTIONS = {
  'p11-1': `OUTPUT "Hello, Cambridge!"`,
  'p11-2': `DECLARE a : INTEGER
DECLARE b : INTEGER
a ← 15
b ← 27
OUTPUT a + b`,
  'p11-4': `DECLARE total : INTEGER
total ← 0
FOR i ← 1 TO 10
   total ← total + i
NEXT i
OUTPUT total`,
  'p11-5': `DECLARE n : INTEGER
n ← 5
WHILE n >= 1 DO
   OUTPUT n
   n ← n - 1
ENDWHILE`,
  'p11-6': `FUNCTION Square(n : INTEGER) RETURNS INTEGER
   RETURN n * n
ENDFUNCTION
OUTPUT Square(7)`,
  'p11-7': `PROCEDURE Greet(name : STRING)
   OUTPUT "Hello, " & name
ENDPROCEDURE
CALL Greet("Alice")`,
  'p11-8': `DECLARE nums : ARRAY[1:5] OF INTEGER
nums[1] ← 10
nums[2] ← 20
nums[3] ← 30
nums[4] ← 40
nums[5] ← 50
DECLARE total : INTEGER
total ← 0
FOR i ← 1 TO 5
   total ← total + nums[i]
NEXT i
OUTPUT total`,

  'p13-1': `DECLARE stack : ARRAY[1:10] OF INTEGER
DECLARE top : INTEGER
top ← 0
top ← top + 1
stack[top] ← 5
top ← top + 1
stack[top] ← 10
top ← top + 1
stack[top] ← 15
OUTPUT stack[top]
top ← top - 1
OUTPUT stack[top]
top ← top - 1
OUTPUT stack[top]
top ← top - 1`,
  'p13-2': `DECLARE arr : ARRAY[1:5] OF INTEGER
DECLARE i, j, temp : INTEGER
arr[1] ← 64
arr[2] ← 34
arr[3] ← 25
arr[4] ← 12
arr[5] ← 22
FOR i ← 1 TO 4
   FOR j ← 1 TO 5 - i
      IF arr[j] > arr[j + 1] THEN
         temp ← arr[j]
         arr[j] ← arr[j + 1]
         arr[j + 1] ← temp
      ENDIF
   NEXT j
NEXT i
FOR i ← 1 TO 5
   OUTPUT arr[i]
NEXT i`,
  'p13-3': `DECLARE arr : ARRAY[1:6] OF INTEGER
arr[1] ← 3
arr[2] ← 14
arr[3] ← 7
arr[4] ← 22
arr[5] ← 9
arr[6] ← 1
DECLARE found : INTEGER
found ← -1
FOR i ← 1 TO 6
   IF arr[i] = 22 THEN
      found ← i
   ENDIF
NEXT i
OUTPUT found`,
  'p13-4': `DECLARE arr : ARRAY[1:6] OF INTEGER
DECLARE i, j, key : INTEGER
DECLARE shifting : BOOLEAN
arr[1] ← 5
arr[2] ← 3
arr[3] ← 8
arr[4] ← 1
arr[5] ← 9
arr[6] ← 2
FOR i ← 2 TO 6
   key ← arr[i]
   j ← i - 1
   shifting ← j >= 1
   WHILE shifting DO
      IF arr[j] > key THEN
         arr[j + 1] ← arr[j]
         j ← j - 1
         shifting ← j >= 1
      ELSE
         shifting ← FALSE
      ENDIF
   ENDWHILE
   arr[j + 1] ← key
NEXT i
FOR i ← 1 TO 6
   OUTPUT arr[i]
NEXT i`,
  'p13-5': `DECLARE q : ARRAY[1:6] OF STRING
DECLARE front, rear : INTEGER
front ← 1
rear ← 0
rear ← rear + 1
q[rear] ← "A"
rear ← rear + 1
q[rear] ← "B"
rear ← rear + 1
q[rear] ← "C"
rear ← rear + 1
q[rear] ← "D"
OUTPUT q[front]
front ← front + 1
OUTPUT q[front]
front ← front + 1
OUTPUT "Front: " & q[front]`,
  'p13-6': `DECLARE a : ARRAY[1:5] OF INTEGER
DECLARE i, j, minIdx, temp : INTEGER
DECLARE out : STRING
a[1] ← 29; a[2] ← 10; a[3] ← 14; a[4] ← 37; a[5] ← 13
FOR i ← 1 TO 4
   minIdx ← i
   FOR j ← i + 1 TO 5
      IF a[j] < a[minIdx] THEN
         minIdx ← j
      ENDIF
   NEXT j
   temp ← a[i]
   a[i] ← a[minIdx]
   a[minIdx] ← temp
NEXT i
out ← NUM_TO_STR(a[1])
FOR i ← 2 TO 5
   out ← out & " " & NUM_TO_STR(a[i])
NEXT i
OUTPUT out`,
  'p13-7': `DECLARE a : ARRAY[1:11] OF INTEGER
DECLARE low, high, mid : INTEGER
DECLARE found : BOOLEAN
a[1]←2;a[2]←5;a[3]←8;a[4]←12;a[5]←16;a[6]←23;a[7]←38;a[8]←45;a[9]←56;a[10]←72;a[11]←91
low ← 1
high ← 11
found ← FALSE
WHILE found = FALSE AND low <= high DO
   mid ← (low + high) DIV 2
   IF a[mid] = 23 THEN
      found ← TRUE
   ELSE
      IF a[mid] < 23 THEN
         low ← mid + 1
      ELSE
         high ← mid - 1
      ENDIF
   ENDIF
ENDWHILE
IF found THEN
   OUTPUT "Found at " & NUM_TO_STR(mid)
ELSE
   OUTPUT "-1"
ENDIF`,
  'p13-8': `DECLARE a : ARRAY[1:11] OF INTEGER
DECLARE i, count : INTEGER
a[1]←3;a[2]←1;a[3]←4;a[4]←1;a[5]←5;a[6]←9;a[7]←2;a[8]←6;a[9]←5;a[10]←3;a[11]←5
count ← 0
FOR i ← 1 TO 11
   IF a[i] = 5 THEN
      count ← count + 1
   ENDIF
NEXT i
OUTPUT "5 appears " & NUM_TO_STR(count) & " times"`,

  'p15-1': `FUNCTION Factorial(n : INTEGER) RETURNS INTEGER
   IF n <= 1 THEN
      RETURN 1
   ELSE
      RETURN n * Factorial(n - 1)
   ENDIF
ENDFUNCTION
OUTPUT Factorial(5)`,
  'p15-2': `FUNCTION Fib(n : INTEGER) RETURNS INTEGER
   IF n <= 1 THEN RETURN n ENDIF
   RETURN Fib(n-1) + Fib(n-2)
ENDFUNCTION
OUTPUT Fib(8)`,
  'p15-3': `PROCEDURE DoubleByVal(BYVAL n : INTEGER)
   n ← n * 2
ENDPROCEDURE
PROCEDURE DoubleByRef(BYREF n : INTEGER)
   n ← n * 2
ENDPROCEDURE
DECLARE x : INTEGER
x ← 10
CALL DoubleByVal(x)
OUTPUT x
CALL DoubleByRef(x)
OUTPUT x`,
  'p15-4': `FUNCTION GCD(a : INTEGER, b : INTEGER) RETURNS INTEGER
   IF b = 0 THEN
      RETURN a
   ELSE
      RETURN GCD(b, a MOD b)
   ENDIF
ENDFUNCTION
OUTPUT GCD(84, 30)`,
  'p15-5': `DECLARE a : ARRAY[1:4] OF INTEGER
a[1] ← 3; a[2] ← 6; a[3] ← 9; a[4] ← 12
FUNCTION SumArray(idx : INTEGER, n : INTEGER) RETURNS INTEGER
   IF idx > n THEN
      RETURN 0
   ELSE
      RETURN a[idx] + SumArray(idx + 1, n)
   ENDIF
ENDFUNCTION
OUTPUT SumArray(1, 4)`,
  'p15-6': `FUNCTION Power(base : INTEGER, exp : INTEGER) RETURNS INTEGER
   IF exp = 0 THEN
      RETURN 1
   ELSE
      RETURN base * Power(base, exp - 1)
   ENDIF
ENDFUNCTION
OUTPUT Power(3, 4)`,
  'p15-7': `PROCEDURE DoubleAll(BYREF arr : ARRAY[1:3] OF INTEGER)
   DECLARE i : INTEGER
   FOR i ← 1 TO 3
      arr[i] ← arr[i] * 2
   NEXT i
ENDPROCEDURE
DECLARE nums : ARRAY[1:3] OF INTEGER
DECLARE i : INTEGER
DECLARE out : STRING
nums[1] ← 1; nums[2] ← 2; nums[3] ← 3
CALL DoubleAll(nums)
out ← NUM_TO_STR(nums[1])
FOR i ← 2 TO 3
   out ← out & " " & NUM_TO_STR(nums[i])
NEXT i
OUTPUT out`,
}

let pass = 0, fail = 0, skipped = 0
for (const [setId, set] of Object.entries(PSEUDO_SETS)) {
  for (const ex of set.exercises) {
    if (ex.check.type !== 'output_equals') {   // e.g. 'ai' — free-form, nothing to run
      skipped++
      continue
    }
    const sol = SOLUTIONS[ex.id]
    if (!sol) { fail++; console.log(`✗ ${ex.id} ${ex.title} — no reference solution`); continue }
    try {
      const res = new Interpreter().run(sol, [])
      const got = res.output.map(o => String(o).trim())
      const expect = ex.check.lines
      const ok = got.length === expect.length && expect.every((e, i) => got[i] === e)
      if (ok) { pass++; console.log(`✓ ${setId}/${ex.id} ${ex.title}`) }
      else    { fail++; console.log(`✗ ${setId}/${ex.id} ${ex.title}\n    expected: ${JSON.stringify(expect)}\n    got:      ${JSON.stringify(got)}`) }
    } catch (e) {
      fail++
      console.log(`✗ ${setId}/${ex.id} ${ex.title} — threw: ${e?.message ?? JSON.stringify(e)}`)
    }
    // Starters must not crash, AND must not already satisfy check.lines
    // before any student edits (the Grade 8 / A-Level "TODO stub already
    // passes" bug class).
    if (ex.starter && ex.check.type === 'output_equals') {
      try {
        const res = new Interpreter().run(ex.starter.replace(/<-/g, '←'), [])
        const got = res.output.map(o => String(o).trim())
        const expect = ex.check.lines
        const alreadyPasses = got.length === expect.length && expect.every((e, i) => got[i] === e)
        if (alreadyPasses) { fail++; console.log(`✗ ${setId}/${ex.id} — starter already satisfies check.lines before any student edits`) }
      } catch (e) {
        console.log(`  ⚠ starter for ${ex.id} crashes: ${e?.message ?? JSON.stringify(e)}`)
      }
    }
  }
}
console.log(`\n${pass} passed, ${fail} failed, ${skipped} AI-checked (skipped)`)
process.exit(fail ? 1 : 0)
