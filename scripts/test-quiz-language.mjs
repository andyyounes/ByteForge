// Verifies the EN / РУ support for quiz answers across lesson pages, by running
// each page's REAL renderQuiz/checkQuiz code against a stub DOM.
//
// What must hold in every language:
//  - dropdown option VALUES are always the original English strings (only labels
//    are translated), so grading never depends on the language shown
//  - every quiz question has a Russian translation, lined up 1:1 with the English
//  - typed answers in Russian (and their case/ё variants) are accepted, wrong ones
//    still fail, and English answers keep working
//  - free-text "write a good prompt" checks recognise Russian keywords
// Code, tag names and identifiers are deliberately NOT translated.
import { readFileSync } from 'fs'

const ROOT = 'c:/Users/user/Downloads/ICT website/public'
let pass = 0, fail = 0
const ok = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg) } else { fail++; console.log('✗ ' + msg) } }
const cyr = /[А-Яа-яЁё]/

// ── the real shared BFLang ───────────────────────────────────────────────────
function loadLang(lang, fetchImpl) {
  const win = {}, store = { bf_lang: lang }
  new Function('window', 'document', 'localStorage', 'fetch', readFileSync(ROOT + '/js/lang.js', 'utf8'))(
    win,
    { readyState: 'complete', documentElement: { hasAttribute: () => true, setAttribute() {} }, getElementById: () => null, addEventListener() {} },
    { getItem: k => store[k], setItem: (k, v) => { store[k] = v } },
    fetchImpl || (() => Promise.reject(new Error('no network in tests'))))
  return win.BFLang
}
// a fake /api/ai-check that replies with `content` and records every request it receives
function fakeAI(content, calls = []) {
  return Object.assign((url, opts) => {
    calls.push({ url, body: JSON.parse(opts.body) })
    return Promise.resolve({ json: () => Promise.resolve(typeof content === 'function' ? content() : { choices: [{ message: { content } }] }) })
  }, { calls })
}
{
  const L = loadLang('en')
  ok(L.norm('  ПроцЕссор ') === 'процессор', 'norm(): trims and lower-cases Cyrillic')
  ok(L.norm('ЁЛКА') === L.norm('елка'), 'norm(): treats ё and е as the same letter')
  ok(L.norm('KB,   MB') === 'kb, mb' || L.norm('KB,   MB') === 'kb, mb', 'norm(): collapses repeated spaces')
  ok(loadLang('ru').get() === 'ru' && loadLang('en').get() === 'en', 'BFLang.get() reads the saved language')
  ok(L.esc('<script> & "x"') === '&lt;script&gt; &amp; &quot;x&quot;', 'esc(): tag-like text is escaped')
}

