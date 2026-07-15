// Verifies every Grade 9 mission: reference solutions pass, star pars are
// honest in BOTH languages, and failure modes (miss / crash / off-map /
// missed waypoints) are detected. Also unit-tests the pseudocode executor.
import { readFileSync } from 'fs'

const html = readFileSync('c:/Users/user/Downloads/ICT website/public/lessons/grade9-missions.html', 'utf8')
const s = html.indexOf('const MISSIONS = [')
const e = html.indexOf('// ═══', html.indexOf('function execPseudo'))
const { MISSIONS, simTurtle, evalSuccess, starsFor, countLines, checkRequire, execPseudo } =
  new Function(html.slice(s, e)
    + '\nreturn { MISSIONS, simTurtle, evalSuccess, starsFor, countLines, checkRequire, execPseudo }')()

let fail = 0
const bad = m => { fail++; console.log('✗ ' + m) }
const ok = m => console.log('✓ ' + m)

// ── Reference COMMAND solutions (must pass; par-checked when metric is cmds) ──
const SOLUTIONS = {
  p1m1: [['F', 320], ['L', 90], ['F', 200]],
  p1m2: [['L', 90], ['F', 160], ['R', 90], ['F', 440], ['R', 90], ['F', 160]],
  p1m3: [['F', -240]],
  p1m4: [['F', 160], ['L', 90], ['F', 160], ['L', 90], ['F', 160], ['L', 90], ['F', 160], ['L', 90]],
  p1m5: Array.from({ length: 5 }, () => [['F', 40], ['L', 90], ['F', 40], ['R', 90]]).flat(),
  p1m6: [['F', 40], ['L', 90], ['F', 80], ['L', 90], ['F', 120], ['L', 90], ['F', 160], ['L', 90], ['F', 200], ['L', 90], ['F', 240]],
  p1m7: Array.from({ length: 6 }, () => [['F', 120], ['L', 60]]).flat(),
  p1m8: [['F', 120], ['L', 90], ['F', 120], ['R', 90], ['F', 120], ['L', 90], ['F', 120]],
  p1m9: [['F', 120], ['R', 90], ['F', 120], ['F', 120], ['L', 90], ['F', 120], ['F', 120]],
  p1m10: [['F', 160], ['R', 90], ['F', 80], ['L', 90], ['F', 120], ['R', 90], ['F', 80], ['L', 90], ['F', 120], ['R', 90]],
  p1m11: [['F', 160], ['L', 90], ['F', 160], ['R', 90], ['F', 160], ['L', 90], ['F', 160]],
}

for (const m of MISSIONS) {
  const sol = SOLUTIONS[m.id]
  if (!sol) { bad(m.id + ' — no reference solution'); continue }
  const sim = simTurtle(m.scene, sol)
  const v = evalSuccess(m, sim)
  if (!v.ok) { bad(m.id + ' — reference solution FAILS (' + v.why + (v.dist ? ' ' + v.dist + 'px' : '') + ')'); continue }
  if ((m.stars.metric || 'cmds') === 'cmds') {
    if (sol.length !== m.stars.par) { bad(m.id + ' — par ' + m.stars.par + ' but solution uses ' + sol.length + ' commands'); continue }
    if (starsFor(m, { cmds: sol.length, lines: 999 }) !== 3) { bad(m.id + ' — par solution does not earn 3★'); continue }
  }
  ok(m.id + ' — ' + m.title + ': solution passes' + (m.stars.metric === 'lines' ? '' : ' at par ' + m.stars.par))
}

