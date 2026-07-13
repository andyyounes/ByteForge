// Verifies every Grade 9 mission: the reference solution passes, star pars are
// honest, and failure modes (miss / off-map) are detected by the pure simulator.
import { readFileSync } from 'fs'

const html = readFileSync('c:/Users/user/Downloads/ICT website/public/lessons/grade9-missions.html', 'utf8')
const s = html.indexOf('const MISSIONS = [')
const e = html.indexOf('// ═══', html.indexOf('function starsFor'))
const { MISSIONS, simTurtle, evalSuccess, starsFor } =
  new Function(html.slice(s, e) + '\nreturn { MISSIONS, simTurtle, evalSuccess, starsFor }')()

// Reference solutions: command lists that must pass at exactly par length.
// Add one entry per new mission — the test fails loudly if one is missing.
const SOLUTIONS = {
  p1m1: [['F', 320], ['L', 90], ['F', 200]],
}

let fail = 0
for (const m of MISSIONS) {
  const sol = SOLUTIONS[m.id]
  if (!sol) { fail++; console.log(`✗ ${m.id} — no reference solution`); continue }
  const sim = simTurtle(m.scene, sol)
  const v = evalSuccess(m, sim)
  if (!v.ok) { fail++; console.log(`✗ ${m.id} — reference solution FAILS (${v.why})`); continue }
  const moveCmds = sol.length
  if (moveCmds !== m.stars.par) {
    fail++; console.log(`✗ ${m.id} — par ${m.stars.par} but solution uses ${moveCmds} commands`); continue
  }
  if (starsFor(m, moveCmds) !== 3) { fail++; console.log(`✗ ${m.id} — par solution doesn't earn 3★`); continue }
  console.log(`✓ ${m.id} — ${m.title}: solution passes at par ${m.stars.par}`)
}

// Generic failure-mode checks on the first mission
const m0 = MISSIONS[0]
if (evalSuccess(m0, simTurtle(m0.scene, [['F', 40]])).ok) { fail++; console.log('✗ trivial flight should not pass') }
if (!simTurtle(m0.scene, [['F', 99999]]).lost) { fail++; console.log('✗ off-map flight not detected') }

console.log(fail ? `\n${fail} problems` : '\nall missions verified')
process.exit(fail ? 1 : 0)