// ── Grade 7 ──────────────────────────────────────────────────────────────────
{
  const html = readFileSync(ROOT + '/lessons/grade7.html', 'utf8')
  const { CHALLENGES } = new Function(html.slice(html.indexOf('const WORLDS = ['), html.indexOf('const STAGE_INDEX')) + '\nreturn { CHALLENGES }')()
  const ruWin = {}
  new Function('window', readFileSync(ROOT + '/lessons/grade7-ru.js', 'utf8'))(ruWin)
  const RU = ruWin.G7_RU_QUIZ
  const quizSrc = html.slice(html.indexOf('function renderQuiz(ch) {'), html.indexOf('// ── Chat stages'))
  const quizzes = CHALLENGES.filter(c => c.questions && c.questions.length)

  function runtime(lang, answers, ch) {
    const box = { innerHTML: '' }, resultEl = { textContent: '', className: '' }
    const els = {}
    const doc = { getElementById: id => id === 'output-quiz' ? box : id === 'quiz-result' ? resultEl
      : (els[id] = els[id] || { value: answers[id] != null ? String(answers[id]) : '', className: '', textContent: '', innerHTML: '' }) }
    let got = null
    const f = new Function('document', 'BFLang', 'G7_RU_QUIZ', 'CHALLENGES', 'getIdx', 'checkChallenge',
      quizSrc.replace(/activeIdx/g, 'getIdx()') + '\nreturn { renderQuiz, checkQuiz }')
    const rt = f(doc, loadLang(lang), RU, [ch], () => 0, r => { got = r })
    return { box, resultEl, render: () => rt.renderQuiz(ch), check: () => { rt.checkQuiz(); return got } }
  }
  const idOf = (ch, i, suffix = 'a') => `quiz-${ch.id}-${i}-${suffix}`
  const correctAnswers = ch => {
    const a = {}
    ch.questions.forEach((q, i) => {
      if (q.type === 'match' || q.type === 'fill') a[idOf(ch, i)] = Array.isArray(q.answer) ? q.answer[0] : q.answer
      if (q.type === 'judge') { a[idOf(ch, i)] = q.answer; if (q.flagAnswers) a[idOf(ch, i, 'b')] = q.flagAnswers[0] }
    })
    return a
  }
  const gradable = ch => ch.questions.filter(q => ['match', 'fill', 'judge'].includes(q.type)).length

  // 1. Translation coverage, lined up 1:1
  for (const ch of quizzes) {
    const tr = RU[ch.id]; let why = ''
    if (!tr) why = 'no Russian entry'
    else if (tr.length !== ch.questions.length) why = `translated ${tr.length}, quiz has ${ch.questions.length}`
    else ch.questions.forEach((q, i) => {
      const t = tr[i]
      if (!t || !t[0] || !cyr.test(t[0])) why = why || `question ${i + 1}: no Russian text`
      const list = q.type === 'match' ? q.options : q.type === 'judge' ? q.flagOptions : null
      if (t && t[1] && (!list || t[1].length !== list.length)) why = why || `question ${i + 1}: label count differs from options`
      if (q.type === 'fill' && !(t && t[2] && t[2].length)) why = why || `question ${i + 1}: typed answer has no Russian answers`
    })
    ok(!why, `g7 ${ch.id} — Russian text complete${why ? ' — ' + why : ''}`)
  }

  // 2. Rendering: no stray tags, and dropdown VALUES stay English in both languages
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  for (const lang of ['en', 'ru']) for (const ch of quizzes) {
    const r = runtime(lang, {}, ch); r.render()
    const vals = [...r.box.innerHTML.matchAll(/<option value="([^"]*)"/g)].map(m => m[1]).filter(v => v !== '')
    const want = ch.questions.flatMap(q => q.type === 'match' ? q.options : q.type === 'judge' ? ['FAKE', 'REAL', ...(q.flagOptions || [])] : []).map(esc)
    const stray = [...r.box.innerHTML.matchAll(/<\/?([a-zA-Z!][\w-]*)/g)].map(m => m[1].toLowerCase()).filter(t => !['div', 'span', 'select', 'option', 'input', 'button', 'img'].includes(t))
    ok(vals.join('|') === want.join('|') && !stray.length, `g7 ${ch.id} [${lang}] — dropdown values unchanged, no stray tags`)
  }

  // 3. Grading in Russian mode and English mode: every correct English answer still passes
  for (const lang of ['en', 'ru']) for (const ch of quizzes) {
    if (!gradable(ch)) continue
    const got = runtime(lang, correctAnswers(ch), ch).check()
    ok(got.quizCorrect === gradable(ch), `g7 ${ch.id} [${lang}] — every correct answer passes (${got.quizCorrect}/${gradable(ch)})`)
  }

  // 4. Typed answers in Russian: accepted (any case, ё/е), wrong ones rejected
  for (const ch of quizzes) ch.questions.forEach((q, i) => {
    if (q.type !== 'fill') return
    const extras = RU[ch.id][i][2]
    const total = gradable(ch)
    for (const ex of extras) for (const variant of [ex, ex.toUpperCase(), '  ' + ex.replace(/е/g, 'ё') + ' ']) {
      const a = correctAnswers(ch); a[idOf(ch, i)] = variant
      if (runtime('ru', a, ch).check().quizCorrect !== total) { ok(false, `g7 ${ch.id} q${i + 1} — Russian answer "${variant}" was rejected`); return }
    }
    const bad = correctAnswers(ch); bad[idOf(ch, i)] = 'совсем неверно'
    ok(runtime('ru', bad, ch).check().quizCorrect === total - 1, `g7 ${ch.id} q${i + 1} — all ${extras.length} Russian answers accepted in any case; a wrong answer is rejected`)
  })

  // 5. Free-text prompts written in Russian
  {
    const good = 'Напиши короткий список из пяти смешных фактов о собаках для детей'
    const vague = 'Расскажи мне про собак'
    for (const id of ['cb5s2', 'cb5boss']) {
      const ch = CHALLENGES.find(c => c.id === id)
      const g = runtime('ru', { [idOf(ch, 0)]: good }, ch).check()
      const v = runtime('ru', { [idOf(ch, 0)]: vague }, ch).check()
      ok(g.quizCorrect === 1 && v.quizCorrect === 0, `g7 ${id} — a specific Russian prompt passes, a vague one does not`)
    }
    const en = runtime('en', { [idOf(CHALLENGES.find(c => c.id === 'cb5s2'), 0)]: 'Write a short list of five funny facts about dogs for kids' }, CHALLENGES.find(c => c.id === 'cb5s2')).check()
    ok(en.quizCorrect === 1, 'g7 cb5s2 — an English specific prompt still passes')
  }
}

