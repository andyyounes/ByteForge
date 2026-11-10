// Verifies every Grade 9 mission: reference solutions pass, star pars are
// honest in BOTH languages, and failure modes (miss / crash / off-map /
// missed waypoints) are detected. Also unit-tests the pseudocode executor.
import { readFileSync } from 'fs'

const html = readFileSync('c:/Users/user/Downloads/ICT website/public/lessons/grade9-missions.html', 'utf8')
const s = html.indexOf('const MISSIONS = [')
const e = html.indexOf('// ═══', html.indexOf('function execPseudo'))
// Session 6's tournament engine sits after runBattleSim/battleEnvFor/dataEnvFor
// but before the DOM-touching UI code — extend the slice to include it.
const e6 = html.indexOf('// ═══', html.indexOf('function runBracketHeadless') + 40)
const {
  MISSIONS, simTurtle, evalSuccess, starsFor, countLines, checkRequire, execPseudo,
  simBattleTurn, runBattleSim, battleEnvFor, dataEnvFor, evalDataSuccess,
  resolveDuelTurn, execTurnForBot, runDuel, runBracketHeadless, DUEL_CONFIG, PRACTICE_BOTS,
} = new Function(html.slice(s, e6)
    + '\nreturn { MISSIONS, simTurtle, evalSuccess, starsFor, countLines, checkRequire, execPseudo, '
    + 'simBattleTurn, runBattleSim, battleEnvFor, dataEnvFor, evalDataSuccess, '
    + 'resolveDuelTurn, execTurnForBot, runDuel, runBracketHeadless, DUEL_CONFIG, PRACTICE_BOTS }')()

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
  if (m.type === 'battle' || m.type === 'data' || m.type === 'learn' || m.type === 'cards' || m.type === 'flowchart') continue   // validated separately, below (learn/cards/flowchart bubbles have no code/solution at all)
  if (m.type === 'quiz') {
    // Quiz bubbles have no turtle solution — instead verify every question
    // is actually answerable and unambiguous: 2+ distinct options, and the
    // marked answer is one of them (catches a typo'd answer that would
    // silently make a question impossible to pass).
    const qs = m.quiz?.questions || []
    if (!qs.length) { bad(m.id + ' — quiz has no questions'); continue }
    let okQuiz = true
    qs.forEach((q, i) => {
      const opts = q.options || []
      if (new Set(opts).size < 2) { bad(m.id + ` — Q${i + 1} has fewer than 2 distinct options`); okQuiz = false }
      if (!opts.includes(q.answer)) { bad(m.id + ` — Q${i + 1}'s answer "${q.answer}" is not among its own options`); okQuiz = false }
    })
    if (okQuiz) ok(m.id + ' — ' + qs.length + ' quiz question(s), each answerable and unambiguous')
    continue
  }
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
for (const m of MISSIONS.filter(x => x.stars && x.stars.metric === 'lines')) {
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

// ── INT()/REAL()/STR() — Cambridge pseudocode conversion functions ───────────
// Did not exist at all before this (only LENGTH/ROUND/SUM did) — a real
// engine gap, surfaced live when a student tried answer(STRING(x)) in p0m5
// and hit "Unknown function". Each case below is verified against the real
// execPseudo(), not just inspected.
{
  const r = execPseudo('x <- "7"\nOUTPUT INT(x) + 1', m1)
  if (!r.ok || r.outputs[0] !== '8') bad('INT(): numeric string parse broken: ' + JSON.stringify(r))
  else ok('INT(): parses a numeric STRING and adds correctly')
}
{
  const r = execPseudo('OUTPUT INT(7.9)', m1)
  if (!r.ok || r.outputs[0] !== '7') bad('INT(): REAL truncation broken: ' + JSON.stringify(r))
  else ok('INT(): truncates a REAL toward zero (7.9 -> 7)')
}
{
  const r = execPseudo('OUTPUT REAL("3.5") + 1', m1)
  if (!r.ok || r.outputs[0] !== '4.5') bad('REAL(): numeric string parse broken: ' + JSON.stringify(r))
  else ok('REAL(): parses a decimal STRING and keeps the decimal')
}
{
  const r = execPseudo('n <- 42\nOUTPUT STR(n) + " items"', m1)
  if (!r.ok || r.outputs[0] !== '42 items') bad('STR(): number-to-string conversion broken: ' + JSON.stringify(r))
  else ok('STR(): converts a number to STRING and concatenates correctly')
}
{
  const r = execPseudo('OUTPUT INT("banana")', m1)
  if (r.ok) bad('INT(): should reject a non-numeric string, not silently succeed: ' + JSON.stringify(r))
  else ok('INT(): correctly errors on a non-numeric string instead of silently returning NaN')
}

// ── Phase 2 tutorial battles: pure combat resolution engine ───────────────────
function constExec(action) { return async () => ({ ok: true, action }) }

for (const id of ['p2m1', 'p2m2']) {
  const m = MISSIONS.find(x => x.id === id)
  const target = m.battle.enemies[0].id
  const res = await runBattleSim(m, constExec({ type: 'attack', target }))
  if (!res.ok || res.outcome !== 'win') { bad(id + ' — always-attack strategy should win, got ' + (res.outcome || res.error)); continue }
  if (res.turns !== m.stars.par) { bad(id + ' — par ' + m.stars.par + ' turns but always-attack wins in ' + res.turns); continue }
  if (starsFor(m, { turns: res.turns }) !== 3) { bad(id + ' — par turns should earn 3★'); continue }
  ok(id + ' — ' + m.title + ': always-attack wins in ' + res.turns + ' turns (par)')
}

{
  const m = MISSIONS.find(x => x.id === 'p2m1')
  const res = await runBattleSim(m, constExec({ type: 'wait' }))
  if (res.outcome === 'win') bad('p2m1 — pure waiting should never win against a passive drone')
  else ok('p2m1 — pure waiting correctly stalls (outcome: ' + res.outcome + ')')
}
{
  const m = MISSIONS.find(x => x.id === 'p2m2')
  const res = await runBattleSim(m, constExec({ type: 'wait' }))
  if (res.outcome !== 'loss') bad('p2m2 — pure waiting should lose to counter-fire, got ' + res.outcome)
  else ok('p2m2 — pure waiting correctly loses in ' + res.turns + ' turns (' + m.battle.playerHp + 'hp vs ' + m.battle.enemies[0].attack + '/turn)')
}
{
  const m = MISSIONS.find(x => x.id === 'p2m1')
  const state = { turn: 1, playerHp: 100, enemies: m.battle.enemies.map(e => ({ ...e, maxHp: e.hp })) }
  const r = simBattleTurn(state, { type: 'attack', target: 'ghost' }, m)
  if (!r.events.some(ev => ev.kind === 'invalidTarget')) bad('invalid target should surface as an event, not throw')
  else ok('invalid target handled as a harmless no-op event')
}
{
  // A killed enemy must not retaliate the turn it dies (order: player acts, then survivors act)
  const m = MISSIONS.find(x => x.id === 'p2m2')
  const state = { turn: 3, playerHp: 80, enemies: [{ id: 'e1', name: 'Armed Sentinel', hp: 20, maxHp: 60, attack: 12, dist: 4 }] }
  const r = simBattleTurn(state, { type: 'attack', target: 'e1' }, m)
  if (r.playerHp !== 80 || !r.win) bad('killing blow should not take retaliation damage: ' + JSON.stringify(r))
  else ok('lethal hit prevents that enemy\'s retaliation the same turn')
}

// ── Pseudocode battle engine, executed turn-by-turn like the real page does ───
function simulateWithPseudo(mission, src) {
  let state = { turn: 1, playerHp: mission.battle.playerHp,
                enemies: mission.battle.enemies.map(e => ({ ...e, maxHp: e.hp })) }
  const maxTurns = mission.battle.maxTurns || 20
  while (state.turn <= maxTurns) {
    const res = execPseudo(src, mission, battleEnvFor(mission, state))
    if (!res.ok) return { outcome: 'error', error: res.error, line: res.line }
    const result = simBattleTurn(state, res.action, mission)
    state = { turn: state.turn + 1, playerHp: result.playerHp, enemies: result.enemies }
    if (result.win) return { outcome: 'win', turns: state.turn - 1 }
    if (result.loss) return { outcome: 'loss', turns: state.turn - 1 }
  }
  return { outcome: 'timeout', turns: maxTurns }
}
for (const id of ['p2m1', 'p2m2']) {
  const m = MISSIONS.find(x => x.id === id)
  const r = simulateWithPseudo(m, 'attack(enemyId[1])')
  if (r.outcome !== 'win' || r.turns !== m.stars.par)
    bad(id + ' — ps battle script should win in ' + m.stars.par + ' turns, got ' + r.outcome + '/' + r.turns + (r.error ? ' (' + r.error + ')' : ''))
  else ok(id + ' — pseudocode battle script (attack(enemyId[1])) wins in ' + r.turns + ' turns (par)')
}
{
  const m = MISSIONS.find(x => x.id === 'p2m1')
  const bad1 = execPseudo('forward(10)', m, battleEnvFor(m, { turn: 1, playerHp: 100, enemies: m.battle.enemies.map(e => ({ ...e, maxHp: e.hp })) }))
  if (bad1.ok) bad('battle mode should not expose forward() — turtle commands must be unavailable')
  else ok('battle mode correctly rejects turtle-only commands (forward)')
}

// ── Session 4: FUNCTION/PROCEDURE pseudocode support (unit tests) ─────────────
const P2M1 = MISSIONS.find(m => m.id === 'p2m1')   // any battle mission works as the harness
function freshBattleState(m) {
  return { turn: 1, playerHp: m.battle.playerHp, enemies: m.battle.enemies.map(e => ({ ...e, maxHp: e.hp })) }
}
{
  const src = 'FUNCTION Double(n) RETURNS INTEGER\n    RETURN n * 2\nENDFUNCTION\n\n'
    + 'x ← Double(5)\nOUTPUT x\nattack(enemyId[1])'
  const r = execPseudo(src, P2M1, battleEnvFor(P2M1, freshBattleState(P2M1)))
  if (!r.ok || r.outputs[0] !== '10') bad('FUNCTION with RETURN: expected OUTPUT 10, got ' + JSON.stringify(r))
  else ok('FUNCTION with RETURN and a parameter computes correctly')
}
{
  const src = 'PROCEDURE Greet()\n    attack(enemyId[1])\nENDPROCEDURE\n\nCALL Greet()'
  const r = execPseudo(src, P2M1, battleEnvFor(P2M1, freshBattleState(P2M1)))
  if (!r.ok || r.action.type !== 'attack') bad('PROCEDURE + CALL: expected an attack action, got ' + JSON.stringify(r))
  else ok('PROCEDURE definition + CALL executes its body')
}
{
  // Local params must not leak into / collide with the outer scope
  const src = 'FUNCTION Pick(id) RETURNS STRING\n    RETURN id\nENDFUNCTION\n\n'
    + 'id ← Pick(enemyId[1])\nattack(id)'
  const r = execPseudo(src, P2M1, battleEnvFor(P2M1, freshBattleState(P2M1)))
  if (!r.ok || r.action.target !== P2M1.battle.enemies[0].id)
    bad('local parameter scoping broken: ' + JSON.stringify(r))
  else ok('function parameters are locally scoped, no leakage into the caller')
}
{
  // Battle state (selfHp etc.) must stay visible INSIDE a user function without being passed in
  const src = 'FUNCTION ReadHp() RETURNS INTEGER\n    RETURN selfHp\nENDFUNCTION\n\n'
    + 'OUTPUT ReadHp()\nattack(enemyId[1])'
  const st = freshBattleState(P2M1)
  const r = execPseudo(src, P2M1, battleEnvFor(P2M1, st))
  if (!r.ok || r.outputs[0] !== String(st.playerHp))
    bad('outer/battle state should be visible inside a function: ' + JSON.stringify(r))
  else ok('battle state variables are visible inside user-defined functions')
}
{
  const src = 'FUNCTION Bad() RETURNS INTEGER\n    x ← 1\nENDFUNCTION\n\nOUTPUT Bad()'
  const r = execPseudo(src, P2M1, battleEnvFor(P2M1, freshBattleState(P2M1)))
  if (r.ok) bad('a FUNCTION that never RETURNs should error')
  else ok('a FUNCTION falling through without RETURN is a clear error')
}
{
  const src = 'FUNCTION Add(a, b) RETURNS INTEGER\n    RETURN a + b\nENDFUNCTION\n\nOUTPUT Add(1)'
  const r = execPseudo(src, P2M1, battleEnvFor(P2M1, freshBattleState(P2M1)))
  if (r.ok) bad('calling a function with the wrong argument count should error')
  else ok('wrong argument count is rejected')
}
{
  const r = execPseudo('RETURN 5', P2M1, battleEnvFor(P2M1, freshBattleState(P2M1)))
  if (r.ok) bad('RETURN outside any function/procedure should error, not silently succeed')
  else ok('RETURN outside a function is rejected with a clear message')
}
{
  // Recursion: the call stack (scopes.push/pop) must support a function calling itself
  const src = 'FUNCTION Fact(n) RETURNS INTEGER\n    IF n <= 1 THEN\n        RETURN 1\n    ENDIF\n'
    + '    RETURN n * Fact(n - 1)\nENDFUNCTION\n\nOUTPUT Fact(5)\nattack(enemyId[1])'
  const r = execPseudo(src, P2M1, battleEnvFor(P2M1, freshBattleState(P2M1)))
  if (!r.ok || r.outputs[0] !== '120') bad('recursive FUNCTION broken: ' + JSON.stringify(r))
  else ok('recursive function calls work (scope stack pushes/pops correctly)')
}

// ── checkRequire('function') ───────────────────────────────────────────────────
{
  const noFn = checkRequire({ require: 'function' }, 'attack(enemyId[1])')
  if (!noFn) bad('checkRequire should reject code with no function/def at all')
  else ok('checkRequire(function) rejects code with no function defined')
}
{
  const uncalled = checkRequire({ require: 'function' }, 'def pick():\n    return "e1"\nattack("e1")')
  if (!uncalled) bad('checkRequire should reject a defined-but-never-called function')
  else ok('checkRequire(function) rejects a function that is defined but never called')
}
{
  const good = checkRequire({ require: 'function' }, 'def pick():\n    return "e1"\nattack(pick())')
  if (good) bad('checkRequire should accept a defined AND called function: ' + good)
  else ok('checkRequire(function) accepts a defined-and-called function')
}
{
  const goodPs = checkRequire({ require: 'function' }, 'FUNCTION Pick() RETURNS STRING\n    RETURN enemyId[1]\nENDFUNCTION\n\nattack(Pick())')
  if (goodPs) bad('checkRequire should accept pseudocode FUNCTION+call: ' + goodPs)
  else ok('checkRequire(function) accepts pseudocode FUNCTION definitions too')
}

// ── Session 4: defend() and shield mechanics (pure combat resolution) ─────────
{
  // defend() halves ALL incoming damage, rounded down, and deals no damage itself
  const mission = { battle: { playerAttack: 20 } }
  const state = { turn: 1, playerHp: 100, enemies: [{ id: 'e1', name: 'X', hp: 50, maxHp: 50, attack: 9 }] }
  const r = simBattleTurn(state, { type: 'defend' }, mission)
  if (r.enemies[0].hp !== 50) bad('defend() should deal no damage to the enemy')
  else if (r.playerHp !== 100 - Math.floor(9 / 2)) bad('defend() should halve (floor) incoming damage: ' + r.playerHp)
  else ok('defend() deals no damage and halves (floors) retaliation')
}
{
  // shield: an attack immediately after another attack is blocked
  const mission = { battle: { playerAttack: 20, shield: true } }
  const state = { turn: 2, playerHp: 100, prevType: 'attack', enemies: [{ id: 'e1', name: 'X', hp: 50, maxHp: 50, attack: 5 }] }
  const r = simBattleTurn(state, { type: 'attack', target: 'e1' }, mission)
  if (r.enemies[0].hp !== 50) bad('shield should block a second consecutive attack')
  else if (!r.events.some(ev => ev.kind === 'shieldBlock')) bad('shield block should surface as an event')
  else ok('shield correctly blocks a second consecutive attack')
}
{
  // shield: attack is NOT blocked if the previous turn was wait/defend
  const mission = { battle: { playerAttack: 20, shield: true } }
  const state = { turn: 2, playerHp: 100, prevType: 'wait', enemies: [{ id: 'e1', name: 'X', hp: 50, maxHp: 50, attack: 5 }] }
  const r = simBattleTurn(state, { type: 'attack', target: 'e1' }, mission)
  if (r.enemies[0].hp !== 30) bad('shield should NOT block an attack after a non-attack turn: ' + r.enemies[0].hp)
  else ok('shield does not block after alternating with wait/defend')
}
{
  // function-valued attack: hpFrac reflects post-attack hp, using the enemy's own maxHp
  const mission = { battle: { playerAttack: 30 } }
  const state = { turn: 1, playerHp: 100,
    enemies: [{ id: 'e1', name: 'X', hp: 60, maxHp: 60, attack: ctx => (ctx.hpFrac < 0.6 ? 25 : 5) }] }
  const r = simBattleTurn(state, { type: 'attack', target: 'e1' }, mission)
  // post-attack hp = 30, frac = 30/60 = 0.5 < 0.6 -> enraged(25)
  if (r.playerHp !== 75) bad('adaptive attack() function should see post-attack hpFrac: ' + r.playerHp)
  else ok('function-valued enemy attack reads post-attack hpFrac correctly')
}

// ── Session 4: all 9 new missions — reference pseudocode wins at exact par ────
const REF = {
  p2m3: 'FUNCTION PickTarget() RETURNS STRING\n    RETURN enemyId[1]\nENDFUNCTION\n\nattack(PickTarget())',
  p2m4: 'FUNCTION FindWeakest() RETURNS STRING\n    weakest ← enemyId[1]\n    lowest ← enemyHp[1]\n'
    + '    FOR i ← 2 TO enemyCount\n        IF enemyHp[i] < lowest THEN\n            weakest ← enemyId[i]\n'
    + '            lowest ← enemyHp[i]\n        ENDIF\n    NEXT i\n    RETURN weakest\nENDFUNCTION\n\nattack(FindWeakest())',
  // Exact turn-tuned to the solver-verified optimal path (a real student's
  // "defend every 3rd/even turn" heuristic also wins, just 1-2 turns slower —
  // these hit the razor-exact par to prove it's achievable).
  p2m5: 'IF turn = 3 THEN\n    defend()\nELSE\n    attack(enemyId[1])\nENDIF',
  p2m6: 'IF turn = 2 THEN\n    defend()\nELSE\n    attack(enemyId[1])\nENDIF',
  p2m7: 'attack(enemyId[1])',
  p2m8: 'FUNCTION MostDangerous() RETURNS STRING\n    best ← enemyId[1]\n    bestAtk ← enemyAttack[1]\n'
    + '    FOR i ← 2 TO enemyCount\n        IF enemyAttack[i] > bestAtk THEN\n            best ← enemyId[i]\n'
    + '            bestAtk ← enemyAttack[i]\n        ENDIF\n    NEXT i\n    RETURN best\nENDFUNCTION\n\nattack(MostDangerous())',
  p2m9: 'IF turn MOD 2 = 1 THEN\n    attack(enemyId[1])\nELSE\n    wait()\nENDIF',
  p2m10: 'attack(enemyId[1])',
  p2m11: 'FUNCTION PickTarget() RETURNS STRING\n    RETURN enemyId[1]\nENDFUNCTION\n\n'
    + 'IF turn MOD 2 = 1 THEN\n    attack(PickTarget())\nELSE\n    wait()\nENDIF',
  p2m12: 'attack(enemyId[1])',
  p2m13: 'IF enemyHp[1] > 0 THEN\n    attack(enemyId[1])\nELSE\n    attack(enemyId[2])\nENDIF',
  p2m14: 'IF turn MOD 2 = 1 THEN\n'
    + '    IF enemyHp[1] > 0 THEN\n        attack(enemyId[1])\n    ELSE\n'
    + '        IF enemyHp[2] > 0 THEN\n            attack(enemyId[2])\n        ELSE\n            attack(enemyId[3])\n        ENDIF\n    ENDIF\n'
    + 'ELSE\n    wait()\nENDIF',
  p2m15: 'IF enemyCount = 2 THEN\n    attack(enemyId[2])\nELSE\n    attack(enemyId[1])\nENDIF',
}
for (const [id, src] of Object.entries(REF)) {
  const m = MISSIONS.find(x => x.id === id)
  if (!m) { bad(id + ' — mission not found'); continue }
  const r = simulateWithPseudo(m, src)
  if (r.outcome !== 'win') { bad(id + ' — ' + m.title + ': reference should WIN, got ' + r.outcome + (r.error ? ' (' + r.error + ')' : '')); continue }
  if (r.turns !== m.stars.par) { bad(id + ' — ' + m.title + ': par ' + m.stars.par + ' turns but reference wins in ' + r.turns); continue }
  const reqErr = m.require === 'function' ? checkRequire(m, src) : null
  if (reqErr) { bad(id + ' — ' + m.title + ': reference should satisfy its own require(function) check: ' + reqErr); continue }
  ok(id + ' — ' + m.title + ': reference wins in ' + r.turns + ' turns (par), require satisfied')
}

// ── Naive/failing strategies must actually fail — proves each lesson is load-bearing ─
function simulateFixed(mission, strategyFn) {
  let state = { turn: 1, playerHp: mission.battle.playerHp,
    enemies: mission.battle.enemies.map(e => ({ ...e, maxHp: e.hp })), prevType: null }
  const maxTurns = mission.battle.maxTurns || 20
  while (state.turn <= maxTurns) {
    const action = strategyFn(state)
    const result = simBattleTurn(state, action, mission)
    state = { turn: state.turn + 1, playerHp: result.playerHp, enemies: result.enemies, prevType: result.prevType }
    if (result.win) return { outcome: 'win', turns: state.turn - 1 }
    if (result.loss) return { outcome: 'loss', turns: state.turn - 1 }
  }
  return { outcome: 'timeout' }
}
{
  const m = MISSIONS.find(x => x.id === 'p2m5')
  const r = simulateFixed(m, st => ({ type: 'attack', target: m.battle.enemies[0].id }))
  if (r.outcome === 'win') bad('Shields Up — always-attack (ignoring the charge turn) should NOT win')
  else ok('Shields Up — always-attack correctly fails, defend() is genuinely required')
}
{
  const m = MISSIONS.find(x => x.id === 'p2m7')
  const r = simulateFixed(m, st => ({ type: 'attack', target: st.enemies.find(e => e.id === 'e2' && e.hp > 0) ? 'e2' : 'e1' }))
  if (r.outcome === 'win') bad('Double Trouble — killing the tanky enemy first should NOT win')
  else ok('Double Trouble — wrong target priority correctly loses')
}
{
  const m = MISSIONS.find(x => x.id === 'p2m9')
  const r = simulateFixed(m, () => ({ type: 'attack', target: m.battle.enemies[0].id }))
  if (r.outcome === 'win') bad('Shield Recharge — spamming attack should NOT win (shield blocks every other hit)')
  else ok('Shield Recharge — attack-spam correctly fails against the shield')
}

// ── Session 5: Data mission engine (Phase 3) ───────────────────────────────────
{
  // Exact numeric match, and a wrong answer correctly fails
  if (!evalDataSuccess({ answer: 41 }, 41).ok) bad('evalDataSuccess: exact number match should pass')
  else ok('evalDataSuccess: exact number match passes')
  if (!evalDataSuccess({ answer: 41 }, '41').ok) bad('evalDataSuccess: numeric string should coerce and pass')
  else ok('evalDataSuccess: numeric string coerces correctly')
  if (evalDataSuccess({ answer: 41 }, 40).ok) bad('evalDataSuccess: wrong number should fail')
  else ok('evalDataSuccess: wrong number correctly fails')
  if (!evalDataSuccess({ answer: 'Bex' }, 'bex').ok) bad('evalDataSuccess: string match should be case-insensitive')
  else ok('evalDataSuccess: string match is case-insensitive')
  if (evalDataSuccess({ answer: 41 }, undefined).ok) bad('evalDataSuccess: no answer() call should fail, not pass')
  else ok('evalDataSuccess: never calling answer() correctly fails as "noanswer"')
}

// Runs a data mission's pseudocode source once (no turn loop) and returns its answer
function runData(mission, src) {
  return execPseudo(src, mission, dataEnvFor(mission))
}

const DATA_REF = {
  p3m1: 'DECLARE total : INTEGER\ntotal ← 0\nFOR i ← 1 TO dataCount\n    total ← total + dataWeight[i]\nNEXT i\n\nanswer(total)',
  p3m2: 'DECLARE best : STRING\nDECLARE bestSkill : INTEGER\nbest ← dataName[1]\nbestSkill ← dataSkill[1]\nFOR i ← 1 TO dataCount\n'
    + '    IF dataSkill[i] > bestSkill THEN\n        best ← dataName[i]\n        bestSkill ← dataSkill[i]\n    ENDIF\nNEXT i\n\nanswer(best)',
  p3m3: 'DECLARE cheapest : STRING\nDECLARE lowCost : INTEGER\ncheapest ← dataRoute[1]\nlowCost ← dataCost[1]\nFOR i ← 1 TO dataCount\n'
    + '    IF dataCost[i] < lowCost THEN\n        cheapest ← dataRoute[i]\n        lowCost ← dataCost[i]\n    ENDIF\nNEXT i\n\nanswer(cheapest)',
  p3m4: 'DECLARE count : INTEGER\ncount ← 0\nFOR i ← 1 TO dataCount\n    IF dataHp[i] > 50 THEN\n        count ← count + 1\n    ENDIF\nNEXT i\n\nanswer(count)',
  p3m5: 'DECLARE budget : INTEGER\nbudget ← 80\nFOR i ← 1 TO dataCount\n    budget ← budget - dataCost[i]\nNEXT i\n\nanswer(budget)',

  // ── FOUNDATIONS 3 · flowchart-to-code unit (2026-10-13 rewrite) — every
  // mission shows a FINISHED flowchart and asks for real pseudocode/code
  // that reproduces it; these references are each mission's own diagram,
  // hand-transcribed into pseudocode, verified against the real interpreter.
  'flow-p1': 'DECLARE age : INTEGER\nage ← 15\nIF age >= 18 THEN\n    OUTPUT "Adult"\nELSE\n    OUTPUT "Minor"\nENDIF',
  'flow-code': 'DECLARE num : INTEGER\nnum ← 12\nIF num MOD 2 = 0 THEN\n    OUTPUT "Even"\nELSE\n    OUTPUT "Odd"\nENDIF',
  flowg1: 'DECLARE n : INTEGER\nn ← 7\nIF n MOD 2 = 0 THEN\n    OUTPUT "Even"\nELSE\n    OUTPUT "Odd"\nENDIF',
  flowg2: 'DECLARE score : INTEGER\nscore ← 82\nIF score >= 50 THEN\n    OUTPUT "Pass"\nELSE\n    OUTPUT "Fail"\nENDIF',
  flowg3: 'FOR i ← 1 TO 5\n    OUTPUT i\nNEXT i',
  flowg4: 'DECLARE total : INTEGER\ntotal ← 0\nFOR i ← 1 TO 10\n    total ← total + i\nNEXT i\n\nOUTPUT total',
  flowg5: 'DECLARE n : INTEGER\nn ← 5\nWHILE n > 0\n    OUTPUT n\n    n ← n - 1\nENDWHILE\nOUTPUT "Liftoff!"',
  flowg6: 'FOR i ← 1 TO 10\n    IF i MOD 2 = 0 THEN\n        OUTPUT i\n    ENDIF\nNEXT i',
  flowgboss: 'FOR n ← 1 TO 20\n    IF n MOD 15 = 0 THEN\n        OUTPUT "FizzBuzz"\n    ELSE\n        IF n MOD 3 = 0 THEN\n            OUTPUT "Fizz"\n        ELSE\n            IF n MOD 5 = 0 THEN\n                OUTPUT "Buzz"\n            ELSE\n                OUTPUT n\n            ENDIF\n        ENDIF\n    ENDIF\nNEXT n',
  flowg7: 'DECLARE weight : INTEGER\nweight ← 7\nIF weight <= 1 THEN\n    answer("$3")\nELSE\n    IF weight <= 5 THEN\n        answer("$6")\n    ELSE\n        IF weight <= 10 THEN\n            answer("$12")\n        ELSE\n            answer("$20")\n        ENDIF\n    ENDIF\nENDIF',
  flowg8: 'DECLARE a : INTEGER\nDECLARE b : INTEGER\nDECLARE c : INTEGER\na ← 7\nb ← 15\nc ← 3\nIF a > b THEN\n    IF a > c THEN\n        answer(a)\n    ELSE\n        answer(c)\n    ENDIF\nELSE\n    IF b > c THEN\n        answer(b)\n    ELSE\n        answer(c)\n    ENDIF\nENDIF',
  flowg9: 'DECLARE balance : INTEGER\nDECLARE amount : INTEGER\nbalance ← 100\namount ← 40\nIF amount <= balance THEN\n    balance ← balance - amount\n    answer(balance)\nELSE\n    answer("Insufficient Funds")\nENDIF',
  flowg10: 'DECLARE day : INTEGER\nday ← 7\nIF day = 6 THEN\n    answer("Weekend")\nELSE\n    IF day = 7 THEN\n        answer("Weekend")\n    ELSE\n        answer("Weekday")\n    ENDIF\nENDIF',
  flowg11: 'DECLARE n : INTEGER\nDECLARE result : STRING\nn ← 7\nresult ← ""\nFOR i ← 1 TO 12\n    result ← result + STR(n) + " x " + STR(i) + " = " + STR(n*i) + ","\nNEXT i\n\nanswer(result)',
  flowg12: 'DECLARE total : INTEGER\ntotal ← 0\nFOR i ← 1 TO 50\n    IF i MOD 2 = 0 THEN\n        total ← total + i\n    ENDIF\nNEXT i\n\nanswer(total)',
  flowg13: 'DECLARE balance : REAL\nDECLARE rate : REAL\nDECLARE year : INTEGER\nbalance ← 1000\nrate ← 0.1\nyear ← 1\nWHILE year <= 3\n    balance ← balance + balance * rate\n    year ← year + 1\nENDWHILE\n\nanswer(balance)',
  flowg14: 'DECLARE num : INTEGER\nDECLARE isPrime : INTEGER\nDECLARE divisor : INTEGER\nnum ← 17\nisPrime ← 1\ndivisor ← 2\nWHILE divisor < num\n    IF num MOD divisor = 0 THEN\n        isPrime ← 0\n    ENDIF\n    divisor ← divisor + 1\nENDWHILE\nIF isPrime = 1 THEN\n    answer("Prime")\nELSE\n    answer("Not Prime")\nENDIF',
  flowg15: 'DECLARE a : INTEGER\nDECLARE b : INTEGER\nDECLARE temp : INTEGER\na ← 48\nb ← 18\nWHILE b <> 0\n    temp ← b\n    b ← a MOD b\n    a ← temp\nENDWHILE\n\nanswer(a)',
  flowg16: 'DECLARE n : INTEGER\nDECLARE result : INTEGER\nn ← 5\nresult ← 1\nFOR i ← 1 TO n\n    result ← result * i\nNEXT i\n\nanswer(result)',
  flowg17: 'DECLARE num : INTEGER\nDECLARE sum : INTEGER\nDECLARE temp : INTEGER\nDECLARE digit : INTEGER\nnum ← 153\nsum ← 0\ntemp ← num\nWHILE temp > 0\n    digit ← temp MOD 10\n    sum ← sum + digit * digit * digit\n    temp ← temp DIV 10\nENDWHILE\nIF sum = num THEN\n    answer("Armstrong")\nELSE\n    answer("Not Armstrong")\nENDIF',
  flowg18: 'DECLARE num : INTEGER\nDECLARE result : STRING\nDECLARE digit : INTEGER\nnum ← 13\nresult ← ""\nWHILE num > 0\n    digit ← num MOD 2\n    result ← STR(digit) + result\n    num ← num DIV 2\nENDWHILE\n\nanswer(result)',

  // ── REPEAT-UNTIL (added alongside the interpreter support — see
  // execPseudo's new REPEAT branch) — both use the checkVars mechanic
  // (TODO-GRADE9.md Phase 1), no answer() call at all.
  flowg19: 'DECLARE n : INTEGER\nDECLARE count : INTEGER\nn ← 1\ncount ← 0\nREPEAT\n    n ← n * 2\n    count ← count + 1\nUNTIL n > 100',
  flowg20boss: 'DECLARE num : INTEGER\nDECLARE sum : INTEGER\nDECLARE temp : INTEGER\nnum ← 9875\nREPEAT\n    sum ← 0\n    temp ← num\n    WHILE temp > 0\n        sum ← sum + (temp MOD 10)\n        temp ← temp DIV 10\n    ENDWHILE\n    num ← sum\nUNTIL num < 10',
}
for (const [id, src] of Object.entries(DATA_REF)) {
  const m = MISSIONS.find(x => x.id === id)
  if (!m) { bad(id + ' — mission not found'); continue }
  const res = runData(m, src)
  if (!res.ok) { bad(id + ' — ' + m.title + ': reference errored: ' + res.error); continue }
  const v = evalDataSuccess(m, res.answer, res.vars, res.outputs)
  if (!v.ok) {
    const expected = m.expectedOutput ? JSON.stringify(m.expectedOutput) : m.checkVars ? JSON.stringify(m.checkVars) : JSON.stringify(m.answer)
    const got = m.expectedOutput ? JSON.stringify(res.outputs) : m.checkVars ? JSON.stringify(res.vars) : JSON.stringify(res.answer)
    bad(id + ' — ' + m.title + ': reference got ' + got + ' != expected ' + expected)
    continue
  }
  const reqErr = m.require === 'loop' ? checkRequire(m, src) : null
  if (reqErr) { bad(id + ' — ' + m.title + ': reference should satisfy its own require(loop) check: ' + reqErr); continue }
  const gotStr = m.expectedOutput ? JSON.stringify(res.outputs) : m.checkVars ? JSON.stringify(res.vars) : JSON.stringify(res.answer)
  ok(id + ' — ' + m.title + ': reference computes ' + gotStr + ' correctly, require satisfied')
}
{
  // A hardcoded, non-loop "cheat" must fail p3m2's require check (loop is genuinely needed)
  const m = MISSIONS.find(x => x.id === 'p3m2')
  const cheat = checkRequire(m, "answer('Bex')")
  if (!cheat) bad('p3m2 — hardcoding the known answer with no loop should fail the require(loop) check')
  else ok('p3m2 — hardcoded non-loop answer correctly fails require(loop)')
}
{
  // Wrong aggregation logic must fail the actual numeric check, not just run without error
  const m = MISSIONS.find(x => x.id === 'p3m4')
  const wrong = 'DECLARE count : INTEGER\ncount ← 0\nFOR i ← 1 TO dataCount\n    IF dataHp[i] > 90 THEN\n        count ← count + 1\n    ENDIF\nNEXT i\n\nanswer(count)'
  const res = runData(m, wrong)
  if (evalDataSuccess(m, res.answer).ok) bad('p3m4 — a wrong threshold should not coincidentally pass')
  else ok('p3m4 — wrong aggregation logic correctly produces a wrong (rejected) answer')
}

// ── Session 5: hidden attack (hideAttack) + intel exposure ────────────────────
{
  const m = MISSIONS.find(x => x.id === 'p3m6')
  const state = { turn: 1, playerHp: m.battle.playerHp, enemies: m.battle.enemies.map(e => ({ ...e, maxHp: e.hp })) }
  const env = battleEnvFor(m, state)
  if (env.enemyattack.some(a => a !== 0)) bad('p3m6 — hideAttack should blank enemyAttack[] to all zeros: ' + JSON.stringify(env.enemyattack))
  else ok('p3m6 — hideAttack correctly hides enemyAttack[] from the pseudocode state')
  if (!env.intelid || env.intelid.length !== 2) bad('p3m6 — intel should expose intelId[] with 2 entries: ' + JSON.stringify(env.intelid))
  else ok('p3m6 — intel report is exposed via intelId[]/intelContact[]/intelTrueAttack[]')
  if (env.inteltrueattack.join(',') !== '25,5') bad('p3m6 — intelTrueAttack[] should carry the real attack values: ' + env.inteltrueattack)
  else ok('p3m6 — intelTrueAttack[] carries the true (otherwise-hidden) attack values')
}

// ── Session 5: all 4 Phase 3 battle missions (intel + optional shield) ────────
const P3_BATTLE_REF = {
  // Intel is STATIC (doesn't drop dead enemies) — the correct pattern loops the
  // LIVE enemyId[] and looks up each one's true attack via intel, not the other
  // way round (looping intel directly can pick an already-destroyed contact).
  p3m6: 'FUNCTION TrueAttackOf(id) RETURNS INTEGER\n    FOR i ← 1 TO intelCount\n        IF intelId[i] = id THEN\n'
    + '            RETURN intelTrueAttack[i]\n        ENDIF\n    NEXT i\n    RETURN 0\nENDFUNCTION\n\n'
    + 'best ← enemyId[1]\nbestAtk ← TrueAttackOf(enemyId[1])\nFOR i ← 2 TO enemyCount\n'
    + '    atk ← TrueAttackOf(enemyId[i])\n    IF atk > bestAtk THEN\n        best ← enemyId[i]\n        bestAtk ← atk\n    ENDIF\nNEXT i\n\nattack(best)',
  p3m7: 'FUNCTION TrueAttackOf(id) RETURNS INTEGER\n    FOR i ← 1 TO intelCount\n        IF intelId[i] = id THEN\n'
    + '            RETURN intelTrueAttack[i]\n        ENDIF\n    NEXT i\n    RETURN 0\nENDFUNCTION\n\n'
    + 'FUNCTION MostDangerous() RETURNS STRING\n    best ← enemyId[1]\n    bestAtk ← TrueAttackOf(enemyId[1])\n'
    + '    FOR i ← 2 TO enemyCount\n        atk ← TrueAttackOf(enemyId[i])\n        IF atk > bestAtk THEN\n'
    + '            best ← enemyId[i]\n            bestAtk ← atk\n        ENDIF\n    NEXT i\n    RETURN best\nENDFUNCTION\n\nattack(MostDangerous())',
  p3m8: 'IF turn = 1 THEN\n    attack(intelId[1])\nELSE\n'
    + '    IF turn MOD 2 = 1 THEN\n        attack(intelId[2])\n    ELSE\n        wait()\n    ENDIF\nENDIF',
  p3m9: 'FUNCTION PickTarget() RETURNS STRING\n    RETURN enemyId[1]\nENDFUNCTION\n\n'
    + 'IF turn MOD 2 = 1 THEN\n    attack(PickTarget())\nELSE\n    wait()\nENDIF',
}
for (const [id, src] of Object.entries(P3_BATTLE_REF)) {
  const m = MISSIONS.find(x => x.id === id)
  const r = simulateWithPseudo(m, src)
  if (r.outcome !== 'win') { bad(id + ' — ' + m.title + ': reference should WIN, got ' + r.outcome + (r.error ? ' (' + r.error + ')' : '')); continue }
  if (r.turns !== m.stars.par) { bad(id + ' — ' + m.title + ': par ' + m.stars.par + ' turns but reference wins in ' + r.turns); continue }
  const reqErr = m.require === 'function' ? checkRequire(m, src) : null
  if (reqErr) { bad(id + ' — ' + m.title + ': reference should satisfy its own require(function) check: ' + reqErr); continue }
  ok(id + ' — ' + m.title + ': reference wins in ' + r.turns + ' turns (par), require satisfied')
}
{
  // Wrong priority (guessing from the visible-but-hidden state instead of intel) must lose
  const m = MISSIONS.find(x => x.id === 'p3m7')
  const r = simulateFixed(m, st => {
    // "attack whichever is listed last" — ignores intel entirely, a plausible wrong guess
    const alive = st.enemies.filter(e => e.hp > 0)
    return { type: 'attack', target: alive[alive.length - 1].id }
  })
  if (r.outcome === 'win') bad('Ghost Squadron — ignoring intel and guessing should not reliably win')
  else ok('Ghost Squadron — ignoring intel (wrong priority guess) correctly fails')
}

// ── Session 6: symmetric duel resolution (pure, no Pyodide needed) ────────────
{
  const r = resolveDuelTurn({ hp: 60, attack: 15, action: 'attack' }, { hp: 60, attack: 15, action: 'attack' })
  if (r.dmgToA !== 15 || r.dmgToB !== 15) bad('attack vs attack: both should take full damage: ' + JSON.stringify(r))
  else ok('attack vs attack: both take full damage')
}
{
  const r = resolveDuelTurn({ hp: 60, attack: 15, action: 'attack' }, { hp: 60, attack: 15, action: 'defend' })
  if (r.dmgToB !== 7 || r.dmgToA !== 0) bad('attack vs defend: defender should take HALF (floored), attacker takes 0: ' + JSON.stringify(r))
  else ok('attack vs defend: defender takes half (floored) damage, no damage dealt back')
}
{
  const r = resolveDuelTurn({ hp: 60, attack: 15, action: 'attack' }, { hp: 60, attack: 15, action: 'wait' })
  if (r.dmgToB !== 15 || r.dmgToA !== 0) bad('attack vs wait: waiter should take full damage: ' + JSON.stringify(r))
  else ok('attack vs wait: waiter takes full damage')
}
{
  const r = resolveDuelTurn({ hp: 60, attack: 15, action: 'defend' }, { hp: 60, attack: 15, action: 'wait' })
  if (r.dmgToA !== 0 || r.dmgToB !== 0) bad('defend vs wait: neither attacks, no damage should be dealt: ' + JSON.stringify(r))
  else ok('defend vs wait: no damage exchanged when neither attacks')
}

// ── Session 6: runDuel orchestration ───────────────────────────────────────────
{
  // Identical mirror match must draw at the exact same turn both sides die
  const rush = { name: 'Rush', decide: () => ({ type: 'attack' }) }
  const rush2 = { name: 'Rush2', decide: () => ({ type: 'attack' }) }
  const res = await runDuel(rush, rush2, { hp: 60, attack: 15, maxTurns: 10 })
  if (res.winner !== 'draw' || res.reason !== 'mutual') bad('mirror match should be a mutual draw: ' + JSON.stringify(res.winner) + '/' + res.reason)
  else ok('identical always-attack bots mutually KO in a draw')
}
{
  const rush = { name: 'Rush', decide: () => ({ type: 'attack' }) }
  const waiter = { name: 'Waiter', decide: () => ({ type: 'wait' }) }
  const res = await runDuel(rush, waiter, { hp: 60, attack: 15, maxTurns: 15 })
  if (res.winner !== 'A' || res.reason !== 'ko' || res.log.some(r => r.dmgToA > 0))
    bad('rush vs a pure waiter should win cleanly with zero damage taken: ' + JSON.stringify(res.winner) + '/' + res.reason)
  else ok('attacker beats a pure waiter cleanly, taking zero damage')
}
{
  // Regression test for the maxHp bug: self.maxHp exposed to a bot's own code
  // must stay CONSTANT turn to turn, not shrink to match current hp.
  const myBot = { name: 'My Bot', lang: 'ps', code: 'IF selfHp < 20 THEN\n    defend()\nELSE\n    attack(enemyId[1])\nENDIF' }
  const rusher = { name: 'Rusher', hp: 60, attack: 20, decide: () => ({ type: 'attack' }) }
  const res = await runDuel(myBot, rusher, { hp: 70, attack: 16, maxTurns: 15 })
  if (!res.log.every(r => r.maxHpA === 70 && r.maxHpB === 60))
    bad('maxHp should stay constant across all turns (regression): ' + JSON.stringify(res.log.map(r => [r.maxHpA, r.maxHpB])))
  else ok('self.maxHp stays constant across turns (does not shrink with current hp)')
  // and the reactive defend at low hp actually fired (proves state['self']['hp'] updates correctly)
  const lastA = res.log[res.log.length - 1].actionA
  if (res.log.some(r => r.hpAAfter < 20) && !res.log.some(r => r.actionA === 'defend'))
    bad('bot never defended despite dropping below its own 20hp threshold')
  else ok('pseudocode bot correctly reacts to its own shrinking current hp mid-duel')
}
{
  // A bot whose code errors should lose that side of the duel, not crash it
  // (Python isn't runnable in this Node harness — same precedent as the rest
  // of this suite — so the error path is proven via the pseudocode engine.)
  const badBot = { name: 'Broken', lang: 'ps', code: 'attack(nonexistentVariable)' }
  const rush = { name: 'Rush', decide: () => ({ type: 'attack' }) }
  const res = await runDuel(badBot, rush, DUEL_CONFIG)
  if (res.winner !== 'B' || res.reason !== 'error' || res.errSide !== 'A')
    bad('a script-error bot should lose immediately, not crash the duel: ' + JSON.stringify(res))
  else ok('a bot with broken code loses cleanly (duel does not throw)')
}
{
  // Timeout with unequal remaining hp should be decided by hp, not called a draw
  const tank = { name: 'Tank', hp: 200, attack: 5, decide: () => ({ type: 'attack' }) }
  const glass = { name: 'Glass', hp: 200, attack: 3, decide: () => ({ type: 'attack' }) }
  const res = await runDuel(tank, glass, { hp: 200, attack: 5, maxTurns: 5 })
  if (res.reason !== 'timeout-hp' || res.winner !== 'A')
    bad('higher-damage side should win an unresolved fight on remaining hp at the turn limit: ' + JSON.stringify(res))
  else ok('turn-limit timeout is broken by remaining hp, not left as an automatic draw')
}

// ── Session 6: bracket (headless, deterministic) ───────────────────────────────
{
  const entrants = [
    { name: 'A', decide: () => ({ type: 'attack' }) },
    { name: 'B', decide: () => ({ type: 'wait' }) },
    { name: 'C', decide: () => ({ type: 'attack' }) },
    { name: 'D', decide: () => ({ type: 'wait' }) },
  ]
  const bracket = await runBracketHeadless(entrants, DUEL_CONFIG)
  if (bracket.rounds.length !== 2) bad('4 entrants should produce a 2-round bracket (semis + final): got ' + bracket.rounds.length)
  else ok('4-entrant bracket has the correct depth (2 rounds)')
  if (bracket.champion.name !== 'A' && bracket.champion.name !== 'C')
    bad('the champion should be one of the two attackers, not a waiter: ' + bracket.champion.name)
  else ok('bracket champion is a genuinely-winning bot, not an also-ran')
}
{
  // Odd entrant count: the last one gets a bye and auto-advances
  const entrants = [
    { name: 'A', decide: () => ({ type: 'attack' }) },
    { name: 'B', decide: () => ({ type: 'wait' }) },
    { name: 'C', decide: () => ({ type: 'attack' }) },
  ]
  const bracket = await runBracketHeadless(entrants, DUEL_CONFIG)
  const firstRound = bracket.rounds[0]
  if (!firstRound.some(m => m.bye)) bad('an odd entrant count should produce exactly one bye in round 1')
  else ok('odd entrant count correctly produces a bye')
}
{
  // A true draw (identical mirror bots) is broken deterministically — the
  // earlier-listed bot advances, not decided by chance.
  const entrants = [
    { name: 'Mirror1', decide: () => ({ type: 'attack' }) },
    { name: 'Mirror2', decide: () => ({ type: 'attack' }) },
  ]
  const bracket = await runBracketHeadless(entrants, DUEL_CONFIG)
  if (bracket.champion.name !== 'Mirror1') bad('a drawn match should deterministically advance the first-listed bot, got ' + bracket.champion.name)
  else ok('drawn matches are broken deterministically (first-listed bot advances), not by chance')
}

// ── Session 6: all 6 PRACTICE_BOTS are well-formed ─────────────────────────────
for (const pb of PRACTICE_BOTS) {
  if (typeof pb.decide !== 'function') { bad(pb.id + ' — practice bot has no decide() function'); continue }
  const rush = { name: 'Baseline', decide: () => ({ type: 'attack' }) }
  const res = await runDuel(pb, rush, DUEL_CONFIG)
  if (res.reason === 'error') bad(pb.id + ' (' + pb.name + ') — errored against a baseline opponent: ' + res.error)
  else ok(pb.id + ' (' + pb.name + ', ' + pb.group + ') — plays a full duel without error, outcome: ' + res.winner + '/' + res.reason)
}

// ── Session 7: teacher API's TOTAL_MISSIONS constant must not silently drift ──
{
  const apiSrc = readFileSync('c:/Users/user/Downloads/ICT website/app/api/teacher/g9-progress/route.ts', 'utf8')
  const m = apiSrc.match(/const TOTAL_MISSIONS = (\d+)/)
  if (!m) bad('g9-progress route.ts — TOTAL_MISSIONS constant not found')
  else if (parseInt(m[1]) !== MISSIONS.length)
    bad('g9-progress route.ts — TOTAL_MISSIONS is ' + m[1] + ' but MISSIONS.length is ' + MISSIONS.length
      + ' (bot-lock/champion XP rows would miscount as real missions in the teacher view)')
  else ok('g9-progress route.ts — TOTAL_MISSIONS (' + m[1] + ') matches the real MISSIONS.length')
}

// ── Session 8: every mission must be reachable through the map ───────────────
// TIERS is a SEPARATE array from each mission's own `phase` field, and is
// what showJourney() actually renders onto the map (worlds = TIERS.map(...)).
// A mission can exist in MISSIONS, pass every check above, and still be
// completely unreachable through normal play if nobody added its id to
// TIERS too — this has now happened 3 separate times in one session
// (flowg1-6/flowgboss, all of Phase 4, and this session's own p2m12-p2m15),
// so it's worth a permanent automated check rather than relying on catching
// it by hand again.
{
  const tStart = html.indexOf('const TIERS = [')
  const tEnd = html.indexOf('\n]', tStart) + 2
  const tierIds = new Set([...html.slice(tStart, tEnd).matchAll(/'([\w-]+)'/g)].map(x => x[1]))
  const orphans = MISSIONS.map(m => m.id).filter(id => !tierIds.has(id))
  if (orphans.length) bad('TIERS is missing ' + orphans.length + ' mission id(s) — unreachable through the map: ' + orphans.join(', '))
  else ok('every mission id in MISSIONS is registered in TIERS (reachable through the map)')
}

console.log(fail ? '\n' + fail + ' problems' : '\nall missions verified — both engines honest')
process.exit(fail ? 1 : 0)
