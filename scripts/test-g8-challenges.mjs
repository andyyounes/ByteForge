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

let pass = 0, fail = 0
for (const ch of CHALLENGES) {
  const label = `${ch.mod}/${ch.id}`

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

console.log(`\n${pass} passed, ${fail} failed.`)
if (fail > 0) process.exit(1)
console.log('all Grade 8 challenge checks are non-vacuous and every starter stub is genuinely incomplete')