// ── Grade 9 Mission IDE: quiz bubbles + learn Match-Ups ──────────────────────
{
  const html = readFileSync(ROOT + '/lessons/grade9-missions.html', 'utf8')
  const s = html.indexOf('const MISSIONS = ['), e = html.indexOf('// ═══', html.indexOf('function execPseudo'))
  const { MISSIONS } = new Function(html.slice(s, e) + '\nreturn { MISSIONS }')()
  const ruWin = {}
  new Function('window', readFileSync(ROOT + '/lessons/grade9-ru.js', 'utf8'))(ruWin)
  const RU = ruWin.G9_RU
  const quizzes = MISSIONS.filter(m => m.type === 'quiz'), learns = MISSIONS.filter(m => m.type === 'learn')

  // 1. Coverage, lined up 1:1 with the English data
  for (const m of quizzes) {
    const t = RU.quiz[m.id]; let why = ''
    if (!t) why = 'no Russian entry'
    else if (!cyr.test(t.intro || '')) why = 'intro not translated'
    else if (t.q.length !== m.quiz.questions.length) why = `translated ${t.q.length}, quiz has ${m.quiz.questions.length}`
    else m.quiz.questions.forEach((q, i) => {
      const x = t.q[i]
      if (!x || !cyr.test(x[0])) why = why || `question ${i + 1}: no Russian text`
      if (x && x[1] && x[1].length !== q.options.length) why = why || `question ${i + 1}: label count differs`
    })
    ok(!why, `g9 quiz ${m.id} — Russian text complete${why ? ' — ' + why : ''}`)
  }
  for (const m of learns) {
    const t = RU.learn[m.id]; let why = ''
    if (!t) why = 'no Russian entry'
    else if (t.length !== m.learn.terms.length) why = `translated ${t.length}, match-up has ${m.learn.terms.length}`
    else t.forEach((x, i) => { if (!x || !cyr.test(x[1])) why = why || `pair ${i + 1}: definition not translated` })
    ok(!why, `g9 learn ${m.id} — Russian text complete${why ? ' — ' + why : ''}`)
  }

  // 2. Run the real quiz code against a tiny fake DOM
  class El {
    constructor() { this.children = []; this.dataset = {}; this._c = new Set(); this.textContent = ''; this.innerHTML = ''; this.id = ''; this.className = ''; this.style = {} }
    appendChild(c) { this.children.push(c); return c }
    get classList() { const s = this._c; return { add: c => s.add(c), remove: c => s.delete(c), contains: c => s.has(c), toggle: c => (s.has(c) ? s.delete(c) : s.add(c)) } }
    all() { return [this, ...this.children.flatMap(c => c.all())] }
    querySelectorAll(sel) { return this.all().filter(x => x !== this && x.has(sel.replace(/^\./, ''))) }
    has(cls) { return this.className.split(' ').includes(cls) || this._c.has(cls) }
  }
  const fixed = {}
  const root = new El()
  const doc = {
    createElement: () => new El(),
    getElementById: id => (fixed[id] = fixed[id] || root.all().find(x => x.id === id) || (() => { const el = new El(); el.id = id; root.appendChild(el); return el })()),
    querySelector: () => null, querySelectorAll: () => [],
  }
  const src = html.slice(html.indexOf('// ── Language (EN / РУ) for quiz + learn bubbles'), html.indexOf('function completeQuizBubble'))
  function build(lang) {
    return new Function('document', 'BFLang', 'G9_RU', 'showMissionMain', 'completeLearnBubble', 'let activeMission = null;\n' + src
      + '\nreturn { renderQuizBubble, pickQuizOption, renderLearnBubble, renderMatchup, setMission: m => { activeMission = m }, get solved() { return _quizSolved } }')(
      doc, loadLang(lang), RU, () => {}, () => {})
  }
  const m = quizzes.find(x => x.id === 'comp-p2')   // 3 questions, options Input/Process/Output
  for (const lang of ['en', 'ru']) {
    for (const k of Object.keys(fixed)) delete fixed[k]
    root.children.length = 0
    const g = build(lang); g.setMission(m); g.renderQuizBubble()
    const wrap = doc.getElementById('quiz-questions')
    const cards = wrap.children
    const prompt0 = cards[0].children.find(c => c.className === 'quiz-prompt').textContent
    const btns = cards[0].children.find(c => c.className === 'quiz-opts').children
    ok(cards.length === 3 && (lang === 'ru') === cyr.test(prompt0), `g9 comp-p2 [${lang}] — prompt shown in ${lang === 'ru' ? 'Russian' : 'English'}`)
    ok((lang === 'ru') === cyr.test(btns.map(b => b.textContent).join('')), `g9 comp-p2 [${lang}] — option labels shown in ${lang === 'ru' ? 'Russian' : 'English'}`)
    // Click the button whose ENGLISH answer is right (Output) — by its label position, whatever language it shows
    const rightIdx = m.quiz.questions[0].options.indexOf(m.quiz.questions[0].answer)
    const wrongIdx = rightIdx === 0 ? 1 : 0
    g.pickQuizOption(0, btns[wrongIdx], m.quiz.questions[0].options[wrongIdx])
    ok(g.solved.size === 0, `g9 comp-p2 [${lang}] — a wrong option is not accepted`)
    btns[rightIdx].onclick()
    ok(g.solved.has(0), `g9 comp-p2 [${lang}] — clicking the option labelled "${btns[rightIdx].textContent}" is graded as the correct English answer`)
  }
}

