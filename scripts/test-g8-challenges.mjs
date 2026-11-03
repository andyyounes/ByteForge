// Verifies every Grade 8 challenge's check(code[, log]) predicate. Unlike
// Grade 7's log-object check(), Grade 8's is purely structural regex over the
// raw Python source text (no execution/Pyodide needed at all — confirmed by
// reading every check() body in grade8.html; a couple also take a second
// `log` arg of canvas draw-counts for the drawing challenges, same shape as
// Grade 7's).
//
// Two structural, zero-authoring tests per challenge:
//  1. An EMPTY submission ("") must FAIL — catches a check that accidentally
//     always passes regardless of what the student wrote.
//  2. Where the challenge ships its own `starter` code (an intentionally
//     incomplete TODO stub), that starter must also FAIL — if a starter
//     already satisfies check() before the student does anything, either the
//     starter secretly already solves it or check() doesn't actually gate on
//     the thing the TODO asks for. Either way that's a real design bug this
//     test is built to catch, and needs no hand-authored "right answer" since
//     it reuses content the file already ships.
import { readFileSync } from 'fs'

const html = readFileSync('c:/Users/user/Downloads/ICT website/public/lessons/grade8.html', 'utf8')
// Starts from the Colors & Shading palette helpers (COLOR_PALETTE,
// isAllowedColor, colorBrightness, etc.) rather than 'const MODULES = ['
// directly — several web3/web4/web5 checks now close over those helpers.
const s = html.indexOf('// ── Colors & Shading — shared palette data')
const e = html.indexOf('const CHALLENGES = MODULES')
const ctx = html.slice(s, e) + '\nconst CHALLENGES = MODULES.filter(m => m.live).flatMap(m => m.stages.map(s => ({ ...s, mod: m.id.toUpperCase() })))'
const { CHALLENGES } = new Function(ctx + '\nreturn { CHALLENGES }')()

console.log(`Found ${CHALLENGES.length} Grade 8 challenges.\n`)

const permissiveLog = { frames: 999, rects: 999, circles: 999, lines: 999, texts: 999, hasIf: true, hasVar: true, hasFunction: true }

