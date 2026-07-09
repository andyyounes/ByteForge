// Verifies every Code Lab exercise in a-level.html is solvable: extracts
// AL_LAB_SETS + the interpreter from the page, runs a reference pseudocode
// solution for each exercise, and compares against ex.expect.
import { readFileSync } from 'fs'

const html = readFileSync('c:/Users/user/Downloads/ICT website/public/lessons/a-level.html', 'utf8')
const s1 = html.indexOf('const KEYWORDS = new Set([')
const e1 = html.indexOf('CodeMirror.defineSimpleMode')
const Interpreter = new Function(html.slice(s1, e1) + '\nreturn Interpreter')()

const s2 = html.indexOf('const AL_LAB_SETS = {')
const e2 = html.indexOf('// ── Lab state, saves & helpers')
const SETS = new Function(html.slice(s2, e2) + '\nreturn AL_LAB_SETS')()

// ── Reference solutions (keyed by exercise id) ────────────────────────────────
const SOLUTIONS = {
  r1: `PROCEDURE CountDown(n : INTEGER)
   IF n = 0 THEN
      OUTPUT "Go!"
   ELSE
      OUTPUT n
      CALL CountDown(n - 1)
   ENDIF
ENDPROCEDURE
CALL CountDown(5)`,

  r2: `FUNCTION SumTo(n : INTEGER) RETURNS INTEGER
   IF n = 1 THEN
      RETURN 1
   ELSE
      RETURN n + SumTo(n - 1)
   ENDIF
ENDFUNCTION
OUTPUT SumTo(10)`,

  r3: `FUNCTION Power(base : INTEGER, exp : INTEGER) RETURNS INTEGER
   IF exp = 0 THEN
      RETURN 1
   ELSE
      RETURN base * Power(base, exp - 1)
   ENDIF
ENDFUNCTION
OUTPUT Power(2, 8)`,

  r4: `FUNCTION Digits(n : INTEGER) RETURNS INTEGER
   IF n < 10 THEN
      RETURN 1
   ELSE
      RETURN 1 + Digits(n DIV 10)
   ENDIF
ENDFUNCTION
OUTPUT Digits(52407)`,

  r5: `FUNCTION Rev(s : STRING) RETURNS STRING
   IF LENGTH(s) <= 1 THEN
      RETURN s
   ELSE
      RETURN Rev(RIGHT(s, LENGTH(s) - 1)) & LEFT(s, 1)
   ENDIF
ENDFUNCTION
OUTPUT Rev("PAPER")`,

  s1: `DECLARE a : ARRAY[1:7] OF INTEGER
DECLARE i, comps : INTEGER
DECLARE found : BOOLEAN
a[1] ← 8; a[2] ← 3; a[3] ← 9; a[4] ← 42; a[5] ← 7; a[6] ← 15; a[7] ← 6
comps ← 0
i ← 1
found ← FALSE
WHILE i <= 7 AND found = FALSE DO
   comps ← comps + 1
   IF a[i] = 42 THEN
      found ← TRUE
   ELSE
      i ← i + 1
   ENDIF
ENDWHILE
OUTPUT "Found at " & NUM_TO_STR(i)
OUTPUT "Comparisons: " & NUM_TO_STR(comps)`,

  s2: `DECLARE a : ARRAY[1:5] OF INTEGER
DECLARE i, minVal, minIdx : INTEGER
a[1] ← 14; a[2] ← 7; a[3] ← 22; a[4] ← 3; a[5] ← 19
minVal ← a[1]
minIdx ← 1
FOR i ← 2 TO 5
   IF a[i] < minVal THEN
      minVal ← a[i]
      minIdx ← i
   ENDIF
NEXT i
OUTPUT "Min " & NUM_TO_STR(minVal) & " at " & NUM_TO_STR(minIdx)`,

  s3: `DECLARE a : ARRAY[1:7] OF INTEGER
DECLARE low, high, mid : INTEGER
DECLARE found : BOOLEAN
a[1] ← 3; a[2] ← 8; a[3] ← 12; a[4] ← 17; a[5] ← 23; a[6] ← 31; a[7] ← 40
low ← 1
high ← 7
found ← FALSE
WHILE found = FALSE AND low <= high DO
   mid ← (low + high) DIV 2
   OUTPUT a[mid]
   IF a[mid] = 31 THEN
      found ← TRUE
   ELSE
      IF a[mid] < 31 THEN
         low ← mid + 1
      ELSE
         high ← mid - 1
      ENDIF
   ENDIF
ENDWHILE
OUTPUT "Found at " & NUM_TO_STR(mid)`,

  s4: `DECLARE a : ARRAY[1:5] OF INTEGER
DECLARE i, j, minIdx, temp : INTEGER
DECLARE line : STRING
a[1] ← 9; a[2] ← 4; a[3] ← 8; a[4] ← 1; a[5] ← 6
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
line ← NUM_TO_STR(a[1])
FOR i ← 2 TO 5
   line ← line & " " & NUM_TO_STR(a[i])
NEXT i
OUTPUT line`,

  s5: `DECLARE a : ARRAY[1:5] OF INTEGER
DECLARE i, swaps, temp : INTEGER
DECLARE swapped : BOOLEAN
DECLARE line : STRING
a[1] ← 5; a[2] ← 1; a[3] ← 4; a[4] ← 2; a[5] ← 8
swaps ← 0
REPEAT
   swapped ← FALSE
   FOR i ← 1 TO 4
      IF a[i] > a[i + 1] THEN
         temp ← a[i]
         a[i] ← a[i + 1]
         a[i + 1] ← temp
         swaps ← swaps + 1
         swapped ← TRUE
      ENDIF
   NEXT i
UNTIL swapped = FALSE
line ← NUM_TO_STR(a[1])
FOR i ← 2 TO 5
   line ← line & " " & NUM_TO_STR(a[i])
NEXT i
OUTPUT line
OUTPUT "Swaps: " & NUM_TO_STR(swaps)`,

  a1: `DECLARE stack : ARRAY[1:10] OF STRING
DECLARE sp, i : INTEGER
DECLARE word, result : STRING
word ← "STACK"
sp ← 0
FOR i ← 1 TO LENGTH(word)
   sp ← sp + 1
   stack[sp] ← RIGHT(LEFT(word, i), 1)
NEXT i
result ← ""
WHILE sp > 0 DO
   result ← result & stack[sp]
   sp ← sp - 1
ENDWHILE
OUTPUT result`,

  a2: `DECLARE q : ARRAY[1:10] OF STRING
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
rear ← rear + 1
q[rear] ← "E"
OUTPUT q[front]
front ← front + 1
OUTPUT q[front]
front ← front + 1
rear ← rear + 1
q[rear] ← "F"
OUTPUT "Front: " & q[front]
OUTPUT "Rear: " & q[rear]`,

  a3: `DECLARE data : ARRAY[1:5] OF INTEGER
DECLARE nxt : ARRAY[1:5] OF INTEGER
DECLARE startPtr, p, count : INTEGER
data[1] ← 12 : nxt[1] ← 3
data[2] ← 99 : nxt[2] ← 0
data[3] ← 34 : nxt[3] ← 5
data[5] ← 51 : nxt[5] ← 2
startPtr ← 1
count ← 0
p ← startPtr
WHILE p <> 0 DO
   count ← count + 1
   p ← nxt[p]
ENDWHILE
OUTPUT "Length: " & NUM_TO_STR(count)`,

  a4: `DECLARE vals : ARRAY[1:5] OF INTEGER
DECLARE i, minSoFar : INTEGER
vals[1] ← 7; vals[2] ← 3; vals[3] ← 9; vals[4] ← 2; vals[5] ← 5
minSoFar ← vals[1]
FOR i ← 1 TO 5
   IF vals[i] < minSoFar THEN
      minSoFar ← vals[i]
   ENDIF
   OUTPUT minSoFar
NEXT i`,

  a5: `DECLARE val   : ARRAY[1:5] OF INTEGER
DECLARE left  : ARRAY[1:5] OF INTEGER
DECLARE right : ARRAY[1:5] OF INTEGER
DECLARE node, target, nextNode : INTEGER
DECLARE path : STRING
DECLARE walking : BOOLEAN
val[1] ← 50 : left[1] ← 2 : right[1] ← 3
val[2] ← 30 : left[2] ← 4 : right[2] ← 5
val[3] ← 70 : left[3] ← 0 : right[3] ← 0
val[4] ← 20 : left[4] ← 0 : right[4] ← 0
val[5] ← 40 : left[5] ← 0 : right[5] ← 0
target ← 45
node ← 1
path ← ""
walking ← TRUE
WHILE walking DO
   IF target < val[node] THEN
      IF path = "" THEN
         path ← "L"
      ELSE
         path ← path & " L"
      ENDIF
      nextNode ← left[node]
   ELSE
      IF path = "" THEN
         path ← "R"
      ELSE
         path ← path & " R"
      ENDIF
      nextNode ← right[node]
   ENDIF
   IF nextNode = 0 THEN
      walking ← FALSE
   ELSE
      node ← nextNode
   ENDIF
ENDWHILE
OUTPUT path`,

  t1: `DECLARE s, ch : STRING
DECLARE i, count : INTEGER
s ← "COMPUTER SCIENCE"
count ← 0
FOR i ← 1 TO LENGTH(s)
   ch ← RIGHT(LEFT(s, i), 1)
   IF ch = "A" OR ch = "E" OR ch = "I" OR ch = "O" OR ch = "U" THEN
      count ← count + 1
   ENDIF
NEXT i
OUTPUT "Vowels: " & NUM_TO_STR(count)`,

  t2: `DECLARE s, ch, initials : STRING
DECLARE i : INTEGER
s ← "GRACE BREWSTER HOPPER"
initials ← LEFT(s, 1)
FOR i ← 2 TO LENGTH(s) - 1
   ch ← RIGHT(LEFT(s, i), 1)
   IF ch = " " THEN
      initials ← initials & RIGHT(LEFT(s, i + 1), 1)
   ENDIF
NEXT i
OUTPUT initials`,

  t3: `DECLARE s, ch : STRING
DECLARE i, spaces : INTEGER
s ← "TO BE OR NOT TO BE"
spaces ← 0
FOR i ← 1 TO LENGTH(s)
   ch ← RIGHT(LEFT(s, i), 1)
   IF ch = " " THEN
      spaces ← spaces + 1
   ENDIF
NEXT i
OUTPUT "Words: " & NUM_TO_STR(spaces + 1)`,

  t4: `DECLARE alpha, cipher, plain, ch : STRING
DECLARE i, j, pos : INTEGER
alpha ← "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
cipher ← "KHOOR"
plain ← ""
FOR i ← 1 TO LENGTH(cipher)
   ch ← RIGHT(LEFT(cipher, i), 1)
   pos ← 0
   FOR j ← 1 TO 26
      IF RIGHT(LEFT(alpha, j), 1) = ch THEN
         pos ← j
      ENDIF
   NEXT j
   pos ← ((pos - 1 - 3 + 26) MOD 26) + 1
   plain ← plain & RIGHT(LEFT(alpha, pos), 1)
NEXT i
OUTPUT plain`,

  ppa1: `DECLARE temps : ARRAY[1:8] OF INTEGER
DECLARE i, maxVal, maxDay, total : INTEGER
temps[1] ← 21; temps[2] ← 25; temps[3] ← 19; temps[4] ← 30
temps[5] ← 27; temps[6] ← 30; temps[7] ← 18; temps[8] ← 24
maxVal ← temps[1]
maxDay ← 1
total ← 0
FOR i ← 1 TO 8
   IF temps[i] > maxVal THEN
      maxVal ← temps[i]
      maxDay ← i
   ENDIF
   total ← total + temps[i]
NEXT i
OUTPUT "Hottest: " & NUM_TO_STR(maxVal) & " at day " & NUM_TO_STR(maxDay)
OUTPUT "Average: " & NUM_TO_STR(total / 8)`,

  ppa2: `FUNCTION Test(X : INTEGER) RETURNS INTEGER
   IF X <= 1 THEN
      RETURN 1
   ELSE
      RETURN X * Test(X - 2)
   ENDIF
ENDFUNCTION
OUTPUT Test(7)
OUTPUT Test(6)`,

  ppa3: `DECLARE stack : ARRAY[1:5] OF INTEGER
DECLARE sp : INTEGER
sp ← 0
PROCEDURE Push(item : INTEGER)
   IF sp = 5 THEN
      OUTPUT "Stack full"
   ELSE
      sp ← sp + 1
      stack[sp] ← item
   ENDIF
ENDPROCEDURE
FUNCTION Pop() RETURNS INTEGER
   DECLARE item : INTEGER
   item ← stack[sp]
   sp ← sp - 1
   RETURN item
ENDFUNCTION
CALL Push(12)
CALL Push(5)
CALL Push(8)
OUTPUT Pop()
CALL Push(3)
CALL Push(9)
CALL Push(7)
CALL Push(4)
OUTPUT Pop()`,

  ppb1: `DECLARE q : ARRAY[1:6] OF STRING
DECLARE front, rear : INTEGER
front ← 1
rear ← 0
rear ← rear + 1
q[rear] ← "Ali"
rear ← rear + 1
q[rear] ← "Ben"
rear ← rear + 1
q[rear] ← "Cy"
OUTPUT q[front]
front ← front + 1
rear ← rear + 1
q[rear] ← "Dee"
OUTPUT q[front]
front ← front + 1
OUTPUT "Front: " & q[front]
OUTPUT "Size: " & NUM_TO_STR(rear - front + 1)`,

  ppb2: `DECLARE data : ARRAY[1:5] OF INTEGER
DECLARE nxt : ARRAY[1:5] OF INTEGER
DECLARE startPtr, p, newNode : INTEGER
DECLARE searching : BOOLEAN
data[1] ← 5  : nxt[1] ← 2
data[2] ← 12 : nxt[2] ← 3
data[3] ← 19 : nxt[3] ← 4
data[4] ← 26 : nxt[4] ← 0
startPtr ← 1
newNode ← 5
data[newNode] ← 15
p ← startPtr
searching ← TRUE
WHILE searching DO
   IF nxt[p] = 0 THEN
      searching ← FALSE
   ELSE
      IF data[nxt[p]] < 15 THEN
         p ← nxt[p]
      ELSE
         searching ← FALSE
      ENDIF
   ENDIF
ENDWHILE
nxt[newNode] ← nxt[p]
nxt[p] ← newNode
DECLARE line : STRING
p ← startPtr
line ← ""
WHILE p <> 0 DO
   IF line = "" THEN
      line ← NUM_TO_STR(data[p])
   ELSE
      line ← line & " " & NUM_TO_STR(data[p])
   ENDIF
   p ← nxt[p]
ENDWHILE
OUTPUT line`,

  ppb3: `FUNCTION CountChar(s : STRING, ch : STRING) RETURNS INTEGER
   IF LENGTH(s) = 0 THEN
      RETURN 0
   ENDIF
   IF LEFT(s, 1) = ch THEN
      RETURN 1 + CountChar(RIGHT(s, LENGTH(s) - 1), ch)
   ELSE
      RETURN CountChar(RIGHT(s, LENGTH(s) - 1), ch)
   ENDIF
ENDFUNCTION
OUTPUT CountChar("MISSISSIPPI", "S")
OUTPUT CountChar("BANANA", "A")`,

  t5: `DECLARE s, cur, ch, result : STRING
DECLARE i, runLen : INTEGER
s ← "AAABBCDDDD"
result ← ""
cur ← LEFT(s, 1)
runLen ← 1
FOR i ← 2 TO LENGTH(s)
   ch ← RIGHT(LEFT(s, i), 1)
   IF ch = cur THEN
      runLen ← runLen + 1
   ELSE
      result ← result & cur & NUM_TO_STR(runLen)
      cur ← ch
      runLen ← 1
   ENDIF
NEXT i
result ← result & cur & NUM_TO_STR(runLen)
OUTPUT result`,
}

