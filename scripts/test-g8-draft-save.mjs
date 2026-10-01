// Verifies Grade 8's "save any code written, pass or fail" feature:
//  - checkWebChallenge/validateChallenge always call LessonSaves.save(), on
//    both a failing AND a passing attempt, and keep saving after a stage was
//    already passed (so further edits aren't lost)
//  - XP is only ever requested on the FIRST pass, never on later re-saves
//  - currentWebCode()/parseWebDraft() round-trip single-page, multi-page and
//    legacy (bare-JS-string) saves correctly
//  - selectChallenge() restores a saved draft instead of the starter code,
//    for web (single + multi-page), Python, and the "nothing ever saved" case
import { readFileSync } from 'fs'

const html = readFileSync('c:/Users/user/Downloads/ICT website/public/lessons/grade8.html', 'utf8')
const s = html.indexOf('// ── Colors & Shading — shared palette data'), e = html.indexOf('const CHALLENGES = MODULES')
const { CHALLENGES } = new Function(html.slice(s, e) + '\nconst CHALLENGES = MODULES.filter(m => m.live).flatMap(m => m.stages)\nreturn { CHALLENGES }')()

let pass = 0, fail = 0
const ok = (c, m) => { if (c) { pass++; console.log('✓ ' + m) } else { fail++; console.log('✗ ' + m) } }

// ── currentWebCode / parseWebDraft round-trip ────────────────────────────────
{
  const src = html.slice(html.indexOf('function currentWebCode()'), html.indexOf('function checkWebChallenge(log)'))
  const mk = (pageOrder, pageEditors, webEditors) => new Function('pageOrder', 'pageEditors', 'webEditors', src + '\nreturn { currentWebCode, parseWebDraft }')(pageOrder, pageEditors, webEditors)

  const singlePage = mk([], {}, { html: { getValue: () => '<h1>Hi</h1>' }, css: { getValue: () => 'h1{color:red}' }, js: { getValue: () => 'let x=1' } })
  const draft1 = singlePage.parseWebDraft(singlePage.currentWebCode())
  ok(draft1.html === '<h1>Hi</h1>' && draft1.css === 'h1{color:red}' && draft1.js === 'let x=1', 'currentWebCode/parseWebDraft round-trips a single-page draft')

  const multi = mk(['index.html', 'about.html'],
    { 'index.html': { getValue: () => '<h1>Index</h1>' }, 'about.html': { getValue: () => '<h1>About</h1>' } },
    { css: { getValue: () => 'body{}' }, js: { getValue: () => 'console.log(1)' } })
  const draft2 = multi.parseWebDraft(multi.currentWebCode())
  ok(draft2.pages['index.html'] === '<h1>Index</h1>' && draft2.pages['about.html'] === '<h1>About</h1>' && draft2.css === 'body{}', 'currentWebCode/parseWebDraft round-trips a multi-page draft')

  ok(singlePage.parseWebDraft(null) === null, 'parseWebDraft(null) — nothing ever saved — returns null, not a crash')
  const legacy = singlePage.parseWebDraft('let x = 5; console.log(x);')
  ok(legacy.js === 'let x = 5; console.log(x);' && legacy.html === undefined, 'parseWebDraft recognises a pre-feature legacy save (bare JS string)')
}

// ── checkWebChallenge / validateChallenge always autosave ────────────────────
function harness(fnName, extraSrc) {
  const body = html.slice(html.indexOf('function ' + fnName), html.indexOf('\nfunction ', html.indexOf('function ' + fnName) + 10))
  const calls = []
  const stub = {
    CHALLENGES, activeIdx: 0,
    completed: new Set(),
    LessonSaves: { save: (lesson, id, opts) => calls.push({ lesson, id, ...opts }) },
    renderPills() {}, winShow() {}, showToast() {}, clog() {}, me: null, BF: { addXP() {}, recordAttempt() {} },
    reportRealProgress() {}, updateFooterNext() {}, renderModuleXPBar() {}, findModuleForChallenge: () => null,
    explainColorFailure: () => [], stripPyComments: c => c, drawLog: {},
    currentWebCode: () => '"CODE"',
  }
  const fn = new Function(...Object.keys(stub), (extraSrc || '') + body + `\nreturn ${fnName}`)(...Object.values(stub))
  return { fn, calls, completed: stub.completed }
}

