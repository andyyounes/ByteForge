// Verifies the AS/A Level daily quest chest's variable-reward roll
// (LessonQuest's CHEST_REWARDS / rollChestReward in public/js/lesson-quest.js):
// every roll must return one of the defined rewards (never undefined), the
// cumulative weight bands must be well-formed (strictly increasing, ending
// at 100), and over many rolls the observed distribution should land close
// to the declared weights — catching an off-by-one in the `max` bands that
// would silently skew rewards.
import { readFileSync } from 'fs'

const src = readFileSync('c:/Users/user/Downloads/ICT website/public/js/lesson-quest.js', 'utf8')
const s = src.indexOf('const CHEST_REWARDS = [')
const e = src.indexOf('function rollChestReward')
const endOfFn = src.indexOf('\n  }', e) + 4
const snippet = src.slice(s, endOfFn)
const { CHEST_REWARDS, rollChestReward } = new Function('Math', snippet + '\nreturn { CHEST_REWARDS, rollChestReward }')(Math)

let pass = 0, fail = 0

// 1. Well-formed cumulative bands
let prevMax = 0
for (const r of CHEST_REWARDS) {
  if (r.max > prevMax) { pass++ } else { fail++; console.log(`✗ band max ${r.max} does not strictly increase past ${prevMax}`) }
  prevMax = r.max
}
if (CHEST_REWARDS[CHEST_REWARDS.length - 1].max === 100) { pass++; console.log('✓ bands end exactly at 100') }
else { fail++; console.log(`✗ bands end at ${CHEST_REWARDS[CHEST_REWARDS.length - 1].max}, not 100 — some rolls would fall through undefined`) }

// 2. Every possible roll (0..99.999) resolves to a defined reward, never undefined
const N = 200000
const counts = {}
let anyUndefined = false
for (let i = 0; i < N; i++) {
  const r = rollChestReward()
  if (!r || typeof r.xp !== 'number') { anyUndefined = true; break }
  counts[r.xp] = (counts[r.xp] || 0) + 1
}
if (!anyUndefined) { pass++; console.log(`✓ ${N} rolls all resolved to a defined reward`) }
else { fail++; console.log(`✗ some roll produced an undefined reward`) }

// 3. Observed distribution roughly matches declared weights (within 1.5 percentage points)
let bandFloor = 0
for (const r of CHEST_REWARDS) {
  const declaredPct = r.max - bandFloor
  const observedPct = (counts[r.xp] || 0) / N * 100
  const diff = Math.abs(declaredPct - observedPct)
  if (diff < 1.5) { pass++; console.log(`✓ xp=${r.xp}: declared ${declaredPct}%, observed ${observedPct.toFixed(2)}%`) }
  else { fail++; console.log(`✗ xp=${r.xp}: declared ${declaredPct}%, observed ${observedPct.toFixed(2)}% (diff ${diff.toFixed(2)} too large)`) }
  bandFloor = r.max
}

console.log(`\n${pass} passed, ${fail} failed.`)
if (fail > 0) process.exit(1)
console.log('daily quest chest reward roll is well-formed and statistically matches its declared weights')
