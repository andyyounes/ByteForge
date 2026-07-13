/**
 * LessonQuest v2 — turns a rendered ByteForge lesson into an active mini-game.
 *
 *  ┌────────────────────────────────────────────────────────────┐
 *  │ 🤖──🎬──🔑──📚──💡──⚔️──🎁   quest path with walking mascot │
 *  └────────────────────────────────────────────────────────────┘
 *  🔑 Key terms  → MATCH-UP mini-game (pair each term with its definition)
 *  ⚔️ Practice   → BOSS FIGHT: the chapter boss has HP; every good answer
 *                  from Check Answers deals damage. Beat it for ★★★.
 *  🎁 Finish     → Mark Complete opens the chest: celebration + Next Topic.
 *  Every first-time step pays +5 XP. Stars appear on the Journey map.
 *
 * Page wiring (unchanged from v1):
 *   LessonQuest.attach({ pageKey, topicId, container, alreadyDone,
 *                        nextId, onOpenNext(id), onXP(amount, label) })
 *   LessonQuest.markStep(topicId, 'practice')   // from checkAnswers
 *   LessonQuest.boss(topicId)                   // from completeTopic
 *   LessonQuest.totalXP(pageKey)                // for the page's XP bar
 *   LessonQuest.stars(pageKey, topicId)         // 0–3 for the Journey map
 */
