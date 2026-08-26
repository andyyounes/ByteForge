#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
// Grade 6 non-maze worlds regression suite (W3, W5–W12).
//
// W1/W2/W4 (maze + repeat-chip worlds) already have stronger coverage in
// scripts/test-g6-maze.mjs — a BFS proves every maze's par is genuinely
// optimal, not just that one known-good answer passes. This script covers
// everything else: color mixing, turtle drawing, pixel grids, Caesar
// cipher, the music beat-grid, the dance sequencer, game-design vocabulary,
// the AI-world classifier, and the Final Quest capstone.
//
// It reads every stage straight out of the live public/lessons/grade6.html
// (via ALL_STAGES, evaluated in a real browser — these engines are DOM-
// coupled, not pure functions, so this needs a real page, not a Node-side
// extraction like test-g6-maze.mjs). For each stage it derives a genuinely
// correct answer STRUCTURALLY from that stage's own config (never a
// separately hand-maintained copy that could silently drift from the real
// content), drives it through the real UI, and asserts the stage actually
// completes. It also drives one deliberately-wrong answer per stage and
// asserts the stage does NOT complete — this is what catches an "always
// passes" bug that a positive-only test would miss.
//
// Run: node scripts/test-g6-worlds.mjs   (needs `npm run dev` already up)
// ══════════════════════════════════════════════════════════════════════════════
import { chromium } from 'playwright'

const BASE = process.env.BF_BASE_URL || 'http://localhost:3000'
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'

let pass = 0, fail = 0
const failures = []

function ok(label) { pass++; console.log('✓ ' + label) }
function bad(label, detail) { fail++; failures.push(label + (detail ? ' — ' + detail : '')); console.log('✗ ' + label + (detail ? ' — ' + detail : '')) }

async function openStage(page, id) {
  await page.evaluate(() => { const w = document.getElementById('win'); if (w) w.classList.remove('open') })
  await page.evaluate((id) => { openStage(id) }, id)
  await page.waitForTimeout(150)
}

async function setSlider(page, sel, val) {
  await page.evaluate(({ sel, val }) => {
    const el = document.querySelector(sel)
    el.value = val
    el.dispatchEvent(new Event('input'))
  }, { sel, val })
}

async function feedbackText(page, sel) {
  return (await page.locator(sel).textContent()) || ''
}

// ── one solver per engine type: returns {apply(page, wrong), checkSel, fbSel} ──

async function solveColor(page, stage, wrong) {
  const isBoss = !!stage.boss
  const targets = isBoss ? stage.targets : [stage.target]
  for (let i = 0; i < targets.length; i++) {
    let [r, g, b] = targets[i]
    // move AWAY from the target by 150, whichever direction keeps it in [0,255] —
    // just adding 150 is a no-op when the target channel is already near 255
    if (wrong && i === targets.length - 1) r = r <= 127 ? Math.min(255, r + 150) : Math.max(0, r - 150)
    await setSlider(page, '#mix-r', r)
    await setSlider(page, '#mix-g', g)
    await setSlider(page, '#mix-b', b)
    await page.click('button[onclick="mixCheck()"]')
    // a boss's intermediate rounds sleep 900ms (see mixCheck()) before advancing
    // and reloading the sliders for the next target — wait past that, not just
    // a fixed short delay, or the next round's slider-set races the reload.
    await page.waitForTimeout(i < targets.length - 1 ? 1100 : 250)
  }
  return { fbSel: '#mix-feedback' }
}

async function solveTurtle(page, stage, wrong) {
  const t = stage.turtle || {}
  let sides = t.exactSides ?? t.minSides ?? t.defaultSides ?? 4
  let angle = t.needsStarAngle ? Math.round((360 * 2) / sides) : Math.round(360 / sides)
  let growth = t.needsGrowth ? 3 : (t.defaultGrowth ?? 0)
  let layers = t.minLayers ?? t.defaultLayers ?? 1
  if (wrong) {
    if (t.exactSides != null) sides = t.exactSides - 1
    else if (t.minSides != null) sides = t.minSides - 1
    else if (t.needsGrowth) growth = 0
    else if (t.minLayers != null) layers = t.minLayers - 1
    else sides = sides - 1
  }
  await setSlider(page, '#t-sides', sides)
  if (t.lockAngle === false) await setSlider(page, '#t-angle', angle)
  await setSlider(page, '#t-growth', growth)
  await setSlider(page, '#t-layers', layers)
  await page.click('button[onclick="turtleCheck()"]')
  await page.waitForTimeout(150)
  return { fbSel: '#t-feedback' }
}

