// Verifies every IGCSE Y1 challenge's check(ans) predicate is non-vacuous.
// Unlike Grade 6-8 (whose stage data structurally IS a correct answer) or
// AS/A-Level's Code Lab (hand-authored reference pseudocode solutions run
// through the real interpreter), IGCSE Y1's 20 challenges each accept a
// free-typed text answer via ad-hoc per-exercise check(ans) logic (numeric
// tolerance, case-insensitive string match, accepted alternate-answer
// arrays, etc.) with no separate canonical "answer" field to extract and no
// realistic way to auto-derive one from the check body's source without real
// per-exercise authoring — that's tracked as follow-up work, not attempted
// here. (Y2's CHALLENGES use a completely different shape — check(code, res)
// run through a real pseudocode interpreter — so it has its own dedicated
// script: scripts/test-igcse-y2-challenges.mjs.)
//
// What generalizes with zero per-exercise authoring, and is still a real,
// valuable regression: every check must correctly REJECT a blank submission
// and an obviously-wrong one. This is exactly the class of bug already found
// in Grade 8 (an unmodified/empty submission silently passing) — cheap to
// test everywhere, and worth having even without a positive-path test.
import { readFileSync } from 'fs'

const html = readFileSync('c:/Users/user/Downloads/ICT website/public/lessons/igcse-y1.html', 'utf8')
const s = html.indexOf('const CHALLENGES = [')
const m = html.slice(s).match(/\r?\n\]\r?\n/) // the array closes on its own bare "]" line, no semicolon
const ctx = html.slice(s, s + m.index + m[0].indexOf(']') + 1)
const { CHALLENGES } = new Function(ctx + '\nreturn { CHALLENGES }')()

console.log(`Found ${CHALLENGES.length} IGCSE Y1 challenges.\n`)

let pass = 0, fail = 0
for (const ch of CHALLENGES) {
  const id = `${ch.mod}/${ch.name}`
  for (const bad of ['', 'zzz_definitely_wrong_answer_12345']) {
    try {
      if (!ch.check(bad)) { pass++; console.log(`✓ ${id} — correctly rejects "${bad || '(blank)'}"`) }
      else { fail++; console.log(`✗ ${id} — VACUOUS: "${bad || '(blank)'}" passes check()`) }
    } catch (err) {
      // a check() that throws on bad input (e.g. calling .toUpperCase() on something
      // parseFloat-shaped) is still correctly NOT passing — that's a crash-safety
      // gap worth knowing about, but not a false-positive risk, so count it as pass
      // with a note rather than a hard failure.
      pass++
      console.log(`✓ ${id} — rejects "${bad || '(blank)'}" (throws: ${err.message}) — consider guarding check() against non-numeric input`)
    }
  }
}

console.log(`\n${pass} passed, ${fail} failed.`)
if (fail > 0) process.exit(1)
console.log('\nall IGCSE Y1 challenge checks correctly reject blank/garbage answers')
console.log('(NOTE: no positive/correct-answer path is tested here — see the file header comment)')
