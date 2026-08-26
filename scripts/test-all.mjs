// ByteForge — unified exercise test runner.
//
// Runs every per-grade pass/fail suite in one go and prints a single numbered
// report: one line per suite, then a grand total across all of them. Exits
// non-zero if any suite fails, so it works as a CI gate as well as a human
// readout.
//
//   node scripts/test-all.mjs            run every headless suite
//   node scripts/test-all.mjs --list     just list the suites, run nothing
//   node scripts/test-all.mjs --verbose  also echo each suite's own output
//
// Playwright-based suites (which need `npm run dev` already serving) are
// listed but skipped by default — pass --browser to include them.
import { spawnSync } from 'child_process'
import { existsSync } from 'fs'
import path from 'path'

const ROOT = 'c:/Users/user/Downloads/ICT website'

// Ordered roughly by student progression, so a failure reads like a grade level.
const SUITES = [
  { id: 'lesson-js',  grade: '—',         name: 'Lesson JS syntax (all pages parse)', script: 'check-lesson-js.mjs' },
  { id: 'g6-maze',    grade: 'Grade 6',   name: 'Maze worlds (W1/W2/W4)',             script: 'test-g6-maze.mjs' },
  { id: 'g6-worlds',  grade: 'Grade 6',   name: 'All worlds (W3, W5–W12)',            script: 'test-g6-worlds.mjs', browser: true },
  { id: 'g7',         grade: 'Grade 7',   name: 'Game Maker challenges',              script: 'test-g7-challenges.mjs' },
  { id: 'g8',         grade: 'Grade 8',   name: 'App Builder challenges',             script: 'test-g8-challenges.mjs' },
  { id: 'g9-missions',grade: 'Grade 9',   name: 'Mission IDE',                        script: 'test-g9-missions.mjs' },
  { id: 'g9',         grade: 'Grade 9',   name: 'Pseudocode challenges',              script: 'test-g9-challenges.mjs' },
  { id: 'igcse-y1',   grade: 'IGCSE Y1',  name: 'Theory challenges',                  script: 'test-igcse-y1-challenges.mjs' },
  { id: 'igcse-y2',   grade: 'IGCSE Y2',  name: 'Pseudocode challenges',              script: 'test-igcse-y2-challenges.mjs' },
  { id: 'as-pseudo',  grade: 'AS Level',  name: 'Pseudocode Lab (PSEUDO_SETS)',       script: 'test-as-pseudo.mjs' },
  { id: 'al-lab',     grade: 'A Level',   name: 'Code Lab (AL_LAB_SETS)',             script: 'test-al-lab.mjs' },
  { id: 'p4',         grade: 'A Level',   name: 'Paper 4 challenges',                 script: 'test-p4-challenges.mjs' },
  { id: 'p4-starters',grade: 'A Level',   name: 'Paper 4 starters',                   script: 'test-p4-starters.mjs' },
  { id: 'theory',     grade: 'AS+A Level', name: 'Written-answer scoring (THEORY_EXERCISES)', script: 'test-theory-scoring.mjs' },
  { id: 'chests',     grade: 'Platform',  name: 'Daily quest chest rewards',          script: 'test-chest-rewards.mjs' },
]

const args     = process.argv.slice(2)
const listOnly = args.includes('--list')
const verbose  = args.includes('--verbose')
const browser  = args.includes('--browser')

const pad = (s, n) => String(s).padEnd(n)

if (listOnly) {
  console.log('\nByteForge test suites\n')
  SUITES.forEach((s, i) => {
    console.log(`  ${String(i + 1).padStart(2)}. ${pad(s.grade, 10)} ${pad(s.name, 42)} ${s.browser ? '(needs npm run dev)' : ''}`)
  })
  console.log(`\n${SUITES.length} suites.\n`)
  process.exit(0)
}

console.log('\n══════════════════════════════════════════════════════════════════════')
console.log('  ByteForge — full exercise test run')
console.log('══════════════════════════════════════════════════════════════════════\n')

let totalPass = 0, totalFail = 0, totalSkip = 0
let suitesOk = 0, suitesFailed = 0, suitesSkipped = 0
const failedSuites = []

SUITES.forEach((suite, i) => {
  const n     = String(i + 1).padStart(2)
  const label = `${pad(suite.grade, 10)} ${pad(suite.name, 42)}`
  const file  = path.join(ROOT, 'scripts', suite.script)

  if (!existsSync(file)) {
    suitesSkipped++
    console.log(`Suite ${n}  ⊘ ${label} MISSING (${suite.script})`)
    return
  }

  if (suite.browser && !browser) {
    suitesSkipped++
    console.log(`Suite ${n}  ⊘ ${label} skipped — needs a browser (--browser)`)
    return
  }

  const res = spawnSync(process.execPath, [file], { encoding: 'utf8', cwd: ROOT })
  const out = (res.stdout || '') + (res.stderr || '')

  // Most suites end with "N passed, M failed"; fall back to counting tick marks.
  const m = out.match(/(\d+)\s+passed,\s+(\d+)\s+failed/)
  let p, f
  if (m) {
    p = parseInt(m[1]); f = parseInt(m[2])
  } else {
    p = (out.match(/^\s*(Test\s+\d+\s+)?✓/gm) || []).length
    f = (out.match(/^\s*(Test\s+\d+\s+)?✗/gm) || []).length
  }
  const skipM = out.match(/(\d+)\s+AI-checked \(skipped\)/)
  const sk = skipM ? parseInt(skipM[1]) : 0

  totalPass += p; totalFail += f; totalSkip += sk
  const ok = res.status === 0 && f === 0

  if (ok) {
    suitesOk++
    console.log(`Suite ${n}  ✓ ${label} ${String(p).padStart(4)} passed${sk ? `, ${sk} skipped` : ''}`)
  } else {
    suitesFailed++
    failedSuites.push({ suite, out, p, f, status: res.status })
    console.log(`Suite ${n}  ✗ ${label} ${String(p).padStart(4)} passed, ${f} FAILED`)
  }

  if (verbose) console.log(out.split('\n').map(l => '        │ ' + l).join('\n'))
})

// ── Detail on anything that failed ───────────────────────────────────────────
if (failedSuites.length) {
  console.log('\n──────────────────────────────────────────────────────────────────────')
  console.log('  FAILURES')
  console.log('──────────────────────────────────────────────────────────────────────')
  for (const { suite, out } of failedSuites) {
    console.log(`\n▼ ${suite.grade} — ${suite.name} (${suite.script})`)
    const lines = out.split('\n').filter(l => /✗/.test(l))
    if (lines.length) lines.forEach(l => console.log('   ' + l.trim()))
    else console.log('   (suite exited non-zero with no ✗ lines — full output below)\n' +
                    out.split('\n').slice(-15).map(l => '   ' + l).join('\n'))
  }
}

// ── Grand total ──────────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════════════════════════════════════')
console.log(`  TOTAL: ${totalPass + totalFail} tests — ${totalPass} passed, ${totalFail} failed` +
            (totalSkip ? `, ${totalSkip} AI-checked (skipped)` : ''))
console.log(`  SUITES: ${suitesOk} passed, ${suitesFailed} failed` +
            (suitesSkipped ? `, ${suitesSkipped} skipped` : ''))
console.log('══════════════════════════════════════════════════════════════════════')

if (suitesFailed > 0) {
  console.log('\n  ✗ SOME TESTS FAILED\n')
  process.exit(1)
}
console.log('\n  ✓ ALL TESTS PASSING\n')