// ── Grade 6: World 10 game-design dropdowns ──────────────────────────────────
{
  const html = readFileSync(ROOT + '/lessons/grade6.html', 'utf8')
  const s = html.indexOf('const W1_STAGES = ['), e = html.indexOf('// ── Real progress: bridge')
  const { WORLDS } = new Function(html.slice(s, e) + '\nreturn { WORLDS }')()
  const stages = WORLDS.flatMap(w => w.stages || []).filter(st => st.gamerules)
  const ruWin = {}
  new Function('window', readFileSync(ROOT + '/lessons/grade6-ru.js', 'utf8'))(ruWin)
  const RU = ruWin.G6_RU.gamerules

  class Node { constructor(tag) { this.tag = tag; this.children = []; this.style = {}; this.value = ''; this.textContent = ''; this.id = '' }
    appendChild(c) { this.children.push(c); return c }
    append(...c) { c.forEach(x => this.children.push(x)) }
    get innerHTML() { return '' } set innerHTML(_) { this.children = [] } }
  const src = html.slice(html.indexOf('function loadGameRules()'), html.indexOf('function gameRulesCheck()'))
  function draw(lang, st) {
    const wrap = new Node('div'), fb = new Node('div')
    const doc = { getElementById: id => (id === 'game-rules' ? wrap : fb), createElement: t => new Node(t), createTextNode: t => ({ text: t }), querySelectorAll: () => [] }
    new Function('document', 'BFLang', 'G6_RU', 'activeStage', src + '\nloadGameRules()')(doc, loadLang(lang), ruWin.G6_RU, st)
    return wrap.children
  }
  for (const st of stages) {
    const t = RU[st.id]; let why = ''
    if (!t) why = 'no Russian entry'
    else if (t.length !== st.gamerules.rules.length) why = `translated ${t.length}, stage has ${st.gamerules.rules.length}`
    else st.gamerules.rules.forEach((r, i) => {
      if (!t[i][0].includes('___') || !cyr.test(t[i][0])) why = why || `rule ${i + 1}: template not translated or lost its ___ blank`
      if (t[i][1].length !== r.choices.length) why = why || `rule ${i + 1}: choice count differs`
    })
    ok(!why, `g6 ${st.id} — Russian rules complete${why ? ' — ' + why : ''}`)
    for (const lang of ['en', 'ru']) {
      const rows = draw(lang, st)
      let good = rows.length === st.gamerules.rules.length
      rows.forEach((row, i) => {
        const sel = row.children.find(c => c.tag === 'select')
        const vals = sel.children.map(o => o.value).filter(v => v !== '')
        good = good && vals.join('|') === st.gamerules.rules[i].choices.join('|')
        const labels = sel.children.map(o => o.textContent).join(' ')
        if (lang === 'ru') good = good && cyr.test(labels) && cyr.test(row.children.filter(c => c.text).map(c => c.text).join(''))
      })
      ok(good, `g6 ${st.id} [${lang}] — dropdown values stay English${lang === 'ru' ? ', labels and sentence are Russian' : ''}`)
    }
  }
}