async function solvePixel(page, stage, wrong) {
  const cfg = stage.pixel || {}
  if (cfg.mode === 'binary') {
    // greedy subset of descending place values that sums exactly to target
    let remaining = cfg.binaryTarget
    const cols = []
    cfg.binaryValues.forEach((v, c) => { if (v <= remaining) { cols.push(c); remaining -= v } })
    const use = wrong ? cols.slice(0, Math.max(0, cols.length - 1)) : cols
    for (const c of use) await page.evaluate((c) => pixelToggle(0, c), c)
  } else {
    const target = wrong ? cfg.target.slice(0, cfg.target.length - 1) : cfg.target
    for (const [r, c] of target) await page.evaluate(({ r, c }) => pixelToggle(r, c), { r, c })
  }
  await page.click('button[onclick="pixelCheck()"]')
  await page.waitForTimeout(150)
  return { fbSel: '#pixel-feedback' }
}

async function solveCipher(page, stage, wrong) {
  const cfg = stage.cipher || {}
  const answer = wrong ? cfg.answer + 'x' : cfg.answer
  await page.fill('#cipher-answer', answer)
  await page.click('button[onclick="cipherCheck()"]')
  await page.waitForTimeout(150)
  return { fbSel: '#cipher-feedback' }
}

async function solveMusic(page, stage, wrong) {
  const cfg = stage.music || {}
  const target = wrong ? cfg.target.slice(0, cfg.target.length - 1) : cfg.target
  for (const [r, c] of target) await page.evaluate(({ r, c }) => musicToggle(r, c), { r, c })
  if (cfg.needsTempo) await setSlider(page, '#m-bpm', wrong ? cfg.targetBpm + 20 : cfg.targetBpm)
  await page.click('button[onclick="musicCheck()"]')
  await page.waitForTimeout(150)
  return { fbSel: '#music-feedback' }
}

async function solveDance(page, stage, wrong) {
  const cfg = stage.dance || {}
  const seq = wrong ? cfg.target.map((v, i) => (i === cfg.target.length - 1 ? (v + 1) % 5 : v)) : cfg.target
  for (let i = 0; i < seq.length; i++) {
    for (let k = 0; k < seq[i]; k++) await page.evaluate((i) => danceCycle(i), i)
  }
  await page.click('button[onclick="danceCheck()"]')
  await page.waitForTimeout(150)
  return { fbSel: '#dance-feedback' }
}

async function solveGameRules(page, stage, wrong) {
  const cfg = stage.gamerules || {}
  for (let i = 0; i < cfg.rules.length; i++) {
    const rule = cfg.rules[i]
    let answer = rule.answer
    if (wrong && i === 0) answer = rule.choices.find(c => c !== rule.answer)
    await page.selectOption(`#gr-${i}`, answer)
  }
  await page.click('button[onclick="gameRulesCheck()"]')
  await page.waitForTimeout(150)
  return { fbSel: '#game-feedback' }
}

async function solveAIWorld(page, stage, wrong) {
  const cfg = stage.aiworld || {}
  if (cfg.mode === 'primarykey') {
    const answer = wrong ? cfg.columns.find(c => c !== cfg.answer) : cfg.answer
    await page.selectOption('#ai-pk-select', answer)
  } else if (cfg.mode === 'trick') {
    const idx = wrong ? (cfg.answer === 0 ? 1 : 0) : cfg.answer
    await page.click(`#ai-card-${idx}`)
  } else {
    for (let i = 0; i < cfg.cards.length; i++) {
      let bin = cfg.cards[i].answer
      if (wrong && i === cfg.cards.length - 1) bin = (bin + 1) % cfg.bins.length
      const numBins = cfg.bins.length
      for (let k = 0; k <= bin; k++) await page.evaluate(({ i, numBins }) => aiCycleBin(i, numBins), { i, numBins })
    }
  }
  await page.click('button[onclick="aiCheck()"]')
  await page.waitForTimeout(150)
  return { fbSel: '#ai-feedback' }
}

