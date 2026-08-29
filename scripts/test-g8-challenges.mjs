// Verifies every Grade 8 challenge's check(code[, log]) predicate. Unlike
// Grade 7's log-object check(), Grade 8's is purely structural regex over the
// raw Python source text (no execution/Pyodide needed at all — confirmed by
// reading every check() body in grade8.html; a couple also take a second
// `log` arg of canvas draw-counts for the drawing challenges, same shape as
// Grade 7's).
//
// Two structural, zero-authoring tests per challenge:
//  1. An EMPTY submission ("") must FAIL — catches a check that accidentally
//     always passes regardless of what the student wrote.
//  2. Where the challenge ships its own `starter` code (an intentionally
//     incomplete TODO stub), that starter must also FAIL — if a starter
//     already satisfies check() before the student does anything, either the
//     starter secretly already solves it or check() doesn't actually gate on
//     the thing the TODO asks for. Either way that's a real design bug this
//     test is built to catch, and needs no hand-authored "right answer" since
//     it reuses content the file already ships.
import { readFileSync } from 'fs'

const html = readFileSync('c:/Users/user/Downloads/ICT website/public/lessons/grade8.html', 'utf8')
const s = html.indexOf('const MODULES = [')
const e = html.indexOf('const CHALLENGES = MODULES')
const ctx = html.slice(s, e) + '\nconst CHALLENGES = MODULES.filter(m => m.live).flatMap(m => m.stages.map(s => ({ ...s, mod: m.id.toUpperCase() })))'
const { CHALLENGES } = new Function(ctx + '\nreturn { CHALLENGES }')()

console.log(`Found ${CHALLENGES.length} Grade 8 challenges.\n`)

const permissiveLog = { frames: 999, rects: 999, circles: 999, lines: 999, texts: 999, hasIf: true, hasVar: true, hasFunction: true }