let pass = 0, fail = 0, skipped = 0
for (const [setId, set] of Object.entries(SETS)) {
  for (const ex of set.exercises) {
    if (!ex.expect.length) {   // AI-checked (OOP / file handling) — nothing to run
      skipped++
      continue
    }
    const sol = SOLUTIONS[ex.id]
    if (!sol) { fail++; console.log(`✗ ${ex.id} ${ex.title} — no reference solution`); continue }
    try {
      const res = new Interpreter().run(sol, [])
      const got = res.output.map(o => String(o).trim())
      const ok  = got.length === ex.expect.length && ex.expect.every((e, i) => got[i] === e)
      if (ok) { pass++; console.log(`✓ ${setId}/${ex.id} ${ex.title}`) }
      else    { fail++; console.log(`✗ ${setId}/${ex.id} ${ex.title}\n    expected: ${JSON.stringify(ex.expect)}\n    got:      ${JSON.stringify(got)}`) }
    } catch (e) {
      fail++
      console.log(`✗ ${setId}/${ex.id} ${ex.title} — threw: ${e?.message ?? JSON.stringify(e)}`)
    }
    // Starters must not crash either (pseudocode only)
    if (ex.ps) {
      try { new Interpreter().run(ex.ps.replace(/<-/g, '←'), []) }
      catch (e) { console.log(`  ⚠ starter for ${ex.id} crashes: ${e?.message ?? JSON.stringify(e)}`) }
    }
  }
}
console.log(`\n${pass} passed, ${fail} failed, ${skipped} AI-checked (skipped)`)
process.exit(fail ? 1 : 0)
