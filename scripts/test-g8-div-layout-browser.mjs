// Real-browser check of the Grade 8 "Divs & Page Layout" stages.
//
// The layout stages are graded from what the browser actually drew (each div's
// real box + computed style, via buildWebLog). Hand-made numbers can't prove
// that, so this renders reference solutions in a real Chromium iframe — the same
// 480px-wide srcdoc frame the app uses, the REAL buildWebLog, the REAL check() —
// and confirms:
//   * every reference solution passes, whichever CSS technique it uses
//     (inline-block, flexbox, float, grid), because the check measures the result
//   * every stage's untouched starter code FAILS (nothing is pre-solved)
// Needs a Chromium install (npx playwright install chromium); no dev server.
import { chromium } from 'playwright'
import { readFileSync } from 'fs'

const html = readFileSync('c:/Users/user/Downloads/ICT website/public/lessons/grade8.html', 'utf8')
const s = html.indexOf('// ── Colors & Shading — shared palette data'), e = html.indexOf('const CHALLENGES = MODULES')
const { MODULES } = new Function(html.slice(s, e) + '\nreturn { MODULES }')()
const stage = id => MODULES.flatMap(m => m.stages).find(x => x.id === id)
const bi = html.indexOf('function buildWebLog(')
const endMatch = html.slice(bi).match(/\r?\n\}(?=\r?\n)/)   // the function closes on a bare "}" line (LF or CRLF)
if (bi < 0 || !endMatch) throw new Error('could not extract buildWebLog')
// buildWebLog's table-measurement code calls normalizeRgb() (defined
// elsewhere in the page) to compare header/data cell colors — pull that
// function's source along with it, the same way the main test file does.
const nbi = html.indexOf('function normalizeRgb(')
const nEndMatch = html.slice(nbi).match(/\r?\n\}(?=\r?\n)/)
if (nbi < 0 || !nEndMatch) throw new Error('could not extract normalizeRgb')
const normalizeRgbSrc = html.slice(nbi, nbi + nEndMatch.index + nEndMatch[0].length)
const buildSrc = normalizeRgbSrc + '\n' + html.slice(bi, bi + endMatch.index + endMatch[0].length)

