// Verifies app/api/lesson-saves/route.ts never lets `passed` or `xp_earned`
// regress — the exact bug that draft-autosaving code on every Run would
// otherwise trigger: a student reopens an ALREADY-passed stage, Run sends
// passed:false because it's recomputing from the (still-correct, unmodified)
// code isn't re-checked client-side before the autosave fires... the point
// being ANY later save call with passed:false/xpEarned:0 for a row that was
// already passed must keep it passed, with its XP intact.
//
// Runs the row-building logic exactly as route.ts computes it (both the
// id-keyed path and the legacy index-keyed path), against a fake "existing
// row" — no real Supabase needed, this is pure logic extracted to match.
import { readFileSync } from 'fs'
let pass = 0, fail = 0
const ok = (c, m) => { if (c) { pass++; console.log('✓ ' + m) } else { fail++; console.log('✗ ' + m) } }

// Source-level tripwire: if someone edits route.ts's monotonic expressions
// without updating the reimplementation below, THIS fails loudly instead of
// the two silently drifting apart and the behavioral tests below passing
// against stale logic.
{
  const src = readFileSync('c:/Users/user/Downloads/ICT website/app/api/lesson-saves/route.ts', 'utf8')
  ok(src.includes('passed:        !!passed || !!existingRow?.passed,'), 'route.ts (id-keyed): the exact monotonic `passed` expression is present')
  ok(src.includes('xp_earned:     Math.max(xpEarned ?? 0, existingRow?.xp_earned ?? 0),'), 'route.ts (id-keyed): the exact monotonic `xp_earned` expression is present')
  ok(src.includes('passed:        !!passed || !!existing?.passed,'), 'route.ts (idx-keyed): the exact monotonic `passed` expression is present')
  ok(src.includes('xp_earned:     Math.max(xpEarned ?? 0, existing?.xp_earned ?? 0),'), 'route.ts (idx-keyed): the exact monotonic `xp_earned` expression is present')
}

// id-keyed path (mirrors route.ts lines building `row` under `if (challengeId)`)
function idKeyedRow({ passed, xpEarned, code }, existingRow) {
  return {
    passed:    !!passed || !!existingRow?.passed,
    xp_earned: Math.max(xpEarned ?? 0, existingRow?.xp_earned ?? 0),
    code:      code ?? null,
  }
}
// legacy index-keyed path (mirrors the `upsert` row further down)
function idxKeyedRow({ passed, xpEarned, code }, existing) {
  return {
    passed:    !!passed || !!existing?.passed,
    xp_earned: Math.max(xpEarned ?? 0, existing?.xp_earned ?? 0),
    code:      code ?? null,
  }
}

for (const rowFn of [idKeyedRow, idxKeyedRow]) {
  const label = rowFn === idKeyedRow ? 'id-keyed' : 'idx-keyed'

  const r1 = rowFn({ passed: true, xpEarned: 50, code: 'print(1)' }, null)
  ok(r1.passed === true && r1.xp_earned === 50, `${label}: a brand-new first pass saves passed:true and the real XP`)

  const r2 = rowFn({ passed: false, xpEarned: 0, code: 'print(2) # still editing' }, { passed: true, xp_earned: 50 })
  ok(r2.passed === true && r2.xp_earned === 50 && r2.code === 'print(2) # still editing',
    `${label}: a draft autosave (passed:false) on an ALREADY-passed row keeps it passed and keeps its XP — the whole point of this fix`)

  const r3 = rowFn({ passed: true, xpEarned: 0, code: 'print(3)' }, { passed: true, xp_earned: 50 })
  ok(r3.passed === true && r3.xp_earned === 50, `${label}: re-saving an already-passed row with xpEarned:0 never double-awards or loses XP`)

  const r4 = rowFn({ passed: false, xpEarned: 0, code: 'still wrong' }, { passed: false, xp_earned: 0 })
  ok(r4.passed === false, `${label}: a genuinely-never-passed row correctly stays passed:false`)

  const r5 = rowFn({ passed: true, xpEarned: 50, code: 'print(5)' }, { passed: false, xp_earned: 0 })
  ok(r5.passed === true && r5.xp_earned === 50, `${label}: passing for real still flips an unpassed row to passed:true`)
}

console.log(`\n${pass} passed, ${fail} failed.`)
if (fail > 0) process.exit(1)
console.log('lesson_saves.passed/xp_earned are monotonic — a code-draft autosave can never un-complete a stage')
