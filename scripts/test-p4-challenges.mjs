// Extracts the pseudocode Interpreter from a-level.html and runs reference
// solutions for the Paper 4 challenges against it — verifies every challenge
// is actually solvable in the in-page interpreter before students see it.
//
// Usage: node scripts/test-p4-challenges.mjs
import { readFileSync } from 'fs'

const html  = readFileSync('c:/Users/user/Downloads/ICT website/public/lessons/a-level.html', 'utf8')
const start = html.indexOf('const KEYWORDS = new Set([')
let end     = html.indexOf('CodeMirror.defineSimpleMode')
if (end === -1) end = html.indexOf('const p2Interp=new Interpreter()')
if (start === -1 || end === -1) { console.error('interpreter markers not found'); process.exit(1) }

const interpSrc = html.slice(start, end)
const Interpreter = new Function(interpSrc + '\nreturn Interpreter')()

function run(code, inputs = []) {
  const interp = new Interpreter()
  return interp.run(code, inputs)
}

// ── Reference solutions ───────────────────────────────────────────────────────
const TESTS = [
  {
    name: 'GCD (Euclid, recursive)',
    expect: ['21'],
    code: `
FUNCTION GCD(a : INTEGER, b : INTEGER) RETURNS INTEGER
   IF b = 0 THEN
      RETURN a
   ELSE
      RETURN GCD(b, a MOD b)
   ENDIF
ENDFUNCTION
OUTPUT GCD(1071, 462)`,
  },
  {
    name: 'Recursive binary search',
    expect: ['6', '-1'],
    code: `
DECLARE arr : ARRAY[1:8] OF INTEGER
arr[1] ← 2; arr[2] ← 5; arr[3] ← 8; arr[4] ← 12; arr[5] ← 16; arr[6] ← 23; arr[7] ← 38; arr[8] ← 56

FUNCTION Search(target : INTEGER, low : INTEGER, high : INTEGER) RETURNS INTEGER
   DECLARE mid : INTEGER
   IF low > high THEN
      RETURN -1
   ENDIF
   mid ← (low + high) DIV 2
   IF arr[mid] = target THEN
      RETURN mid
   ELSE
      IF arr[mid] < target THEN
         RETURN Search(target, mid + 1, high)
      ELSE
         RETURN Search(target, low, mid - 1)
      ENDIF
   ENDIF
ENDFUNCTION

OUTPUT Search(23, 1, 8)
OUTPUT Search(40, 1, 8)`,
  },
  {
    name: 'Tower of Hanoi move count',
    expect: ['63'],
    code: `
FUNCTION Moves(n : INTEGER) RETURNS INTEGER
   IF n = 1 THEN
      RETURN 1
   ELSE
      RETURN 2 * Moves(n - 1) + 1
   ENDIF
ENDFUNCTION
OUTPUT Moves(6)`,
  },
  {
    name: 'Memoised Fibonacci',
    expect: ['6765'],
    code: `
DECLARE memo : ARRAY[0:20] OF INTEGER
DECLARE i : INTEGER
FOR i ← 0 TO 20
   memo[i] ← -1
NEXT i

FUNCTION Fib(n : INTEGER) RETURNS INTEGER
   IF n <= 1 THEN
      RETURN n
   ENDIF
   IF memo[n] <> -1 THEN
      RETURN memo[n]
   ENDIF
   memo[n] ← Fib(n - 1) + Fib(n - 2)
   RETURN memo[n]
ENDFUNCTION

OUTPUT Fib(20)`,
  },
  {
    name: 'Insertion sort',
    expect: ['1 2 3 5 8 9'],
    code: `
DECLARE a : ARRAY[1:6] OF INTEGER
DECLARE i, j, key : INTEGER
DECLARE line : STRING
a[1] ← 8; a[2] ← 3; a[3] ← 5; a[4] ← 1; a[5] ← 9; a[6] ← 2

DECLARE done : BOOLEAN
FOR i ← 2 TO 6
   key ← a[i]
   j ← i - 1
   done ← FALSE
   WHILE j >= 1 AND done = FALSE DO
      IF a[j] > key THEN
         a[j + 1] ← a[j]
         j ← j - 1
      ELSE
         done ← TRUE
      ENDIF
   ENDWHILE
   a[j + 1] ← key
NEXT i

line ← ""
FOR i ← 1 TO 6
   IF i = 1 THEN
      line ← NUM_TO_STR(a[i])
   ELSE
      line ← line & " " & NUM_TO_STR(a[i])
   ENDIF
NEXT i
OUTPUT line`,
  },
  {
    name: 'Optimised bubble sort with flag',
    expect: ['1 2 3 4 5', 'Passes: 2'],
    code: `
DECLARE a : ARRAY[1:5] OF INTEGER
DECLARE i, passes, temp : INTEGER
DECLARE swapped : BOOLEAN
DECLARE line : STRING
a[1] ← 2; a[2] ← 1; a[3] ← 3; a[4] ← 4; a[5] ← 5

passes ← 0
REPEAT
   swapped ← FALSE
   passes ← passes + 1
   FOR i ← 1 TO 4
      IF a[i] > a[i + 1] THEN
         temp ← a[i]
         a[i] ← a[i + 1]
         a[i + 1] ← temp
         swapped ← TRUE
      ENDIF
   NEXT i
UNTIL swapped = FALSE

line ← NUM_TO_STR(a[1])
FOR i ← 2 TO 5
   line ← line & " " & NUM_TO_STR(a[i])
NEXT i
OUTPUT line
OUTPUT "Passes: " & NUM_TO_STR(passes)`,
  },
  {
    name: 'Merge two sorted arrays',
    expect: ['1 2 5 6 7 9'],
    code: `
DECLARE a : ARRAY[1:3] OF INTEGER
DECLARE b : ARRAY[1:3] OF INTEGER
DECLARE m : ARRAY[1:6] OF INTEGER
DECLARE i, j, k : INTEGER
DECLARE line : STRING
a[1] ← 2; a[2] ← 5; a[3] ← 9
b[1] ← 1; b[2] ← 6; b[3] ← 7

i ← 1; j ← 1; k ← 1
WHILE i <= 3 AND j <= 3 DO
   IF a[i] <= b[j] THEN
      m[k] ← a[i]
      i ← i + 1
   ELSE
      m[k] ← b[j]
      j ← j + 1
   ENDIF
   k ← k + 1
ENDWHILE
WHILE i <= 3 DO
   m[k] ← a[i]; i ← i + 1; k ← k + 1
ENDWHILE
WHILE j <= 3 DO
   m[k] ← b[j]; j ← j + 1; k ← k + 1
ENDWHILE

line ← NUM_TO_STR(m[1])
FOR k ← 2 TO 6
   line ← line & " " & NUM_TO_STR(m[k])
NEXT k
OUTPUT line`,
  },
  {
    name: 'Linked list insert (array implementation)',
    expect: ['10 15 20 30'],
    code: `
DECLARE data : ARRAY[1:5] OF INTEGER
DECLARE nxt : ARRAY[1:5] OF INTEGER
DECLARE startPtr, p, newNode : INTEGER

data[1] ← 10 : nxt[1] ← 2
data[2] ← 20 : nxt[2] ← 3
data[3] ← 30 : nxt[3] ← 0
startPtr ← 1

newNode ← 4
data[newNode] ← 15
p ← startPtr
DECLARE searching : BOOLEAN
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
  },
  {
    name: 'Linked list delete',
    expect: ['10 30 40'],
    code: `
DECLARE data : ARRAY[1:4] OF INTEGER
DECLARE nxt : ARRAY[1:4] OF INTEGER
DECLARE startPtr, p : INTEGER

data[1] ← 10 : nxt[1] ← 2
data[2] ← 20 : nxt[2] ← 3
data[3] ← 30 : nxt[3] ← 4
data[4] ← 40 : nxt[4] ← 0
startPtr ← 1

p ← startPtr
DECLARE searching : BOOLEAN
searching ← TRUE
WHILE searching DO
   IF nxt[p] = 0 THEN
      searching ← FALSE
   ELSE
      IF data[nxt[p]] = 20 THEN
         searching ← FALSE
      ELSE
         p ← nxt[p]
      ENDIF
   ENDIF
ENDWHILE
IF nxt[p] <> 0 THEN
   nxt[p] ← nxt[nxt[p]]
ENDIF

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
  },
  {
    name: 'BST in-order traversal (array representation)',
    expect: ['3 8 12 15 20 27'],
    code: `
DECLARE val   : ARRAY[1:6] OF INTEGER
DECLARE left  : ARRAY[1:6] OF INTEGER
DECLARE right : ARRAY[1:6] OF INTEGER
val[1] ← 15 : left[1] ← 2 : right[1] ← 3
val[2] ← 8  : left[2] ← 4 : right[2] ← 5
val[3] ← 20 : left[3] ← 0 : right[3] ← 6
val[4] ← 3  : left[4] ← 0 : right[4] ← 0
val[5] ← 12 : left[5] ← 0 : right[5] ← 0
val[6] ← 27 : left[6] ← 0 : right[6] ← 0

DECLARE line : STRING
line ← ""

PROCEDURE InOrder(node : INTEGER)
   IF node <> 0 THEN
      CALL InOrder(left[node])
      IF line = "" THEN
         line ← NUM_TO_STR(val[node])
      ELSE
         line ← line & " " & NUM_TO_STR(val[node])
      ENDIF
      CALL InOrder(right[node])
   ENDIF
ENDPROCEDURE

CALL InOrder(1)
OUTPUT line`,
  },
  {
    name: 'Circular queue',
    expect: ['A', 'B', 'F'],
    code: `
DECLARE q : ARRAY[0:4] OF STRING
DECLARE front, rear, count : INTEGER
front ← 0 : rear ← -1 : count ← 0

PROCEDURE Enqueue(item : STRING)
   IF count = 5 THEN
      OUTPUT "Full"
   ELSE
      rear ← (rear + 1) MOD 5
      q[rear] ← item
      count ← count + 1
   ENDIF
ENDPROCEDURE

FUNCTION Dequeue() RETURNS STRING
   DECLARE item : STRING
   IF count = 0 THEN
      RETURN "Empty"
   ENDIF
   item ← q[front]
   front ← (front + 1) MOD 5
   count ← count - 1
   RETURN item
ENDFUNCTION

CALL Enqueue("A")
CALL Enqueue("B")
CALL Enqueue("C")
OUTPUT Dequeue()
OUTPUT Dequeue()
CALL Enqueue("D")
CALL Enqueue("E")
CALL Enqueue("F")
OUTPUT q[rear]`,
  },
  {
    name: 'Postfix (RPN) evaluation with a stack',
    expect: ['14'],
    code: `
DECLARE tokens : ARRAY[1:9] OF STRING
DECLARE stack : ARRAY[1:9] OF INTEGER
DECLARE sp, i, x, y : INTEGER
DECLARE t : STRING
tokens[1] ← "5" : tokens[2] ← "1" : tokens[3] ← "2"
tokens[4] ← "+" : tokens[5] ← "4" : tokens[6] ← "*"
tokens[7] ← "+" : tokens[8] ← "3" : tokens[9] ← "-"
sp ← 0

FOR i ← 1 TO 9
   t ← tokens[i]
   IF t = "+" OR t = "-" OR t = "*" OR t = "/" THEN
      y ← stack[sp]
      sp ← sp - 1
      x ← stack[sp]
      sp ← sp - 1
      IF t = "+" THEN
         sp ← sp + 1
         stack[sp] ← x + y
      ENDIF
      IF t = "-" THEN
         sp ← sp + 1
         stack[sp] ← x - y
      ENDIF
      IF t = "*" THEN
         sp ← sp + 1
         stack[sp] ← x * y
      ENDIF
      IF t = "/" THEN
         sp ← sp + 1
         stack[sp] ← x DIV y
      ENDIF
   ELSE
      sp ← sp + 1
      stack[sp] ← STR_TO_NUM(t)
   ENDIF
NEXT i
OUTPUT stack[sp]`,
  },
  {
    name: 'Hash table with linear probing',
    expect: ['0:7 1:14 2:21 3:3 4:- 5:- 6:-'],
    code: `
DECLARE table : ARRAY[0:6] OF INTEGER
DECLARE keys : ARRAY[1:4] OF INTEGER
DECLARE i, k, idx : INTEGER
DECLARE line : STRING
FOR i ← 0 TO 6
   table[i] ← -1
NEXT i
keys[1] ← 7 : keys[2] ← 14 : keys[3] ← 21 : keys[4] ← 3

FOR i ← 1 TO 4
   k ← keys[i]
   idx ← k MOD 7
   WHILE table[idx] <> -1 DO
      idx ← (idx + 1) MOD 7
   ENDWHILE
   table[idx] ← k
NEXT i

line ← ""
FOR i ← 0 TO 6
   IF i > 0 THEN
      line ← line & " "
   ENDIF
   IF table[i] = -1 THEN
      line ← line & NUM_TO_STR(i) & ":-"
   ELSE
      line ← line & NUM_TO_STR(i) & ":" & NUM_TO_STR(table[i])
   ENDIF
NEXT i
OUTPUT line`,
  },
  {
    name: 'Recursive palindrome check',
    expect: ['YES', 'NO'],
    code: `
FUNCTION IsPal(s : STRING) RETURNS BOOLEAN
   IF LENGTH(s) <= 1 THEN
      RETURN TRUE
   ENDIF
   IF LEFT(s, 1) <> RIGHT(s, 1) THEN
      RETURN FALSE
   ENDIF
   RETURN IsPal(LEFT(RIGHT(s, LENGTH(s) - 1), LENGTH(s) - 2))
ENDFUNCTION

IF IsPal("RACECAR") THEN
   OUTPUT "YES"
ELSE
   OUTPUT "NO"
ENDIF
IF IsPal("LEVELS") THEN
   OUTPUT "YES"
ELSE
   OUTPUT "NO"
ENDIF`,
  },
  {
    name: 'Caesar cipher (alphabet lookup)',
    expect: ['KHOOR'],
    code: `
DECLARE alpha, plain, cipher, ch : STRING
DECLARE i, j, pos : INTEGER
alpha ← "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
plain ← "HELLO"
cipher ← ""

FOR i ← 1 TO LENGTH(plain)
   ch ← RIGHT(LEFT(plain, i), 1)
   pos ← 0
   FOR j ← 1 TO 26
      IF RIGHT(LEFT(alpha, j), 1) = ch THEN
         pos ← j
      ENDIF
   NEXT j
   pos ← ((pos - 1 + 3) MOD 26) + 1
   cipher ← cipher & RIGHT(LEFT(alpha, pos), 1)
NEXT i
OUTPUT cipher`,
  },
  {
    name: 'Bank account BYREF',
    expect: ['350', 'Insufficient funds', '350'],
    code: `
PROCEDURE Deposit(BYREF bal : INTEGER, BYVAL amt : INTEGER)
   bal ← bal + amt
ENDPROCEDURE

PROCEDURE Withdraw(BYREF bal : INTEGER, BYVAL amt : INTEGER)
   IF amt > bal THEN
      OUTPUT "Insufficient funds"
   ELSE
      bal ← bal - amt
   ENDIF
ENDPROCEDURE

DECLARE balance : INTEGER
balance ← 100
CALL Deposit(balance, 250)
OUTPUT balance
CALL Withdraw(balance, 500)
OUTPUT balance`,
  },
]

let pass = 0, fail = 0
for (const t of TESTS) {
  try {
    const res = run(t.code)
    const got = res.output.map(o => String(o).trim())
    const ok  = t.expect.every((e, i) => got[i] === e) && got.length === t.expect.length
    if (ok) { pass++; console.log(`✓ ${t.name}`) }
    else    { fail++; console.log(`✗ ${t.name}\n    expected: ${JSON.stringify(t.expect)}\n    got:      ${JSON.stringify(got)}`) }
  } catch (e) {
    fail++
    console.log(`✗ ${t.name} — threw: ${e?.message ?? JSON.stringify(e)}`)
  }
}
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