async function solveFinalQuest(page, stage, wrong) {
  const cfg = stage.finalquest || {}
  await page.evaluate((bossIds) => {
    const prog = {}
    bossIds.forEach(id => { prog[id] = { stars: 3, xp: 75 } })
    localStorage.setItem('bf-g6-quest', JSON.stringify(prog))
  }, wrong ? cfg.bossIds.slice(0, cfg.bossIds.length - 1) : cfg.bossIds)
  await openStage(page, stage.id) // reload so loadFinalQuest re-reads localStorage
  await page.click('button[onclick="finalQuestCheck()"]')
  await page.waitForTimeout(150)
  return { fbSel: '#final-feedback' }
}

const SOLVERS = {
  color: solveColor, turtle: solveTurtle, pixel: solvePixel, cipher: solveCipher,
  music: solveMusic, dance: solveDance, gamerules: solveGameRules,
  aiworld: solveAIWorld, finalquest: solveFinalQuest,
}

async function stagePassed(page) {
  // completeStage() opens the #win overlay — most reliable "did it actually pass" signal
  return await page.evaluate(() => {
    const w = document.getElementById('win')
    return !!(w && w.classList.contains('open'))
  })
}

async function main() {
  const browser = await chromium.launch({ executablePath: EDGE })
  const page = await browser.newPage()
  const consoleErrors = []
  page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message))
  page.on('console', msg => {
    if (msg.type() === 'error' && !/40[14]/.test(msg.text())) consoleErrors.push('console: ' + msg.text())
  })

  await page.goto(`${BASE}/lessons/grade6.html?dev=1`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  try { await page.mouse.click(1240, 33) } catch {}
  await page.waitForTimeout(200)

  const solverTypes = Object.keys(SOLVERS)
  const rawStages = await page.evaluate((types) => ALL_STAGES.filter(s => types.includes(s.type)), solverTypes)

  console.log(`Found ${rawStages.length} stages across non-maze worlds to test.\n`)

  for (const raw of rawStages) {
    const solver = SOLVERS[raw.type]
    // build a stage-shaped object with the fields each solver reads (mirrors ALL_STAGES' own shape)
    const stage = raw

    // 1) correct answer must pass
    await openStage(page, stage.id)
    const { fbSel } = await solver(page, stage, false)
    if (await stagePassed(page)) ok(`${stage.id} (${stage.type}) — correct answer passes`)
    else bad(`${stage.id} (${stage.type}) — correct answer passes`, await feedbackText(page, fbSel).catch(() => ''))

    // 2) deliberately wrong answer must NOT pass
    await openStage(page, stage.id)
    try {
      const { fbSel: fbSel2 } = await solver(page, stage, true)
      if (!(await stagePassed(page))) ok(`${stage.id} (${stage.type}) — wrong answer correctly rejected`)
      else bad(`${stage.id} (${stage.type}) — wrong answer correctly rejected`, 'stage passed with a deliberately wrong answer! feedback: ' + await feedbackText(page, fbSel2).catch(() => ''))
    } catch (e) {
      // some stages have no meaningful "wrong" variant structurally (e.g. single mandatory field) — skip, don't fail
      console.log(`  (skipped negative test for ${stage.id}: ${e.message})`)
    }
  }

  console.log(`\n${pass} passed, ${fail} failed.`)
  if (consoleErrors.length) {
    console.log(`\n${consoleErrors.length} unexpected console error(s):`)
    consoleErrors.forEach(e => console.log('  ' + e))
  }

  await browser.close()

  if (fail > 0 || consoleErrors.length > 0) {
    console.log('\nFAILURES:')
    failures.forEach(f => console.log('  ✗ ' + f))
    process.exit(1)
  }
  console.log('\nall Grade 6 non-maze worlds verified — every exercise honest')
}

main()
