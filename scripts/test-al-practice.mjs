// Verifies A Level's PRACTICE_EXERCISES pool (30 exercises), which had no
// coverage at all. Pressing Run on a starter must never produce a confusing
// error: either it is valid 9618 pseudocode and executes, or it is recognised
// as a non-pseudocode task and the student is told what to do instead.
//
// Real bugs this locks down:
//   * a01 "Big-O of a Loop" looped `FOR i <- 1 TO n` with n never declared, so
//     the very first Run failed with "Variable 'n' not declared".
//   * a02 "Hash Index Calculation" used PYTHON's `FOR key IN [25, 36, 47]`.
//     The FOR regex ate the leading 'k' and the student was shown
//     "Variable 'ey' is not declared" — a name they never typed.
//   * Seven exercises are SQL, OOP/CLASS or transaction tasks, but Run fed them
//     to the pseudocode interpreter, which can only fail. Students saw parse
//     errors pointing at a SQL comment ("Unsupported statement:
//     -- Write your SQL here"). They are now detected and explained.
import { readFileSync } from 'fs'

const ROOT = 'c:/Users/user/Downloads/ICT website'
const html = readFileSync(`${ROOT}/public/lessons/a-level.html`, 'utf8')
const BS = String.fromCharCode(92)

const s1 = html.indexOf('const KEYWORDS = new Set([')
const e1 = html.indexOf('CodeMirror.defineSimpleMode')
const Interpreter = new Function(html.slice(s1, e1) + '\nreturn Interpreter')()

// The page's own non-pseudocode guard, so this test tracks the real behaviour.
const gs = html.indexOf('function p2NonPseudoKind')
const ge = html.indexOf('\n}', gs) + 2
const p2NonPseudoKind = new Function(html.slice(gs, ge) + '\nreturn p2NonPseudoKind')()

function arrayLiteral(opener) {
  const s = html.indexOf(opener)
  const st = html.indexOf('[', s)
  let d = 0, end = -1, q = null
  for (let i = st; i < html.length; i++) {
    const c = html[i], p = html[i - 1], nx = html[i + 1]
    if (q) { if (c === q && p !== BS) q = null; continue }
    if (c === '/' && nx === '/') { i = html.indexOf('\n', i); if (i < 0) break; continue }
    if (c === '"' || c === "'" || c === '`') { q = c; continue }
    if (c === '[') d++
    else if (c === ']') { d--; if (d === 0) { end = i + 1; break } }
  }
  return new Function('return ' + html.slice(st, end))()
}
const PRACTICE = arrayLiteral('const PRACTICE_EXERCISES')

let n = 0, pass = 0, fail = 0
const t = (ok, label) => {
  n++
  if (ok) { pass++; console.log(`Test ${String(n).padStart(2)}  ✓ ${label}`) }
  else    { fail++; console.log(`Test ${String(n).padStart(2)}  ✗ ${label}`) }
}

t(PRACTICE.length > 0, `found ${PRACTICE.length} practice exercises`)

let ran = 0, guarded = 0
for (const ex of PRACTICE) {
  const label = `${ex.id} ${String(ex.title).slice(0, 30)}`
  const kind = p2NonPseudoKind(ex.starter || '')
  if (kind) {
    guarded++
    t(!!kind.hint, `${label} — recognised as a ${kind.kind} exercise, with guidance`)
    continue
  }
  try {
    new Interpreter().run(String(ex.starter).replace(/<-/g, '\u2190'), [])
    ran++
    t(true, `${label} — starter runs without crashing`)
  } catch (e) {
    t(false, `${label} — starter CRASHES: ${e?.message ?? e}`)
  }
}

// Every exercise must state an expected answer, or it cannot be self-marked.
const noExpected = PRACTICE.filter(e => !String(e.expected || '').trim())
t(noExpected.length === 0,
  `every exercise states an expected answer${noExpected.length ? ` — missing on ${noExpected.map(e => e.id).join(', ')}` : ''}`)

// Ids must be unique — the loader finds exercises by id.
const ids = PRACTICE.map(e => e.id)
const dupes = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))]
t(dupes.length === 0, `exercise ids are unique${dupes.length ? ` — duplicates: ${dupes.join(', ')}` : ''}`)

// a02 specifically must produce the answer it claims.
{
  const a02 = PRACTICE.find(e => e.id === 'a02')
  if (a02) {
    const out = new Interpreter().run(String(a02.starter).replace(/<-/g, '\u2190'), []).output
    const flat = out.join(' ').replace(/\s/g, '')
    const want = String(a02.expected).replace(/\s/g, '').split(',')
    t(want.every(w => flat.includes(w)),
      `a02 produces its stated answer (${JSON.stringify(out)})`)
  }
}

console.log(`\n${ran} run as pseudocode, ${guarded} guarded as non-pseudocode`)
console.log(`${pass} passed, ${fail} failed, ${n} tests total.`)
if (fail > 0) process.exit(1)
console.log('no practice starter crashes: each either executes or explains what it is')
