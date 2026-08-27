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

// ── flowchart.html: the simulator must actually simulate ─────────────────────
// buildSimPath used a `visited` Set and bailed the moment a node repeated, so a
// loop's back-edge ended the walk immediately: the body ran ONCE and "End" was
// never reached — the While-loop template could not be simulated as a loop at
// all. Decisions also always took the Yes branch, making every No branch
// unreachable. Run the real (patched) logic over the shipped templates.
{
  const src = readFileSync(`${ROOT}/public/lessons/flowchart.html`, 'latin1')
  const s = src.indexOf('const path = [];')
  const e = src.indexOf('return path;', s) + 'return path;'.length
  const buildSimPath = (nodes, edges) => new Function('nodes', 'edges', src.slice(s, e))(nodes, edges)

  let id = 1
  const mk = (type, label) => ({ id: id++, type, label })

  // While-loop template
  const ln = [mk('start','Start'), mk('process','count = 0'), mk('decision','count < 5?'),
              mk('process','Do something'), mk('process','count = count + 1'), mk('start','End')]
  const [S, INIT, DEC, BODY, INC, END] = ln
  const le = [
    { from:S.id, to:INIT.id, label:'' }, { from:INIT.id, to:DEC.id, label:'' },
    { from:DEC.id, to:BODY.id, label:'Yes' }, { from:BODY.id, to:INC.id, label:'' },
    { from:INC.id, to:DEC.id, label:'' },          // back-edge
    { from:DEC.id, to:END.id, label:'No' },
  ]
  const lp = buildSimPath(ln, le)
  t(lp.some(x => x.id === END.id),            'flowchart: the loop template reaches End')
  t(lp.filter(x => x.id === BODY.id).length >= 2, 'flowchart: the loop body actually repeats')
  t(lp.some(x => x.branch === 'No'),          'flowchart: the No branch is reachable (loop can exit)')
  t(lp.length <= 60,                          'flowchart: the walk is bounded (no runaway loop)')

  // If/Else template — must still terminate at End
  id = 1
  const fn = [mk('start','Start'), mk('process','Init'), mk('decision','Condition true?'),
              mk('process','True branch'), mk('process','False branch'), mk('start','End')]
  const [S2, P2, D2, T2, F2, E2] = fn
  const fe = [
    { from:S2.id, to:P2.id, label:'' }, { from:P2.id, to:D2.id, label:'' },
    { from:D2.id, to:T2.id, label:'Yes' }, { from:D2.id, to:F2.id, label:'No' },
    { from:T2.id, to:E2.id, label:'' }, { from:F2.id, to:E2.id, label:'' },
  ]
  const fp = buildSimPath(fn, fe)
  t(fp.some(x => x.id === E2.id), 'flowchart: the if/else template reaches End')

  // The decision message must report the branch actually taken.
  t(/decision:\s*\(n,\s*branch\)/.test(src), 'flowchart: the decision message reports the real branch, not always YES')
}

// ── turtle.html: expression arguments must actually evaluate ─────────────────
// parseLine used bare +m[1], so `forward(i * 3)` became +("i * 3") = NaN. The
// Spiral challenge recorded 36 NaN moves, drew NOTHING, and still awarded 50 XP
// because its check only counted them. pencolor() accepted only a QUOTED
// literal, so `pencolor(colors[i % 6])` produced zero colour commands and the
// Colourful Hexagon challenge was impossible. The loop variable was also
// discarded entirely by parseCode, so `i` could never resolve.
{
  const src = readFileSync(`${ROOT}/public/lessons/turtle.html`, 'latin1')
  const ps = src.indexOf('function parseCode(src)')
  const pe = src.indexOf('function execStep(cmd)')
  const cs = src.indexOf('const CHALLENGES = [')
  const cm = src.slice(cs).match(/\r?\n\]\r?\n/)
  const { parseCode, CHALLENGES } = new Function(
    src.slice(ps, pe) + '\n' + src.slice(cs, cs + cm.index + cm[0].indexOf(']') + 1) +
    '\nreturn { parseCode, CHALLENGES }')()

  const allCmds = CHALLENGES.flatMap(c => parseCode(c.starter))
  t(allCmds.every(c => typeof c.val !== 'number' || Number.isFinite(c.val)),
    'turtle: no starter produces a NaN movement')

  const spiral = CHALLENGES.find(c => c.name === 'Spiral')
  const svals = parseCode(spiral.starter).filter(c => c.type === 'forward').map(c => c.val)
  t(svals.length >= 20 && svals.every(Number.isFinite),
    'turtle/Spiral: forward(i * 3) evaluates instead of yielding NaN')
  t(new Set(svals).size > 5,
    'turtle/Spiral: the distances actually grow (a real spiral, not a blank canvas)')

  const hex = CHALLENGES.find(c => c.name === 'Colourful Hexagon')
  const hcmds = parseCode(hex.starter)
  t(hcmds.filter(c => c.type === 'color').length >= 3,
    'turtle/Colourful Hexagon: pencolor(colors[i % 6]) resolves to real colours')
  t(!!hex.check(hcmds), 'turtle/Colourful Hexagon: is completable at all')
}

