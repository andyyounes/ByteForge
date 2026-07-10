/**
 * LessonQuest — turns a rendered ByteForge lesson into an active mini-quest.
 *
 * Steps (auto-detected from the lesson DOM):
 *   🎬 Watch → 🔑 Terms → 📚 Theory → 💡 Example → ✏️ Practice → 🏁 Boss
 *
 * - Sticky tracker bar at the top of the lesson; nodes pop as they complete
 * - Key terms become tap-to-reveal cards (reveal all = step done)
 * - "✓ Got it" checkpoints after theory and the worked example
 * - "✅ I watched it" under the videos
 * - Practice completes via the page's own Check Answers (markStep hook)
 * - Boss = the page's Mark Complete → celebration overlay + Next Topic chain
 * - Every first-time step awards +5 XP through the page's onXP callback
 *
 * Page wiring:
 *   LessonQuest.attach({ pageKey, topicId, container, alreadyDone,
 *                        nextId, onOpenNext(id), onXP(amount, label) })
 *   LessonQuest.markStep(topicId, 'practice')   // from checkAnswers
 *   LessonQuest.boss(topicId)                   // from completeTopic
 *   LessonQuest.totalXP(pageKey)                // for the page's XP bar
 */
const LessonQuest = (() => {
  'use strict'
  let cfg = null
  let styled = false

  const STEP_META = {
    watch:    { icon: '🎬', label: 'Watch' },
    terms:    { icon: '🔑', label: 'Terms' },
    theory:   { icon: '📚', label: 'Theory' },
    example:  { icon: '💡', label: 'Example' },
    practice: { icon: '✏️', label: 'Practice' },
    boss:     { icon: '🏁', label: 'Finish' },
  }

  function key(pageKey, topicId) { return 'bf-lq-' + pageKey + '-' + topicId }
  function load(pageKey, topicId) {
    try { return JSON.parse(localStorage.getItem(key(pageKey, topicId))) || { steps: {} } }
    catch (e) { return { steps: {} } }
  }
  function save(pageKey, topicId, state) {
    try { localStorage.setItem(key(pageKey, topicId), JSON.stringify(state)) } catch (e) {}
  }

  function ensureStyles() {
    if (styled) return
    styled = true
    const css = `
      .lq-bar { position:sticky; top:0; z-index:6; display:flex; align-items:center; gap:4px;
                background:rgba(13,15,26,.94); backdrop-filter:blur(6px); border:1px solid rgba(255,255,255,.09);
                border-radius:12px; padding:8px 12px; margin-bottom:16px; overflow-x:auto; }
      .lq-step { display:flex; align-items:center; gap:5px; padding:4px 10px; border-radius:99px; flex-shrink:0;
                 font-size:11px; font-weight:800; color:#6b7280; border:1px solid rgba(255,255,255,.08);
                 background:#161927; transition:.2s; }
      .lq-step.done { color:#4ade80; border-color:rgba(74,222,128,.4); background:rgba(74,222,128,.08); }
      .lq-step.pop { animation:lqPop .5s cubic-bezier(.34,1.56,.64,1); }
      @keyframes lqPop { 0%{transform:scale(1)} 40%{transform:scale(1.25)} 100%{transform:scale(1)} }
      .lq-sep { color:#3c4157; font-size:11px; flex-shrink:0; }
      .lq-xp { margin-left:auto; font-size:10.5px; font-weight:900; color:#fbbf24; white-space:nowrap; padding-left:8px; }
      .lq-gotit { display:block; margin:10px 0 18px; padding:9px 20px; border-radius:10px; cursor:pointer;
                  font-size:12.5px; font-weight:800; border:1px solid rgba(74,222,128,.35);
                  background:rgba(74,222,128,.1); color:#4ade80; transition:.15s; }
      .lq-gotit:hover { background:rgba(74,222,128,.22); transform:translateY(-1px); }
      .lq-gotit.claimed { opacity:.5; cursor:default; transform:none; }
      .lq-term-hint { font-size:10.5px; color:#a78bfa; font-weight:700; margin:-4px 0 10px; }
      .lq-hidden-def { filter:blur(6px); user-select:none; transition:filter .25s; }
      .lq-term-clickable { cursor:pointer; }
      .lq-term-clickable:hover { border-color:rgba(167,139,250,.5) !important; }
      .lq-revealed { animation:lqPop .4s; }
      .lq-next-btn { padding:11px 26px; border:none; border-radius:11px; font-size:14px; font-weight:800;
                     cursor:pointer; background:linear-gradient(135deg,#7c3aed,#a855f7); color:#fff; margin:0 5px; }
      .lq-stay-btn { background:none; border:1px solid rgba(255,255,255,.18); color:#9ca3af;
                     padding:11px 18px; border-radius:11px; font-size:13px; cursor:pointer; }
    `
    const el = document.createElement('style')
    el.textContent = css
    document.head.appendChild(el)
  }

  function stepsFor(container) {
    const steps = []
    if (container.querySelector('.video-section')) steps.push('watch')
    if (container.querySelector('.key-term-card')) steps.push('terms')
    if (container.querySelector('.theory-block')) steps.push('theory')
    if (container.querySelector('.example-block')) steps.push('example')
    if (container.querySelector('.question-card')) steps.push('practice')
    steps.push('boss')
    return steps
  }

  function renderBar() {
    const bar = document.getElementById('lq-bar')
    if (!bar || !cfg) return
    const state = load(cfg.pageKey, cfg.topicId)
    const earned = Object.keys(state.steps).length * 5
    bar.innerHTML = cfg.steps.map((s, i) => {
      const done = cfg.alreadyDone || !!state.steps[s]
      return (i > 0 ? '<span class="lq-sep">›</span>' : '')
        + '<span class="lq-step' + (done ? ' done' : '') + '" id="lq-step-' + s + '">'
        + STEP_META[s].icon + ' ' + STEP_META[s].label + (done ? ' ✓' : '') + '</span>'
    }).join('') + '<span class="lq-xp">+5 XP each · ' + earned + ' earned</span>'
  }

  function mark(step) {
    if (!cfg || cfg.steps.indexOf(step) === -1) return
    const state = load(cfg.pageKey, cfg.topicId)
    if (state.steps[step]) return       // already earned
    state.steps[step] = 1
    save(cfg.pageKey, cfg.topicId, state)
    renderBar()
    const node = document.getElementById('lq-step-' + step)
    if (node) { node.classList.add('pop') }
    if (cfg.onXP && step !== 'boss') cfg.onXP(5, STEP_META[step].label)
  }

  return {
    attach(config) {
      ensureStyles()
      cfg = config
      const c = cfg.container
      cfg.steps = stepsFor(c)
      const state = load(cfg.pageKey, cfg.topicId)

      // ── Tracker bar (inside the lesson pane, above everything) ─────────────
      const lessonPane = c.querySelector('.topic-pane') || c
      const bar = document.createElement('div')
      bar.className = 'lq-bar'
      bar.id = 'lq-bar'
      lessonPane.insertBefore(bar, lessonPane.firstChild)
      renderBar()

      // ── Videos → "I watched it" ────────────────────────────────────────────
      const vid = c.querySelector('.video-section')
      if (vid && cfg.steps.indexOf('watch') !== -1) {
        const b = document.createElement('button')
        b.className = 'lq-gotit' + (state.steps.watch || cfg.alreadyDone ? ' claimed' : '')
        b.textContent = state.steps.watch || cfg.alreadyDone ? '✅ Watched' : '✅ I watched it — claim +5 XP'
        b.onclick = function () { mark('watch'); b.classList.add('claimed'); b.textContent = '✅ Watched' }
        vid.appendChild(b)
      }

      // ── Key terms → tap-to-reveal cards ────────────────────────────────────
      const cards = c.querySelectorAll('.key-term-card')
      if (cards.length && cfg.steps.indexOf('terms') !== -1) {
        const grid = c.querySelector('.key-terms-grid')
        const done = state.steps.terms || cfg.alreadyDone
        if (grid && !done) {
          const hint = document.createElement('div')
          hint.className = 'lq-term-hint'
          hint.textContent = '🔮 Guess each definition, then tap the card to reveal it. Reveal all to claim +5 XP.'
          grid.parentNode.insertBefore(hint, grid)
        }
        let revealed = 0
        cards.forEach(card => {
          const def = card.querySelector('.key-term-def')
          if (!def) { revealed++; return }
          if (done) return    // leave readable
          def.classList.add('lq-hidden-def')
          card.classList.add('lq-term-clickable')
          card.addEventListener('click', function onTap() {
            if (!def.classList.contains('lq-hidden-def')) return
            def.classList.remove('lq-hidden-def')
            card.classList.add('lq-revealed')
            card.classList.remove('lq-term-clickable')
            revealed++
            if (revealed >= cards.length) mark('terms')
          })
        })
      }

      // ── Theory + Example → "Got it" checkpoints ────────────────────────────
      const addGotIt = (selector, step, label) => {
        const el = c.querySelector(selector)
        if (!el || cfg.steps.indexOf(step) === -1) return
        const b = document.createElement('button')
        const done = state.steps[step] || cfg.alreadyDone
        b.className = 'lq-gotit' + (done ? ' claimed' : '')
        b.textContent = done ? '✓ Got it' : label
        b.onclick = function () { mark(step); b.classList.add('claimed'); b.textContent = '✓ Got it' }
        el.parentNode.insertBefore(b, el.nextSibling)
      }
      addGotIt('.theory-block', 'theory', '✓ Got it — I read the theory (+5 XP)')
      addGotIt('.example-block', 'example', '✓ Got it — the example makes sense (+5 XP)')
    },

    markStep(topicId, step) {
      if (cfg && cfg.topicId === topicId) mark(step)
    },

    boss(topicId) {
      if (!cfg || cfg.topicId !== topicId) return
      mark('boss')
      // Celebration overlay (reuses the page's xp-burst styles)
      const old = document.getElementById('lq-celebrate')
      if (old) old.remove()
      const ov = document.createElement('div')
      ov.id = 'lq-celebrate'
      ov.className = 'xp-burst-overlay'
      let stars = ''
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * 360, d = 80 + Math.random() * 60
        stars += '<div class="xp-burst-star" style="width:' + (6 + Math.floor(Math.random() * 6)) + 'px;height:'
          + (6 + Math.floor(Math.random() * 6)) + 'px;background:' + ['#a78bfa','#e879f9','#fbbf24','#34d399','#60a5fa'][i % 5]
          + ';--sx:' + (Math.cos(a * Math.PI / 180) * d) + 'px;--sy:' + (Math.sin(a * Math.PI / 180) * d)
          + 'px;animation-delay:' + (Math.random() * 0.15).toFixed(2) + 's;"></div>'
      }
      const av = (typeof _BFW_AV !== 'undefined') ? '<span class="xp-burst-icon xp-burst-bot">' + _BFW_AV + '</span>' : '<span class="xp-burst-icon">🏆</span>'
      ov.innerHTML = stars
        + '<div class="xp-burst-card">' + av
        + '<div class="xp-burst-amount">+100 XP</div>'
        + '<div class="xp-burst-label">Topic Complete!</div>'
        + '<div class="xp-burst-exname">Every step conquered.</div>'
        + '<div style="margin-top:6px;">'
        + (cfg.nextId ? '<button class="lq-next-btn" id="lq-next">Next topic →</button>' : '')
        + '<button class="lq-stay-btn" id="lq-stay">Stay here</button></div>'
        + '</div>'
      document.body.appendChild(ov)
      const kill = () => ov.remove()
      const nextBtn = document.getElementById('lq-next')
      if (nextBtn) nextBtn.onclick = () => { kill(); if (cfg.onOpenNext) cfg.onOpenNext(cfg.nextId) }
      document.getElementById('lq-stay').onclick = kill
    },

    totalXP(pageKey) {
      let xp = 0
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i)
          if (k && k.indexOf('bf-lq-' + pageKey + '-') === 0) {
            const st = JSON.parse(localStorage.getItem(k))
            // boss step's XP is the topic-completion 100, counted by the page
            const steps = Object.keys((st && st.steps) || {}).filter(s => s !== 'boss')
            xp += steps.length * 5
          }
        }
      } catch (e) {}
      return xp
    },
  }
})()