const CARD = '.card { background-color: #FFF7E6; padding: 12px; border: 1px solid #2F3B52; }'
const COLORS = '#header, #footer, #sidebar { background-color: #2F3B52; color: #fff; padding: 8px; }'
const SOLUTIONS = {
  divs1: [{ html: '<div>\n<h1>My Pets</h1>\n<p>I have a cat.</p>\n<p>I have a fish.</p>\n</div>', css: '' }],
  divs2: [{ html: '<div><h2>About Me</h2><p>I like robots.</p></div>\n<div><h2>Hobbies</h2><p>I like chess.</p></div>', css: '' }],
  divs3: [{ html: '<div class="card"><h2>My Card</h2><p>Hi</p></div>', css: CARD }],
  divs4: [{ html: '<div class="card"><h2>One</h2><p>a</p></div>\n<div class="card"><h2>Two</h2><p>b</p></div>', css: CARD + '\n.card { margin-bottom: 16px; }' }],
  divs5: [
    { html: '<div class="box">Box 1</div>\n<div class="box">Box 2</div>', css: '.box { background-color: #93C5FD; padding: 12px; display: inline-block; }' },
    { html: '<div class="box">Box 1</div>\n<div class="box">Box 2</div>', css: '.box { background-color: #93C5FD; padding: 12px; display: inline-block; width: 45%; }' },
    { html: '<div class="row"><div class="box">Box 1</div><div class="box">Box 2</div></div>', css: '.row { display: flex; } .box { background-color: #93C5FD; padding: 12px; flex: 1; }' },
    { html: '<div class="box">Box 1</div><div class="box">Box 2</div>', css: '.box { background-color: #93C5FD; padding: 12px; float: left; width: 40%; }' },
  ],
  divs6: [{ html: '<div id="header">My Site</div>\n<div id="main">Welcome to my page.</div>\n<div id="footer">Made by me</div>', css: COLORS }],
  divsboss: [
    // no vertical-align: boxes of different heights sit on the text baseline, tops not level — still a valid layout
    { html: '<div id="header">My Site</div>\n<div id="sidebar">Menu</div><div id="content">Welcome.<br>A longer text.<br>Three lines.<br>Four lines.</div>\n<div id="footer">Made by me</div>',
      css: COLORS + '\n#sidebar { display: inline-block; width: 25%; }\n#content { display: inline-block; width: 70%; }' },
    { html: '<div id="header">My Site</div>\n<div id="sidebar">Menu</div><div id="content">Welcome to my page.</div>\n<div id="footer">Made by me</div>',
      css: COLORS + '\n#sidebar { display: inline-block; width: 25%; vertical-align: top; }\n#content { display: inline-block; width: 70%; vertical-align: top; padding: 12px; }' },
    { html: '<div id="header">My Site</div>\n<div class="row"><div id="sidebar">Menu</div><div id="content">Welcome to my page.</div></div>\n<div id="footer">Made by me</div>',
      css: COLORS + '\n.row { display: flex; }\n#sidebar { width: 25%; }\n#content { flex: 1; }' },
    { html: '<div id="header">My Site</div>\n<div id="sidebar">Menu</div>\n<div id="content">Welcome to my page.</div>\n<div id="footer">Made by me</div>',
      css: COLORS + '\n#sidebar { float: left; width: 25%; }\n#content { float: left; width: 70%; }\n#footer { clear: both; }' },
    { html: '<div id="header">My Site</div>\n<div class="row"><div id="sidebar">Menu</div><div id="content">Welcome to my page.</div></div>\n<div id="footer">Made by me</div>',
      css: COLORS + '\n.row { display: grid; grid-template-columns: 1fr 3fr; }' },
  ],
  // ── Semantic HTML5 Landmarks ──
  sems1: [{ html: '<header><h1>My Site</h1></header>\n<p>Welcome.</p>\n<footer><p>Made by me</p></footer>', css: '#header, #footer { background-color: #2F3B52; color: #fff; padding: 12px; }\nheader, footer { background-color: #2F3B52; color: #fff; padding: 12px; }' }],
  sems2: [{ html: '<header><h1>My Site</h1><nav><a href="#">Home</a><a href="#">About</a></nav></header>\n<p>Welcome.</p>', css: 'header { background-color: #2F3B52; color: #fff; padding: 12px; } header a { color: #fff; }' }],
  sems3: [{ html: '<header><h1>My Site</h1></header>\n<main>\n<section id="about"><h2>About Me</h2><p>Hi, I am a student.</p></section>\n<section id="projects"><h2>My Projects</h2><ul><li>One</li><li>Two</li></ul></section>\n</main>',
    css: 'header { background-color: #2F3B52; color: #fff; padding: 12px; }\n#about { background-color: #FFF7E6; }\n#projects { background-color: #E0F2FE; }' }],
  sems4: [{ html: '<header><h1>My Site</h1></header>\n<main><p>Main content.</p></main>\n<aside><h3>Related</h3><a href="#">Link</a></aside>',
    css: '* { box-sizing: border-box; }\nheader { background-color: #2F3B52; color: #fff; padding: 12px; }\nmain { display: inline-block; width: 70%; vertical-align: top; }\naside { display: inline-block; width: 28%; vertical-align: top; background-color: #FFF7E6; }' }],
  semsboss: [
    // no wrapper div at all — the stage's whole point is zero <div>s on the page
    { html: '<header><h1>My Site</h1><nav><a href="#">Home</a><a href="#">About</a></nav></header>\n<aside><h3>Menu</h3><a href="#">Link</a></aside>\n<main>\n<section id="about"><h2>About Me</h2><p>Hi.</p></section>\n<section id="projects"><h2>My Projects</h2><p>Stuff.</p></section>\n</main>\n<footer><p>Made by me</p></footer>',
      css: '* { box-sizing: border-box; }\nheader, aside, footer { background-color: #2F3B52; color: #fff; padding: 12px; }\n#about { background-color: #FFF7E6; }\n#projects { background-color: #E0F2FE; }\naside { display: inline-block; width: 25%; vertical-align: top; }\nmain { display: inline-block; width: 70%; vertical-align: top; }' },
  ],
  // ── Tables ──
  tabs1: [{ html: '<table><tr><th>Name</th><th>Score</th></tr><tr><td>Alex</td><td>85</td></tr><tr><td>Sam</td><td>92</td></tr></table>', css: '' }],
  tabs2: [{ html: '<table><caption>Test Scores</caption><thead><tr><th>Name</th><th>Score</th></tr></thead><tbody><tr><td>Alex</td><td>85</td></tr><tr><td>Sam</td><td>92</td></tr></tbody></table>', css: '' }],
  tabs3: [{ html: '<table><tr><th colspan="3">Term Report</th></tr><tr><th>Subject</th><th>Grade</th><th>Teacher</th></tr><tr><td>Maths</td><td>A</td><td>Ms. Lee</td></tr></table>', css: '' }],
  tabs4: [{ html: '<table><tr><th>Name</th><th>Score</th></tr><tr><td>Alex</td><td>85</td></tr></table>',
    css: 'table { border-collapse: collapse; } th, td { border: 1px solid #333; padding: 8px; } th { background-color: #2F3B52; color: #fff; }' }],
  tabsboss: [{
    html: '<table><caption>My Timetable</caption><thead><tr><th>Time</th><th>Mon</th><th>Tue</th><th>Wed</th></tr></thead><tbody><tr><td>9am</td><td>Maths</td><td>English</td><td>Maths</td></tr><tr><td>10am</td><td>Science</td><td>Art</td><td>Science</td></tr><tr><td colspan="4">Lunch</td></tr></tbody></table>',
    css: 'table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid #333; padding: 8px; } th { background-color: #2F3B52; color: #fff; }',
  }],
  // ── Meta Tags & SEO — full-skeleton HTML (DOCTYPE/html/head/body), the same
  // pattern web0b's stages use. This specifically re-confirms, against the
  // REAL stage data (not a one-off probe), that <meta>/<title> written inside
  // a <head> nested in the wrapper's own <body> are still found correctly by
  // doc.querySelector('meta[...]') / doc.title in a real browser.
  metas1: [{ html: '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>My Page</title>\n</head>\n<body>\n<h1>Hello!</h1>\n</body>\n</html>', css: '' }],
  metas2: [{ html: '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>My Page</title>\n<meta name="description" content="A page about my hobbies, built while learning web development.">\n</head>\n<body>\n<h1>Hello!</h1>\n</body>\n</html>', css: '' }],
  metas3: [{ html: '<!DOCTYPE html>\n<html>\n<head>\n<title>My Page</title>\n<meta property="og:title" content="My Page">\n<meta property="og:description" content="A real one.">\n<meta property="og:image" content="preview.jpg">\n</head>\n<body>\n<h1>Hello!</h1>\n</body>\n</html>', css: '' }],
  metasboss: [{
    html: '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>My Page</title>\n<meta name="description" content="A real twenty-plus character description.">\n<meta property="og:title" content="My Page">\n<meta property="og:description" content="A real one.">\n<meta property="og:image" content="preview.jpg">\n</head>\n<body>\n<h1>Hello!</h1>\n</body>\n</html>',
    css: '',
  }],
  // ── Responsive Design — real @media queries, checked by actually resizing
  // the real iframe (buildWebLog's `responsive` field) rather than any mock.
  resps1: [{ html: '<div class="sidebar">Sidebar content</div>\n<div class="main">Main content</div>',
    css: '.sidebar { display: block; background: #eee; padding: 10px; }\n@media (max-width: 400px) { .sidebar { display: none; } }' }],
  resps2: [{ html: '<nav class="nav">\n  <a href="#">Home</a>\n  <a href="#">About</a>\n  <a href="#">Contact</a>\n</nav>',
    css: '.nav { display: flex; flex-direction: row; gap: 12px; }\n@media (max-width: 500px) { .nav { flex-direction: column; } }' }],
  resps3: [{ html: '<h1 class="title">Welcome to My Site</h1>',
    css: '.title { font-size: 48px; }\n@media (max-width: 500px) { .title { font-size: 28px; } }' }],
  respboss: [{
    html: '<nav class="nav">\n  <a href="#">Home</a>\n  <a href="#">About</a>\n</nav>\n<div class="sidebar">Sidebar</div>\n<div class="main">Main content</div>',
    css: '.nav { display: flex; flex-direction: row; gap: 12px; }\n.sidebar { display: block; background: #eee; padding: 10px; }\n@media (max-width: 500px) { .nav { flex-direction: column; } }\n@media (max-width: 400px) { .sidebar { display: none; } }',
  }],
}

