// Verifies every Grade 9 mission: reference solutions pass, star pars are
// honest in BOTH languages, and failure modes (miss / crash / off-map /
// missed waypoints) are detected. Also unit-tests the pseudocode executor.
import { readFileSync } from 'fs'

const html = readFileSync('c:/Users/user/Downloads/ICT website/public/lessons/grade9-missions.html', 'utf8')
const s = html.indexOf('const MISSIONS = [')
const e = html.indexOf('// ═══', html.indexOf('function execPseudo'))
const {
  MISSIONS, simTurtle, evalSuccess, starsFor, countLines, checkRequire, execPseudo,
  simBattleTurn, runBattleSim, battleEnvFor,
} = new Function(html.slice(s, e)
    + '\nreturn { MISSIONS, simTurtle, evalSuccess, starsFor, countLines, checkRequire, execPseudo, '
    + 'simBattleTurn, runBattleSim, battleEnvFor }')()

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
  if (m.type === 'battle') continue   // validated separately, below
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

console.log(fail ? '\n' + fail + ' problems' : '\nall missions verified — both engines honest')
process.exit(fail ? 1 : 0)