{
  const web = CHALLENGES.find(c => c.lang === 'web' && !c.boss)
  const idx = CHALLENGES.indexOf(web)
  // fail
  let h = harness('checkWebChallenge')
  h.fn = h.fn  // no-op, kept for clarity
  const H1 = (() => {
    const calls = []
    const completed = new Set()
    const stub = { CHALLENGES, get activeIdx() { return idx }, completed, LessonSaves: { save: (l, id, o) => calls.push({ id, ...o }) },
      renderPills() {}, winShow() {}, showToast() {}, clog() {}, me: null, BF: { addXP() {}, recordAttempt() {} },
      reportRealProgress() {}, updateFooterNext() {}, renderModuleXPBar() {}, findModuleForChallenge: () => null,
      explainColorFailure: () => [], currentWebCode: () => '"DRAFT"', challengeStartedAt: 0 }
    const body = html.slice(html.indexOf('function checkWebChallenge'), html.indexOf('\nfunction ', html.indexOf('function checkWebChallenge') + 10))
    const fn = new Function(...Object.keys(stub), body + '\nreturn checkWebChallenge')(...Object.values(stub))
    return { fn, calls, completed }
  })()
  const failingLog = {}
  const originalCheck = web.check
  web.check = () => false
  H1.fn(failingLog)
  ok(H1.calls.length === 1 && H1.calls[0].code === '"DRAFT"' && H1.calls[0].passed === false && H1.calls[0].xpEarned === 0,
    'checkWebChallenge: a FAILING attempt still autosaves the draft (xpEarned 0)')
  ok(!H1.completed.has(idx), 'checkWebChallenge: a failing attempt does not mark the stage complete')

  web.check = () => true
  H1.fn({})
  ok(H1.calls.length === 2 && H1.calls[1].passed === true && H1.calls[1].xpEarned === web.xp, 'checkWebChallenge: the first PASS saves passed:true with real XP')
  ok(H1.completed.has(idx), 'checkWebChallenge: a passing attempt marks the stage complete')

  // re-running an already-passed stage (e.g. the student keeps tinkering) must keep saving, with xpEarned:0 this time
  H1.fn({})
  ok(H1.calls.length === 3 && H1.calls[2].passed === true && H1.calls[2].xpEarned === 0,
    'checkWebChallenge: re-saving an ALREADY-passed stage sends xpEarned:0 (no double XP) but still saves the code')
  web.check = originalCheck
}

{
  const py = CHALLENGES.find(c => !c.lang && c.type !== 'quiz' && typeof c.check === 'function')
  const idx = CHALLENGES.indexOf(py)
  const calls = []
  const completed = new Set()
  const stub = { CHALLENGES, get activeIdx() { return idx }, completed, LessonSaves: { save: (l, id, o) => calls.push({ id, ...o }) },
    renderPills() {}, winShow() {}, showToast() {}, clog() {}, me: null, BF: { addXP() {}, recordAttempt() {} },
    reportRealProgress() {}, updateFooterNext() {}, renderModuleXPBar() {}, findModuleForChallenge: () => null,
    stripPyComments: c => c, drawLog: {}, challengeStartedAt: 0 }
  const body = html.slice(html.indexOf('function validateChallenge'), html.indexOf('\nfunction ', html.indexOf('function validateChallenge') + 10))
  const fn = new Function(...Object.keys(stub), body + '\nreturn validateChallenge')(...Object.values(stub))
  const originalCheck = py.check
  py.check = () => false
  fn('this is wrong')
  ok(calls.length === 1 && calls[0].code === 'this is wrong' && calls[0].passed === false, 'validateChallenge: a wrong Python attempt still autosaves the exact code typed')
  py.check = () => true
  fn('this is right')
  ok(calls.length === 2 && calls[1].passed === true && calls[1].xpEarned === py.xp && completed.has(idx), 'validateChallenge: a correct attempt passes and saves with real XP')
  fn('this is right, edited further')
  ok(calls.length === 3 && calls[2].code === 'this is right, edited further' && calls[2].xpEarned === 0,
    'validateChallenge: editing further after passing keeps saving the latest code, with no extra XP')
  py.check = originalCheck
}

