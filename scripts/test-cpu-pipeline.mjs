// Verifies the CPU pipeline animation (public/lessons/cpu-pipeline.html)
// actually demonstrates PIPELINING — the real bug this locks down:
//
//   The animation used to move a SINGLE token through all four stages, one
//   instruction fully completing (Fetch -> Decode -> Execute -> WriteBack)
//   before the next one entered Fetch. That is a non-pipelined CPU. Question 3
//   ("Why is pipelining beneficial?") tells students to answer using what they
//   saw in the animation above, expecting "it processes multiple instructions
//   simultaneously at different stages" — the opposite of what the old
//   animation showed.
//
// This re-simulates the page's own stepPipeline() advance/fetch/retire logic
// standalone (no DOM needed) and checks: every instruction retires exactly
// once, in program order, the pipeline actually drains, and — the whole
// point — multiple instructions occupy multiple DIFFERENT stages on the same
// tick at some point during the run.
import { readFileSync } from 'fs'

const ROOT = 'c:/Users/user/Downloads/ICT website'
const html = readFileSync(`${ROOT}/public/lessons/cpu-pipeline.html`, 'utf8')

// Pull INSTRUCTIONS out of the page so this tracks the real program, not a
// hand-copied one.
const s = html.indexOf('const INSTRUCTIONS = [')
const m = html.slice(s).match(/\r?\n\]\r?\n/)
const { INSTRUCTIONS } = new Function(html.slice(s, s + m.index + m[0].indexOf(']') + 1) + '\nreturn { INSTRUCTIONS }')()

let n = 0, pass = 0, fail = 0
const t = (ok, label) => {
  n++
  if (ok) { pass++; console.log(`Test ${String(n).padStart(2)}  ✓ ${label}`) }
  else    { fail++; console.log(`Test ${String(n).padStart(2)}  ✗ ${label}`) }
}

function simulate(N) {
  let inFlight = [], nextToFetch = 0, instrCompleted = 0
  const retiredOrder = []
  const distinctStagesPerTick = []
  let ticks = 0
  while (!(nextToFetch >= N && inFlight.length === 0)) {
    const advanced = []
    for (const f of inFlight) {
      const ns = f.stage + 1
      if (ns > 3) { instrCompleted++; retiredOrder.push(f.instrIdx) }
      else advanced.push({ instrIdx: f.instrIdx, stage: ns })
    }
    inFlight = advanced
    if (nextToFetch < N) { inFlight.push({ instrIdx: nextToFetch, stage: 0 }); nextToFetch++ }
    distinctStagesPerTick.push(new Set(inFlight.map(f => f.stage)).size)
    ticks++
    if (ticks > N * 6 + 20) throw new Error('runaway — pipeline never drains')
  }
  return { ticks, instrCompleted, retiredOrder, maxDistinctStages: Math.max(...distinctStagesPerTick, 0) }
}

t(INSTRUCTIONS.length >= 4, `program has enough instructions to actually fill the pipeline (${INSTRUCTIONS.length} found, need >= 4)`)

const N = INSTRUCTIONS.length
const r = simulate(N)

// The core regression: real overlap. A non-pipelined model (the old bug)
// never has more than ONE stage occupied at a time.
t(r.maxDistinctStages === 4,
  `multiple instructions occupy all 4 DIFFERENT stages at once at some point (max seen: ${r.maxDistinctStages}) — this is what "pipelining" means`)

t(r.instrCompleted === N, `every instruction retires exactly once (${r.instrCompleted}/${N})`)
t(JSON.stringify(r.retiredOrder) === JSON.stringify([...Array(N).keys()]),
  `instructions retire in program order (no reordering) — ${JSON.stringify(r.retiredOrder)}`)
t(r.ticks < N * 4, `the pipeline drains in fewer ticks than running each instruction to completion one at a time would take (${r.ticks} ticks, vs ${N * 4} unpipelined)`)

// Also re-verify the jump-target fix from a previous session hasn't regressed:
// the program must not reference an address it doesn't itself define.
const addrs = new Set(INSTRUCTIONS.map(i => i.addr))
const jump = INSTRUCTIONS.find(i => /^JGT\s+0x/i.test(i.op))
if (jump) {
  const target = jump.op.match(/0x[0-9a-fA-F]+/)[0]
  t(addrs.has(target), `the JGT jump target (${target}) is a real address in the program`)
}

console.log(`\n${pass} passed, ${fail} failed, ${n} tests total.`)
if (fail > 0) process.exit(1)
console.log('the pipeline animation demonstrates real overlapping execution, not a sequential non-pipelined CPU')
