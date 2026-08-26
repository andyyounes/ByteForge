// Verifies the standalone tool lessons — the pages students reach from a
// concept's `learningModes` via MODE_URLS in
// app/(app)/student/concept/[id]/page.tsx. These had ZERO coverage of any kind
// despite being high-traffic: canvas-code.html serves 16 concepts across
// Grades 6-8, pseudocode.html serves 18, ide.html serves 19.
//
// What this locks down (each was a real, confirmed bug):
//   * canvas-code.html — every one of the 5 challenges shipped a COMPLETE
//     working demo as its "starter" and a substring check the demo already
//     satisfied, so all five completed the instant you pressed Run.
//   * pseudocode.html — the DIV transform was
//       .replace(/DIV/gi, 'Math.floor(({0})/({1}))'.slice(0,14))
//     where .slice(0,14) yields the 14-char FRAGMENT "Math.floor(({0". Every
//     `a DIV b` threw a SyntaxError that the evaluator swallowed, printing the
//     raw text "7 DIV 2". Both operators were also unanchored, so /DIV/gi and
//     /MOD/gi corrupted identifiers like `divisor` and `modulus`.
//   * ide.html — the JS "Reverse a string" expected answer was mojibake
//     ("egreFotyB"), so the correct answer failed.
//   * blockly-turtle.html — two loop challenges gated on jsCode.includes('for(')
//     but Blockly emits "for (var " WITH a space, so they were uncompletable.
//
// Also guards against a stray backspace byte (0x08) ending up inside a source
// file — one was introduced during this work by a shell heredoc collapsing an
// escape, and it silently corrupted a live regex.
import { readFileSync, readdirSync } from 'fs'

const ROOT = 'c:/Users/user/Downloads/ICT website'
const read = f => readFileSync(`${ROOT}/${f}`, 'utf8')

let n = 0, pass = 0, fail = 0
const t = (ok, label) => {
  n++
  if (ok) { pass++; console.log(`Test ${String(n).padStart(2)}  ✓ ${label}`) }
  else    { fail++; console.log(`Test ${String(n).padStart(2)}  ✗ ${label}`) }
}

// ── canvas-code.html ─────────────────────────────────────────────────────────
{
  const h = read('public/lessons/canvas-code.html')
  const s = h.indexOf('const CHALLENGES = [')
  const m = h.slice(s).match(/\r?\n\]\r?\n/)
  const { CHALLENGES } = new Function(h.slice(s, s + m.index + m[0].indexOf(']') + 1) + '\nreturn {CHALLENGES}')()
  const strip = c => c.replace(/\/\/.*$/gm, '')

  t(CHALLENGES.length === 5, `canvas-code: found all 5 challenges (got ${CHALLENGES.length})`)

  for (const c of CHALLENGES) {
    t(!c.check(strip(c.starter)), `canvas-code/${c.name} — starter does NOT already pass`)
  }

  // A finished solution — the starter plus exactly what its TODO asks for.
  const SOLUTIONS = {
    'Colour Mixer':           c => c.starter + '\nbackground(`rgb(${r},${g},${b})`)',
    'Traffic Light':          c => c.starter.replace('let redColor    = "#3f0f0f"',
                                                     'let redColor    = state === 0 ? "#ef4444" : "#3f0f0f"'),
    'Move the Box':           c => c.starter.replace('  rect(x - 25',
                                                     '  if (isKeyDown("ArrowUp")) y -= speed\n  if (isKeyDown("ArrowDown")) y += speed\n  rect(x - 25'),
    'Village with Functions': c => c.starter + '\ndrawHouse(60,200,"#3b82f6")\ndrawHouse(180,200,"#f97316")\ndrawHouse(300,200,"#22c55e")\ndrawHouse(420,200,"#a855f7")',
    'Leaderboard':            c => c.starter + '\nscores.sort((a, b) => b - a)',
  }
  for (const [name, build] of Object.entries(SOLUTIONS)) {
    const c = CHALLENGES.find(x => x.name === name)
    if (!c) { t(false, `canvas-code/${name} — challenge not found`); continue }
    t(!!c.check(strip(build(c))), `canvas-code/${name} — a real solution DOES pass`)
  }
}

