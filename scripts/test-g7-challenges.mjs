// Verifies every Grade 7 challenge's check(log) predicate — pure logic over a
// {frames,rects,circles,lines,texts,hasIf,hasVar,hasFunction} log object that
// runCode() builds from tracking a student's executed code (see runCode()'s
// static/animated branches). check() never touches the DOM/canvas/Blockly
// itself, so this can all be tested straight in Node with zero browser.
//
// Two structural tests per challenge, needing no hand-curated "right answer":
//  1. a MAXIMAL log (every count generous, every flag true) must PASS — if it
//     doesn't, the check is unsatisfiable (a typo/contradiction nobody could
//     ever complete).
//  2. an EMPTY log (all zeros/false) must FAIL — if it doesn't, the check
//     accidentally always passes regardless of what the student did.
// Then, for every needsVar/needsIf/needsFrames/needsFunction flag the stage
// declares true (used only for the "what's missing" hint text), a mutation
// test: starting from the maximal log, flip JUST that one field off and
// confirm check() actually flips to fail. This is what catches a hint that
// promises a requirement check() doesn't really enforce — the two could
// drift apart silently otherwise, since nothing else ties them together.
import { readFileSync } from 'fs'

const html = readFileSync('c:/Users/user/Downloads/ICT website/public/lessons/grade7.html', 'utf8')
const s = html.indexOf('const WORLDS = [')
const e = html.indexOf('const STAGE_INDEX')
const ctx = html.slice(s, e)
const { CHALLENGES } = new Function(ctx + '\nreturn { CHALLENGES }')()

console.log(`Found ${CHALLENGES.length} Grade 7 challenges.\n`)

let pass = 0, fail = 0
const maximalLog = () => ({ frames: 999, rects: 999, circles: 999, lines: 999, texts: 999, hasIf: true, hasVar: true, hasFunction: true })
const emptyLog   = () => ({ frames: 0,   rects: 0,   circles: 0,   lines: 0,   texts: 0,   hasIf: false, hasVar: false, hasFunction: false })

for (const ch of CHALLENGES) {
  const label = `${ch.mod}/${ch.id}`

  if (ch.check(maximalLog())) { pass++; console.log(`✓ ${label} — satisfiable (maximal log passes)`) }
  else { fail++; console.log(`✗ ${label} — UNSATISFIABLE: even a maximal log fails check()`) }

  if (!ch.check(emptyLog())) { pass++; console.log(`✓ ${label} — not vacuous (empty log correctly fails)`) }
  else { fail++; console.log(`✗ ${label} — VACUOUS: an empty/no-op submission passes check()`) }

  const flags = ['needsVar', 'needsIf', 'needsFrames', 'needsFunction']
  const fieldFor = { needsVar: 'hasVar', needsIf: 'hasIf', needsFrames: 'frames', needsFunction: 'hasFunction' }
  for (const flag of flags) {
    if (!ch[flag]) continue
    const log = maximalLog()
    const field = fieldFor[flag]
    log[field] = field === 'frames' ? 0 : false
    if (!ch.check(log)) { pass++; console.log(`✓ ${label} — ${flag} is genuinely enforced by check()`) }
    else { fail++; console.log(`✗ ${label} — ${flag}:true but check() still passes with ${field} off (hint promises a requirement it doesn't enforce)`) }
  }
}

console.log(`\n${pass} passed, ${fail} failed.`)
if (fail > 0) process.exit(1)
console.log('all Grade 7 challenge checks are satisfiable, non-vacuous, and match their own hint metadata')
