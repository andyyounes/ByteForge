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
    + 'const MPG = 25; const gasPrice = 3.50; let distance = 200; let time = 4; let speed = distance / time; let gasCost = (distance / MPG) * gasPrice;',
  // ws1s0 reads real global state (an actual array with 2+ items) rather
  // than a regex flag — needs a real array sitting on the fixture's window.
  globals: { inventory: ['sword', 'shield', 'lantern'] },
  bodyText: 'true false you see 1. item 3 items 1 2 3 4 5 Hi, my name is Sam. My favorite food is tacos! '
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
  hasNumberConvert: true, hasToFixed: true, hasValueRead: true,
  bodyTextAfterClick: 'Tip: $20.00 Total: $120.00 Tip: $10.00 Total: $60.00 14',
  // web7 (Real Multi-Page Websites) — log.pages[filename] mirrors this same
  // maximal shape, one level deeper, for each page in the project.
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
  hasVariable: false, imgCount: 0, imgAltOk: false, pageTitle: '' })

let pass = 0, fail = 0
for (const ch of CHALLENGES) {
  const label = `${ch.mod}/${ch.id}`

  if (ch.lang === 'web') {
    if (ch.check(webMaximalLog())) { pass++; console.log(`✓ ${label} — satisfiable (maximal log passes)`) }
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
const WEB_REJECT = [
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
]
const WEB_ACCEPT = [
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

console.log(`\n${pass} passed, ${fail} failed.`)
if (fail > 0) process.exit(1)
console.log('all Grade 8 challenge checks are non-vacuous, every starter stub is genuinely incomplete,')
console.log('and each tightened check tells a correct solution from a wrong one')