// ── pixel-grid.html: setGrid must not depend on the global window.event ──────
// setGrid used `event.target.classList.add('active')`, relying on the
// deprecated global window.event. It is ALSO called programmatically by
// loadChallenge during init, where window.event is undefined — so it threw a
// TypeError that halted top-level execution: the LessonSaves.load() that
// follows never ran (saved artwork and completion state were never restored)
// and draw() was skipped, so the grid did not even render.
{
  const h = readFileSync(`${ROOT}/public/lessons/pixel-grid.html`, 'utf8')
  const live = h.replace(/^\s*\/\/.*$/gm, '')
  t(/function setGrid\(n, ev\)/.test(live), 'pixel-grid: setGrid takes the event explicitly')
  t(!/[^.\w]event\.target/.test(live),      'pixel-grid: no reliance on the global window.event in live code')
  t((live.match(/setGrid\(\d+, event\)/g) || []).length === 4,
    'pixel-grid: all four size buttons pass their event through')
}

// ── blockly.html: shape challenges must check the actual shape ───────────────
// 'sq' was trail.length>=4 and 'tri' was trail.length>=3, and checkChallenge()
// evaluates EVERY challenge after each run — so one square completed "square",
// "triangle" and "travel 100+ pixels" at once (95 XP from one program), and any
// four segments (a zigzag) counted as a square.
{
  const h = readFileSync(`${ROOT}/public/lessons/blockly.html`, 'utf8')
  const s = h.indexOf('function isRegularPolygon')
  const e = h.indexOf('\n    }', s) + 6
  const { isRegularPolygon } = new Function(h.slice(s, e) + '\nreturn { isRegularPolygon }')()

  // Build trails: closed square, closed triangle, open zigzag.
  const seg = (x1, y1, x2, y2) => ({ x1, y1, x2, y2 })
  const square = [seg(0,0,100,0), seg(100,0,100,100), seg(100,100,0,100), seg(0,100,0,0)]
  const tri    = [seg(0,0,100,0), seg(100,0,50,86),   seg(50,86,0,0)]
  const zigzag = [seg(0,0,50,0),  seg(50,0,50,50),    seg(50,50,120,50), seg(120,50,120,10)]
  const openSquare = square.slice(0, 3)   // three sides, never closes

  t(isRegularPolygon(square, 4) === true,  'blockly: a real square counts as a square')
  t(isRegularPolygon(square, 3) === false, 'blockly: a square does NOT also count as a triangle')
  t(isRegularPolygon(tri, 3) === true,     'blockly: a real triangle counts as a triangle')
  t(isRegularPolygon(tri, 4) === false,    'blockly: a triangle does NOT also count as a square')
  t(isRegularPolygon(zigzag, 4) === false, 'blockly: a 4-segment zigzag is NOT a square')
  t(isRegularPolygon(openSquare, 3) === false, 'blockly: an unclosed path is not a polygon')
  t(!/output-panel'\)\.textContent\.length > 30/.test(h.replace(/^\s*\/\/.*$/gm, '')),
    'blockly: "say" no longer passes on the output panel\'s own text')
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