// ── pseudocode.html: DIV / MOD ───────────────────────────────────────────────
{
  // Strip line comments first: both files deliberately quote the OLD broken
  // code in a comment explaining the bug, which would match these greps.
  const noComments = src => src.replace(/^\s*\/\/.*$/gm, '')
  const h = noComments(read('public/lessons/pseudocode.html'))
  t(!/'Math\.floor\(\(\{0\}\)\/\(\{1\}\)\)'\.slice/.test(h),
    'pseudocode: the truncated .slice(0,14) DIV transform is gone from live code')
  t(/\.replace\(\/\\bMOD\\b\/gi/.test(h),
    'pseudocode: MOD is word-bounded (does not corrupt "modulus")')

  // Re-implement the shipped transform and check it actually computes.
  const OPERAND = '(\\([^()]*\\)|-?[\\w.]+(?:\\[[^\\]]*\\])?)'
  const evalExpr = (expr, vars = {}) => {
    let d = expr
    for (let g = 0; g < 20 && /\bDIV\b/i.test(d); g++) {
      const before = d
      d = d.replace(new RegExp(OPERAND + '\\s*\\bDIV\\b\\s*' + OPERAND, 'i'), 'Math.floor(($1)/($2))')
      if (d === before) break
    }
    const js = d.replace(/\bMOD\b/gi, '%').replace(/\^/g, '**')
      .replace(/([A-Za-z_]\w*)(\[[^\]]+\])?/g, (mm, name) => (name in vars) ? JSON.stringify(vars[name]) : mm)
    try { return eval(js) } catch { return 'SYNTAX ERROR' }
  }
  for (const [expr, vars, want] of [
    ['7 DIV 2', {}, 3],
    ['17 DIV 5', {}, 3],
    ['total DIV n', { total: 420, n: 5 }, 84],
    ['(a+b) DIV 2', { a: 7, b: 3 }, 5],
    ['10 DIV 3 + 1', {}, 4],
    ['7 MOD 2', {}, 1],
    ['divisor + 1', { divisor: 9 }, 10],
    ['modulus * 2', { modulus: 4 }, 8],
  ]) {
    t(evalExpr(expr, vars) === want, `pseudocode: ${expr} = ${want} (got ${evalExpr(expr, vars)})`)
  }
}

// ── ide.html ─────────────────────────────────────────────────────────────────
{
  const h = read('public/lessons/ide.html')
  const m = h.match(/id:'js3'[\s\S]*?expected:'([^']*)'/)
  const want = 'ByteForge'.split('').reverse().join('')
  t(!!m && m[1] === want, `ide: "Reverse a string" expects ${JSON.stringify(want)} (found ${m ? JSON.stringify(m[1]) : 'nothing'})`)
  t(/loadExercise\(currentLang, currentEx\.id, true\)/.test(h),
    'ide: re-rendering results keeps the student\'s code instead of resetting to the starter')
  t(/const firstTime = !BF\.progress\(me\.id\)\.completedExercises\.includes/.test(h),
    'ide: first-time completion is checked BEFORE recordAttempt, so the XP popup can fire')
}

// ── blockly-turtle.html ──────────────────────────────────────────────────────
{
  const h = read('public/lessons/blockly-turtle.html').replace(/^\s*\/\/.*$/gm, '')
  t(!/includes\('for\('\)/.test(h), 'blockly-turtle: the unmatchable includes("for(") loop gate is gone from live code')
  const loopRe = /\b(for|while)\s*\(/
  t(loopRe.test('for (var i = 0; i < 5; i++) {'), 'blockly-turtle: loop gate matches Blockly\'s real "for (var " output')
  t(loopRe.test('for(let x=0;x<3;x++){'),          'blockly-turtle: loop gate also matches compact "for("')
  t(!loopRe.test('forward(100)'),                   'blockly-turtle: loop gate does not match forward()')
}

// ── No stray control bytes anywhere in shipped source ────────────────────────
{
  const BS = String.fromCharCode(8)
  const files = [
    ...readdirSync(`${ROOT}/public/lessons`).filter(f => f.endsWith('.html')).map(f => `public/lessons/${f}`),
    ...readdirSync(`${ROOT}/public/js`).filter(f => f.endsWith('.js')).map(f => `public/js/${f}`),
  ]
  const dirty = files.filter(f => read(f).includes(BS))
  t(dirty.length === 0, `no shipped source file contains a stray backspace byte${dirty.length ? ` — ${dirty.join(', ')}` : ''}`)
}

console.log(`\n${pass} passed, ${fail} failed, ${n} tests total.`)
if (fail > 0) process.exit(1)
console.log('standalone tool lessons: starters require real work and the shipped answers are correct')