// Mirrors validateChallenge()'s call site exactly: every check() is regex
// over raw source, so comments are stripped before matching — otherwise a
// starter's own "# TODO: use a while loop" comment satisfies a check looking
// for the literal word "while" before the student writes anything real.
function stripPyComments(code) { return code.replace(/#.*$/gm, '') }

// Web Story stages (lang:'web') check a log OBJECT (from runWebCode's DOM/
// state read), not a Python code string — same shape as Grade 7's page-type
// stages. Mirrors that file's maximal/empty log pattern instead of the
// code-regex convention every Python stage below uses.
const webMaximalLog = () => ({
  html: '<!DOCTYPE html>\n<html>\n<head>\n<title>My Page</title>\n</head>\n<body>\n<h1>My Page</h1>\n<h2>Sub</h2>\n<img src="x" alt="x">\n<p>Text</p>\n</body>\n</html>',
  // Raw JS source — needed by checks (web5s2b/web5s2c) that inspect log.js
  // directly (a declared variable's name later appearing in a textContent
  // assignment) rather than relying only on the pre-computed hasX flags below.
  js: 'let animal = "Red Panda"; document.querySelector("#x").textContent = "My favorite animal is " + animal; '
    + 'function greet() { return "Welcome, traveler!"; } document.querySelector("#y").textContent = greet(); '
    + 'let inventory = ["sword", "shield"]; '
    // jsf1/jsf2 (JS Foundations) — console.log/document.write/comments/data
    // types/Math, all satisfied at once for the generic satisfiability check.
    + 'console.log("hi"); console.log("a"); console.log("b"); console.log("c"); console.log("d"); console.log("e"); '
    + 'document.write("visible output"); document.write("Hi " + "there"); '
    + '// comment one\n// comment two\n// comment three\n'
    + 'let userName = "Sam"; let favoriteFood = "tacos"; let landmark = "Museum"; let age = 16; let heightCm = 170; let isStudent = true; let hasPet = false; '
    + 'let sum = age + heightCm; let product = age * heightCm; '
    + 'let squared = Math.pow(5, 2); let root = Math.sqrt(36); '
    + 'let width = 8; let height = 5; let area = width * height; let perimeter = 2 * (width + height); '
    + 'const MPG = 25; const gasPrice = 3.50; let distance = 200; let time = 4; let speed = distance / time; let gasCost = (distance / MPG) * gasPrice; '
    // web5s5/web5s6 (classList.toggle / setInterval bonus stages)
    + 'document.querySelector("h1").addEventListener("click", function() { document.querySelector("h1").classList.toggle("highlighted"); }); '
    + 'let timer; timer = setInterval(function() { seconds = seconds + 1; }, 1000); clearInterval(timer); '
    // ws2s1 (describeItem) — a real definition + a real call whose result is shown
    + 'function describeItem(name) { return "You see a " + name + "."; } document.querySelector("#story").textContent = describeItem("sword");',
  // ws1s0 reads real global state (an actual array with 2+ items) rather
  // than a regex flag — needs a real array sitting on the fixture's window.
  globals: { inventory: ['sword', 'shield', 'lantern'] },
  bodyText: 'true false you see sword 1. item 3 items 1 2 3 4 5 Hi, my name is Sam. My favorite food is tacos! '
    + 'x, '.repeat(5), hasArray: true, hasObject: true, hasPush: true,
  hasFunction: true, functionCount: 999, hasReturn: true, hasIf: true,
  hasLSSet: true, hasLSGet: true, hasLSRemove: true, hasJSONStringify: true, hasJSONParse: true,
  // ws4s4 additionally checks listItems < 4 — 3 is the one value that
  // satisfies every ">= 3" challenge elsewhere AND that upper bound.
  hasLoop: true, listItems: 3,
  hasClick: true, listItemsGrewOnClick: true, bodyChangedOnClick: true,
  hasIndex: true, hasLength: true, hasAnd: true,
  // Forms/Tip Calculator project — real <input> elements + behavioral
  // click-testing fields (bodyTextAfterClick includes both a calculator's
  // correct result AND the quick-tip-button's correct result, since the
  // same generic fixture has to satisfy every check that reads it).
  inputCount: 5, numberInputCount: 3, radioInputCount: 3,
  emailInputCount: 1, urlInputCount: 1, dateInputCount: 1, textareaCount: 1, requiredCount: 1, labelForOk: true,
  // Responsive Design — one generous responsive snapshot satisfying every
  // resp*/respboss check at once: .sidebar visible-wide/hidden-narrow,
  // .nav row-wide/column-narrow, .title bigger-wide/smaller-narrow.
  responsive: {
    wide: [
      { id: '', cls: 'sidebar', display: 'block', flexDirection: 'row', fontSize: 16, width: 200 },
      { id: '', cls: 'nav', display: 'flex', flexDirection: 'row', fontSize: 16, width: 400 },
      { id: '', cls: 'title', display: 'block', flexDirection: 'row', fontSize: 48, width: 400 },
    ],
    narrow: [
      { id: '', cls: 'sidebar', display: 'none', flexDirection: 'row', fontSize: 16, width: 0 },
      { id: '', cls: 'nav', display: 'flex', flexDirection: 'column', fontSize: 16, width: 300 },
      { id: '', cls: 'title', display: 'block', flexDirection: 'row', fontSize: 28, width: 300 },
    ],
  },
  hasNumberConvert: true, hasToFixed: true, hasValueRead: true,
  bodyTextAfterClick: 'Tip: $20.00 Total: $120.00 Tip: $10.00 Total: $60.00 14 Pepperoni Olives Premium',
  // web7 (Real Multi-Page Websites) — log.pages[filename] mirrors this same
  // maximal shape, one level deeper, for each page in the project.
  // Divs & Page Layout — real measured boxes. One log that satisfies every div
  // stage at once: a wrapper, two styled "card"s 16px apart, two "box"es on one
  // row, and header/main/sidebar/content/footer laid out as a real page.
  divs: (() => {
    const d = o => ({ id: '', cls: '', text: 20, nestedDivs: 0, hasHeading: false, hasPara: false, hasLink: false, bg: 'rgba(0, 0, 0, 0)',
      display: 'block', padTop: 0, borderW: 0, borderRadius: 0, left: 0, right: 480, top: 0, bottom: 50, width: 480, height: 50, ...o })
    const fill = 'rgb(255, 247, 230)'
    return [
      d({ nestedDivs: 1, hasHeading: true, hasPara: true, top: 0, bottom: 200 }),
      // Real height here is 100/84 (bottom - top) — borderRadius 999 clears
      // height/2 either way, same as the browser capping a too-big value.
      d({ cls: 'card', hasHeading: true, hasPara: true, bg: fill, padTop: 12, borderW: 1, borderRadius: 999, top: 0, bottom: 100, height: 100 }),
      d({ cls: 'card', hasHeading: true, hasPara: true, bg: fill, padTop: 12, borderW: 1, borderRadius: 999, top: 116, bottom: 200, height: 84 }),
      d({ cls: 'box', bg: fill, left: 0, right: 200, top: 300, bottom: 350, width: 200 }),
      d({ cls: 'box', bg: fill, left: 210, right: 410, top: 300, bottom: 350, width: 200 }),
      d({ id: 'header',  bg: fill, top: 500, bottom: 540 }),
      d({ id: 'main',    top: 540, bottom: 700 }),
      d({ id: 'sidebar', bg: fill, left: 0,   right: 120, width: 120, top: 540, bottom: 700 }),
      d({ id: 'content', left: 130, right: 400, width: 270, top: 540, bottom: 700 }),
      d({ id: 'footer',  bg: fill, top: 700, bottom: 740 }),
      // Rounded Corners module — a real square (width === height) avatar,
      // fully rounded, for divs3r3's circle check.
      d({ cls: 'avatar', bg: fill, borderRadius: 40, left: 0, right: 80, top: 800, bottom: 880, width: 80, height: 80 }),
    ]
  })(),
  // Semantic HTML5 — one of each landmark, positioned/colored generously
  // enough to satisfy every sems*/semsboss check at once (semsboss's OWN
  // "zero divs" requirement is handled with a per-stage override below,
  // since that one genuinely conflicts with the divs fixture just above).
  landmarks: (() => {
    const l = o => ({ tag: '', id: '', text: 20, hasLink: false, hasHeading: false, nested: 0, bg: 'rgba(0, 0, 0, 0)',
      left: 0, right: 480, top: 0, bottom: 40, width: 480, height: 40, ...o })
    const fill = 'rgb(255, 247, 230)'
    return [
      l({ tag: 'header', hasHeading: true, bg: fill, top: 0, bottom: 40 }),
      l({ tag: 'nav', hasLink: true, top: 10, bottom: 30, left: 100, right: 300, width: 200 }),
      l({ tag: 'aside', hasHeading: true, hasLink: true, bg: fill, left: 0, right: 120, width: 120, top: 40, bottom: 200 }),
      l({ tag: 'main', left: 130, right: 400, width: 270, top: 40, bottom: 200 }),
      l({ tag: 'section', id: 'about', hasHeading: true, bg: fill, top: 50, bottom: 110 }),
      l({ tag: 'section', id: 'projects', hasHeading: true, bg: 'rgb(224, 242, 254)', top: 120, bottom: 190 }),
      l({ tag: 'footer', bg: fill, top: 200, bottom: 240 }),
    ]
  })(),
  // Tables — one generous table satisfying every tabs*/tabsboss check at once:
  // captioned, thead+tbody, 3+ real columns, a colspan AND a rowspan, fully
  // styled cells with a header color distinct from the data cells.
  tables: (() => {
    const cell = (tag, text, o) => ({ tag, text, colSpan: 1, rowSpan: 1, bg: tag === 'th' ? 'rgb(47, 59, 82)' : 'rgb(255, 255, 255)', borderW: 1, padTop: 8, ...o })
    const rows = [
      { cells: [cell('th', 'My Timetable', { colSpan: 3 })] },
      { cells: [cell('th', 'Time'), cell('th', 'Mon'), cell('th', 'Tue')] },
      { cells: [cell('td', '9am'), cell('td', 'Maths'), cell('td', 'English', { rowSpan: 2 })] },
      { cells: [cell('td', '10am'), cell('td', 'Science')] },
    ]
    return [{
      hasCaption: true, hasThead: true, hasTbody: true, rowCount: rows.length, colCount: 3,
      headerCellCount: 4, hasColspan: true, hasRowspan: true, borderCollapse: 'collapse',
      allCellsHaveBorder: true, allCellsHavePadding: true, headerBgDiffersFromData: true, rows,
    }]
  })(),
  // Audio & Video — one generous audio + video satisfying every avs*/avsboss
  // check at once: controls, 2 sources, fallback text, poster, sized, looped
  // and muted (never unmuted autoplay).
  media: {
    audio: [{ hasControls: true, hasAutoplay: false, hasLoop: true, hasMuted: true, sourceCount: 2, hasDirectSrc: false, fallbackText: 40 }],
    video: [{ hasControls: true, hasAutoplay: true, hasLoop: true, hasMuted: true, sourceCount: 2, hasDirectSrc: false, fallbackText: 0, hasPoster: true, width: 480, height: 270 }],
  },
  // Meta Tags & SEO — one generous head satisfying every metas*/metasboss check.
  meta: { hasCharset: true, hasViewport: true, description: 'A page about my hobbies and interests, built while learning web development.',
    keywords: '', og: { title: 'My Page', description: 'A real description.', image: 'preview.jpg' } },
  currentPage: 'index.html', pageOrder: ['index.html', 'about.html'],
  pages: {
    'index.html': { h1s: 1, paragraphs: 1, links: 1, headingText: ['Home Page'],
      html: '<h1>Home Page</h1><p>Welcome!</p><nav><a href="about.html">About</a></nav>' },
    'about.html': { h1s: 1, paragraphs: 1, links: 1, headingText: ['About Page'],
      html: '<h1>About Page</h1><p>All about me.</p><nav><a href="index.html">Home</a></nav>' },
  },
  // Semester 1 (3-semester rebuild, web1-web4) — real element counts +
  // EXACT computed colors (getComputedStyle's rgb() form of each challenge's
  // own hex color — h1/body from #2F3B52/#FFF7E6, h2/h3/p/link/button colors
  // from web3's own per-tag palette, per web3s2-5/web3boss/web4boss).
  h1s: 999, h1Count: 999, h2Count: 999, h3Count: 999, h4Count: 999, h5Count: 999,
  paragraphs: 999, buttons: 999, links: 999,
  headingText: ['My Page','My Page'], paragraphText: ['This is my page.','This is my page.'],
  bgColor: 'rgb(255, 247, 230)', headingColor: 'rgb(47, 59, 82)',
  h2Color: 'rgb(124, 58, 237)', h3Color: 'rgb(5, 150, 105)', pColor: 'rgb(75, 85, 99)',
  linkColor: 'rgb(29, 78, 216)', buttonBg: 'rgb(230, 57, 70)', buttonColor: 'rgb(255, 255, 255)',
  linkBg: 'rgb(79, 70, 229)', linkPadTop: 10, linkDecoration: 'none', linkHrefOk: true,
  boldCount: 999, italicCount: 999, underlineCount: 999,
  bodyFontFamily: 'Georgia, serif', h1FontSizePx: 48, captionFontSizePx: 10,
  checkboxCount: 999, selectCount: 999, optionCount: 999, fieldsetCount: 999, legendCount: 999, legendInsideFieldsetOk: true,
  ulItems: 999, olItems: 999,
  hasVariable: true, imgCount: 1, imgAltOk: true, pageTitle: 'My Favorite Animal' })
const webEmptyLog   = () => ({ html: '', js: '', globals: {}, bodyText: '', hasArray: false, hasObject: false, hasPush: false,
  hasFunction: false, functionCount: 0, hasReturn: false, hasIf: false,
  hasLSSet: false, hasLSGet: false, hasLSRemove: false, hasJSONStringify: false, hasJSONParse: false,
  hasLoop: false, listItems: 0,
  hasClick: false, listItemsGrewOnClick: false, bodyChangedOnClick: false,
  hasIndex: false, hasLength: false, hasAnd: false,
  h1s: 0, h1Count: 0, h2Count: 0, h3Count: 0, h4Count: 0, h5Count: 0,
  paragraphs: 0, buttons: 0, links: 0,
  headingText: [], paragraphText: [], bgColor: '', headingColor: '',
  h2Color: '', h3Color: '', pColor: '', linkColor: '', buttonBg: '', buttonColor: '',
  linkBg: '', linkPadTop: 0, linkDecoration: '', linkHrefOk: false,
  boldCount: 0, italicCount: 0, underlineCount: 0,
  bodyFontFamily: 'Times New Roman, serif', h1FontSizePx: 32, captionFontSizePx: 0,
  checkboxCount: 0, selectCount: 0, optionCount: 0, fieldsetCount: 0, legendCount: 0, legendInsideFieldsetOk: false,
  ulItems: 0, olItems: 0,
  hasVariable: false, imgCount: 0, imgAltOk: false, pageTitle: '',
  divs: [], landmarks: [], tables: [], media: { audio: [], video: [] },
  meta: { hasCharset: false, hasViewport: false, description: '', keywords: '', og: { title: '', description: '', image: '' } },
  emailInputCount: 0, urlInputCount: 0, dateInputCount: 0, textareaCount: 0, requiredCount: 0, labelForOk: false,
  responsive: { wide: [], narrow: [] } })

let pass = 0, fail = 0
for (const ch of CHALLENGES) {
  const label = `${ch.mod}/${ch.id}`

  if (ch.lang === 'web') {
    // semsboss's whole point is "no <div> anywhere" — genuinely incompatible
    // with the shared maximal log's own divs fixture (needed by the earlier
    // Divs module's stages), so it gets the same maximal data minus divs.
    const maxLog = ch.id === 'semsboss' ? { ...webMaximalLog(), divs: [] } : webMaximalLog()
    if (ch.check(maxLog)) { pass++; console.log(`✓ ${label} — satisfiable (maximal log passes)`) }
    else { fail++; console.log(`✗ ${label} — UNSATISFIABLE: even a maximal log fails check()`) }
    if (!ch.check(webEmptyLog())) { pass++; console.log(`✓ ${label} — not vacuous (empty log correctly fails)`) }
    else { fail++; console.log(`✗ ${label} — VACUOUS: an empty log passes check()`) }
    continue
  }

  if (!ch.check(stripPyComments(''), permissiveLog)) { pass++; console.log(`✓ ${label} — not vacuous (empty submission correctly fails)`) }
  else { fail++; console.log(`✗ ${label} — VACUOUS: an empty submission passes check()`) }

  if (ch.starter) {
    // Starters are deliberately incomplete TODO stubs — a fair check needs the
    // draw-count log a starter would REALLY produce if run, not an artificially
    // generous one. Without executing real Python we can't know that exactly,
    // but zero is the honest conservative assumption for "hasn't drawn the
    // missing pieces yet" (using a generous log here would just prove the
    // regex-only half of a hybrid check, silently hiding whether the
    // draw-count half is actually satisfied by the incomplete starter).
    const zeroLog = { frames: 0, rects: 0, circles: 0, lines: 0, texts: 0, hasIf: false, hasVar: false, hasFunction: false }
    if (!ch.check(stripPyComments(ch.starter), zeroLog)) { pass++; console.log(`✓ ${label} — starter TODO stub correctly does not pass yet`) }
    else { fail++; console.log(`✗ ${label} — starter code already satisfies check() before the student does anything`) }
  }
}

// ── Wrong solutions that must be rejected, correct ones that must pass ───────
// "The starter doesn't pass" is a low bar: a check can still be far too weak to
// tell a right answer from a wrong one. Each REJECT case below was genuinely
// ACCEPTED before these checks were tightened, and each ACCEPT case guards
// against over-tightening them.
const strip = c => c.replace(/#.*$/gm, '')
const byId  = id => CHALLENGES.find(c => c.id === id)

// web1boss required 7 paragraphs while its own instructions only describe 6
// headings (1 h1 + 2 h2 + 1 h3 + 1 h4 + 1 h5), each with "its own paragraph"
// — a student following the spec exactly (6 headings, 6 paragraphs) was
// rejected until this was tightened.
{
  const ch = byId('web1boss')
  const exactSpecLog = { h1Count: 1, h2Count: 2, h3Count: 1, h4Count: 1, h5Count: 1, paragraphs: 6 }
  if (ch.check(exactSpecLog)) { pass++; console.log('✓ web1boss — correctly accepts: exactly the 6 headings/6 paragraphs the spec describes') }
  else { fail++; console.log('✗ web1boss — REJECTS the exact 6-heading/6-paragraph structure its own instructions describe') }
}

const REJECT = [
  ['m7s3',  'safe division 1/2 never raises, so the except branch never runs',
   'try:\n    r = 1 / 2\nexcept ZeroDivisionError:\n    print("Caught it!")', {}],
  ['m3s1',  'three eyeless, mouthless heads',
   'def draw_smiley(x,y,r):\n    circle(x,y,r)\ndraw_smiley(1,2,3)\ndraw_smiley(4,5,6)\ndraw_smiley(7,8,9)', { circles: 3 }],
  ['m10s2', 'scorer that decrements on a match',
   'for i in range(len(answers)):\n    if student_answers[i] == answers[i]:\n        score = score - 1\nif len(answers) > 0:\n    percentage = (score / len(answers)) * 100', {}],
  ['m4s3',  'unmodified starter already draws 5 bars but no text labels',
   null, { rects: 5, texts: 0 }],
  ['m3s5',  'loop body left as bare pass, both values always numbers[0]',
   'def min_and_max(numbers):\n    smallest = numbers[0]\n    largest = numbers[0]\n    for n in numbers:\n        pass\n    return smallest, largest\n\nscores = [45, 82, 19, 67, 90, 33]\nlow, high = min_and_max(scores)\nprint(f"Lowest: {low}, Highest: {high}")', {}],
  ['m6s1',  'splits every line but never prints anything',
   'file = open("students.csv")\nlines = file.readlines()\nfile.close()\nfor line in lines[1:]:\n    line = line.strip()\n    name, grade = line.split(",")', {}],
  ['m4s2',  'only 5 colors/circles, one short of the stated "at least 6"',
   'colors = [(255,80,80),(255,165,0),(255,255,60),(0,200,0),(0,0,255)]\nfor color in colors:\n    r, g, b = color\n    fill(r, g, b)\n    circle(50, 130, 35)', { circles: 5 }],
  ['m3s2',  'partial 4-tile grid, not a full 3x2',
   'def colored_tile(r,g,b,x,y,size):\n    fill(r,g,b)\n    rect(x,y,size,size)\ncolored_tile(1,2,3,40,80,70)\ncolored_tile(1,2,3,130,80,70)\ncolored_tile(1,2,3,40,160,70)\ncolored_tile(1,2,3,130,160,70)', { rects: 4 }],
  ['m7s1',  'multiplies by 1024 instead of dividing',
   'size_in_bytes = 262144000\nkb = size_in_bytes * 1024\nprint(kb)\nmb = size_in_bytes * 1024 * 1024\nprint(mb)\nsmall_number = 42\nprint(bin(small_number))', {}],
  ['m7s2',  'appends the raw sum, never divides (not a valid grayscale average)',
   'photo = [(220,40,40),(40,200,60),(50,90,230),(245,220,30),(30,30,30)]\ngrayscale = []\nfor pixel in photo:\n    r, g, b = pixel\n    grayscale.append(r + g + b)\nprint("Grayscale values:", grayscale)', {}],
  ['m10s5', "hint's own sorted(scores)[-3:] gives worst-of-top-3 as #1 (backwards leaderboard)",
   'file = open("highscores.txt")\nscores = []\nfor line in file.readlines():\n    scores.append(int(line.strip()))\nfile.close()\ntop_3 = sorted(scores)[-3:]\nfor i, score in enumerate(top_3):\n    print(f"#{i+1}: {score}")', {}],
]
const ACCEPT = [
  ['m7s3',  'division by a name that can be zero',
   'try:\n    r = total / count\nexcept ZeroDivisionError:\n    print("Caught it!")', {}],
  ['m7s3',  'explicit division by zero',
   'try:\n    r = 10 / 0\nexcept ZeroDivisionError:\n    print("Caught it!")', {}],
  ['m3s1',  'two complete smileys with eyes and mouths',
   'def draw_smiley(x,y,r):\n    circle(x,y,r)\n    circle(x-1,y-1,6)\n    circle(x+1,y-1,6)\n    rect(x,y,10,2)\ndraw_smiley(1,2,3)\ndraw_smiley(4,5,6)', { circles: 6, rects: 2 }],
  ['m10s2', 'correct incrementing scorer',
   'for i in range(len(answers)):\n    if student_answers[i] == answers[i]:\n        score = score + 1\nif len(answers) > 0:\n    percentage = (score / len(answers)) * 100', {}],
  ['m3s5',  'genuine scan-and-track loop',
   'def min_and_max(numbers):\n    smallest = numbers[0]\n    largest = numbers[0]\n    for n in numbers:\n        if n < smallest:\n            smallest = n\n        if n > largest:\n            largest = n\n    return smallest, largest\n\nscores = [45, 82, 19, 67, 90, 33]\nlow, high = min_and_max(scores)\nprint(f"Lowest: {low}, Highest: {high}")', {}],
  ['m3s5',  'built-in min()/max() form (explicitly allowed by the hints)',
   'def min_and_max(numbers):\n    smallest = numbers[0]\n    largest = numbers[0]\n    for n in numbers:\n        pass\n    smallest = min(numbers)\n    largest = max(numbers)\n    return smallest, largest\n\nscores = [45, 82, 19, 67, 90, 33]\nlow, high = min_and_max(scores)\nprint(f"Lowest: {low}, Highest: {high}")', {}],
  ['m6s1',  'splits and prints both fields',
   'file = open("students.csv")\nlines = file.readlines()\nfile.close()\nfor line in lines[1:]:\n    line = line.strip()\n    name, grade = line.split(",")\n    print(name, grade)', {}],
  ['m4s2',  'a full 6 colors/circles',
   'colors = [(255,80,80),(255,165,0),(255,255,60),(0,200,0),(0,0,255),(150,0,200)]\nfor color in colors:\n    r, g, b = color\n    fill(r, g, b)\n    circle(50, 130, 35)', { circles: 6 }],
  ['m3s2',  'a genuine 3x2 (6-tile) grid',
   'def colored_tile(r,g,b,x,y,size):\n    fill(r,g,b)\n    rect(x,y,size,size)\nfor row_y in [50, 160]:\n    colored_tile(1,2,3,40,row_y,70)\n    colored_tile(1,2,3,130,row_y,70)\n    colored_tile(1,2,3,220,row_y,70)', { rects: 6 }],
  ['m7s1',  'correctly divides by 1024 both times',
   'size_in_bytes = 262144000\nkb = size_in_bytes / 1024\nprint(kb)\nmb = size_in_bytes / 1024 / 1024\nprint(mb)\nsmall_number = 42\nprint(bin(small_number))', {}],
  ['m7s2',  'a genuine (r+g+b)//3 average',
   'photo = [(220,40,40),(40,200,60),(50,90,230),(245,220,30),(30,30,30)]\ngrayscale = []\nfor pixel in photo:\n    r, g, b = pixel\n    grayscale.append((r + g + b) // 3)\nprint("Grayscale values:", grayscale)', {}],
  ['m10s5', 'reverse=True gives best score as #1',
   'file = open("highscores.txt")\nscores = []\nfor line in file.readlines():\n    scores.append(int(line.strip()))\nfile.close()\ntop_3 = sorted(scores, reverse=True)[:3]\nfor i, score in enumerate(top_3):\n    print(f"#{i+1}: {score}")', {}],
]

for (const [id, label, code, log] of REJECT) {
  const ch = byId(id)
  if (!ch) { fail++; console.log(`✗ ${id} — challenge not found`); continue }
  const src = code ?? ch.starter
  if (ch.check(strip(src), log, src)) { fail++; console.log(`✗ ${id} — ACCEPTS a wrong solution: ${label}`) }
  else { pass++; console.log(`✓ ${id} — correctly rejects: ${label}`) }
}
for (const [id, label, code, log] of ACCEPT) {
  const ch = byId(id)
  if (!ch) { fail++; console.log(`✗ ${id} — challenge not found`); continue }
  if (ch.check(strip(code), log, code)) { pass++; console.log(`✓ ${id} — correctly accepts: ${label}`) }
  else { fail++; console.log(`✗ ${id} — REJECTS a correct solution: ${label}`) }
}

// ── web-lang (JS) coding stages — check(log) takes ONE log object, not
// (code, log, src) like the Python stages above. jsf1/jsf2's checks are
// regex-only (no live browser here), so each REJECT/ACCEPT pair verifies
// the regex logic directly against a realistic log.js/log.bodyText.
// A measured <div> for the layout stages — defaults to an invisible, full-width block.
const dv = o => ({ id: '', cls: '', text: 20, nestedDivs: 0, hasHeading: false, hasPara: false, hasLink: false, bg: 'rgba(0, 0, 0, 0)',
  display: 'block', padTop: 0, borderW: 0, borderRadius: 0, left: 0, right: 480, top: 0, bottom: 50, width: 480, height: 50, ...o })
const FILL = 'rgb(255, 247, 230)'
const page = ({ header, main, sidebar, content, footer }) => ({ divs: [header, main, sidebar, content, footer].filter(Boolean) })
const goodLayout = () => ({
  header:  dv({ id: 'header',  bg: FILL, top: 0,   bottom: 40 }),
  sidebar: dv({ id: 'sidebar', bg: FILL, left: 0,   right: 120, width: 120, top: 40, bottom: 200 }),
  content: dv({ id: 'content',           left: 130, right: 400, width: 270, top: 40, bottom: 200 }),
  footer:  dv({ id: 'footer',  bg: FILL, top: 200, bottom: 240 }),
})
const WEB_REJECT = [
  // ── Divs & Page Layout ──
  ['divs1', 'no div at all — content left loose', { divs: [] }],
  ['divs1', 'a div holding only a heading (no paragraph)', { divs: [dv({ hasHeading: true })] }],
  ['divs2', 'only one div', { divs: [dv({ hasHeading: true, hasPara: true })] }],
  ['divs2', 'two divs but one is nested inside the other (not two separate boxes)', { divs: [dv({ hasHeading: true, hasPara: true, nestedDivs: 1 }), dv({ hasHeading: true, hasPara: true })] }],
  ['divs3', 'a card with no background color', { divs: [dv({ cls: 'card', padTop: 12, borderW: 1 })] }],
  ['divs3', 'a card with no padding', { divs: [dv({ cls: 'card', bg: FILL, borderW: 1 })] }],
  ['divs3', 'a card with no border', { divs: [dv({ cls: 'card', bg: FILL, padTop: 12 })] }],
  ['divs3', 'the styling is on a div that is not class "card"', { divs: [dv({ cls: 'other', bg: FILL, padTop: 12, borderW: 1 })] }],
  ['divs3', 'padding too small to count (2px)', { divs: [dv({ cls: 'card', bg: FILL, padTop: 2, borderW: 1 })] }],
  ['divs4', 'two cards touching — no margin between them', { divs: [dv({ cls: 'card', top: 0, bottom: 100 }), dv({ cls: 'card', top: 100, bottom: 200 })] }],
  ['divs4', 'only 4px between the cards (needs 10)', { divs: [dv({ cls: 'card', top: 0, bottom: 100 }), dv({ cls: 'card', top: 104, bottom: 200 })] }],
  ['divs4', 'only one card', { divs: [dv({ cls: 'card', top: 0, bottom: 100 })] }],
  ['divs5', 'boxes still stacked (block-level)', { divs: [dv({ cls: 'box', top: 0, bottom: 50 }), dv({ cls: 'box', top: 50, bottom: 100 })] }],
  ['divs5', 'boxes wrapped onto two rows (widths too big)', { divs: [dv({ cls: 'box', left: 0, right: 300, top: 0, bottom: 50 }), dv({ cls: 'box', left: 0, right: 300, top: 50, bottom: 100 })] }],
  ['divs5', 'only one box', { divs: [dv({ cls: 'box' })] }],
  ['divs6', 'footer missing', page({ header: dv({ id: 'header', bg: FILL, top: 0, bottom: 40 }), main: dv({ id: 'main', top: 40, bottom: 200 }) })],
  ['divs6', 'footer written ABOVE main (wrong order)', page({ header: dv({ id: 'header', bg: FILL, top: 0, bottom: 40 }), main: dv({ id: 'main', top: 100, bottom: 200 }), footer: dv({ id: 'footer', bg: FILL, top: 40, bottom: 100 }) })],
  ['divs6', 'header has no background color', page({ header: dv({ id: 'header', top: 0, bottom: 40 }), main: dv({ id: 'main', top: 40, bottom: 200 }), footer: dv({ id: 'footer', bg: FILL, top: 200, bottom: 240 }) })],
  ['divs6', 'a section with no text in it', page({ header: dv({ id: 'header', bg: FILL, top: 0, bottom: 40 }), main: dv({ id: 'main', text: 0, top: 40, bottom: 200 }), footer: dv({ id: 'footer', bg: FILL, top: 200, bottom: 240 }) })],
  ['divsboss', 'sidebar on the RIGHT of the content (swapped)', page({ ...goodLayout(), sidebar: dv({ id: 'sidebar', bg: FILL, left: 290, right: 410, width: 120, top: 40, bottom: 200 }), content: dv({ id: 'content', left: 0, right: 280, width: 280, top: 40, bottom: 200 }) })],
  ['divsboss', 'sidebar wider than the content area', page({ ...goodLayout(), sidebar: dv({ id: 'sidebar', bg: FILL, left: 0, right: 300, width: 300, top: 40, bottom: 200 }), content: dv({ id: 'content', left: 310, right: 400, width: 90, top: 40, bottom: 200 }) })],
  ['divsboss', 'sidebar and content stacked instead of side by side', page({ ...goodLayout(), sidebar: dv({ id: 'sidebar', bg: FILL, left: 0, right: 120, width: 120, top: 40, bottom: 120 }), content: dv({ id: 'content', left: 0, right: 400, width: 400, top: 120, bottom: 200 }) })],
  ['divsboss', 'footer sits beside the content instead of under it', page({ ...goodLayout(), footer: dv({ id: 'footer', bg: FILL, left: 410, right: 480, width: 70, top: 40, bottom: 100 }) })],
  ['divsboss', 'header not above the row (overlaps it)', page({ ...goodLayout(), header: dv({ id: 'header', bg: FILL, top: 0, bottom: 90 }) })],
  ['divsboss', 'sidebar has no background color', page({ ...goodLayout(), sidebar: dv({ id: 'sidebar', left: 0, right: 120, width: 120, top: 40, bottom: 200 }) })],
  ['divsboss', 'a part is missing (no #content)', { divs: [goodLayout().header, goodLayout().sidebar, goodLayout().footer] }],
  ['jsf1s2', 'console.log with no quotes (not a real string argument)', { js: 'console.log(5);' }],
  ['jsf1s3', 'document.write() called but produces no visible output', { js: 'document.write("");', bodyText: 'My First Script' }],
  ['jsf1s4', 'only ONE string variable, not two', { js: 'let userName = "Sam";\ndocument.write("Hi " + userName);' }],
  ['jsf1s5', 'unmodified starter — still says Jordan/pizza', { js: 'let userName = "Jordan";\nlet favoriteFood = "pizza";', bodyText: 'Hi, my name is Jordan. My favorite food is pizza!' }],
  ['jsf1s6', 'no comment added', { js: 'let age = 16;\nconsole.log(age);' }],
  ['jsf1boss', 'only 2 string variables (needs 3+)', { js: '// Alex\n// name\nlet name = "Alex";\n// food\nlet food = "sushi";\nconsole.log(name);\ndocument.write("hi " + name);', bodyText: 'All About Mehi Alex' }],
  ['jsf2s2', 'only 5 console.log calls (needs 6, one variable never printed)', { js: 'let a="x";let b="y";let c=1;let d=2;let e=true;let f=false;console.log(a);console.log(b);console.log(c);console.log(d);console.log(e);' }],
  ['jsf2s4', 'sum calculated but product is missing', { js: 'let a=6;let b=4;let sum=a+b;document.write("s:"+sum);' }],
  ['jsf2s5', 'Math.pow used but Math.sqrt is missing', { js: 'let squared=Math.pow(5,2);document.write(squared);' }],
  ['jsf2s6', 'perimeter formula has no doubling at all (mathematically wrong)', { js: 'let width=8;let height=5;let area=width*height;let perimeter=width+height;console.log(width);console.log(height);console.log(area);console.log(perimeter);' }],
  ['jsf2boss', 'never divides by MPG at all (gasCost formula missing)', { js: 'let driver="Sam";let dest="Miami";let snacks=true;let distance=200;let time=4;\nlet a1="Beach";let a2="Pier";let a3="Museum";\nconst MPG=25;const gasPrice=3.50;\n// trip calcs\nlet speed=distance/time;\nconsole.log(speed);' }],
  ['web5cs1', 'only 1 input (needs 2, one of them a number input)', { inputCount: 1, numberInputCount: 0 }],
  ['web5cs2', 'never converts with Number() (string concatenation instead of doubling)', { hasNumberConvert: false, hasValueRead: true, hasClick: true, bodyTextAfterClick: '77' }],
  ['web5cboss', 'only 2 radio buttons (needs 3)', { radioInputCount: 2, hasClick: true }],
  ['web6s1', 'only 1 number input and 1 paragraph (needs 2 inputs, 3 paragraphs)', { numberInputCount: 1, buttons: 1, paragraphs: 1 }],
  ['web6s2', 'wrong math — a bug that computes the WRONG tip/total for bill=100,tip=20%', { hasNumberConvert: true, hasToFixed: true, hasClick: true, bodyTextAfterClick: 'Tip: $2.00 Total: $102.00' }],
  ['web6boss', 'quick-tip button uses the wrong percentage (not actually 20%)', { bodyTextAfterClick: 'Tip: $5.00 Total: $55.00' }],
  ['web7s1', 'no log.pages at all (a single-page log, not a multi-page one)', {}],
  ['web7s1', 'both pages have the SAME heading (not genuinely different content)', { pages: {
    'index.html': { h1s: 1, paragraphs: 1, headingText: ['Same Title'] },
    'about.html': { h1s: 1, paragraphs: 1, headingText: ['Same Title'] } } }],
  ['web7boss', 'index.html has no link to about.html at all', { pages: {
    'index.html': { h1s: 1, links: 0, html: '<h1>Home</h1>' },
    'about.html': { h1s: 1, links: 1, html: '<h1>About</h1><a href="index.html">Home</a>' } } }],
  ['web7boss', 'about.html links to itself instead of back to index.html', { pages: {
    'index.html': { h1s: 1, links: 1, html: '<h1>Home</h1><a href="about.html">About</a>' },
    'about.html': { h1s: 1, links: 1, html: '<h1>About</h1><a href="about.html">About</a>' } } }],
  ['web3boss', 'free choice still rejects unreadable text (light grey on white)', { bgColor: 'rgb(255, 255, 255)', headingColor: 'rgb(240, 240, 240)', h2Color: 'rgb(0, 0, 200)', h3Color: 'rgb(0, 120, 0)', pColor: 'rgb(90, 0, 90)', linkColor: 'rgb(0, 90, 160)', buttonBg: 'rgb(0, 0, 0)', buttonColor: 'rgb(255, 255, 255)' }],
  ['web3boss', 'free choice still rejects a button whose text matches its fill', { bgColor: 'rgb(255, 255, 255)', headingColor: 'rgb(0, 0, 200)', h2Color: 'rgb(0, 120, 0)', h3Color: 'rgb(90, 0, 90)', pColor: 'rgb(60, 60, 60)', linkColor: 'rgb(0, 90, 160)', buttonBg: 'rgb(200, 30, 30)', buttonColor: 'rgb(210, 40, 40)' }],
  ['jsf1s5', 'Russian sentence but the values were never changed from the starter', { js: 'let userName = "Jordan";\nlet favoriteFood = "pizza";\ndocument.write("Меня зовут " + userName);', bodyText: 'Меня зовут Jordan' }],
  ['jsf1s5', 'changed the values but they never reach the page', { js: 'let userName = "Алексей";\nlet favoriteFood = "суши";', bodyText: '' }],
  ['ws2s1', 'function defined but never called (result not on the page)', { hasFunction: true, hasReturn: true, js: 'function describeItem(name) { return "Вы видите " + name; }', bodyText: '' }],
  ['web5s5', 'no classList.toggle at all, just a plain style change', { js: 'document.querySelector("h1").style.color = "red";', hasClick: true }],
  ['web5s5', 'classList.toggle used but never wired to a click', { js: 'document.querySelector("h1").classList.toggle("highlighted");', hasClick: false }],
  ['web5s6', 'setInterval used but clearInterval never called (can\'t actually stop)', { js: 'let timer = setInterval(function() { seconds++; }, 1000);' }],
  ['web5s6', 'clearInterval called on a variable that was never assigned a real setInterval', { js: 'let timer;\nclearInterval(timer);' }],
]
// A measured semantic landmark for the sems*/semsboss stages.
const lm = o => ({ tag: '', id: '', text: 20, hasLink: false, hasHeading: false, nested: 0, bg: 'rgba(0, 0, 0, 0)',
  left: 0, right: 480, top: 0, bottom: 40, width: 480, height: 40, ...o })
const semGoodLayout = () => ({
  header: lm({ tag: 'header', hasHeading: true, bg: FILL, top: 0, bottom: 40 }),
  aside:  lm({ tag: 'aside', hasHeading: true, hasLink: true, bg: FILL, left: 0, right: 120, width: 120, top: 40, bottom: 200 }),
  main:   lm({ tag: 'main', left: 130, right: 400, width: 270, top: 40, bottom: 200 }),
  footer: lm({ tag: 'footer', bg: FILL, top: 200, bottom: 240 }),
})
const semPage = ({ header, nav, aside, main, footer, about, projects, extraDivs }) =>
  ({ divs: extraDivs || [], landmarks: [header, nav, aside, main, footer, about, projects].filter(Boolean) })

const SEM_REJECT = [
  ['sems1', 'the header is still a <div> with an id, not a real <header> tag', { divs: [dv({ id: 'header', hasHeading: true, bg: FILL })], landmarks: [] }],
  ['sems1', 'header exists but has no fill color (CSS id-selector was never updated to a tag selector)', { landmarks: [lm({ tag: 'header', hasHeading: true, top: 0, bottom: 40 }), lm({ tag: 'footer', bg: FILL, top: 200, bottom: 240 })] }],
  ['sems1', 'footer missing entirely', { landmarks: [lm({ tag: 'header', hasHeading: true, bg: FILL })] }],
  ['semq1', 'placeholder — quiz, covered generically', {}],
  ['sems2', 'nav has no real link inside it', { landmarks: [lm({ tag: 'header', bg: FILL, top: 0, bottom: 60 }), lm({ tag: 'nav', hasLink: false, top: 10, bottom: 50 })] }],
  ['sems2', 'nav exists but sits OUTSIDE the header (after it, not inside)', { landmarks: [lm({ tag: 'header', bg: FILL, top: 0, bottom: 40 }), lm({ tag: 'nav', hasLink: true, top: 40, bottom: 80 })] }],
  ['sems3', 'only one section built, not two', { landmarks: [lm({ tag: 'section', id: 'about', hasHeading: true, bg: FILL })] }],
  ['sems3', 'both sections exist but share the SAME background color', { landmarks: [lm({ tag: 'section', id: 'about', hasHeading: true, bg: FILL, top: 0, bottom: 50 }), lm({ tag: 'section', id: 'projects', hasHeading: true, bg: FILL, top: 60, bottom: 110 })] }],
  ['sems3', 'sections exist but neither has an id (can\'t tell them apart)', { landmarks: [lm({ tag: 'section', hasHeading: true, bg: FILL, top: 0, bottom: 50 }), lm({ tag: 'section', hasHeading: true, bg: 'rgb(224, 242, 254)', top: 60, bottom: 110 })] }],
  ['sems4', 'aside and main are stacked, not side by side', { landmarks: [lm({ tag: 'main', top: 0, bottom: 60 }), lm({ tag: 'aside', hasHeading: true, hasLink: true, bg: FILL, top: 60, bottom: 120 })] }],
  ['sems4', 'aside has no link inside it', { landmarks: [lm({ tag: 'main', left: 130, right: 400, top: 0, bottom: 160 }), lm({ tag: 'aside', hasHeading: true, hasLink: false, bg: FILL, left: 0, right: 120, top: 0, bottom: 160 })] }],
  ['semsboss', 'still has a <div> in the page (not fully converted to semantic tags)', semPage({ ...semGoodLayout(), about: lm({ tag: 'section', id: 'about', hasHeading: true, bg: FILL, top: 50, bottom: 110 }), projects: lm({ tag: 'section', id: 'projects', hasHeading: true, bg: 'rgb(224, 242, 254)', top: 120, bottom: 190 }), extraDivs: [dv({ hasHeading: true })] })],
  ['semsboss', 'header has no nav inside it', { divs: [], landmarks: [semGoodLayout().header, semGoodLayout().aside, semGoodLayout().main, semGoodLayout().footer, lm({ tag: 'section', id: 'about', hasHeading: true, bg: FILL, top: 50, bottom: 110 }), lm({ tag: 'section', id: 'projects', hasHeading: true, bg: 'rgb(224, 242, 254)', top: 120, bottom: 190 })] }],
  ['semsboss', 'the two sections share the same background color', { divs: [], landmarks: [semGoodLayout().header, lm({ tag: 'nav', hasLink: true, top: 10, bottom: 30 }), semGoodLayout().aside, semGoodLayout().main, semGoodLayout().footer, lm({ tag: 'section', id: 'about', hasHeading: true, bg: FILL, top: 50, bottom: 110 }), lm({ tag: 'section', id: 'projects', hasHeading: true, bg: FILL, top: 120, bottom: 190 })] }],
]
const SEM_ACCEPT = [
  ['sems1', 'a real header and footer, both colored, header has a heading', { landmarks: [lm({ tag: 'header', hasHeading: true, bg: FILL, top: 0, bottom: 40 }), lm({ tag: 'footer', bg: FILL, top: 200, bottom: 240 })] }],
  ['sems2', 'a real nav with a link, inside the header', { landmarks: [lm({ tag: 'header', bg: FILL, top: 0, bottom: 60 }), lm({ tag: 'nav', hasLink: true, top: 10, bottom: 50 })] }],
  ['sems3', 'two real sections with different ids and different colors', { landmarks: [lm({ tag: 'section', id: 'about', hasHeading: true, text: 30, bg: FILL, top: 0, bottom: 50 }), lm({ tag: 'section', id: 'projects', hasHeading: true, bg: 'rgb(224, 242, 254)', top: 60, bottom: 110 })] }],
  ['sems4', 'aside and main sit side by side, aside has a heading and a link', { landmarks: [lm({ tag: 'main', left: 130, right: 400, width: 270, top: 0, bottom: 160 }), lm({ tag: 'aside', hasHeading: true, hasLink: true, bg: FILL, left: 0, right: 120, width: 120, top: 0, bottom: 160 })] }],
  ['semsboss', 'a fully semantic sidebar layout, no divs anywhere', semPage({ ...semGoodLayout(), nav: lm({ tag: 'nav', hasLink: true, top: 10, bottom: 30, left: 100, right: 300 }), about: lm({ tag: 'section', id: 'about', hasHeading: true, bg: FILL, top: 50, bottom: 110 }), projects: lm({ tag: 'section', id: 'projects', hasHeading: true, bg: 'rgb(224, 242, 254)', top: 120, bottom: 190 }) })],
]
for (const [id, label, log] of SEM_REJECT) {
  if (id === 'semq1') continue   // quiz stage, no code-based check to test here
  const ch = byId(id)
  if (!ch) { fail++; console.log(`✗ ${id} — challenge not found`); continue }
  if (ch.check(log)) { fail++; console.log(`✗ ${id} — ACCEPTS a wrong solution: ${label}`) }
  else { pass++; console.log(`✓ ${id} — correctly rejects: ${label}`) }
}
for (const [id, label, log] of SEM_ACCEPT) {
  const ch = byId(id)
  if (!ch) { fail++; console.log(`✗ ${id} — challenge not found`); continue }
  if (ch.check(log)) { pass++; console.log(`✓ ${id} — correctly accepts: ${label}`) }
  else { fail++; console.log(`✗ ${id} — REJECTS a correct solution: ${label}`) }
}

// Measured table cells/rows for the tabs*/tabsboss stages.
const tc = (tag, text, o) => ({ tag, text, colSpan: 1, rowSpan: 1, bg: 'rgba(0, 0, 0, 0)', borderW: 0, padTop: 0, ...o })
const tbl = o => ({ hasCaption: false, hasThead: false, hasTbody: false, rowCount: 0, colCount: 0, headerCellCount: 0,
  hasColspan: false, hasRowspan: false, borderCollapse: 'separate', allCellsHaveBorder: false, allCellsHavePadding: false,
  headerBgDiffersFromData: false, rows: [], ...o })

const TABLE_REJECT = [
  ['tabs1', 'no table at all', { tables: [] }],
  ['tabs1', 'header row has only 1 column, not 2', { tables: [tbl({ rowCount: 3, colCount: 1, headerCellCount: 1, rows: [{ cells: [tc('th', 'Name')] }] })] }],
  ['tabs1', 'only a header row, no data rows', { tables: [tbl({ rowCount: 1, colCount: 2, headerCellCount: 2 })] }],
  ['tabs2', 'table exists but has no caption', { tables: [tbl({ hasThead: true, hasTbody: true, rowCount: 3, colCount: 2, headerCellCount: 2 })] }],
  ['tabs2', 'no thead/tbody grouping at all', { tables: [tbl({ hasCaption: true, rowCount: 3, colCount: 2, headerCellCount: 2 })] }],
  ['tabs3', 'no colspan used anywhere', { tables: [tbl({ rowCount: 3, colCount: 3, hasColspan: false })] }],
  ['tabs3', 'only 2 columns, not 3', { tables: [tbl({ rowCount: 3, colCount: 2, hasColspan: true })] }],
  ['tabs4', 'border-collapse was never set (still the default "separate")', { tables: [tbl({ borderCollapse: 'separate', allCellsHaveBorder: true, allCellsHavePadding: true, headerBgDiffersFromData: true })] }],
  ['tabs4', 'cells have no border', { tables: [tbl({ borderCollapse: 'collapse', allCellsHaveBorder: false, allCellsHavePadding: true, headerBgDiffersFromData: true })] }],
  ['tabs4', 'header background is the same as the data cells (no real header color)', { tables: [tbl({ borderCollapse: 'collapse', allCellsHaveBorder: true, allCellsHavePadding: true, headerBgDiffersFromData: false })] }],
  ['tabsboss', 'no caption', { tables: [tbl({ hasThead: true, hasTbody: true, colCount: 3, rowCount: 3, hasColspan: true })] }],
  ['tabsboss', 'neither colspan nor rowspan used', { tables: [tbl({ hasCaption: true, hasThead: true, hasTbody: true, colCount: 3, rowCount: 3, hasColspan: false, hasRowspan: false })] }],
  ['tabsboss', 'fewer than 3 day columns', { tables: [tbl({ hasCaption: true, hasThead: true, hasTbody: true, colCount: 2, rowCount: 3, hasColspan: true })] }],
]
const TABLE_ACCEPT = [
  ['tabs1', 'a real 2-column table, header + 2 data rows', { tables: [tbl({ rowCount: 3, colCount: 2, headerCellCount: 2 })] }],
  ['tabs2', 'captioned, thead + tbody', { tables: [tbl({ hasCaption: true, hasThead: true, hasTbody: true, rowCount: 3, colCount: 2, headerCellCount: 2 })] }],
  ['tabs3', 'a merged title row plus a real 3-column header/data', { tables: [tbl({ rowCount: 3, colCount: 3, hasColspan: true })] }],
  ['tabs4', 'fully styled: collapsed borders, per-cell border+padding, distinct header color', { tables: [tbl({ borderCollapse: 'collapse', allCellsHaveBorder: true, allCellsHavePadding: true, headerBgDiffersFromData: true, rows: [{ cells: [tc('th', 'x')] }, { cells: [tc('td', 'y')] }] })] }],
  ['tabsboss', 'a full timetable: caption, thead, tbody, 3 columns, a colspan', { tables: [tbl({ hasCaption: true, hasThead: true, hasTbody: true, colCount: 3, rowCount: 3, hasColspan: true })] }],
  ['tabsboss', 'same but using rowspan instead of colspan', { tables: [tbl({ hasCaption: true, hasThead: true, hasTbody: true, colCount: 3, rowCount: 3, hasRowspan: true })] }],
]
for (const [id, label, log] of TABLE_REJECT) {
  const ch = byId(id)
  if (!ch) { fail++; console.log(`✗ ${id} — challenge not found`); continue }
  if (ch.check(log)) { fail++; console.log(`✗ ${id} — ACCEPTS a wrong solution: ${label}`) }
  else { pass++; console.log(`✓ ${id} — correctly rejects: ${label}`) }
}
for (const [id, label, log] of TABLE_ACCEPT) {
  const ch = byId(id)
  if (!ch) { fail++; console.log(`✗ ${id} — challenge not found`); continue }
  if (ch.check(log)) { pass++; console.log(`✓ ${id} — correctly accepts: ${label}`) }
  else { fail++; console.log(`✗ ${id} — REJECTS a correct solution: ${label}`) }
}

// Measured audio/video elements for the avs*/avsboss stages.
const audioEl = o => ({ hasControls: false, hasAutoplay: false, hasLoop: false, hasMuted: false, sourceCount: 0, hasDirectSrc: false, fallbackText: 0, ...o })
const videoEl = o => ({ hasControls: false, hasAutoplay: false, hasLoop: false, hasMuted: false, sourceCount: 0, hasDirectSrc: false, fallbackText: 0, hasPoster: false, width: 0, height: 0, ...o })

const AV_REJECT = [
  ['avs1', 'no audio element at all', { media: { audio: [], video: [] } }],
  ['avs1', 'audio has no controls attribute', { media: { audio: [audioEl({ sourceCount: 1, fallbackText: 30 })], video: [] } }],
  ['avs1', 'audio has no <source>', { media: { audio: [audioEl({ hasControls: true, fallbackText: 30 })], video: [] } }],
  ['avs1', 'audio has no fallback text', { media: { audio: [audioEl({ hasControls: true, sourceCount: 1 })], video: [] } }],
  ['avs2', 'video missing width/height', { media: { audio: [], video: [videoEl({ hasControls: true, hasPoster: true, sourceCount: 1 })] } }],
  ['avs2', 'video has no poster', { media: { audio: [], video: [videoEl({ hasControls: true, width: 480, height: 270, sourceCount: 1 })] } }],
  ['avs3', 'autoplay used WITHOUT muted', { media: { audio: [], video: [videoEl({ hasAutoplay: true, hasMuted: false, hasLoop: true, sourceCount: 1, width: 480, height: 270 })] } }],
  ['avs3', 'muted but no loop', { media: { audio: [], video: [videoEl({ hasAutoplay: true, hasMuted: true, hasLoop: false, sourceCount: 1, width: 480, height: 270 })] } }],
  ['avsboss', 'video has only 1 source, not 2', { media: { audio: [audioEl({ hasControls: true, sourceCount: 1, fallbackText: 30 })], video: [videoEl({ hasControls: true, width: 480, height: 270, hasPoster: true, sourceCount: 1, hasMuted: true, hasLoop: true })] } }],
  ['avsboss', 'video uses autoplay without muted', { media: { audio: [audioEl({ hasControls: true, sourceCount: 1, fallbackText: 30 })], video: [videoEl({ hasControls: true, width: 480, height: 270, hasPoster: true, sourceCount: 2, hasAutoplay: true, hasMuted: false, hasLoop: true })] } }],
  ['avsboss', 'audio is missing entirely', { media: { audio: [], video: [videoEl({ hasControls: true, width: 480, height: 270, hasPoster: true, sourceCount: 2, hasMuted: true, hasLoop: true })] } }],
]
const AV_ACCEPT = [
  ['avs1', 'a real audio with controls, source and fallback text', { media: { audio: [audioEl({ hasControls: true, sourceCount: 1, fallbackText: 35 })], video: [] } }],
  ['avs2', 'a real sized, postered video', { media: { audio: [], video: [videoEl({ hasControls: true, width: 480, height: 270, hasPoster: true, sourceCount: 1 })] } }],
  ['avs3', 'autoplay + muted + loop together, properly sized', { media: { audio: [], video: [videoEl({ hasAutoplay: true, hasMuted: true, hasLoop: true, sourceCount: 1, width: 480, height: 270 })] } }],
  ['avsboss', 'a full media showcase: audio + two-source muted/looped video', { media: {
    audio: [audioEl({ hasControls: true, sourceCount: 1, fallbackText: 35 })],
    video: [videoEl({ hasControls: true, width: 480, height: 270, hasPoster: true, sourceCount: 2, hasMuted: true, hasLoop: true })],
  } }],
  ['avsboss', 'same but also uses autoplay, correctly paired with muted', { media: {
    audio: [audioEl({ hasControls: true, sourceCount: 1, fallbackText: 35 })],
    video: [videoEl({ hasControls: true, width: 480, height: 270, hasPoster: true, sourceCount: 2, hasAutoplay: true, hasMuted: true, hasLoop: true })],
  } }],
]
for (const [id, label, log] of AV_REJECT) {
  const ch = byId(id)
  if (!ch) { fail++; console.log(`✗ ${id} — challenge not found`); continue }
  if (ch.check(log)) { fail++; console.log(`✗ ${id} — ACCEPTS a wrong solution: ${label}`) }
  else { pass++; console.log(`✓ ${id} — correctly rejects: ${label}`) }
}
for (const [id, label, log] of AV_ACCEPT) {
  const ch = byId(id)
  if (!ch) { fail++; console.log(`✗ ${id} — challenge not found`); continue }
  if (ch.check(log)) { pass++; console.log(`✓ ${id} — correctly accepts: ${label}`) }
  else { fail++; console.log(`✗ ${id} — REJECTS a correct solution: ${label}`) }
}

// Measured <head> meta state for the metas*/metasboss stages.
const metaState = o => ({ hasCharset: false, hasViewport: false, description: '', keywords: '', og: { title: '', description: '', image: '' }, ...o })

const META_REJECT = [
  ['metas1', 'no charset meta tag', { meta: metaState({ hasViewport: true }), pageTitle: 'My Page' }],
  ['metas1', 'no viewport meta tag', { meta: metaState({ hasCharset: true }), pageTitle: 'My Page' }],
  ['metas1', 'no real title', { meta: metaState({ hasCharset: true, hasViewport: true }), pageTitle: '' }],
  ['metas2', 'description is empty', { meta: metaState({ description: '' }) }],
  ['metas2', 'description is too short/vague ("test")', { meta: metaState({ description: 'test' }) }],
  ['metas3', 'only og:title and og:description, missing og:image', { meta: metaState({ og: { title: 'x', description: 'y', image: '' } }) }],
  ['metas3', 'no Open Graph tags at all', { meta: metaState({}) }],
  ['metasboss', 'everything except Open Graph', { meta: metaState({ hasCharset: true, hasViewport: true, description: 'A real twenty-plus character description.' }), pageTitle: 'My Page' }],
  ['metasboss', 'everything except a real description', { meta: metaState({ hasCharset: true, hasViewport: true, description: 'short', og: { title: 'x', description: 'y', image: 'z.jpg' } }), pageTitle: 'My Page' }],
]
const META_ACCEPT = [
  ['metas1', 'charset + viewport + a real title', { meta: metaState({ hasCharset: true, hasViewport: true }), pageTitle: 'My Page' }],
  ['metas2', 'a real, specific description', { meta: metaState({ description: 'A page about my hobbies, built while learning web development.' }) }],
  ['metas3', 'all three Open Graph tags present', { meta: metaState({ og: { title: 'My Page', description: 'A real one.', image: 'preview.jpg' } }) }],
  ['metasboss', 'a fully SEO-ready head: charset, viewport, title, description, 3 OG tags', {
    meta: metaState({ hasCharset: true, hasViewport: true, description: 'A real twenty-plus character description.', og: { title: 'My Page', description: 'A real one.', image: 'preview.jpg' } }),
    pageTitle: 'My Page',
  }],
]
for (const [id, label, log] of META_REJECT) {
  const ch = byId(id)
  if (!ch) { fail++; console.log(`✗ ${id} — challenge not found`); continue }
  if (ch.check(log)) { fail++; console.log(`✗ ${id} — ACCEPTS a wrong solution: ${label}`) }
  else { pass++; console.log(`✓ ${id} — correctly rejects: ${label}`) }
}
for (const [id, label, log] of META_ACCEPT) {
  const ch = byId(id)
  if (!ch) { fail++; console.log(`✗ ${id} — challenge not found`); continue }
  if (ch.check(log)) { pass++; console.log(`✓ ${id} — correctly accepts: ${label}`) }
  else { fail++; console.log(`✗ ${id} — REJECTS a correct solution: ${label}`) }
}

const AF_REJECT = [
  ['afs1', 'missing url and date inputs', { emailInputCount: 1, urlInputCount: 0, dateInputCount: 0 }],
  ['afs1', 'missing email input', { emailInputCount: 0, urlInputCount: 1, dateInputCount: 1 }],
  ['afs2', 'no textarea at all', { textareaCount: 0, requiredCount: 1 }],
  ['afs2', 'textarea but not required', { textareaCount: 1, requiredCount: 0 }],
  ['afs3', 'label present but for doesn\'t match any id', { labelForOk: false }],
  ['afsboss', 'missing required on the email input', { emailInputCount: 1, requiredCount: 0, dateInputCount: 1, textareaCount: 1, labelForOk: true }],
  ['afsboss', 'missing the linked label', { emailInputCount: 1, requiredCount: 1, dateInputCount: 1, textareaCount: 1, labelForOk: false }],
  ['afsboss', 'missing the textarea', { emailInputCount: 1, requiredCount: 1, dateInputCount: 1, textareaCount: 0, labelForOk: true }],
]
const AF_ACCEPT = [
  ['afs1', 'real email, url and date inputs', { emailInputCount: 1, urlInputCount: 1, dateInputCount: 1 }],
  ['afs2', 'a required textarea', { textareaCount: 1, requiredCount: 1 }],
  ['afs3', 'a label genuinely linked via matching for/id', { labelForOk: true }],
  ['afsboss', 'a fully-linked required signup form', { emailInputCount: 1, requiredCount: 1, dateInputCount: 1, textareaCount: 1, labelForOk: true }],
]
for (const [id, label, log] of AF_REJECT) {
  const ch = byId(id)
  if (!ch) { fail++; console.log(`✗ ${id} — challenge not found`); continue }
  if (ch.check(log)) { fail++; console.log(`✗ ${id} — ACCEPTS a wrong solution: ${label}`) }
  else { pass++; console.log(`✓ ${id} — correctly rejects: ${label}`) }
}
for (const [id, label, log] of AF_ACCEPT) {
  const ch = byId(id)
  if (!ch) { fail++; console.log(`✗ ${id} — challenge not found`); continue }
  if (ch.check(log)) { pass++; console.log(`✓ ${id} — correctly accepts: ${label}`) }
  else { fail++; console.log(`✗ ${id} — REJECTS a correct solution: ${label}`) }
}

// Builds a `responsive` log from plain {wide:{cls,display,flexDirection,fontSize}, narrow:{...}} shorthand.
const respLog = (wide, narrow) => ({
  responsive: {
    wide: Object.entries(wide).map(([cls, o]) => ({ id: '', cls, display: 'block', flexDirection: 'row', fontSize: 16, width: 100, ...o })),
    narrow: Object.entries(narrow).map(([cls, o]) => ({ id: '', cls, display: 'block', flexDirection: 'row', fontSize: 16, width: 100, ...o })),
  },
})
const RESP_REJECT = [
  ['resps1', 'sidebar never hides at all', respLog({ sidebar: {} }, { sidebar: {} })],
  ['resps1', 'sidebar hidden even at wide width', respLog({ sidebar: { display: 'none' } }, { sidebar: { display: 'none' } })],
  ['resps2', 'nav never switches to column', respLog({ nav: { display: 'flex', flexDirection: 'row' } }, { nav: { display: 'flex', flexDirection: 'row' } })],
  ['resps2', 'nav isn\'t flex at all', respLog({ nav: { display: 'block', flexDirection: 'row' } }, { nav: { display: 'block', flexDirection: 'column' } })],
  ['resps3', 'title font-size never shrinks', respLog({ title: { fontSize: 48 } }, { title: { fontSize: 48 } })],
  ['respboss', 'sidebar hides correctly but nav never stacks', respLog({ nav: { display: 'flex', flexDirection: 'row' }, sidebar: {} }, { nav: { display: 'flex', flexDirection: 'row' }, sidebar: { display: 'none' } })],
  ['respboss', 'nav stacks correctly but sidebar never hides', respLog({ nav: { display: 'flex', flexDirection: 'row' }, sidebar: {} }, { nav: { display: 'flex', flexDirection: 'column' }, sidebar: {} })],
]
const RESP_ACCEPT = [
  ['resps1', 'sidebar visible wide, hidden narrow', respLog({ sidebar: {} }, { sidebar: { display: 'none' } })],
  ['resps2', 'nav row wide, column narrow', respLog({ nav: { display: 'flex', flexDirection: 'row' } }, { nav: { display: 'flex', flexDirection: 'column' } })],
  ['resps3', 'title genuinely smaller narrow', respLog({ title: { fontSize: 40 } }, { title: { fontSize: 24 } })],
  ['respboss', 'nav stacks AND sidebar hides', respLog({ nav: { display: 'flex', flexDirection: 'row' }, sidebar: {} }, { nav: { display: 'flex', flexDirection: 'column' }, sidebar: { display: 'none' } })],
]
for (const [id, label, log] of RESP_REJECT) {
  const ch = byId(id)
  if (!ch) { fail++; console.log(`✗ ${id} — challenge not found`); continue }
  if (ch.check(log)) { fail++; console.log(`✗ ${id} — ACCEPTS a wrong solution: ${label}`) }
  else { pass++; console.log(`✓ ${id} — correctly rejects: ${label}`) }
}
for (const [id, label, log] of RESP_ACCEPT) {
  const ch = byId(id)
  if (!ch) { fail++; console.log(`✗ ${id} — challenge not found`); continue }
  if (ch.check(log)) { pass++; console.log(`✓ ${id} — correctly accepts: ${label}`) }
  else { fail++; console.log(`✗ ${id} — REJECTS a correct solution: ${label}`) }
}

const WEB_ACCEPT = [
  // ── Divs & Page Layout ──
  ['divs1', 'heading and paragraphs wrapped in one div', { divs: [dv({ hasHeading: true, hasPara: true })] }],
  ['divs2', 'two separate divs, each with heading + paragraph', { divs: [dv({ hasHeading: true, hasPara: true }), dv({ hasHeading: true, hasPara: true, top: 60, bottom: 110 })] }],
  ['divs3', 'a styled card: background, padding, border', { divs: [dv({ cls: 'card', bg: FILL, padTop: 12, borderW: 1 })] }],
  ['divs3', 'a card whose class list has other classes too', { divs: [dv({ cls: 'wide card', bg: 'rgba(255, 247, 230, 1)', padTop: 10, borderW: 2 })] }],
  ['divs4', 'cards 16px apart', { divs: [dv({ cls: 'card', top: 0, bottom: 100 }), dv({ cls: 'card', top: 116, bottom: 200 })] }],
  ['divs5', 'two boxes on one row (inline-block)', { divs: [dv({ cls: 'box', left: 0, right: 200, top: 0, bottom: 50 }), dv({ cls: 'box', left: 204, right: 404, top: 0, bottom: 50 })] }],
  ['divs5', 'two boxes on one row (flex-style, touching)', { divs: [dv({ cls: 'box', left: 0, right: 240, top: 0, bottom: 50 }), dv({ cls: 'box', left: 240, right: 480, top: 0, bottom: 50 })] }],
  ['divs6', 'header, main, footer stacked in order, header/footer coloured', page({ header: dv({ id: 'header', bg: FILL, top: 0, bottom: 40 }), main: dv({ id: 'main', top: 40, bottom: 200 }), footer: dv({ id: 'footer', bg: FILL, top: 200, bottom: 240 }) })],
  ['divsboss', 'full sidebar layout', page(goodLayout())],
  ['divsboss', 'boxes of different heights share a row but are not top-aligned (baseline)', page({ ...goodLayout(), sidebar: dv({ id: 'sidebar', bg: FILL, left: 0, right: 120, width: 120, top: 92, bottom: 118 }), content: dv({ id: 'content', left: 130, right: 400, width: 270, top: 40, bottom: 118 }) })],
  ['divs5', 'boxes side by side but one sits a little lower (different heights)', { divs: [dv({ cls: 'box', left: 0, right: 200, top: 0, bottom: 30 }), dv({ cls: 'box', left: 204, right: 404, top: 10, bottom: 70 })] }],
  ['divsboss', 'sidebar layout in Safari-format colors (rgba)', page({ ...goodLayout(), header: dv({ id: 'header', bg: 'rgba(47, 59, 82, 1)', top: 0, bottom: 40 }), footer: dv({ id: 'footer', bg: 'rgba(47, 59, 82, 1)', top: 200, bottom: 240 }) })],
  ['jsf1s2', 'a real quoted console.log message', { js: 'console.log("hi there");' }],
  ['jsf1s3', 'document.write() with real visible output', { js: 'document.write("hi");', bodyText: 'My First Scripthi' }],
  ['jsf1s4', 'two string variables, concatenated in document.write', { js: 'let userName = "Sam";\nlet favoriteFood = "tacos";\ndocument.write("Hi " + userName + " " + favoriteFood);' }],
  ['jsf1s5', 'personalized with real values', { js: 'let userName = "Alex";\nlet favoriteFood = "sushi";\ndocument.write("Hi, my name is " + userName + ". My favorite food is " + favoriteFood + "!");', bodyText: 'Hi, my name is Alex. My favorite food is sushi!' }],
  ['jsf1s6', 'a real explanatory comment', { js: 'let age = 16;\n// stores the user\'s age\nconsole.log(age);' }],
  ['jsf1boss', '3 string vars, 3 comments, both output methods', { js: '// Alex\n// name var\nlet name = "Alex";\n// food var\nlet food = "sushi";\n// emoji var\nlet emoji = "🍣";\nconsole.log(name);\ndocument.write("Hi " + name);', bodyText: 'All About MeHi Alex' }],
  ['jsf2s2', 'a real 2-string/2-number/2-boolean set, all 6 logged', { js: 'let a="x";let b="y";let c=1;let d=2;let e=true;let f=false;console.log(a);console.log(b);console.log(c);console.log(d);console.log(e);console.log(f);' }],
  ['jsf2s4', 'sum and product both calculated and printed', { js: 'let a=6;let b=4;let sum=a+b;let product=a*b;document.write("s:"+sum+"p:"+product);' }],
  ['jsf2s5', 'both Math.pow and Math.sqrt used', { js: 'let squared=Math.pow(5,2);let root=Math.sqrt(36);document.write(squared+root);' }],
  ['jsf2s6', 'the doubled-terms alternate formula (mathematically equivalent to the hint)', { js: 'let width=8;let height=5;let area=width*height;let perimeter=width*2+height*2;console.log(width);console.log(height);console.log(area);console.log(perimeter);' }],
  ['jsf2boss', 'a genuine full solution', { js: 'let driver="Sam";let dest="Miami";let snacks=true;let distance=200;let time=4;\nlet a1="Beach";let a2="Pier";let a3="Museum";\nconst MPG=25;const gasPrice=3.50;\n// convert distance and time into a real speed and cost\nlet speed=distance/time;\nlet gasCost=(distance/MPG)*gasPrice;\nconsole.log(speed);\nconsole.log(gasCost);', bodyText: '' }],
  ['web5cs1', 'a real text input + number input', { inputCount: 2, numberInputCount: 1 }],
  ['web5cs2', 'genuine Number() conversion, doubled correctly (7*2=14)', { hasNumberConvert: true, hasValueRead: true, hasClick: true, bodyTextAfterClick: '14' }],
  ['web5cboss', '3 radio buttons, real click handler', { radioInputCount: 3, hasClick: true }],
  ['web6s1', 'the full required layout', { numberInputCount: 2, buttons: 1, paragraphs: 3 }],
  ['web6s2', 'correct math for bill=100, tip=20% -> tip $20.00, total $120.00', { hasNumberConvert: true, hasToFixed: true, hasClick: true, bodyTextAfterClick: 'Tip: $20.00 Total: $120.00' }],
  ['web6boss', 'quick-tip button correctly computes 20% of bill=50 -> $10.00 tip, $60.00 total', { bodyTextAfterClick: 'Tip: $10.00 Total: $60.00' }],
  ['web7s1', 'two pages, genuinely different headings', { pages: {
    'index.html': { h1s: 1, paragraphs: 1, headingText: ['Home Page'] },
    'about.html': { h1s: 1, paragraphs: 1, headingText: ['About Page'] } } }],
  ['web7boss', 'real two-way nav, both directions present', { pages: {
    'index.html': { h1s: 1, links: 1, html: '<h1>Home</h1><nav><a href="about.html">About</a></nav>' },
    'about.html': { h1s: 1, links: 1, html: '<h1>About</h1><nav><a href="index.html">Home</a></nav>' } } }],
  ['web3boss', 'Chrome-format colors: a valid scheme with white text on a dark button', { bgColor: 'rgb(255, 247, 230)', headingColor: 'rgb(47, 59, 82)', h2Color: 'rgb(124, 58, 237)', h3Color: 'rgb(5, 150, 105)', pColor: 'rgb(75, 85, 99)', linkColor: 'rgb(29, 78, 216)', buttonBg: 'rgb(230, 57, 70)', buttonColor: 'rgb(255, 255, 255)' }],
  ['web3boss', 'Safari-format (rgba) colors: the same valid scheme must still pass', { bgColor: 'rgba(255, 247, 230, 1)', headingColor: 'rgba(47, 59, 82, 1)', h2Color: 'rgba(124, 58, 237, 1)', h3Color: 'rgba(5, 150, 105, 1)', pColor: 'rgba(75, 85, 99, 1)', linkColor: 'rgba(29, 78, 216, 1)', buttonBg: 'rgba(230, 57, 70, 1)', buttonColor: 'rgba(255, 255, 255, 1)' }],
  ['web3s16', 'Safari-format (rgba) colors: four distinct readable text colors', { bgColor: 'rgba(255, 247, 230, 1)', headingColor: 'rgba(47, 59, 82, 1)', h2Color: 'rgba(124, 58, 237, 1)', h3Color: 'rgba(5, 150, 105, 1)', pColor: 'rgba(75, 85, 99, 1)' }],
  ['web3boss', 'free choice: arbitrary non-palette colors that are distinct and readable', { bgColor: 'rgb(10, 10, 40)', headingColor: 'rgb(255, 200, 0)', h2Color: 'rgb(0, 255, 200)', h3Color: 'rgb(255, 120, 200)', pColor: 'rgb(230, 230, 230)', linkColor: 'rgb(120, 200, 255)', buttonBg: 'rgb(200, 30, 30)', buttonColor: 'rgb(255, 255, 255)' }],
  // ── Answers written in another language (Russian) — code stays English ──
  ['jsf1s5', 'Russian sentence with the student\'s own Russian values', { js: 'let userName = "Алексей";\nlet favoriteFood = "суши";\ndocument.write("Меня зовут " + userName + ". Моя любимая еда — " + favoriteFood + "!");', bodyText: 'Меня зовут Алексей. Моя любимая еда — суши!' }],
  ['ws1s1', 'array of Russian items joined by commas', { hasArray: true, bodyText: 'меч, щит, зелье' }],
  ['ws2s1', 'describeItem returning a Russian sentence, result shown on the page', { hasFunction: true, hasReturn: true, js: 'function describeItem(name) { return "Вы видите " + name + "."; }\ndocument.getElementById("story").textContent = describeItem("меч");', bodyText: 'Вы видите меч.' }],
  ['ws4s2', 'numbered list items in Russian ("1. Драться")', { hasLoop: true, listItems: 3, bodyText: '1. Драться 2. Бежать 3. Договориться' }],
  ['web5s5', 'classList.toggle wired to a real click handler', { js: 'document.querySelector("h1").addEventListener("click", function() { document.querySelector("h1").classList.toggle("highlighted"); });', hasClick: true }],
  ['web5s6', 'setInterval AND clearInterval both genuinely used', { js: 'let timer;\ntimer = setInterval(function() { seconds = seconds + 1; }, 1000);\nclearInterval(timer);' }],
]
for (const [id, label, log] of WEB_REJECT) {
  const ch = byId(id)
  if (!ch) { fail++; console.log(`✗ ${id} — challenge not found`); continue }
  if (ch.check(log)) { fail++; console.log(`✗ ${id} — ACCEPTS a wrong solution: ${label}`) }
  else { pass++; console.log(`✓ ${id} — correctly rejects: ${label}`) }
}
for (const [id, label, log] of WEB_ACCEPT) {
  const ch = byId(id)
  if (!ch) { fail++; console.log(`✗ ${id} — challenge not found`); continue }
  if (ch.check(log)) { pass++; console.log(`✓ ${id} — correctly accepts: ${label}`) }
  else { fail++; console.log(`✗ ${id} — REJECTS a correct solution: ${label}`) }
}

// ── The Divs module's teaching text must have balanced <div> tags ───────────
// (unbalanced markup inside a figure would swallow the steps below it)
{
  const { CHALLENGE_LESSON: CL } = new Function(html.slice(s, html.indexOf('const STAGE_INDEX')) + '\nreturn { CHALLENGE_LESSON }')()
  const divsMod = new Function(html.slice(s, e) + '\nreturn MODULES.find(m => m.id === "web4d")')()
  const balanced = h => (h.match(/<div\b/g) || []).length === (h.match(/<\/div>/g) || []).length
  for (const st of divsMod.stages) {
    if (balanced(st.text) && balanced(CL[st.id].html)) pass++
    else { fail++; console.log(`✗ ${st.id} — unbalanced <div> tags in its text or lesson`) }
  }
  console.log(`✓ ${divsMod.stages.length} Divs stages have balanced <div> markup in text and lesson`)
}

// ── Every live stage must have Lesson panel content ─────────────────────────
// Stages added without a CHALLENGE_LESSON entry showed an empty "📘 Lesson"
// panel (and a whole module's Lesson node could be blank). 35 stages had
// drifted into that state before this test existed.
{
  const se = html.indexOf('const STAGE_INDEX')
  const { CHALLENGE_LESSON } = new Function(html.slice(s, se) + '\nreturn { CHALLENGE_LESSON }')()
  for (const ch of CHALLENGES) {
    const l = CHALLENGE_LESSON[ch.id]
    if (!l || !l.title || !l.html || l.html.replace(/<[^>]+>/g, '').trim().length < 40) {
      fail++; console.log(`✗ ${ch.id} — no (or empty) Lesson panel content in CHALLENGE_LESSON`)
    } else pass++
  }
  console.log(`✓ ${CHALLENGES.length} stages checked for Lesson panel content`)
}

// ── Quiz rendering: no question/option text may become a real HTML tag ──────
// renderQuiz() builds innerHTML from raw strings. Prompts/options containing
// tag-like text ("<script> tags", "<body>", "<!DOCTYPE html>") were parsed as
// real elements — swallowing the dropdown, later questions and the Submit
// button (a stage that showed "no quiz" at all). Render every quiz stage with
// a stub box and assert the only tags produced are the renderer's own.
{
  const rs = html.indexOf('function escapeQuizHtml')
  const re = html.indexOf('function markQuestion')
  const ruWin = {}
  new Function('window', readFileSync('c:/Users/user/Downloads/ICT website/public/lessons/grade8-ru.js', 'utf8'))(ruWin)
  const RU = ruWin.G8_RU_QUIZ
  const stub = { innerHTML: '' }
  const ownTags = new Set(['div', 'span', 'select', 'option', 'input', 'button'])
  const cyr = /[А-Яа-яЁё]/
  const optionValues = h => [...h.matchAll(/<option value="([^"]*)"/g)].map(m => m[1])
  let quizStages = 0
  for (const lang of ['en', 'ru']) {
    const renderer = new Function('document', 'BFLang', 'G8_RU_QUIZ', html.slice(rs, re) + '\nreturn renderQuiz')(
      { getElementById: () => stub }, { get: () => lang, onChange() {} }, RU)
    for (const ch of CHALLENGES.filter(c => c.type === 'quiz')) {
      if (lang === 'en') quizStages++
      renderer(ch)
      const stray = [...stub.innerHTML.matchAll(/<\/?([a-zA-Z!][\w-]*)/g)].map(m => m[1].toLowerCase()).filter(t => !ownTags.has(t))
      const expectedSelects = (ch.questions || []).filter(q => q.type === 'match' || q.type === 'judge').length
      const gotSelects = (stub.innerHTML.match(/<select /g) || []).length
      if (stray.length || gotSelects < expectedSelects) {
        fail++; console.log(`✗ ${ch.id} [${lang}] — quiz renders stray tags [${[...new Set(stray)].join(', ')}] or lost dropdowns (${gotSelects}/${expectedSelects})`)
      } else pass++
      if (lang === 'ru') {
        // Grading compares the ORIGINAL English value — Russian may only change the visible label.
        const wantValues = (ch.questions || []).flatMap(q => (q.type === 'match' ? ['', ...q.options] : q.type === 'judge' ? ['', 'FAKE', 'REAL'] : [])).map(v => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'))
        const gotValues = optionValues(stub.innerHTML)
        if (gotValues.filter(v => v !== '').join('|') !== wantValues.filter(v => v !== '').join('|')) {
          fail++; console.log(`✗ ${ch.id} [ru] — dropdown option VALUES changed (would break grading)`)
        } else pass++
      }
    }
  }
  console.log(`✓ ${quizStages} quiz stages render with no stray tags and every dropdown present (EN and RU)`)

  // Russian coverage: every quiz question has a translation, options line up 1:1
  for (const ch of CHALLENGES.filter(c => c.type === 'quiz')) {
    const tr = RU[ch.id], qs = ch.questions || []
    let why = ''
    if (!tr) why = 'no Russian entry'
    else if (tr.length !== qs.length) why = `has ${tr.length} translated questions, quiz has ${qs.length}`
    else qs.forEach((q, i) => {
      const t = tr[i]
      if (!t || !t[0] || !cyr.test(t[0])) why = why || `question ${i + 1} has no Russian prompt`
      else if (t[1] && (!q.options || t[1].length !== q.options.length)) why = why || `question ${i + 1} option count differs`
      else if (q.type === 'match' && t[1] && !t[1].some(x => cyr.test(x))) why = why || `question ${i + 1} options are not translated (use null if they are code)`
    })
    if (why) { fail++; console.log(`✗ ${ch.id} — Russian: ${why}`) } else pass++
  }
  console.log(`✓ Russian translations checked for ${quizStages} quiz stages`)
}

console.log(`\n${pass} passed, ${fail} failed.`)
if (fail > 0) process.exit(1)
console.log('all Grade 8 challenge checks are non-vacuous, every starter stub is genuinely incomplete,')
console.log('and each tightened check tells a correct solution from a wrong one')