// Use Playwright's own browser if it matches; otherwise fall back to any Chromium already
// installed under ms-playwright (a slightly older build renders layout identically for this test).
import { existsSync, readdirSync } from 'fs'
import path from 'path'
async function launch() {
  try { return await chromium.launch() } catch (_) { /* fall through to an installed build */ }
  const root = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright')
  const dirs = existsSync(root) ? readdirSync(root).filter(d => d.startsWith('chromium')) : []
  for (const d of dirs) {
    for (const rel of ['chrome-win64/chrome.exe', 'chrome-headless-shell-win64/chrome-headless-shell.exe', 'chrome-linux/chrome']) {
      const exe = path.join(root, d, rel)
      if (existsSync(exe)) return chromium.launch({ executablePath: exe })
    }
  }
  throw new Error('No Chromium found — run: npx playwright install chromium')
}
const browser = await launch()
const page = await browser.newPage()
await page.setContent('<!DOCTYPE html><html><body></body></html>')
async function measure(h, c) {
  return page.evaluate(async ({ src, h, c }) => {
    const buildWebLog = new Function(src + '\nreturn buildWebLog')()
    const f = document.createElement('iframe')
    f.style.cssText = 'width:480px;height:260px;border:none'   // the app's preview frame
    f.setAttribute('sandbox', 'allow-scripts allow-same-origin')
    document.body.appendChild(f)
    await new Promise(r => { f.onload = r; f.srcdoc = '<!DOCTYPE html><html><head><style>' + c + '</style></head><body>' + h + '</body></html>' })
    const log = buildWebLog(f.contentDocument, f.contentWindow, h, c, '')
    f.remove()
    return JSON.parse(JSON.stringify({ ...log, globals: null }))
  }, { src: buildSrc, h, c })
}
// hasFillColor etc. live in the page's helper scope — expose the same ones to the checks
const helpers = html.slice(html.indexOf('// ── Colors & Shading — shared palette data'), html.indexOf('const CHALLENGES = MODULES'))
const { runCheck } = new Function(helpers + '\nreturn { runCheck: (fn, log) => fn(log) }')()

