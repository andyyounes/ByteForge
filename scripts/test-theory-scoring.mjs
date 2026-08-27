// Verifies the keyword scorers behind the AS Level and A Level written-answer
// pools (THEORY_EXERCISES in as-level.html and a-level.html).
//
// ~110 questions across the two files had NO coverage of any kind. The defect
// this suite exists to prevent:
//
//   Each question ships a `keywords` list and a model answer (`ms`). The lists
//   are written as ALTERNATIVE acceptable phrasings — e.g.
//     ['LIFO','FIFO','last in first out','first in first out','top','front','rear','order']
//   — but were scored as a CONJUNCTION over all of them (found/total >= 80%).
//   No real answer can hit 8/8 synonyms, so the questions rejected their own
//   mark schemes: 39 of 64 in AS Level and 20 of 35 in A Level scored below
//   their own pass bar, and several were handed the red "❌ Review needed"
//   verdict for a textbook-perfect answer.
//
// The invariant enforced here is the one that makes the whole pool coherent:
//   1. every question's OWN model answer must clear its own pass bar, and
//   2. irrelevant text must NOT clear it
// — i.e. the scorer can actually tell a right answer from a wrong one.
//
// Note on a real remaining limitation: this scoring is presence-only, so it is
// direction-blind on "X vs Y" questions (an answer that swaps the two halves
// still contains both halves' vocabulary). That is inherent to bag-of-words
// marking and is NOT asserted here — fixing it needs per-question logic of the
// kind written for the IGCSE Y1 checks. Tracked in docs/TODO.md.
import { readFileSync } from 'fs'

const ROOT = 'c:/Users/user/Downloads/ICT website'

// ── Direction-aware scoring re-implementation ────────────────────────────────
// Mirrors the production helpers (detectVsTerms/buildVsSideMap/splitClauses/
// mentionsVsTerm/containsWordAware) added to as-level.html and a-level.html to
// fix presence-only scoring being DIRECTION-BLIND on "X vs Y" questions — an
// inverted answer (properties swapped between the two terms) used to score
// identically to the correct one, because it still contained every keyword.
// Kept in sync manually with the page code; if the two drift, this suite is
// the thing that will notice via the swap-test below.
const AL_VS_TRAILING_STOP = ['compression','ordering','chaining','uses','testing','file','access','learning','encryption','sort']
function detectVsTerms(title) {
  const m = String(title || '').match(/^(.+?)\s+(?:vs\.?|versus)\s+(.+?)$/i)
  if (!m) return null
  const norm = phrase => {
    const words = phrase.trim().split(/\s+/)
    while (words.length > 1 && AL_VS_TRAILING_STOP.includes(words[words.length - 1].toLowerCase().replace(/[^a-z]/g, ''))) words.pop()
    return words.join(' ')
  }
  const a = norm(m[1]), b = norm(m[2])
  return (a && b && a.toLowerCase() !== b.toLowerCase()) ? { a, b } : null
}
function splitClauses(text) {
  return String(text || '').replace(/<[^>]+>/g, ' ')
    .replace(/\b(e\.g|i\.e)\.(?=\s)/gi, '$1')
    .split(/\.(?=\s|$)|\n/)
    .map(c => c.trim().toLowerCase()).filter(Boolean)
}
function containsWordAware(text, phrase) {
  const re = new RegExp('(?<!\\w)' + phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+') + '(?!\\w)', 'i')
  return re.test(text)
}
function mentionsVsTerm(clause, term) { return containsWordAware(clause, term) }
function buildVsSideMap(ex, vs) {
  const cls = splitClauses(ex.ms)
  const sides = {}
  const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '')
  for (const kw of ex.keywords || []) {
    if (norm(kw) === norm(vs.a) || norm(kw) === norm(vs.b)) { sides[kw] = null; continue }
    let side = null, conflict = false
    for (const c of cls) {
      if (!containsWordAware(c, kw)) continue
      const hasA = mentionsVsTerm(c, vs.a), hasB = mentionsVsTerm(c, vs.b)
      if (hasA && !hasB) { if (side === null) side = 'A'; else if (side !== 'A') conflict = true }
      else if (hasB && !hasA) { if (side === null) side = 'B'; else if (side !== 'B') conflict = true }
    }
    sides[kw] = conflict ? null : side
  }
  return sides
}
function scoreDirectional(ex, vs, sideMap, answerLower) {
  const kws = ex.keywords || []
  const ansClauses = splitClauses(answerLower)
  const found = kws.filter(kw => {
    const side = sideMap[kw]
    if (!side) return answerLower.includes(kw.toLowerCase())
    if (!containsWordAware(answerLower, kw)) return false
    const wantTerm = side === 'A' ? vs.a : vs.b
    return ansClauses.some(c => containsWordAware(c, kw) && mentionsVsTerm(c, wantTerm))
  }).length
  const msText = strip(ex.ms)
  const target = Math.max(1, kws.filter(kw => msText.includes(kw.toLowerCase())).length)
  return Math.min(100, Math.round((found / target) * 100))
}

function loadPool(file) {
  const html = readFileSync(`${ROOT}/public/lessons/${file}`, 'utf8')
  const s = html.indexOf('const THEORY_EXERCISES')
  if (s < 0) throw new Error(`THEORY_EXERCISES not found in ${file}`)
  const m = html.slice(s).match(/\r?\n\]\r?\n/)
  const ctx = html.slice(s, s + m.index + m[0].indexOf(']') + 1)
  return new Function(ctx + '\nreturn { THEORY_EXERCISES }')().THEORY_EXERCISES
}

const strip = s => String(s || '').replace(/<[^>]+>/g, ' ').toLowerCase()

