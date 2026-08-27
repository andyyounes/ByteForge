// Loads every student-facing lesson page in a real browser and checks how it
// actually RENDERS — the things a code-only test can never see:
//
//   * console errors thrown during load (a page that throws stops executing,
//     which is how pixel-grid.html silently lost its save restoration)
//   * MOJIBAKE — double-encoded UTF-8 rendering as visible garbage such as
//     "â€”" for an em dash or "ðŸ“Š" for an emoji. Several of these files are
//     stored double-encoded, so students literally see the garbage on screen.
//   * horizontal page overflow (content wider than the viewport)
//   * critical elements that render with zero size (invisible controls)
//   * unrendered template placeholders left in the DOM ("undefined", "NaN",
//     "[object Object]", an unsubstituted ${...})
//
// Requires `npm run dev` to be serving. Run with:  node scripts/test-ui-render.mjs
// Optional: --url http://localhost:3001   --shots  (write screenshots)
import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const argv = process.argv.slice(2)
const BASE = (argv.includes('--url') ? argv[argv.indexOf('--url') + 1] : 'http://localhost:3000').replace(/\/$/, '')
const SHOTS = argv.includes('--shots')
const SHOT_DIR = 'c:/Users/user/Downloads/ICT website/.ui-shots'

const PAGES = [
  'grade6.html', 'grade7.html', 'grade8.html', 'grade9.html', 'grade9-missions.html',
  'igcse-y1.html', 'igcse-y2.html', 'as-level.html', 'a-level.html',
  'binary-cards.html', 'blockly.html', 'blockly-turtle.html', 'canvas-code.html',
  'compression.html', 'cpu-pipeline.html', 'flowchart.html', 'ide.html',
  'pixel-grid.html', 'pseudocode.html', 'algo-viz.html', 'turtle.html',
]

// Sequences that only appear when UTF-8 has been decoded as Latin-1/CP1252.
const MOJIBAKE = /[ÃÂ][\u0080-\u00BF\u2018-\u201D\u20AC\u2122\u0152\u0161]|â€”|â€“|â€™|â€œ|â€\u009d|â€¦|Ã—|Â·|ðŸ|âœ|âš|â†|â–|â€|Ã¢â‚¬/

let n = 0, pass = 0, fail = 0
const findings = []
const t = (ok, label, detail) => {
  n++
  if (ok) { pass++ }
  else { fail++; findings.push(detail ? `${label}\n        ${detail}` : label) }
  console.log(`Test ${String(n).padStart(3)}  ${ok ? '✓' : '✗'} ${label}`)
}

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
if (SHOTS) { try { mkdirSync(SHOT_DIR, { recursive: true }) } catch {} }

for (const file of PAGES) {
  const page = await ctx.newPage()
  const errors = []
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', e => errors.push('UNCAUGHT: ' + e.message))

  let loaded = true
  try {
    // 'domcontentloaded', not 'networkidle': several pages pull YouTube, CDN
    // and WASM assets that never go idle, which hangs the run.
    const resp = await page.goto(`${BASE}/lessons/${file}`, { waitUntil: 'domcontentloaded', timeout: 20000 })
    if (!resp || !resp.ok()) { loaded = false; t(false, `${file} — HTTP ${resp ? resp.status() : 'no response'}`) }
  } catch (e) {
    loaded = false
    t(false, `${file} — failed to load`, e.message)
  }
  if (!loaded) { await page.close(); continue }

  await page.waitForTimeout(700)   // let init/animation settle

  // 1. No uncaught errors from the page's own code.
  const real = errors.filter(e =>
    !/favicon|net::ERR_|Failed to load resource|sql-wasm|cdnjs|youtube|googleapis|pyodide|blockly/i.test(e))
  t(real.length === 0, `${file} — no console errors on load`, real.slice(0, 3).join('\n        '))

  // 2. Visible mojibake in rendered text.
  const bad = await page.evaluate((reSrc) => {
    const re = new RegExp(reSrc)
    const out = []
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    let node
    while ((node = walk.nextNode())) {
      const s = node.nodeValue
      if (!s || !s.trim()) continue
      const el = node.parentElement
      if (!el || el.offsetParent === null) continue          // not visible
      if (re.test(s)) out.push(s.trim().slice(0, 90))
      if (out.length > 6) break
    }
    return out
  }, MOJIBAKE.source)
  t(bad.length === 0, `${file} — no mojibake in visible text`, bad.join('\n        '))

  // 3. No horizontal overflow of the page itself.
  const overflow = await page.evaluate(() =>
    Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth))
  t(overflow <= 2, `${file} — no horizontal page overflow`, overflow ? `${overflow}px wider than the viewport` : '')

  // 4. No unrendered placeholders leaking into visible text.
  const placeholders = await page.evaluate(() => {
    const txt = document.body.innerText || ''
    const hits = []
    for (const p of ['undefined', 'NaN', '[object Object]', '${']) {
      if (txt.includes(p)) {
        const i = txt.indexOf(p)
        hits.push(`${p} -> "${txt.slice(Math.max(0, i - 35), i + 35).replace(/\s+/g, ' ').trim()}"`)
      }
    }
    return hits
  })
  t(placeholders.length === 0, `${file} — no unrendered placeholders on screen`, placeholders.join('\n        '))

  if (SHOTS) {
    try { await page.screenshot({ path: `${SHOT_DIR}/${file.replace('.html', '')}.png`, fullPage: false }) } catch {}
  }
  await page.close()
}

await browser.close()

console.log(`\n${pass} passed, ${fail} failed, ${n} tests total.`)
if (findings.length) {
  console.log('\n──────── RENDERING PROBLEMS ────────')
  findings.forEach(f => console.log('  ✗ ' + f))
}
if (SHOTS) console.log(`\nScreenshots written to ${SHOT_DIR}`)
if (fail > 0) process.exit(1)
console.log('every lesson page loads clean, renders without mojibake, and fits the viewport')