let pass = 0, fail = 0
const ok = (c, m) => { if (c) { pass++; console.log('✓ ' + m) } else { fail++; console.log('✗ ' + m) } }

for (const [id, variants] of Object.entries(SOLUTIONS)) {
  const st = stage(id)
  for (const [i, v] of variants.entries()) {
    // written ON TOP of the stage's own starter CSS, exactly as a student would
    const log = await measure(v.html, (st.webStarter.css || '') + '\n' + v.css)
    const how = /grid/.test(v.css) ? 'grid' : /flex/.test(v.css) ? 'flexbox' : /float/.test(v.css) ? 'float' : /width/.test(v.css) ? 'inline-block + width' : 'inline-block'
    ok(st.check(log), `${id} — reference solution #${i + 1} passes in a real browser${variants.length > 1 ? ` (${how})` : ''}`)
  }
  const starter = st.webStarter
  const slog = await measure(starter.html, starter.css)
  ok(!st.check(slog), `${id} — the untouched starter does NOT pass`)
}

// Layout that LOOKS almost right must still be rejected by real measurement
{
  const stacked = await measure('<div id="header">H</div><div id="sidebar">S</div><div id="content">C</div><div id="footer">F</div>', COLORS)
  ok(!stage('divsboss').check(stacked), 'divsboss — four stacked blocks (no side-by-side) is rejected')
  const noColor = await measure('<div id="header">H</div><div id="sidebar">S</div><div id="content">C</div><div id="footer">F</div>', '#sidebar{display:inline-block;width:25%}#content{display:inline-block;width:70%}')
  ok(!stage('divsboss').check(noColor), 'divsboss — correct positions but no background colors is rejected')
  const wrapped = await measure('<div class="box">1</div><div class="box">2</div>', '.box { display: inline-block; width: 70%; background:#93C5FD }')
  ok(!stage('divs5').check(wrapped), 'divs5 — two boxes too wide for one row (they wrap) is rejected')
}

// ── The lesson text itself must render cleanly at the app's real panel width ──
// A wide code block inside a flex step once pushed the whole boss text 92px past
// the panel (sideways scrolling). Render every stage of the module in a 480px
// column, with the app's own stylesheet, and require: no sideways overflow, and
// every figure (framed diagram) has real size.
{
  const stylesheet = 'file:///' + 'c:/Users/user/Downloads/ICT website/public/styles.css'.replace(/\\/g, '/').replace(/ /g, '%20')
  const pageCss = html.match(/<style[^>]*>([\s\S]*?)<\/style>/)[1]
  const layoutModules = MODULES.filter(m => ['web4d', 'web4e', 'web4f', 'web4h', 'web5e'].includes(m.id))
  const p2 = await browser.newPage({ viewport: { width: 520, height: 900 } })
  for (const st of layoutModules.flatMap(m => m.stages)) {
    for (const width of [480, 340]) {
      await p2.setContent(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>${pageCss}</style></head><body style="height:auto;overflow:auto;padding:0"><div id="t" style="width:${width}px;padding:12px;box-sizing:border-box;font-size:13px">${st.text}</div></body></html>`)
      const r = await p2.evaluate(() => {
        const t = document.getElementById('t')
        const frames = [...t.querySelectorAll('div')].filter(d => (d.getAttribute('style') || '').includes('border-radius:10px') && (d.getAttribute('style') || '').includes('margin:12px 0'))
        return { over: t.scrollWidth - t.clientWidth, frames: frames.length, tiny: frames.filter(f => f.getBoundingClientRect().height < 20).length }
      })
      ok(r.over <= 1 && r.tiny === 0, `${st.id} @${width}px — text renders with no sideways overflow${r.frames ? ` (${r.frames} figure${r.frames > 1 ? 's' : ''} drawn)` : ''}`)
    }
  }
  await p2.close()
}

await browser.close()
console.log(`\n${pass} passed, ${fail} failed.`)
if (fail > 0) process.exit(1)
console.log('the div layout stages accept real working layouts and reject unsolved/near-miss ones')
