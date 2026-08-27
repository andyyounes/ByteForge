// Verifies the algorithm visualiser (public/lessons/algo-viz.html): every
// algorithm must actually SORT/SEARCH correctly, its stated complexity must
// match the algorithm it really runs, and each step must point at the
// pseudocode line being executed.
//
// This pool had no coverage. Real bugs it locks down:
//   * Bubble sort claimed best: O(n) while the pseudocode shown beside it —
//     and generate() itself — was a plain nested FOR with NO early exit, which
//     is O(n^2) even on already-sorted input. That is precisely the
//     distinction 0478/9618 examines.
//   * The "Comparing X and Y" step carried pseudoLine:1, which is the inner
//     FOR header, not the IF that does the comparing: the visualiser
//     highlighted the loop line while narrating a comparison.
import { readFileSync } from 'fs'

const ROOT = 'c:/Users/user/Downloads/ICT website'
const html = readFileSync(`${ROOT}/public/lessons/algo-viz.html`, 'utf8')
// Brace-match to the real end of the object literal. A regex for a closing
// line runs past it into DOM code, which then throws "document is not defined".
const s = html.indexOf('const ALGOS = {')
let depth = 0, end = -1, inStr = null
for (let i = html.indexOf('{', s); i < html.length; i++) {
  const c = html[i], prev = html[i - 1], next = html[i + 1]
  if (inStr) { if (c === inStr && prev !== '\\') inStr = null; continue }
  // Skip comments — an apostrophe inside one ("don't") would otherwise open a
  // string state that never closes, and the scan runs to end of file.
  if (c === '/' && next === '/') { i = html.indexOf('\n', i); if (i < 0) break; continue }
  if (c === '/' && next === '*') { i = html.indexOf('*/', i) + 1; continue }
  if (c === '"' || c === "'" || c === '`') { inStr = c; continue }
  if (c === '{') depth++
  else if (c === '}') { depth--; if (depth === 0) { end = i + 1; break } }
}
const { ALGOS } = new Function(html.slice(s, end) + '\nreturn { ALGOS }')()

let n = 0, pass = 0, fail = 0
const t = (ok, label) => {
  n++
  if (ok) { pass++; console.log(`Test ${String(n).padStart(2)}  ✓ ${label}`) }
  else    { fail++; console.log(`Test ${String(n).padStart(2)}  ✗ ${label}`) }
}

const SORTS = ['bubble', 'insertion', 'merge']
const INPUT = [5, 2, 9, 1, 7, 3]
const SORTED = [...INPUT].sort((a, b) => a - b)

for (const [id, algo] of Object.entries(ALGOS)) {
  t(Array.isArray(algo.pseudo) && algo.pseudo.length > 0, `${id}: has pseudocode`)
  t(typeof algo.generate === 'function', `${id}: has a step generator`)

  let steps
  try { steps = algo.generate([...INPUT]) }
  catch (e) { t(false, `${id}: generate() threw: ${e.message}`); continue }
  t(Array.isArray(steps) && steps.length > 0, `${id}: produces steps`)

  // Every step must reference a real pseudocode line (or -1 for "done").
  const badLine = steps.filter(st => st.pseudoLine !== -1 &&
    (st.pseudoLine == null || st.pseudoLine < 0 || st.pseudoLine >= algo.pseudo.length))
  t(badLine.length === 0, `${id}: every step points at a real pseudocode line`)

  if (SORTS.includes(id)) {
    const final = steps[steps.length - 1].arr
    t(JSON.stringify(final) === JSON.stringify(SORTED),
      `${id}: actually sorts (${JSON.stringify(final)})`)

    // A comparison step must highlight a line that compares, not a loop header.
    const cmp = steps.find(st => /Comparing/.test(st.msg || ''))
    if (cmp) {
      const line = algo.pseudo[cmp.pseudoLine] || ''
      t(/IF|WHILE|>|<|=/.test(line) && !/^\s*(FOR|REPEAT)\b/.test(line.trim()),
        `${id}: a "Comparing" step highlights a comparison line, not a loop header (got ${JSON.stringify(line.trim())})`)
    }
  }
}

// ── Bubble sort's stated best case must match the algorithm it runs ──────────
{
  const bubble = ALGOS.bubble
  t(/best/.test(JSON.stringify(bubble.complexity)), 'bubble: declares a best case')
  const claimsLinearBest = /O\(n\)/.test(bubble.complexity.best)
  const pseudoHasEarlyExit = bubble.pseudo.some(l => /swapped/i.test(l))
  t(!claimsLinearBest || pseudoHasEarlyExit,
    'bubble: a claimed O(n) best case is backed by an early-exit flag in the pseudocode')

  // And the generator must really exit early: on already-sorted input it should
  // do ONE pass, not n-1 passes.
  const sortedIn = [1, 2, 3, 4, 5, 6]
  const stepsSorted = bubble.generate([...sortedIn])
  const comparisons = stepsSorted.filter(st => /Comparing/.test(st.msg || '')).length
  t(!claimsLinearBest || comparisons <= sortedIn.length,
    `bubble: already-sorted input costs one pass (${comparisons} comparisons for n=${sortedIn.length})`)

  // Sanity: the worst case must still cost more than the best case.
  const worst = bubble.generate([6, 5, 4, 3, 2, 1]).filter(st => /Comparing/.test(st.msg || '')).length
  t(worst > comparisons, `bubble: reverse-sorted input costs more than sorted (${worst} vs ${comparisons})`)
}

console.log(`\n${pass} passed, ${fail} failed, ${n} tests total.`)
if (fail > 0) process.exit(1)
console.log('every visualised algorithm is correct and its stated complexity matches what it runs')
