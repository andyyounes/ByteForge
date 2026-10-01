// Verifies the same "save code pass-or-fail, restore instead of resetting to
// starter" fix (already tested for Grade 8 in test-g8-draft-save.mjs) on the
// four other pages with a per-challenge CodeMirror editor: Grade 9, IGCSE Y2,
// AS Level (Paper 2) and A Level (Paper 4).
import { readFileSync } from 'fs'

const ROOT = 'c:/Users/user/Downloads/ICT website/public/lessons/'
let pass = 0, fail = 0
const ok = (c, m) => { if (c) { pass++; console.log('✓ ' + m) } else { fail++; console.log('✗ ' + m) } }

function slice(src, startMarker, endMarker) {
  const a = src.indexOf(startMarker)
  if (a < 0) throw new Error('missing marker: ' + startMarker)
  const b = src.indexOf(endMarker, a + startMarker.length)
  if (b < 0) throw new Error('missing end marker after ' + startMarker + ': ' + endMarker)
  return src.slice(a, b)
}

// One config per page: how its challenge/XP id is built, its lesson key, its
// validate-function name + signature, and its select-function body markers.
const PAGES = [
  {
    file: 'grade9.html', lesson: 'grade9', validateFn: 'validateChallenge', call: ch => `${ch}.mod + '/' + ${ch}.name`,
    selectStart: 'function selectChallenge(i) {', selectEnd: 'function resetStarter() {',
    validateStart: 'function validateChallenge(code, result) {', validateEnd: 'function showHint() {',
    editorVar: 'editor', chList: 'CHALLENGES', activeIdxVar: 'activeIdx', completedVar: 'completed',
  },
  {
    file: 'igcse-y2.html', lesson: 'igcse-y2', validateFn: 'validateChallenge', call: ch => `${ch}.mod + '/' + ${ch}.name`,
    selectStart: 'function selectChallenge(i){', selectEnd: 'function markLessonComplete() {',
    validateStart: 'function validateChallenge(code,result){', validateEnd: 'function showHint(){',
    editorVar: 'editor', chList: 'CHALLENGES', activeIdxVar: 'activeIdx', completedVar: 'completed',
  },
  {
    file: 'as-level.html', lesson: 'as-paper2', validateFn: 'p2ValidateChallenge', call: ch => `${ch}.mod`,
    selectStart: 'function p2SelectChallenge(i) {', selectEnd: 'function p2ValidateChallenge(code, result) {',
    validateStart: 'function p2ValidateChallenge(code, result) {', validateEnd: 'function p2ShowHint() {',
    editorVar: 'p2Editor', chList: 'P2_CHALLENGES', activeIdxVar: 'p2ActiveIdx', completedVar: 'p2Completed',
  },
  {
    file: 'a-level.html', lesson: 'al-paper4', validateFn: 'p2ValidateChallenge', call: ch => `${ch}.mod`,
    selectStart: 'function p2SelectChallenge(i) {', selectEnd: 'function p2ValidateChallenge(code, result) {',
    validateStart: 'function p2ValidateChallenge(code, result) {', validateEnd: 'function p2ShowHint() {',
    editorVar: 'p2Editor', chList: 'P2_CHALLENGES', activeIdxVar: 'p2ActiveIdx', completedVar: 'p2Completed',
  },
]

for (const cfg of PAGES) {
  const src = readFileSync(ROOT + cfg.file, 'utf8')

  // ── validate function: always saves, monotonic firstPass/XP behaviour ──────
  {
    const body = slice(src, cfg.validateStart, cfg.validateEnd)
    const calls = []
    const completedSet = new Set()
    const fakeCh = { id: 'x/y', mod: 'x', name: 'y', xp: 50, check: () => fakeCh._result }
    const stub = {
      [cfg.chList]: [fakeCh],
      get [cfg.activeIdxVar]() { return 0 },
      [cfg.completedVar]: completedSet,
      LessonSaves: { save: (lesson, id, opts) => calls.push({ lesson, id, ...opts }) },
      renderPills() {}, p2RenderPills() {}, showToast() {}, p2AppendOut() {}, me: null, BF: { addXP() {}, recordAttempt() {} },
      reportRealProgress() {}, document: { getElementById: () => null }, challengeStartedAt: 0,
    }
    const fn = new Function(...Object.keys(stub), body + `\nreturn ${cfg.validateFn}`)(...Object.values(stub))

    fakeCh._result = false
    fn('wrong code', {})
    ok(calls.length === 1 && calls[0].lesson === cfg.lesson && calls[0].code === 'wrong code' && calls[0].passed === false && calls[0].xpEarned === 0,
      `${cfg.file}: a FAILING attempt autosaves the draft (lesson ${cfg.lesson}, xpEarned 0)`)
    ok(!completedSet.has(0), `${cfg.file}: a failing attempt does not mark the stage complete`)

    fakeCh._result = true
    fn('right code', {})
    ok(calls.length === 2 && calls[1].passed === true && calls[1].xpEarned === 50 && completedSet.has(0),
      `${cfg.file}: the first PASS saves passed:true with real XP and completes the stage`)

    fn('right code, tweaked further', {})
    ok(calls.length === 3 && calls[2].passed === true && calls[2].xpEarned === 0 && calls[2].code === 'right code, tweaked further',
      `${cfg.file}: re-saving an ALREADY-passed stage keeps saving the latest code with xpEarned:0 (no double XP)`)
  }

  // ── select function: restores a saved draft instead of the starter ─────────
  {
    const body = slice(src, cfg.selectStart, cfg.selectEnd)
    const fakeCh = { id: 'x/y', mod: 'x', name: 'y', xp: 50, starter: 'STARTER CODE', text: 't' }
    function run(savedRaw) {
      const editor = { v: null, setValue(x) { this.v = x }, clearHistory() {} }
      const els = {}
      const doc = { getElementById: id => (els[id] = els[id] || { innerHTML: '', textContent: '', style: {}, classList: { contains: () => false, toggle() {} }, dataset: {} }) }
      const stub = {
        [cfg.chList]: [fakeCh], [cfg.editorVar]: editor,
        LessonSaves: { codeFor: () => savedRaw },
        document: doc, renderPills() {}, p2RenderPills() {}, p2ClearTrace() {}, clearTraceTable() {},
        showMissionMain() {}, renderChallengeLesson() {}, renderP2Lesson() {},
        G9_MOD_LESSON: {}, currentClassId: null,
      }
      const fn = new Function(...Object.keys(stub), body.replace(/function \w+\(i\)\s*{?\s*{?/, 'function go(i) {') + '\nreturn go')(...Object.values(stub))
      fn(0)
      return editor.v
    }
    ok(run(null) === 'STARTER CODE', `${cfg.file}: with no saved draft, the editor still loads the starter`)
    ok(run('my saved attempt') === 'my saved attempt', `${cfg.file}: with a saved draft, the editor restores it instead of the starter`)
  }
}

console.log(`\n${pass} passed, ${fail} failed.`)
if (fail > 0) process.exit(1)
console.log('grade9/igcse-y2/as-level/a-level all autosave code pass-or-fail and restore drafts instead of the starter')
