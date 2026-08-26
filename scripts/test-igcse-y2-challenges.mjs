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

let pass = 0, fail = 0
for (const ch of CHALLENGES) {
  const label = `${ch.mod}/${ch.name}`
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

console.log(`\n${pass} passed, ${fail} failed.`)
if (fail > 0) process.exit(1)
console.log('all IGCSE Y2 challenge starters run cleanly and are genuinely incomplete')
console.log('inline IF/THEN/ELSE/ENDIF on a single physical line is correctly handled')