// ── Par honesty for line-metric missions: real sources in BOTH languages ──────
const PY_SOURCES = {
  p1m4: 'for i in range(4):\n    forward(160)\n    left(90)\n',
  p1m5: 'for i in range(5):\n    forward(40)\n    left(90)\n    forward(40)\n    right(90)\n',
  p1m6: 'for i in range(1, 7):\n    forward(40 * i)\n    left(90)\n',
  p1m7: 'for i in range(6):\n    forward(120)\n    left(60)\n',
  p1m8: "for s in get_signals():\n    forward(120)\n    if s == 'G':\n        left(90)\n    else:\n        right(90)\n\nforward(120)\n",
  p1m9: "for s in get_signals():\n    forward(120)\n    if s == 'R':\n        right(90)\n    elif s == 'G':\n        left(90)\n\nforward(120)\n",
  p1m10: 'for i, d in enumerate(get_signals()):\n    forward(d * 40)\n    if i % 2 == 0:\n        right(90)\n    else:\n        left(90)\n',
}
const PS_SOURCES = {
  p1m4: 'FOR i ← 1 TO 4\nforward(160)\nleft(90)\nNEXT i',
  p1m5: 'FOR i ← 1 TO 5\nforward(40)\nleft(90)\nforward(40)\nright(90)\nNEXT i',
  p1m6: 'FOR i ← 1 TO 6\nforward(40 * i)\nleft(90)\nNEXT i',
  p1m7: 'FOR i ← 1 TO 6\nforward(120)\nleft(60)\nNEXT i',
  p1m8: "FOR i ← 1 TO LENGTH(signals)\nforward(120)\nIF signals[i] = 'G' THEN\nleft(90)\nELSE\nright(90)\nENDIF\nNEXT i\nforward(120)",
  p1m9: "FOR i ← 1 TO LENGTH(signals)\nforward(120)\nIF signals[i] = 'R' THEN\nright(90)\nELSE\nIF signals[i] = 'G' THEN\nleft(90)\nENDIF\nENDIF\nNEXT i\nforward(120)",
  p1m10: 'FOR i ← 1 TO LENGTH(signals)\nd ← signals[i]\nforward(d * 40)\nIF i MOD 2 = 1 THEN\nright(90)\nELSE\nleft(90)\nENDIF\nNEXT i',
}
for (const m of MISSIONS.filter(x => x.stars.metric === 'lines')) {
  const py = PY_SOURCES[m.id], ps = PS_SOURCES[m.id]
  if (!py || !ps) { bad(m.id + ' — missing line-metric reference source'); continue }
  let good = true
  // Python source: line count within par + passes the require check
  if (countLines(py) > m.stars.par) { bad(m.id + ' — py solution needs ' + countLines(py) + ' lines, par is ' + m.stars.par); good = false }
  if (checkRequire(m, py)) { bad(m.id + ' — py solution fails its own require check'); good = false }
  // Pseudocode source: executes, matches the command solution, fits par
  const res = execPseudo(ps, m)
  if (!res.ok) { bad(m.id + ' — ps solution errors: ' + res.error + ' (line ' + res.line + ')'); good = false }
  else {
    const v = evalSuccess(m, simTurtle(m.scene, res.cmds))
    if (!v.ok) { bad(m.id + ' — ps solution fails the mission (' + v.why + ')'); good = false }
    if (countLines(ps) > m.stars.par) { bad(m.id + ' — ps solution needs ' + countLines(ps) + ' lines, par is ' + m.stars.par); good = false }
    if (checkRequire(m, ps)) { bad(m.id + ' — ps solution fails its own require check'); good = false }
  }
  if (good) ok(m.id + ' — line-metric pars honest in both languages (py ' + countLines(py) + ', ps ' + countLines(ps) + ' ≤ ' + m.stars.par + ')')
}

// ── Failure modes ─────────────────────────────────────────────────────────────
const m1 = MISSIONS.find(m => m.id === 'p1m1')
if (evalSuccess(m1, simTurtle(m1.scene, [['F', 40]])).ok) bad('trivial flight should not pass')
if (!simTurtle(m1.scene, [['F', 99999]]).lost) bad('off-map flight not detected')
const m2 = MISSIONS.find(m => m.id === 'p1m2')
if (!simTurtle(m2.scene, [['F', 440]]).crash) bad('asteroid crash not detected on p1m2')
const m4 = MISSIONS.find(m => m.id === 'p1m4')
const partial = evalSuccess(m4, simTurtle(m4.scene, [['F', 160], ['L', 90], ['F', 160]]))
if (partial.ok || partial.why !== 'waypoints') bad('partial patrol should fail with missed waypoints')
const m11 = MISSIONS.find(m => m.id === 'p1m11')
if (!simTurtle(m11.scene, [['F', 160], ['F', 160]]).crash) bad('capstone wall should stop the direct route')
ok('failure modes: miss, off-map, crash, missed waypoints, capstone wall')

// ── Pseudocode executor unit checks ───────────────────────────────────────────
const psErr = execPseudo('forward(40)\nbanana(3)', m1)
if (psErr.ok || psErr.line !== 2) bad('ps executor: unknown command should error on line 2, got ' + JSON.stringify(psErr))
else ok('ps executor: unknown command reported with line number')
const psLoop = execPseudo('FOR i ← 1 TO 3\nforward(10 * i)\nNEXT i', m1)
if (!psLoop.ok || JSON.stringify(psLoop.cmds) !== JSON.stringify([['F', 10], ['F', 20], ['F', 30]]))
  bad('ps executor: loop variable arithmetic wrong: ' + JSON.stringify(psLoop))
else ok('ps executor: FOR loop with loop-variable arithmetic')
const psInf = execPseudo('FOR i ← 1 TO 3 STEP 0\nforward(1)\nNEXT i', m1)
if (psInf.ok) bad('ps executor: STEP 0 should be rejected')
else ok('ps executor: STEP 0 rejected')
const psOut = execPseudo("x ← 5\nOUTPUT x * 2\nforward(x)", m1)
if (!psOut.ok || psOut.outputs[0] !== '10') bad('ps executor: OUTPUT broken: ' + JSON.stringify(psOut))
else ok('ps executor: assignment + OUTPUT')
const m8 = MISSIONS.find(m => m.id === 'p1m8')
const psIdx = execPseudo("IF signals[1] = 'G' THEN\nforward(1)\nELSE\nforward(2)\nENDIF", m8)
if (!psIdx.ok || psIdx.cmds[0][1] !== 1) bad('ps executor: 1-based signals indexing broken: ' + JSON.stringify(psIdx))
else ok('ps executor: 1-based array indexing + IF/ELSE')

console.log(fail ? '\n' + fail + ' problems' : '\nall missions verified — both engines honest')
process.exit(fail ? 1 : 0)