// Mirrors validateChallenge()'s call site exactly: every check() is regex
// over raw source, so comments are stripped before matching — otherwise a
// starter's own "# TODO: use a while loop" comment satisfies a check looking
// for the literal word "while" before the student writes anything real.
function stripPyComments(code) { return code.replace(/#.*$/gm, '') }

// Web Story stages (lang:'web') check a log OBJECT (from runWebCode's DOM/
// state read), not a Python code string — same shape as Grade 7's page-type
// stages. Mirrors that file's maximal/empty log pattern instead of the
// code-regex convention every Python stage below uses.
const webMaximalLog = () => ({ bodyText: 'true false you see 1. item 3 items ' + 'x, '.repeat(5), hasArray: true, hasObject: true, hasPush: true,
  hasFunction: true, functionCount: 999, hasReturn: true, hasIf: true,
  hasLSSet: true, hasLSGet: true, hasJSONStringify: true, hasJSONParse: true,
  hasLoop: true, listItems: 999,
  hasClick: true, listItemsGrewOnClick: true, bodyChangedOnClick: true,
  hasIndex: true, hasLength: true, hasAnd: true,
  // Semester 1 (3-semester rebuild, web1-web4) — real element counts +
  // EXACT computed colors (getComputedStyle's rgb() form of #FFF7E6/#2F3B52).
  h1s: 999, paragraphs: 999, buttons: 999, links: 999,
  headingText: ['My Page'], paragraphText: ['This is my page.'],
  bgColor: 'rgb(255, 247, 230)', headingColor: 'rgb(47, 59, 82)' })
const webEmptyLog   = () => ({ bodyText: '', hasArray: false, hasObject: false, hasPush: false,
  hasFunction: false, functionCount: 0, hasReturn: false, hasIf: false,
  hasLSSet: false, hasLSGet: false, hasJSONStringify: false, hasJSONParse: false,
  hasLoop: false, listItems: 0,
  hasClick: false, listItemsGrewOnClick: false, bodyChangedOnClick: false,
  hasIndex: false, hasLength: false, hasAnd: false,
  h1s: 0, paragraphs: 0, buttons: 0, links: 0,
  headingText: [], paragraphText: [], bgColor: '', headingColor: '' })

let pass = 0, fail = 0
for (const ch of CHALLENGES) {
  const label = `${ch.mod}/${ch.id}`

  if (ch.lang === 'web') {
    if (ch.check(webMaximalLog())) { pass++; console.log(`✓ ${label} — satisfiable (maximal log passes)`) }
    else { fail++; console.log(`✗ ${label} — UNSATISFIABLE: even a maximal log fails check()`) }
    if (!ch.check(webEmptyLog())) { pass++; console.log(`✓ ${label} — not vacuous (empty log correctly fails)`) }
    else { fail++; console.log(`✗ ${label} — VACUOUS: an empty log passes check()`) }
    continue
  }

  if (!ch.check(stripPyComments(''), permissiveLog)) { pass++; console.log(`✓ ${label} — not vacuous (empty submission correctly fails)`) }
  else { fail++; console.log(`✗ ${label} — VACUOUS: an empty submission passes check()`) }

  if (ch.starter) {
    // Starters are deliberately incomplete TODO stubs — a fair check needs the
    // draw-count log a starter would REALLY produce if run, not an artificially
    // generous one. Without executing real Python we can't know that exactly,
    // but zero is the honest conservative assumption for "hasn't drawn the
    // missing pieces yet" (using a generous log here would just prove the
    // regex-only half of a hybrid check, silently hiding whether the
    // draw-count half is actually satisfied by the incomplete starter).
    const zeroLog = { frames: 0, rects: 0, circles: 0, lines: 0, texts: 0, hasIf: false, hasVar: false, hasFunction: false }
    if (!ch.check(stripPyComments(ch.starter), zeroLog)) { pass++; console.log(`✓ ${label} — starter TODO stub correctly does not pass yet`) }
    else { fail++; console.log(`✗ ${label} — starter code already satisfies check() before the student does anything`) }
  }
}

// ── Wrong solutions that must be rejected, correct ones that must pass ───────
// "The starter doesn't pass" is a low bar: a check can still be far too weak to
// tell a right answer from a wrong one. Each REJECT case below was genuinely
// ACCEPTED before these checks were tightened, and each ACCEPT case guards
// against over-tightening them.
const strip = c => c.replace(/#.*$/gm, '')
const byId  = id => CHALLENGES.find(c => c.id === id)

const REJECT = [
  ['m7s3',  'safe division 1/2 never raises, so the except branch never runs',
   'try:\n    r = 1 / 2\nexcept ZeroDivisionError:\n    print("Caught it!")', {}],
  ['m3s1',  'three eyeless, mouthless heads',
   'def draw_smiley(x,y,r):\n    circle(x,y,r)\ndraw_smiley(1,2,3)\ndraw_smiley(4,5,6)\ndraw_smiley(7,8,9)', { circles: 3 }],
  ['m2s1',  'inverted logic with no else',
   'if number % 2 == 1:\n    print("even")', {}],
  ['m2s1',  'inverted logic with an else',
   'if number % 2 == 1:\n    print("even")\nelse:\n    print("odd")', {}],
  ['m10s2', 'scorer that decrements on a match',
   'for i in range(len(answers)):\n    if student_answers[i] == answers[i]:\n        score = score - 1\nif len(answers) > 0:\n    percentage = (score / len(answers)) * 100', {}],
  ['m4s3',  'unmodified starter already draws 5 bars but no text labels',
   null, { rects: 5, texts: 0 }],
]
const ACCEPT = [
  ['m7s3',  'division by a name that can be zero',
   'try:\n    r = total / count\nexcept ZeroDivisionError:\n    print("Caught it!")', {}],
  ['m7s3',  'explicit division by zero',
   'try:\n    r = 10 / 0\nexcept ZeroDivisionError:\n    print("Caught it!")', {}],
  ['m3s1',  'two complete smileys with eyes and mouths',
   'def draw_smiley(x,y,r):\n    circle(x,y,r)\n    circle(x-1,y-1,6)\n    circle(x+1,y-1,6)\n    rect(x,y,10,2)\ndraw_smiley(1,2,3)\ndraw_smiley(4,5,6)', { circles: 6, rects: 2 }],
  ['m2s1',  'correct even/odd',
   'if number % 2 == 0:\n    print("even")\nelse:\n    print("odd")', {}],
  ['m2s1',  'correct, written as != 0',
   'if number % 2 != 0:\n    print("odd")\nelse:\n    print("even")', {}],
  ['m10s2', 'correct incrementing scorer',
   'for i in range(len(answers)):\n    if student_answers[i] == answers[i]:\n        score = score + 1\nif len(answers) > 0:\n    percentage = (score / len(answers)) * 100', {}],
]

for (const [id, label, code, log] of REJECT) {
  const ch = byId(id)
  if (!ch) { fail++; console.log(`✗ ${id} — challenge not found`); continue }
  const src = code ?? ch.starter
  if (ch.check(strip(src), log, src)) { fail++; console.log(`✗ ${id} — ACCEPTS a wrong solution: ${label}`) }
  else { pass++; console.log(`✓ ${id} — correctly rejects: ${label}`) }
}
for (const [id, label, code, log] of ACCEPT) {
  const ch = byId(id)
  if (!ch) { fail++; console.log(`✗ ${id} — challenge not found`); continue }
  if (ch.check(strip(code), log, code)) { pass++; console.log(`✓ ${id} — correctly accepts: ${label}`) }
  else { fail++; console.log(`✗ ${id} — REJECTS a correct solution: ${label}`) }
}

console.log(`\n${pass} passed, ${fail} failed.`)
if (fail > 0) process.exit(1)
console.log('all Grade 8 challenge checks are non-vacuous, every starter stub is genuinely incomplete,')
console.log('and each tightened check tells a correct solution from a wrong one')