// ── Written answers in any language: AI-marked path (mocked — no network) ────
{
  const L = loadLang('ru')
  // language detection
  ok(L.isForeign('Процессор выполняет инструкции и управляет всеми частями компьютера'), 'isForeign: a Russian sentence is detected')
  ok(L.isForeign('Պրոցեսորը կատարում է հրահանգները'), 'isForeign: Armenian is detected too (any non-Latin script)')
  ok(!L.isForeign('The CPU fetches, decodes and executes instructions'), 'isForeign: an English sentence is not')
  ok(!L.isForeign('11010110') && !L.isForeign('0xAF 214 3.14') && !L.isForeign(''), 'isForeign: numbers, binary and hex are not (language-independent)')
  ok(!L.isForeign('IF x > 3 THEN OUTPUT "big" ENDIF'), 'isForeign: pseudocode is not')
  ok(!L.isForeign('ok да'), 'isForeign: one short foreign word in an otherwise tiny answer is not enough')
  ok(loadLang('en').uiLang('Процессор') === 'ru' && loadLang('en').uiLang('CPU') === 'en' && loadLang('ru').uiLang('CPU') === 'ru',
    'uiLang: messages are Russian when the page is set to РУ or the answer itself is Cyrillic')

  // aiGrade: reply parsing + the answer never reaches the system prompt
  const calls = []
  let r = await loadLang('ru', fakeAI('{"score":85,"feedback":"Верно, но не хватает примера."}', calls)).aiGrade({ question: 'Что делает CPU?', modelAnswer: 'Executes instructions', answer: 'Он выполняет команды' })
  ok(r.score === 85 && r.pass === true && /Верно/.test(r.feedback), 'aiGrade: parses the marker\'s JSON (score 85 passes)')
  const sys = calls[0].body.messages.find(m => m.role === 'system').content, usr = calls[0].body.messages.find(m => m.role === 'user').content
  ok(!sys.includes('Он выполняет команды') && usr.includes('Он выполняет команды') && sys.includes('DATA ONLY'), 'aiGrade: the student\'s answer is only ever in the user message, marked as data')
  ok(calls[0].url === '/api/ai-check' && calls[0].body.temperature <= 0.2, 'aiGrade: uses the existing /api/ai-check route at low temperature')
  r = await loadLang('ru', fakeAI('```json\n{"score":40,"feedback":"Частично."}\n```')).aiGrade({ question: 'q', modelAnswer: 'm', answer: 'a' })
  ok(r.score === 40 && r.pass === false, 'aiGrade: tolerates a fenced JSON reply; 40 does not pass')
  r = await loadLang('ru', fakeAI('{"score":250,"feedback":"x"}')).aiGrade({ question: 'q', modelAnswer: 'm', answer: 'a' })
  ok(r.score === 100, 'aiGrade: clamps an out-of-range score to 100')
  let threw = 0
  for (const bad of [fakeAI('not json at all'), fakeAI('{"feedback":"no score"}'), fakeAI(() => ({ error: { message: 'no key' } })), () => Promise.reject(new Error('offline'))]) {
    try { await loadLang('ru', bad).aiGrade({ question: 'q', modelAnswer: 'm', answer: 'a' }) } catch (_) { threw++ }
  }
  ok(threw === 4, 'aiGrade: rejects (so the page can show a friendly message) on unreadable reply / missing score / API error / offline')

  // ── IGCSE Y1: which challenges go to the AI marker ──
  const y1 = readFileSync(ROOT + '/lessons/igcse-y1.html', 'utf8')
  const h0 = y1.indexOf('// ── Answer-matching helpers'), hm = y1.slice(h0).match(/\r?\n\]\r?\n/)
  const { CHALLENGES: Y1 } = new Function(y1.slice(h0, h0 + hm.index + hm[0].indexOf(']') + 1) + '\nreturn { CHALLENGES }')()
  const fnSrc = y1.slice(y1.indexOf('function checkAnswer()'), y1.indexOf('function showHint()'))
  function y1run(ch, answer, mockContent) {
    const fbEl = { className: '', textContent: '' }, done = new Set(), calls = []
    const lang = loadLang('ru', fakeAI(mockContent, calls))
    const f = new Function('document', 'BFLang', 'CHALLENGES', 'getAnswer', 'getIdx', 'completed', 'renderPills', 'showToast', 'me', 'BF', 'LessonSaves', 'reportRealProgress', 'challengeStartedAt', 'markLessonComplete',
      fnSrc.replace(/activeIdx/g, 'getIdx()') + '\nreturn { checkAnswer, done: () => completed }')(
      { getElementById: () => fbEl }, lang, [ch], () => answer, () => 0, done, () => {}, () => {}, null, null, { save() {} }, () => {}, 0, () => {})
    return { rt: f, fbEl, done, calls }
  }
  const pickByType = t => Y1.find(c => c.type === t)
  for (const type of ['theory', 'identify', 'fill', 'complete']) {
    const ch = pickByType(type)
    const good = y1run(ch, 'Правильный развёрнутый ответ на русском языке', '{"score":90,"feedback":"Верно!"}')
    good.rt.checkAnswer(); await new Promise(r => setTimeout(r, 10))
    ok(good.calls.length === 1 && good.done.has(0), `igcse-y1 ${type}: a Russian answer is marked by the AI and a good one completes the challenge`)
    const bad = y1run(ch, 'Совсем неправильный ответ на русском языке', '{"score":10,"feedback":"Нет."}')
    bad.rt.checkAnswer(); await new Promise(r => setTimeout(r, 10))
    ok(bad.calls.length === 1 && !bad.done.has(0) && bad.fbEl.className.includes('err'), `igcse-y1 ${type}: a wrong Russian answer is rejected`)
  }
  for (const type of ['convert', 'trace']) {
    const ch = pickByType(type)
    const t = y1run(ch, 'двести четырнадцать', '{"score":100,"feedback":""}')
    t.rt.checkAnswer(); await new Promise(r => setTimeout(r, 10))
    ok(t.calls.length === 0 && !t.done.has(0), `igcse-y1 ${type}: numeric/trace answers never go to the AI (a spelled-out number is not accepted)`)
  }
  {
    const ch = pickByType('theory')
    const e = y1run(ch, 'The ALU does arithmetic', '{"score":100,"feedback":"x"}')
    e.rt.checkAnswer(); await new Promise(r => setTimeout(r, 10))
    ok(e.calls.length === 0, 'igcse-y1 theory: an English answer never calls the AI (unchanged keyword marking)')
    const off = y1run(pickByType('theory'), 'Ответ на русском языке про процессор', () => { throw new Error('x') })
    off.rt.checkAnswer(); await new Promise(r => setTimeout(r, 10))
    ok(!off.done.has(0) && /Could not check|Не удалось/.test(off.fbEl.textContent), 'igcse-y1 theory: if the marker is unreachable the student gets a clear message, not a false pass')
  }

  // ── IGCSE Y2: "fill" challenges run through the pseudocode editor+interpreter,
  // not a dedicated text box — the AI-marker fallback has to key off ch.type and
  // the raw editor code, not a separate getAnswer()/getIdx() pair like Y1's. ──
  const y2 = readFileSync(ROOT + '/lessons/igcse-y2.html', 'utf8')
  const h0y2 = y2.indexOf('const CHALLENGES='), hmy2 = y2.slice(h0y2).match(/\r?\nconst CHALLENGE_LESSON|\r?\nfunction /)
  const { CHALLENGES: Y2 } = new Function(y2.slice(h0y2, h0y2 + hmy2.index) + '\nreturn { CHALLENGES }')()
  const y2fnSrc = y2.slice(y2.indexOf('function validateChallenge(code,result){'), y2.indexOf('function showHint(){'))
  function y2run(ch, code, mockContent) {
    const outEl = { innerHTML: '', innerText: '' }
    const appendOut = (text) => { outEl.innerText += text + '\n' }
    const done = new Set(), calls = []
    const lang = loadLang('ru', fakeAI(mockContent, calls))
    const f = new Function('document', 'BFLang', 'CHALLENGES', 'activeIdx', 'completed', 'renderPills', 'showToast', 'me', 'BF', 'LessonSaves', 'reportRealProgress', 'challengeStartedAt', 'appendOut',
      y2fnSrc + '\nreturn { validateChallenge }')(
      { getElementById: () => outEl }, lang, [ch], 0, done, () => {}, () => {}, null, null, { save() {} }, () => {}, 0, appendOut)
    return { rt: f, outEl, done, calls }
  }
  const fillCh = Y2.find(c => c.type === 'fill')
  {
    const good = y2run(fillCh, 'индекс массива', '{"score":90,"feedback":"Верно!"}')
    good.rt.validateChallenge('индекс массива', null); await new Promise(r => setTimeout(r, 10))
    ok(good.calls.length === 1 && good.done.has(0), 'igcse-y2 fill: a Russian answer typed in the editor is marked by the AI and a good one completes the challenge')
    const bad = y2run(fillCh, 'банан', '{"score":5,"feedback":"Нет."}')
    bad.rt.validateChallenge('банан', null); await new Promise(r => setTimeout(r, 10))
    ok(bad.calls.length === 1 && !bad.done.has(0) && /✗/.test(bad.outEl.innerText), 'igcse-y2 fill: a wrong Russian answer is rejected')
    const en = y2run(fillCh, 'index', '{"score":100,"feedback":"x"}')
    en.rt.validateChallenge('index', null); await new Promise(r => setTimeout(r, 10))
    ok(en.calls.length === 0 && en.done.has(0), 'igcse-y2 fill: an English answer still passes via the original keyword check, never calling the AI')
    const off = y2run(fillCh, 'индекс массива', () => { throw new Error('x') })
    off.rt.validateChallenge('индекс массива', null); await new Promise(r => setTimeout(r, 10))
    ok(!off.done.has(0) && /Could not check|Не удалось/.test(off.outEl.innerText), 'igcse-y2 fill: if the marker is unreachable the student gets a clear message, not a false pass')
  }
  {
    // A real pseudocode-writing challenge (not type:'fill') must NEVER be routed
    // to the AI marker, even if the student's code happens to contain Cyrillic
    // (e.g. inside a string literal or comment) — code correctness stays code-checked.
    const codeCh = Y2.find(c => c.type !== 'fill' && c.type !== 'lesson')
    const r = y2run(codeCh, '// комментарий на русском\nOUTPUT 1', 'should never be called')
    r.rt.validateChallenge('// комментарий на русском\nOUTPUT 1', { output: ['wrong'] })
    ok(r.calls.length === 0, 'igcse-y2 non-fill: a real code challenge is never routed to the AI marker, even with Cyrillic in it')
  }

  // ── Grade 9: Unit 1 theory ("lesson" + "fill" challenges) — same pattern as
  // igcse-y2's fill-through-the-editor AI marker fallback. ──
  const g9 = readFileSync(ROOT + '/lessons/grade9.html', 'utf8')
  const h0g9 = g9.indexOf('const CHALLENGES = ['), hmg9 = g9.slice(h0g9).match(/\r?\n\]\r?\n/)
  const { CHALLENGES: G9 } = new Function(g9.slice(h0g9, h0g9 + hmg9.index + hmg9[0].indexOf(']') + 1) + '\nreturn { CHALLENGES }')()
  const g9fnSrc = g9.slice(g9.indexOf('function validateChallenge(code, result) {'), g9.indexOf('function showHint() {'))
  function g9run(ch, mockContent) {
    const outEl = { innerHTML: '', innerText: '' }
    const appendOut = (text) => { outEl.innerText += text + '\n' }
    const done = new Set(), calls = []
    const lang = loadLang('ru', fakeAI(mockContent, calls))
    const f = new Function('document', 'BFLang', 'CHALLENGES', 'activeIdx', 'completed', 'renderPills', 'showToast', 'me', 'BF', 'LessonSaves', 'reportRealProgress', 'challengeStartedAt', 'appendOut',
      g9fnSrc + '\nreturn { validateChallenge }')(
      { getElementById: () => outEl }, lang, [ch], 0, done, () => {}, () => {}, null, null, { save() {} }, () => {}, 0, appendOut)
    return { rt: f, outEl, done, calls }
  }
  const g9FillCh = G9.find(c => c.type === 'fill')
  {
    const good = g9run(g9FillCh, '{"score":90,"feedback":"Верно!"}')
    good.rt.validateChallenge('аналитическая машина', null); await new Promise(r => setTimeout(r, 10))
    ok(good.calls.length === 1 && good.done.has(0), 'grade9 fill: a Russian answer typed in the editor is marked by the AI and a good one completes the challenge')
    const bad = g9run(g9FillCh, '{"score":5,"feedback":"Нет."}')
    bad.rt.validateChallenge('банан', null); await new Promise(r => setTimeout(r, 10))
    ok(bad.calls.length === 1 && !bad.done.has(0) && /✗/.test(bad.outEl.innerText), 'grade9 fill: a wrong Russian answer is rejected')
    const en = g9run(g9FillCh, '{"score":100,"feedback":"x"}')
    en.rt.validateChallenge('Analytical', null); await new Promise(r => setTimeout(r, 10))
    ok(en.calls.length === 0 && en.done.has(0), 'grade9 fill: an English answer still passes via the original keyword check, never calling the AI')
    const off = g9run(g9FillCh, () => { throw new Error('x') })
    off.rt.validateChallenge('аналитическая машина', null); await new Promise(r => setTimeout(r, 10))
    ok(!off.done.has(0) && /Could not check|Не удалось/.test(off.outEl.innerText), 'grade9 fill: if the marker is unreachable the student gets a clear message, not a false pass')
  }
  {
    // A real pseudocode-writing challenge must never be routed to the AI
    // marker, even with Cyrillic in a comment.
    const g9CodeCh = G9.find(c => c.type !== 'fill' && c.type !== 'lesson')
    const r = g9run(g9CodeCh, 'should never be called')
    r.rt.validateChallenge('// комментарий на русском\nOUTPUT 1', { output: ['wrong'] })
    ok(r.calls.length === 0, 'grade9 non-fill: a real code challenge is never routed to the AI marker, even with Cyrillic in it')
  }

  // ── AS / A Level: THEORY_EXERCISES short answers ──
  for (const page of ['as-level', 'a-level']) {
    const html = readFileSync(ROOT + `/lessons/${page}.html`, 'utf8')
    const sliceFn = name => { const i = html.indexOf(name); const j = html.indexOf('\nfunction ', i + 10); return html.slice(i, j) }
    const src = sliceFn('async function gradeForeignTheory') + '\n' + sliceFn('function escapeHtml') + '\n' + sliceFn('function checkTheoryShort')
    const ex = { id: 't1', title: 'Stack vs Queue', q: 'Compare a stack and a queue.', ms: 'A stack is LIFO. A queue is FIFO.', keywords: ['lifo', 'fifo'] }
    function short(answer, mock, lang = 'ru') {
      const calls = [], fb = { className: '', style: {}, textContent: '', innerHTML: '' }
      const inp = { value: answer }
      const doc = { getElementById: id => (id.startsWith('tinput') ? inp : fb) }
      const fn = new Function('document', 'BFLang', 'THEORY_EXERCISES', 'detectVsTerms', 'buildVsSideMap', 'splitClauses', 'containsWordAware', 'mentionsVsTerm',
        src + '\nreturn checkTheoryShort')(doc, loadLang(lang, fakeAI(mock, calls)), [ex], () => null, () => null, () => [], () => false, () => false)
      return { run: () => fn({ stopPropagation() {} }, 't1'), fb, calls }
    }
    const good = short('Стек работает по принципу LIFO, очередь — по принципу FIFO', '{"score":92,"feedback":"Отлично."}')
    good.run(); await new Promise(r => setTimeout(r, 10))
    ok(good.calls.length === 1 && good.fb.className.includes('correct'), `${page} short answer: a Russian answer is marked by the AI (92% shown as correct)`)
    const bad = short('Стек — это такая штука', '{"score":15,"feedback":"Не хватает."}')
    bad.run(); await new Promise(r => setTimeout(r, 10))
    ok(bad.fb.className.includes('wrong'), `${page} short answer: a weak Russian answer is shown as wrong`)
    const en = short('A stack is LIFO and a queue is FIFO', '{"score":100,"feedback":"x"}', 'en')
    en.run(); await new Promise(r => setTimeout(r, 10))
    ok(en.calls.length === 0, `${page} short answer: an English answer still uses the keyword scorer (AI not called)`)

    // practice-section question cards (the "Check My Answers" button)
    const cardSrc = sliceFn('async function gradeForeignCard')
    for (const [score, cls] of [[90, 'fb-good'], [50, 'fb-partial'], [10, 'fb-miss']]) {
      const calls = []
      const header = { after(el) { header.fb = el } }
      const card = { querySelector: sel => (sel === '.answer-feedback' ? null : sel === '.question-card-header' ? header
        : sel === '.q-stem' ? { textContent: 'Explain LIFO.' } : sel === '.ms-body' ? { textContent: 'Last in first out.' } : null) }
      const g = new Function('document', 'BFLang', cardSrc + '\nreturn gradeForeignCard')({ createElement: () => ({ className: '', textContent: '' }) },
        loadLang('ru', fakeAI(JSON.stringify({ score, feedback: 'Комментарий.' }), calls)))
      await g(card, 'Последним пришёл — первым вышел')
      ok(header.fb.className.includes(cls) && calls.length === 1, `${page} practice card: AI score ${score} is shown as ${cls}`)
    }
  }
}

console.log(`\n${pass} passed, ${fail} failed.`)
if (fail > 0) process.exit(1)
console.log('quiz answers work in English and Russian; dropdown values never change; code stays English')