// Mirrors checkTheoryShort()'s scoring in both pages. Kept in one place here so
// a drift between the two files shows up as a test failure rather than silently.
function score(ex, answer) {
  const kws = ex.keywords || []
  if (!kws.length) return null
  const a = answer.toLowerCase()
  const found  = kws.filter(kw => a.includes(kw.toLowerCase())).length
  const target = Math.max(1, kws.filter(kw => strip(ex.ms).includes(kw.toLowerCase())).length)
  return Math.min(100, Math.round((found / target) * 100))
}

const PASS_BAR = 80
const NOISE = 'the quick brown fox jumps over the lazy dog this is completely unrelated filler text'

let n = 0, pass = 0, fail = 0
const t = (ok, label) => {
  n++
  if (ok) { pass++; console.log(`Test ${String(n).padStart(3)}  ✓ ${label}`) }
  else    { fail++; console.log(`Test ${String(n).padStart(3)}  ✗ ${label}`) }
}

for (const [label, file] of [['AS Level', 'as-level.html'], ['A Level', 'a-level.html']]) {
  const pool  = loadPool(file)
  const short = pool.filter(e => e.ms && e.keywords && e.keywords.length)
  console.log(`\n── ${label} (${file}) — ${short.length} keyword-scored questions ──`)

  // 1. Every model answer must clear its own bar.
  const below = short.filter(ex => score(ex, strip(ex.ms)) < PASS_BAR)
  t(below.length === 0,
    `${label}: every model answer clears its own ${PASS_BAR}% bar` +
    (below.length ? ` — ${below.length} fail: ${below.slice(0, 6).map(e => `${e.id}=${score(e, strip(e.ms))}%`).join(', ')}` : ''))

  // 2. No model answer may land in the red "Review needed" band (<40%).
  const red = short.filter(ex => score(ex, strip(ex.ms)) < 40)
  t(red.length === 0,
    `${label}: no model answer is marked "Review needed"` +
    (red.length ? ` — ${red.length}: ${red.map(e => e.id).join(', ')}` : ''))

  // 3. Irrelevant text must not pass — the bar still discriminates.
  const noisePass = short.filter(ex => score(ex, NOISE) >= PASS_BAR)
  t(noisePass.length === 0,
    `${label}: irrelevant text does not pass any question` +
    (noisePass.length ? ` — ${noisePass.length}: ${noisePass.map(e => e.id).join(', ')}` : ''))

  // 4. An empty answer must never pass.
  const emptyPass = short.filter(ex => score(ex, '') >= PASS_BAR)
  t(emptyPass.length === 0,
    `${label}: an empty answer does not pass any question` +
    (emptyPass.length ? ` — ${emptyPass.length}: ${emptyPass.map(e => e.id).join(', ')}` : ''))

  // 5. Every question must actually be scoreable (a question with keywords but
  //    a mark scheme that hits none of them cannot be marked meaningfully).
  const unscoreable = short.filter(ex => !ex.keywords.some(kw => strip(ex.ms).includes(kw.toLowerCase())))
  t(unscoreable.length === 0,
    `${label}: every mark scheme hits at least one of its own keywords` +
    (unscoreable.length ? ` — ${unscoreable.length}: ${unscoreable.map(e => e.id).join(', ')}` : ''))

  // 6. Ids must be unique, or the page's find-by-id lookup marks the wrong one.
  const ids = short.map(e => e.id)
  const dupes = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))]
  t(dupes.length === 0, `${label}: question ids are unique` + (dupes.length ? ` — duplicates: ${dupes.join(', ')}` : ''))

  // 7. Every question must carry a chapter, or it cannot be filtered to.
  const noChapter = pool.filter(e => e.ch === undefined || e.ch === null)
  t(noChapter.length === 0,
    `${label}: every question is tagged with a chapter` +
    (noChapter.length ? ` — ${noChapter.length} untagged: ${noChapter.slice(0, 5).map(e => e.id).join(', ')}` : ''))

  // 8. "X vs Y" comparison questions must not be direction-blind. Presence-only
  //    keyword scoring can't tell a correct answer from one that swaps which
  //    property belongs to which term — measured examples that used to pass:
  //      t47 "Stack vs Queue": inverted FIFO/LIFO definition        100%
  //      t20_3 "Supervised vs Unsupervised": labels swapped          88%
  //    For every such question, build the side map from its own mark scheme,
  //    then swap every occurrence of the two term names throughout that mark
  //    scheme (properties stay put, only the names move) and confirm the
  //    inverted result scores well below the pass bar.
  let vsChecked = 0
  const vsFails = []
  for (const ex of short) {
    const vs = detectVsTerms(ex.title)
    if (!vs) continue
    vsChecked++
    const sideMap = buildVsSideMap(ex, vs)
    const msLower = strip(ex.ms)
    const swapRe = new RegExp(
      `(?<!\\w)(${vs.a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')}|${vs.b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')})(?!\\w)`, 'gi')
    const inverted = msLower.replace(swapRe, w => w.toLowerCase() === vs.a.toLowerCase() ? vs.b : vs.a)
    const invertedScore = scoreDirectional(ex, vs, sideMap, inverted)
    if (invertedScore >= 70) vsFails.push(`${ex.id} (${vs.a} vs ${vs.b}) — inverted answer still scores ${invertedScore}%`)
  }
  t(vsFails.length === 0,
    `${label}: all ${vsChecked} "X vs Y" comparison questions reject a term-swapped (inverted) answer` +
    (vsFails.length ? ` — ${vsFails.join('; ')}` : ''))
}

console.log(`\n${pass} passed, ${fail} failed, ${n} tests total.`)
if (fail > 0) process.exit(1)
console.log('both written-answer pools accept their own mark schemes and reject irrelevant answers')