// ── selectChallenge restores a saved draft instead of the starter ───────────
{
  const webStage = CHALLENGES.find(c => c.lang === 'web' && c.webStarter && !c.webStarter.pages && !c.boss)
  const pySt = CHALLENGES.find(c => !c.lang && c.type !== 'quiz' && c.starter)
  const multiStage = CHALLENGES.find(c => c.webStarter && c.webStarter.pages)

  function selRestore(ch, savedRaw) {
    const setVals = {}
    const webEditors = {
      css: { v: '', setValue(x) { this.v = x } }, js: { v: '', setValue(x) { this.v = x } },
      html: { v: '', setValue(x) { this.v = x } },
    }
    let pagesSetup = null
    const editor = { v: '', setValue(x) { this.v = x }, focus() {} }
    const draftSrc = html.slice(html.indexOf('function parseWebDraft'), html.indexOf('\nfunction checkWebChallenge'))
    const fn = new Function('ch', 'webEditors', 'editor', 'LessonSaves', 'setupPageEditors', 'teardownPageEditors', 'switchWebTab',
      draftSrc + `
      const draft = ch.lang === 'web' ? parseWebDraft(LessonSaves.codeFor(ch.id, 'grade8')) : null
      if (ch.lang === 'web') {
        webEditors.css.setValue((draft && draft.css != null ? draft.css : (ch.webStarter && ch.webStarter.css)) || '')
        webEditors.js.setValue((draft && draft.js != null ? draft.js : (ch.webStarter && ch.webStarter.js)) || '')
        if (draft && draft.pages) { setupPageEditors(draft.pages) }
        else if (ch.webStarter && ch.webStarter.pages) { setupPageEditors(ch.webStarter.pages) }
        else { teardownPageEditors(); webEditors.html.setValue((draft && draft.html != null ? draft.html : (ch.webStarter && ch.webStarter.html)) || '') }
      } else {
        const savedPy = LessonSaves.codeFor(ch.id, 'grade8')
        editor.setValue(savedPy != null ? savedPy : (ch.starter || '# Write your Python here\\n'))
      }
      `)
    fn(ch, webEditors, editor, { codeFor: () => savedRaw }, p => { pagesSetup = p }, () => {}, () => {})
    return { webEditors, editor, pagesSetup }
  }

  const r1 = selRestore(webStage, null)
  ok(r1.webEditors.html.v === (webStage.webStarter.html || ''), 'selectChallenge: with NO saved draft, a web stage still loads the starter code')

  const draft = JSON.stringify({ html: '<h1>My edit</h1>', css: 'h1{color:blue}', js: 'let saved=true' })
  const r2 = selRestore(webStage, draft)
  ok(r2.webEditors.html.v === '<h1>My edit</h1>' && r2.webEditors.css.v === 'h1{color:blue}' && r2.webEditors.js.v === 'let saved=true',
    'selectChallenge: a web stage with a saved draft restores html/css/js, not the starter')

  const r3 = selRestore(webStage, 'let legacyJsOnly = 1')
  ok(r3.webEditors.js.v === 'let legacyJsOnly = 1' && r3.webEditors.html.v === (webStage.webStarter.html || ''),
    'selectChallenge: a legacy (bare-JS) saved row restores the JS tab and falls back to starter HTML')

  if (multiStage) {
    const pagesDraft = JSON.stringify({ pages: { 'index.html': '<h1>Saved Index</h1>' }, css: 'c', js: 'j' })
    const r4 = selRestore(multiStage, pagesDraft)
    ok(r4.pagesSetup && r4.pagesSetup['index.html'] === '<h1>Saved Index</h1>', 'selectChallenge: a multi-page stage restores saved per-page HTML')
  } else { ok(false, 'selectChallenge: no multi-page web stage found to test against') }

  const r5 = selRestore(pySt, null)
  ok(r5.editor.v === (pySt.starter || '# Write your Python here\n'), 'selectChallenge: with no saved draft, a Python stage loads the starter')
  const r6 = selRestore(pySt, 'print("my saved attempt")')
  ok(r6.editor.v === 'print("my saved attempt")', 'selectChallenge: a Python stage restores the saved code over the starter')
}

console.log(`\n${pass} passed, ${fail} failed.`)
if (fail > 0) process.exit(1)
console.log('code is autosaved on every Run (pass or fail, even after an earlier pass) and restored instead of the starter')
