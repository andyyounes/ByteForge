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
// positions: several challenges check WHERE shapes were drawn, not just how
// many (g1s2 "Four Corners", g1s3 "Rectangle Room", g1s4 "Three in a Row") —
// the maximal log needs a shape actually sitting at every position any of
// them names, or this generic satisfiability test would wrongly flag a
// perfectly good position-aware check as unsatisfiable.
const maximalLog = () => ({ frames: 999, rects: 999, circles: 999, lines: 999, texts: 999, hasIf: true, hasVar: true, hasFunction: true,
  positions: [[20,20],[440,20],[20,220],[440,220], [220,130], [60,130],[240,130],[420,130]],
  // Story Studio's "page" stages (st1*) — a DOM preview, not the canvas —
  // check headings/paragraphs/links/buttons instead of shapes/frames.
  headings: 999, paragraphs: 999, links: 999, buttons: 999,
  // st2* (CSS styling) — bgColor/headingColor are non-empty strings when
  // set, align matches whichever value a stage's needsAlign names ('center'
  // for every st2 stage today), fontSize is a generous px value.
  bgColor: '#ffffff', headingColor: '#111111', align: 'center', fontSize: 999 })
const emptyLog   = () => ({ frames: 0,   rects: 0,   circles: 0,   lines: 0,   texts: 0,   hasIf: false, hasVar: false, hasFunction: false,
  positions: [],
  headings: 0, paragraphs: 0, links: 0, buttons: 0,
  bgColor: '', headingColor: '', align: '', fontSize: 0 })

for (const ch of CHALLENGES) {
  const label = `${ch.mod}/${ch.id}`

  if (ch.check(maximalLog())) { pass++; console.log(`✓ ${label} — satisfiable (maximal log passes)`) }
  else { fail++; console.log(`✗ ${label} — UNSATISFIABLE: even a maximal log fails check()`) }

  if (!ch.check(emptyLog())) { pass++; console.log(`✓ ${label} — not vacuous (empty log correctly fails)`) }
  else { fail++; console.log(`✗ ${label} — VACUOUS: an empty/no-op submission passes check()`) }

  const flags = ['needsVar', 'needsIf', 'needsFrames', 'needsFunction', 'needsHeadings', 'needsParagraphs', 'needsLinks', 'needsButtons',
    'needsBgColor', 'needsHeadingColor', 'needsAlign', 'needsFontSize']
  const fieldFor = { needsVar: 'hasVar', needsIf: 'hasIf', needsFrames: 'frames', needsFunction: 'hasFunction',
    needsHeadings: 'headings', needsParagraphs: 'paragraphs', needsLinks: 'links', needsButtons: 'buttons',
    needsBgColor: 'bgColor', needsHeadingColor: 'headingColor', needsAlign: 'align', needsFontSize: 'fontSize' }
  const numericFields = new Set(['frames', 'headings', 'paragraphs', 'links', 'buttons', 'fontSize'])
  const stringFields  = new Set(['bgColor', 'headingColor', 'align'])
  for (const flag of flags) {
    if (!ch[flag]) continue
    const log = maximalLog()
    const field = fieldFor[flag]
    // needsAlign carries the REQUIRED value (e.g. 'center'), not a boolean —
    // "off" here means a DIFFERENT value, not empty (an empty string would
    // also correctly fail, but testing a wrong-but-set value is the sharper
    // check that the requirement is actually compared, not just truthiness).
    if (flag === 'needsAlign') log[field] = ch[flag] === 'left' ? 'right' : 'left'
    else if (numericFields.has(field)) log[field] = 0
    else if (stringFields.has(field))  log[field] = ''
    else log[field] = false
    if (!ch.check(log)) { pass++; console.log(`✓ ${label} — ${flag} is genuinely enforced by check()`) }
    else { fail++; console.log(`✗ ${label} — ${flag}:true but check() still passes with ${field} off (hint promises a requirement it doesn't enforce)`) }
  }
}

// ── g1s2 "Four Corners" must actually check corner POSITIONS ─────────────────
// Was (log.rects + log.circles) >= 4 — a pure draw-call count with no position
// check at all, so a single shape drawn 4 times in the same spot (a circle()
// call wrapped in a 4x loop, never varying x/y) passed despite touching no
// corner. Confirmed live in a real browser before this fix: exactly this
// exploit marked the stage complete.
{
  const g1s2 = CHALLENGES.find(c => c.id === 'g1s2')
  if (g1s2) {
    const exploitLog = { rects: 0, circles: 4, lines: 0, texts: 0, hasIf: false, hasVar: false,
      positions: [[200,130],[200,130],[200,130],[200,130]] }   // 4 draws, same spot, no corner
    if (!g1s2.check(exploitLog)) { pass++; console.log('✓ g1s2 — rejects 4 shapes stacked in the center (not a corner)') }
    else { fail++; console.log('✗ g1s2 — STILL ACCEPTS 4 shapes stacked away from any corner') }

    const realLog = { rects: 0, circles: 4, lines: 0, texts: 0, hasIf: false, hasVar: false,
      positions: [[20,20],[440,20],[20,220],[440,220]] }
    if (g1s2.check(realLog)) { pass++; console.log('✓ g1s2 — accepts 4 shapes actually at the 4 corners') }
    else { fail++; console.log('✗ g1s2 — REJECTS a genuine 4-corner solution') }
  } else { fail++; console.log('✗ g1s2 not found') }
}

console.log(`\n${pass} passed, ${fail} failed.`)
if (fail > 0) process.exit(1)
console.log('all Grade 7 challenge checks are satisfiable, non-vacuous, and match their own hint metadata')