const LessonQuest = (() => {
  'use strict'
  let cfg = null
  let styled = false

  const STEP_META = {
    watch:    { icon: '🎬', label: 'Watch' },
    terms:    { icon: '🔑', label: 'Match-Up' },
    theory:   { icon: '📚', label: 'Theory' },
    example:  { icon: '💡', label: 'Example' },
    practice: { icon: '⚔️', label: 'Boss Fight' },
    boss:     { icon: '🎁', label: 'Chest' },
  }
  const BOSSES = ['👾','🐉','🦑','🤖','👹','🦖','🐙','💀','🛸','🧟','🦂','🕷️','😈','🧌']

  function key(pk, id) { return 'bf-lq-' + pk + '-' + id }
  function load(pk, id) {
    try { return JSON.parse(localStorage.getItem(key(pk, id))) || { steps: {} } }
    catch (e) { return { steps: {} } }
  }
  function save(pk, id, st) { try { localStorage.setItem(key(pk, id), JSON.stringify(st)) } catch (e) {} }

  function ensureStyles() {
    if (styled) return
    styled = true
    const css = `
      /* ── Quest path ─────────────────────────────────────────────── */
      .lq-bar { position:sticky; top:0; z-index:6; background:rgba(13,15,26,.96); backdrop-filter:blur(8px);
                border:1px solid rgba(255,255,255,.09); border-radius:14px; padding:14px 16px 10px;
                margin-bottom:18px; overflow-x:auto; }
      .lq-track { position:relative; display:flex; justify-content:space-between; align-items:flex-start;
                  min-width:340px; padding:14px 10px 0; }
      .lq-line { position:absolute; top:32px; left:28px; right:28px; height:5px; border-radius:99px;
                 background:#232738; overflow:hidden; }
      .lq-fill { height:100%; width:0%; border-radius:99px; transition:width .8s cubic-bezier(.4,0,.2,1);
                 background:linear-gradient(90deg,#4ade80,#fbbf24,#e879f9); background-size:200% 100%;
                 animation:lqShimmer 3s linear infinite; }
      @keyframes lqShimmer { 0%{background-position:0 0} 100%{background-position:200% 0} }
      .lq-node { position:relative; z-index:1; display:flex; flex-direction:column; align-items:center;
                 gap:4px; cursor:default; min-width:52px; }
      .lq-orb { width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center;
                font-size:17px; background:#1e2233; border:3px solid #2b3044; transition:.25s; }
      .lq-node.done .lq-orb { border-color:#86efac; background:linear-gradient(145deg,#16a34a,#4ade80);
                              box-shadow:0 0 14px rgba(74,222,128,.5), inset 0 -3px 6px rgba(0,0,0,.25); }
      .lq-node.now .lq-orb { border-color:#f0abfc; background:linear-gradient(145deg,#a21caf,#e879f9);
                             box-shadow:inset 0 -3px 6px rgba(0,0,0,.25);
                             animation:lqGlow 1.8s ease-in-out infinite; }
      @keyframes lqGlow { 0%,100%{box-shadow:0 0 0 0 rgba(232,121,249,.5)} 50%{box-shadow:0 0 0 9px rgba(232,121,249,0)} }
      .lq-node.pop .lq-orb { animation:lqPop .55s cubic-bezier(.34,1.56,.64,1); }
      @keyframes lqPop { 0%{transform:scale(1)} 45%{transform:scale(1.4) rotate(8deg)} 100%{transform:scale(1)} }
      .lq-nlabel { font-size:9px; font-weight:800; color:#6b7280; white-space:nowrap; }
      .lq-node.done .lq-nlabel { color:#4ade80; }
      .lq-node.now .lq-nlabel { color:#e879f9; }
      .lq-ava { position:absolute; top:-26px; left:50%; transform:translateX(-50%); width:30px; height:30px;
                animation:lqBob 1.6s ease-in-out infinite; pointer-events:none; }
      .lq-ava svg { width:30px; height:30px; }
      @keyframes lqBob { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(-5px)} }
      .lq-meta { display:flex; justify-content:space-between; align-items:center; margin-top:8px;
                 font-size:10.5px; font-weight:800; color:#6b7280; }
      .lq-meta b { color:#fbbf24; }
      .lq-stars { color:#fbbf24; letter-spacing:1px; }
      /* ── Buttons & confetti ─────────────────────────────────────── */
      .lq-gotit { display:block; margin:10px 0 18px; padding:9px 20px; border-radius:10px; cursor:pointer;
                  font-size:12.5px; font-weight:800; border:1px solid rgba(74,222,128,.35);
                  background:rgba(74,222,128,.1); color:#4ade80; transition:.15s; }
      .lq-gotit:hover { background:rgba(74,222,128,.22); transform:translateY(-1px); }
      .lq-gotit.claimed { opacity:.5; cursor:default; transform:none; }
      .lq-conf { position:fixed; z-index:9999; font-size:14px; pointer-events:none;
                 animation:lqConf .9s ease-out forwards; }
      @keyframes lqConf { 0%{opacity:1; transform:translate(0,0) rotate(0)}
                          100%{opacity:0; transform:translate(var(--cx),var(--cy)) rotate(280deg)} }
      /* ── Match-Up mini-game ─────────────────────────────────────── */
      .lq-match { border:1px solid rgba(167,139,250,.25); border-radius:14px; padding:14px 16px;
                  background:rgba(124,58,237,.05); margin-bottom:14px; }
      .lq-match-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
      .lq-match-title { font-size:12.5px; font-weight:900; color:#c4b5fd; }
      .lq-match-score { font-size:10.5px; font-weight:800; color:#fbbf24; }
      .lq-match-grid { display:grid; grid-template-columns:minmax(110px,1fr) 2fr; gap:8px; }
      .lq-chip { border:1.5px solid rgba(255,255,255,.12); border-radius:10px; padding:8px 11px; cursor:pointer;
                 font-size:11.5px; line-height:1.45; background:#161927; transition:.15s; user-select:none; }
      .lq-chip:hover { border-color:rgba(167,139,250,.55); }
      .lq-chip.sel { border-color:#e879f9; background:rgba(232,121,249,.12);
                     box-shadow:0 0 10px rgba(232,121,249,.25); }
      .lq-chip.ok { border-color:#4ade80; background:rgba(74,222,128,.1); color:#9ca3af; cursor:default;
                    animation:lqPop .4s; }
      .lq-chip.ok:hover { border-color:#4ade80; }
      .lq-chip.bad { animation:lqShake .35s; border-color:#f87171; }
      @keyframes lqShake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
      .lq-chip b { color:#e879f9; font-size:11.5px; }
      /* ── Boss fight ─────────────────────────────────────────────── */
      .lq-boss { border:1px solid rgba(248,113,113,.3); border-radius:14px; padding:13px 16px;
                 background:linear-gradient(160deg, rgba(248,113,113,.07), rgba(0,0,0,0)); margin-bottom:12px;
                 position:relative; overflow:hidden; }
      .lq-boss-row { display:flex; align-items:center; gap:12px; }
      .lq-boss-face { font-size:34px; line-height:1; filter:drop-shadow(0 0 10px rgba(248,113,113,.45));
                      animation:lqBob 2.2s ease-in-out infinite; }
      .lq-boss.hit .lq-boss-face { animation:lqShake .4s; filter:drop-shadow(0 0 14px rgba(251,191,36,.8)); }
      .lq-boss.dead .lq-boss-face { transform:rotate(180deg); opacity:.35; filter:grayscale(1); animation:none; }
      .lq-boss-name { font-size:12.5px; font-weight:900; color:#fca5a5; }
      .lq-boss-tip { font-size:10.5px; color:#9ca3af; margin-top:2px; }
      .lq-hp { height:13px; border-radius:99px; background:#232738; margin-top:7px; overflow:hidden;
               border:1px solid rgba(255,255,255,.08); }
      .lq-hp-fill { height:100%; width:100%; border-radius:99px; background:linear-gradient(90deg,#ef4444,#f87171);
                    transition:width 1s cubic-bezier(.4,0,.2,1); }
      .lq-dmg { position:absolute; font-size:15px; font-weight:900; color:#fbbf24; pointer-events:none;
                animation:lqDmg 1.1s ease-out forwards; text-shadow:0 2px 6px rgba(0,0,0,.6); }
      @keyframes lqDmg { 0%{opacity:1; transform:translateY(0) scale(1)}
                         100%{opacity:0; transform:translateY(-38px) scale(1.35)} }
      .lq-boss-result { margin-top:9px; font-size:12px; font-weight:800; }
      /* ── Watch tracking ─────────────────────────────────────────── */
      .lq-watch { display:flex; align-items:center; gap:9px; margin:10px 0 6px; padding:9px 14px;
                  border-radius:10px; border:1px solid rgba(96,165,250,.3); background:rgba(96,165,250,.07);
                  font-size:11.5px; font-weight:800; color:#93c5fd; }
      .lq-watch.ok { border-color:rgba(74,222,128,.4); background:rgba(74,222,128,.08); color:#4ade80; }
      .lq-watch-bar { flex:1; height:7px; border-radius:99px; background:#232738; overflow:hidden; }
      .lq-watch-fill { height:100%; width:0%; background:linear-gradient(90deg,#60a5fa,#4ade80);
                       border-radius:99px; transition:width .6s; }
      /* ── Micro-check (prove-it question) ────────────────────────── */
      .lq-check { border:1px solid rgba(251,191,36,.3); border-radius:12px; padding:12px 15px;
                  background:rgba(251,191,36,.05); margin:10px 0 18px; }
      .lq-check-title { font-size:10.5px; font-weight:900; letter-spacing:1px; color:#fbbf24; margin-bottom:7px; }
      .lq-check-q { font-size:12.5px; line-height:1.5; margin-bottom:9px; }
      .lq-check-opts { display:flex; flex-direction:column; gap:6px; }
      /* ── Checkpoint quiz overlay ────────────────────────────────── */
      .lq-quiz { position:fixed; inset:0; z-index:8600; background:rgba(9,10,18,.9); backdrop-filter:blur(6px);
                 display:flex; align-items:center; justify-content:center; padding:18px; }
      .lq-quiz-card { width:min(480px,100%); max-height:88vh; overflow-y:auto; background:#12141f;
                      border:1px solid rgba(96,165,250,.35); border-radius:18px; padding:22px 24px;
                      box-shadow:0 24px 80px rgba(0,0,0,.6); animation:lqPop .4s; }
      .lq-quiz-title { font-size:17px; font-weight:900; }
      .lq-quiz-sub { font-size:11.5px; color:#9ca3af; margin-top:4px; line-height:1.5; }
      .lq-quiz-prog { display:flex; gap:5px; margin:13px 0; }
      .lq-quiz-dot { flex:1; height:6px; border-radius:99px; background:#232738; }
      .lq-quiz-dot.ok { background:#4ade80; }
      .lq-quiz-dot.bad { background:#f87171; }
      .lq-quiz-dot.cur { background:#60a5fa; animation:lqGlow 1.5s infinite; }
      .lq-quiz-q { font-size:13.5px; line-height:1.55; margin:12px 0; font-weight:600; }
      .lq-quiz-x { float:right; background:none; border:none; color:#6b7280; font-size:16px; cursor:pointer; }
      .lq-next-btn { padding:11px 26px; border:none; border-radius:11px; font-size:14px; font-weight:800;
                     cursor:pointer; background:linear-gradient(135deg,#7c3aed,#a855f7); color:#fff; margin:0 5px; }
      .lq-stay-btn { background:none; border:1px solid rgba(255,255,255,.18); color:#9ca3af;
                     padding:11px 18px; border-radius:11px; font-size:13px; cursor:pointer; }
    `
    const el = document.createElement('style')
    el.textContent = css
    document.head.appendChild(el)
  }

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;') }
  function shuffle(a) { return a.slice().sort(() => Math.random() - 0.5) }

  // Key term {name, def} pairs read straight from the rendered lesson
  function readTerms(c) {
    return Array.from(c.querySelectorAll('.key-term-card')).map(card => ({
      name: ((card.querySelector('.key-term-name') || {}).textContent || '').trim(),
      def: ((card.querySelector('.key-term-def') || {}).textContent || '').trim(),
    })).filter(p => p.name && p.def)
  }

  // ── 🎬 Real watch tracking via the YouTube IFrame API ──────────────────────
  let _ytUid = 0, _ytGen = 0, _ytTimer = null, _ytLoad = null
  function loadYT() {
    if (window.YT && window.YT.Player) return Promise.resolve()
    if (_ytLoad) return _ytLoad
    _ytLoad = new Promise((resolve, reject) => {
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => { if (prev) prev(); resolve() }
      const s = document.createElement('script')
      s.src = 'https://www.youtube.com/iframe_api'
      s.onerror = reject
      document.head.appendChild(s)
      setTimeout(() => reject(new Error('yt timeout')), 10000)
    })
    return _ytLoad
  }

  function setupWatch(c) {
    const vid = c.querySelector('.video-section')
    if (!vid) return
    const gen = ++_ytGen
    if (_ytTimer) { clearInterval(_ytTimer); _ytTimer = null }

    const chip = document.createElement('div')
    chip.className = 'lq-watch'
    vid.appendChild(chip)
    if (isDone('watch')) {
      chip.classList.add('ok')
      chip.innerHTML = '✓ Watched — step cleared'
      return
    }
    chip.innerHTML = '🎬 Watch a video (80%) to clear this step '
      + '<span class="lq-watch-bar"><span class="lq-watch-fill" id="lq-wfill"></span></span><b id="lq-wpct">0%</b>'

    // Honor-system fallback ONLY if tracking can't work (YouTube blocked etc.)
    const fallback = () => {
      if (gen !== _ytGen || isDone('watch')) return
      chip.innerHTML = ''
      const b = document.createElement('button')
      b.className = 'lq-gotit'
      b.style.margin = '0'
      b.textContent = '✅ I watched it (+5 XP)'
      b.onclick = () => { mark('watch'); chip.classList.add('ok'); chip.innerHTML = '✓ Watched — step cleared' }
      chip.appendChild(b)
    }

    const frames = Array.from(vid.querySelectorAll('iframe')).filter(f => /youtube\.com\/embed\//.test(f.src))
    if (!frames.length) { fallback(); return }
    frames.forEach(f => {
      try {
        const u = new URL(f.src)
        u.searchParams.set('enablejsapi', '1')
        u.searchParams.set('origin', location.origin)
        f.src = u.toString()
      } catch (e) {}
      if (!f.id) f.id = 'lq-yt-' + (++_ytUid)
    })

    let sawDuration = false
    loadYT().then(() => {
      if (gen !== _ytGen) return
      const players = frames.map(f => { try { return new YT.Player(f.id) } catch (e) { return null } }).filter(Boolean)
      if (!players.length) { fallback(); return }
      let best = 0
      _ytTimer = setInterval(() => {
        if (gen !== _ytGen) { clearInterval(_ytTimer); return }
        players.forEach(p => {
          try {
            const d = p.getDuration(), t = p.getCurrentTime()
            if (d > 0) { sawDuration = true; best = Math.max(best, t / d) }
          } catch (e) {}
        })
        const pct = Math.min(100, Math.round(best * 125))   // 80% watched = 100% of the step
        const f = document.getElementById('lq-wfill'), l = document.getElementById('lq-wpct')
        if (f) f.style.width = pct + '%'
        if (l) l.textContent = pct + '%'
        if (best >= 0.8) {
          clearInterval(_ytTimer); _ytTimer = null
          mark('watch')
          chip.classList.add('ok')
          chip.innerHTML = '✓ Watched — step cleared! +5 XP'
        }
      }, 3000)
    }).catch(fallback)
    // If YouTube never reports a duration (blocked network / no play), offer the fallback
    setTimeout(() => { if (gen === _ytGen && !sawDuration && !isDone('watch')) fallback() }, 45000)
  }

  // ── 📚💡 Micro-check: prove it with one quick question ─────────────────────
  function buildCheck(c, step, anchorSel, mode) {
    const el = c.querySelector(anchorSel)
    if (!el || cfg.steps.indexOf(step) === -1) return
    if (isDone(step)) {
      const chip = document.createElement('div')
      chip.className = 'lq-watch ok'
      chip.style.margin = '10px 0 18px'
      chip.textContent = '✓ ' + STEP_META[step].label + ' check cleared'
      el.parentNode.insertBefore(chip, el.nextSibling)
      return
    }
    const pairs = readTerms(c)
    if (pairs.length < 2) {
      // Not enough material for a question — keep the simple claim button
      const b = document.createElement('button')
      b.className = 'lq-gotit'
      b.textContent = '✓ Got it (+5 XP)'
      b.onclick = () => { mark(step); b.classList.add('claimed'); b.textContent = '✓ Got it' }
      el.parentNode.insertBefore(b, el.nextSibling)
      return
    }
    const box = document.createElement('div')
    box.className = 'lq-check'
    el.parentNode.insertBefore(box, el.nextSibling)
    const ask = () => {
      const target = pairs[Math.floor(Math.random() * pairs.length)]
      const others = shuffle(pairs.filter(p => p.name !== target.name)).slice(0, 3)
      const opts = shuffle([target, ...others])
      const q = mode === 'term'
        ? 'Which key term matches: <em>“' + esc(target.def) + '”</em>'
        : 'What does <b>' + esc(target.name) + '</b> mean?'
      box.innerHTML = '<div class="lq-check-title">⚡ QUICK CHECK — prove it (+5 XP)</div>'
        + '<div class="lq-check-q">' + q + '</div><div class="lq-check-opts">'
        + opts.map((o, i) => '<div class="lq-chip" data-i="' + i + '">'
          + esc(mode === 'term' ? o.name : (o.def.length > 150 ? o.def.slice(0, 150) + '…' : o.def)) + '</div>').join('')
        + '</div>'
      box.querySelectorAll('.lq-chip').forEach((chip, i) => {
        chip.onclick = () => {
          if (opts[i].name === target.name) {
            mark(step)
            confetti(chip)
            box.innerHTML = '<div class="lq-check-title" style="color:#4ade80">✓ CORRECT — ' + STEP_META[step].label + ' cleared! +5 XP</div>'
          } else {
            chip.classList.add('bad')
            setTimeout(ask, 500)   // new random question — retry costs nothing but thought
          }
        }
      })
    }
    ask()
  }

  // Tiny emoji confetti burst at an element
  function confetti(el, emojis) {
    if (!el) return
    const r = el.getBoundingClientRect()
    const set = emojis || ['✨','⭐','💥','🎉']
    for (let i = 0; i < 8; i++) {
      const c = document.createElement('span')
      c.className = 'lq-conf'
      c.textContent = set[i % set.length]
      c.style.left = (r.left + r.width / 2) + 'px'
      c.style.top = (r.top + r.height / 2) + 'px'
      c.style.setProperty('--cx', (Math.random() * 120 - 60) + 'px')
      c.style.setProperty('--cy', (-30 - Math.random() * 70) + 'px')
      document.body.appendChild(c)
      setTimeout(() => c.remove(), 950)
    }
  }

  function state() { return load(cfg.pageKey, cfg.topicId) }
  function isDone(step) { return cfg.alreadyDone || !!state().steps[step] }

  // ── Quest path bar ─────────────────────────────────────────────────────────
  function renderBar(popStep) {
    const bar = document.getElementById('lq-bar')
    if (!bar || !cfg) return
    const st = state()
    const doneCount = cfg.steps.filter(isDone).length
    const pct = cfg.steps.length ? (doneCount / cfg.steps.length) * 100 : 0
    const nowIdx = cfg.steps.findIndex(s => !isDone(s))
    const stars = st.stars || 0
    const av = (typeof _BFW_AV !== 'undefined') ? _BFW_AV : '🤖'
    let nodes = ''
    cfg.steps.forEach((s, i) => {
      const done = isDone(s)
      const now = i === nowIdx
      nodes += '<div class="lq-node' + (done ? ' done' : '') + (now ? ' now' : '')
        + (s === popStep ? ' pop' : '') + '" id="lq-n-' + s + '">'
        + (now ? '<span class="lq-ava">' + av + '</span>' : '')
        + '<span class="lq-orb">' + (done && s === 'boss' ? '🏆' : STEP_META[s].icon) + '</span>'
        + '<span class="lq-nlabel">' + STEP_META[s].label + (done ? ' ✓' : '') + '</span>'
        + (s === 'practice' && stars ? '<span class="lq-stars" style="font-size:9px">' + '★'.repeat(stars) + '</span>' : '')
        + '</div>'
    })
    bar.innerHTML = '<div class="lq-track"><div class="lq-line"><div class="lq-fill" id="lq-fill"></div></div>'
      + nodes + '</div>'
      + '<div class="lq-meta"><span>Quest progress · <b>' + doneCount + '/' + cfg.steps.length + '</b></span>'
      + '<span>+5 XP per step · <b>' + Object.keys(st.steps).filter(k => k !== 'boss').length * 5 + ' XP</b> banked</span></div>'
    requestAnimationFrame(() => {
      const f = document.getElementById('lq-fill')
      if (f) f.style.width = pct + '%'
    })
  }

  function mark(step, opts) {
    if (!cfg || cfg.steps.indexOf(step) === -1) return
    const st = state()
    if (st.steps[step]) {
      if (opts && opts.stars && opts.stars > (st.stars || 0)) { st.stars = opts.stars; save(cfg.pageKey, cfg.topicId, st) }
      renderBar()
      return
    }
    st.steps[step] = 1
    if (opts && opts.stars) st.stars = Math.max(st.stars || 0, opts.stars)
    save(cfg.pageKey, cfg.topicId, st)
    renderBar(step)
    confetti(document.getElementById('lq-n-' + step))
    if (cfg.onXP && step !== 'boss') cfg.onXP(5, STEP_META[step].label)
  }

  // ── 🔑 Match-Up mini-game ──────────────────────────────────────────────────
  function buildMatchUp(c) {
    const cards = Array.from(c.querySelectorAll('.key-term-card'))
    const grid = c.querySelector('.key-terms-grid')
    if (!grid || cards.length < 2) return
    if (isDone('terms')) return   // solved before — leave the readable grid
    const pairs = cards.map((card, i) => ({
      i: i,
      term: (card.querySelector('.key-term-name') || {}).textContent || '',
      def: (card.querySelector('.key-term-def') || {}).textContent || '',
    })).filter(p => p.term && p.def)
    if (pairs.length < 2) return

    grid.style.display = 'none'   // the readable grid returns after the game
    const defs = pairs.slice().sort(() => Math.random() - 0.5)
    const game = document.createElement('div')
    game.className = 'lq-match'
    game.innerHTML = '<div class="lq-match-head"><span class="lq-match-title">🔑 MATCH-UP — pair each term with its definition</span>'
      + '<span class="lq-match-score" id="lqm-score">0/' + pairs.length + '</span></div>'
      + '<div class="lq-match-grid">'
      + '<div>' + pairs.map(p => '<div class="lq-chip" data-t="' + p.i + '" style="margin-bottom:8px"><b>' + esc(p.term) + '</b></div>').join('') + '</div>'
      + '<div>' + defs.map(p => '<div class="lq-chip" data-d="' + p.i + '" style="margin-bottom:8px">' + esc(p.def) + '</div>').join('') + '</div>'
      + '</div>'
    grid.parentNode.insertBefore(game, grid)

    let selTerm = null, solved = 0
    game.addEventListener('click', e => {
      const chip = e.target.closest('.lq-chip')
      if (!chip || chip.classList.contains('ok')) return
      if (chip.dataset.t !== undefined) {
        game.querySelectorAll('[data-t].sel').forEach(x => x.classList.remove('sel'))
        chip.classList.add('sel')
        selTerm = chip
        return
      }
      if (!selTerm) { chip.classList.add('bad'); setTimeout(() => chip.classList.remove('bad'), 400); return }
      if (chip.dataset.d === selTerm.dataset.t) {
        chip.classList.add('ok'); selTerm.classList.add('ok'); selTerm.classList.remove('sel')
        confetti(chip, ['✨','🔑'])
        selTerm = null
        solved++
        const sc = document.getElementById('lqm-score')
        if (sc) sc.textContent = solved + '/' + pairs.length
        if (solved >= pairs.length) {
          mark('terms')
          setTimeout(() => {
            const t = game.querySelector('.lq-match-title')
            if (t) t.textContent = '🏆 MATCH-UP CLEARED! +5 XP — the terms stay below for revision.'
            grid.style.display = ''
          }, 500)
        }
      } else {
        chip.classList.add('bad'); selTerm.classList.add('bad')
        const t = selTerm
        setTimeout(() => { chip.classList.remove('bad'); t.classList.remove('bad') }, 400)
      }
    })
  }

  // ── ⚔️ Boss fight over the practice section ────────────────────────────────
  function buildBoss(c) {
    const section = c.querySelector('.practice-section')
    if (!section || !c.querySelector('.question-card')) return
    const n = c.querySelectorAll('.question-card').length
    const face = BOSSES[Math.abs(String(cfg.topicId).split('').reduce((a, ch) => a + ch.charCodeAt(0), 0)) % BOSSES.length]
    const dead = isDone('practice')
    const el = document.createElement('div')
    el.className = 'lq-boss' + (dead ? ' dead' : '')
    el.id = 'lq-boss'
    el.innerHTML = '<div class="lq-boss-row"><div class="lq-boss-face">' + face + '</div><div style="flex:1">'
      + '<div class="lq-boss-name">' + (dead ? 'BOSS DEFEATED' : 'CHAPTER BOSS') + ' — ' + n + ' question' + (n > 1 ? 's' : '') + ' of HP</div>'
      + '<div class="lq-boss-tip">' + (dead ? 'You already beat this one. Re-answer to sharpen your exam technique.'
        : 'Answer the questions below, then hit <b>Check My Answers</b> — every good answer deals damage!') + '</div>'
      + '<div class="lq-hp"><div class="lq-hp-fill" id="lq-hp" style="width:' + (dead ? 0 : 100) + '%"></div></div>'
      + '</div></div><div class="lq-boss-result" id="lq-boss-result"></div>'
    section.parentNode.insertBefore(el, section)
  }

  // Reads the Check-Answers verdicts and plays out the battle
  function battle() {
    const c = cfg.container
    const boss = document.getElementById('lq-boss')
    const goods = c.querySelectorAll('.answer-feedback.fb-good').length
    const parts = c.querySelectorAll('.answer-feedback.fb-partial').length
    const total = c.querySelectorAll('.question-card').length || 1
    const dmg = goods + parts * 0.5
    const ratio = dmg / total
    const stars = ratio >= 0.85 ? 3 : ratio >= 0.55 ? 2 : 1
    mark('practice', { stars: stars })

    if (!boss) return
    boss.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    boss.classList.add('hit')
    setTimeout(() => boss.classList.remove('hit'), 450)
    // floating damage numbers
    for (let i = 0; i < Math.max(1, Math.round(dmg)); i++) {
      setTimeout(() => {
        const d = document.createElement('span')
        d.className = 'lq-dmg'
        d.textContent = '-1'
        d.style.left = (30 + Math.random() * 60) + 'px'
        d.style.top = '8px'
        boss.appendChild(d)
        setTimeout(() => d.remove(), 1150)
      }, i * 180)
    }
    const hp = document.getElementById('lq-hp')
    if (hp) hp.style.width = Math.max(0, 100 - ratio * 100) + '%'
    const res = document.getElementById('lq-boss-result')
    const starTxt = '<span class="lq-stars">' + '★'.repeat(stars) + '☆'.repeat(3 - stars) + '</span>'
    if (res) {
      if (ratio >= 0.55) {
        boss.classList.add('dead')
        res.innerHTML = '💥 <span style="color:#4ade80">BOSS DEFEATED!</span> ' + starTxt
          + ' — now read the mark schemes like an examiner.'
        confetti(boss, ['💥','⚔️','🏆','⭐'])
      } else {
        res.innerHTML = '🩸 <span style="color:#fca5a5">The boss survived…</span> ' + starTxt
          + ' — study the mark schemes below; it falls in the rematch.'
      }
    }
  }

  return {
    attach(config) {
      ensureStyles()
      cfg = config
      const c = cfg.container
      const steps = []
      if (c.querySelector('.video-section')) steps.push('watch')
      if (c.querySelectorAll('.key-term-card').length >= 2) steps.push('terms')
      if (c.querySelector('.theory-block')) steps.push('theory')
      if (c.querySelector('.example-block')) steps.push('example')
      if (c.querySelector('.question-card')) steps.push('practice')
      steps.push('boss')
      cfg.steps = steps

      // Quest path bar at the top of the lesson pane
      const lessonPane = c.querySelector('.topic-pane') || c
      const bar = document.createElement('div')
      bar.className = 'lq-bar'
      bar.id = 'lq-bar'
      lessonPane.insertBefore(bar, lessonPane.firstChild)
      renderBar()

      // 🎬 videos — verified by the YouTube API, not an honor button
      if (steps.indexOf('watch') !== -1) setupWatch(c)

      // 🔑 match-up
      if (steps.indexOf('terms') !== -1) buildMatchUp(c)

      // 📚 / 💡 — prove-it micro-checks instead of "Got it" buttons
      buildCheck(c, 'theory', '.theory-block', 'term')
      buildCheck(c, 'example', '.example-block', 'def')

      // ⚔️ boss over practice
      if (steps.indexOf('practice') !== -1) buildBoss(c)
    },

    // checkAnswers hook — plays the boss battle from the rendered verdicts
    markStep(topicId, step) {
      if (!cfg || cfg.topicId !== topicId) return
      if (step === 'practice') battle()
      else mark(step)
    },

    // completeTopic hook — the chest opens
    boss(topicId) {
      if (!cfg || cfg.topicId !== topicId) return
      mark('boss')
      const old = document.getElementById('lq-celebrate')
      if (old) old.remove()
      const st = state()
      const starTxt = st.stars ? '★'.repeat(st.stars) + '☆'.repeat(3 - st.stars) : ''
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
        + '<div class="xp-burst-label">🎁 Chest Opened — Topic Complete!</div>'
        + '<div class="xp-burst-exname">' + (starTxt ? 'Boss fight: <span class="lq-stars">' + starTxt + '</span>' : 'Every step conquered.') + '</div>'
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
            xp += Object.keys((st && st.steps) || {}).filter(s => s !== 'boss').length * 5
          }
        }
      } catch (e) {}
      return xp
    },

    stars(pageKey, topicId) {
      return load(pageKey, topicId).stars || 0
    },

    /**
     * Checkpoint quiz overlay (used by the Journey path's 🎯 nodes).
     * quiz({ title, sub, questions: [{q, options, a}], passRatio?, onPass, onClose })
     * One question at a time, progress dots; score >= passRatio (default .8) passes.
     */
    quiz(opts) {
      ensureStyles()
      const old = document.getElementById('lq-quiz')
      if (old) old.remove()
      const ov = document.createElement('div')
      ov.id = 'lq-quiz'
      ov.className = 'lq-quiz'
      document.body.appendChild(ov)
      const qs = opts.questions
      const need = Math.ceil((opts.passRatio || 0.8) * qs.length)
      let idx = 0
      const results = []
      const close = () => { ov.remove(); if (opts.onClose) opts.onClose() }

      const dots = () => '<div class="lq-quiz-prog">' + qs.map((_, i) =>
        '<span class="lq-quiz-dot' + (i < results.length ? (results[i] ? ' ok' : ' bad') : (i === idx ? ' cur' : '')) + '"></span>'
      ).join('') + '</div>'

      const step = () => {
        if (idx >= qs.length) {
          const score = results.filter(Boolean).length
          const passed = score >= need
          ov.innerHTML = '<div class="lq-quiz-card" style="text-align:center">'
            + '<div style="font-size:44px">' + (passed ? '🎯' : '🩹') + '</div>'
            + '<div class="lq-quiz-title">' + (passed ? 'CHECKPOINT CLEARED!' : 'Almost…') + '</div>'
            + '<div class="lq-quiz-sub">You scored <b>' + score + '/' + qs.length + '</b>'
            + (passed ? ' — key terms locked in.' : ' — you need ' + need + '. Revisit the lessons and try again, it costs nothing.') + '</div>'
            + dots()
            + '<div style="margin-top:14px">'
            + (passed ? '<button class="lq-next-btn" id="lqq-done">Claim it →</button>'
                      : '<button class="lq-next-btn" id="lqq-retry">Retry</button>')
            + '<button class="lq-stay-btn" id="lqq-close">Close</button></div></div>'
          const done = document.getElementById('lqq-done')
          if (done) done.onclick = () => { ov.remove(); if (opts.onPass) opts.onPass() }
          const retry = document.getElementById('lqq-retry')
          if (retry) retry.onclick = () => { idx = 0; results.length = 0; qs.forEach(q => {
            const right = q.options[q.a]
            q.options = shuffle(q.options)
            q.a = q.options.indexOf(right)
          }); step() }
          document.getElementById('lqq-close').onclick = close
          return
        }
        const q = qs[idx]
        ov.innerHTML = '<div class="lq-quiz-card">'
          + '<button class="lq-quiz-x" id="lqq-x">✕</button>'
          + '<div class="lq-quiz-title">' + (opts.title || '🎯 Checkpoint') + '</div>'
          + '<div class="lq-quiz-sub">' + esc(opts.sub || '') + '</div>'
          + dots()
          + '<div class="lq-quiz-q">' + (idx + 1) + '. ' + esc(q.q) + '</div>'
          + '<div class="lq-check-opts">'
          + q.options.map((o, i) => '<div class="lq-chip" data-i="' + i + '">' + esc(o) + '</div>').join('')
          + '</div></div>'
        document.getElementById('lqq-x').onclick = close
        ov.querySelectorAll('.lq-chip').forEach((chip, i) => {
          chip.onclick = () => {
            const right = i === q.a
            chip.classList.add(right ? 'ok' : 'bad')
            if (right) confetti(chip, ['✨','🎯'])
            else { const c2 = ov.querySelectorAll('.lq-chip')[q.a]; if (c2) c2.classList.add('ok') }
            results.push(right)
            setTimeout(() => { idx++; step() }, right ? 500 : 1100)
          }
        })
      }
      step()
    },
  }
})()
