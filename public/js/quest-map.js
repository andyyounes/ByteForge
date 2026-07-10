/**
 * QuestMap — shared adventure-map overlay for ByteForge lesson pages.
 * The Grade 6 Creator Quest look, reusable: worlds → zigzag stage nodes with
 * done/locked/current states, boss nodes, an avatar on the current stage.
 *
 * QuestMap.show({
 *   title, subtitle, accent,          // accent = CSS color for the theme
 *   freeRoam,                         // true = nothing locks (AS/A Level)
 *   avatarSvg,                        // optional — marks the current stage
 *   worlds: [{ name, sub, live, count?, stages?: [{ id, emoji, label, done, boss }] }],
 *   onOpen(stageId),                  // stage clicked (map hides itself first)
 * })
 * QuestMap.hide() / QuestMap.refresh()
 */
const QuestMap = (() => {
  'use strict'
  let cfg = null
  let styled = false

  function ensureStyles() {
    if (styled) return
    styled = true
    const css = `
      #qm-overlay { position:fixed; inset:0; z-index:7000; background:#0d0f1a; overflow-y:auto; }
      .qm-hero { text-align:center; padding:26px 16px 8px; position:relative; }
      .qm-hero h1 { font-size:25px; font-weight:900; background:linear-gradient(90deg,#fbbf24,var(--qm-accent,#e879f9),#60a5fa);
                    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
      .qm-hero p { color:#9ca3af; font-size:13px; margin-top:5px; }
      .qm-close { position:absolute; top:14px; right:20px; width:38px; height:38px; border-radius:50%;
                  border:1px solid rgba(255,255,255,.15); background:#161927; color:#9ca3af; font-size:17px;
                  cursor:pointer; }
      .qm-close:hover { color:#fff; }
      .qm-stats { display:flex; gap:12px; justify-content:center; margin-top:10px; flex-wrap:wrap; }
      .qm-stat { background:#111320; border:1px solid rgba(255,255,255,.08); border-radius:99px; padding:5px 15px;
                 font-size:12px; font-weight:800; color:#c4b5fd; }
      .qm-stat b { color:#fbbf24; }
      .qm-map { max-width:680px; margin:16px auto 80px; padding:0 16px; }
      .qm-world { border-radius:18px; border:1px solid rgba(255,255,255,.08); margin-bottom:16px; padding:15px 17px 19px;
                  background:linear-gradient(160deg, rgba(255,255,255,.03), rgba(255,255,255,0)); }
      .qm-world.locked { opacity:.55; filter:saturate(.4); }
      .qm-whead { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:13px; }
      .qm-wname { font-size:15px; font-weight:900; }
      .qm-wsub { font-size:11px; color:#9ca3af; margin-top:2px; }
      .qm-wprog { font-size:11px; font-weight:800; color:#fbbf24; background:rgba(251,191,36,.1);
                  border:1px solid rgba(251,191,36,.3); padding:4px 12px; border-radius:99px; white-space:nowrap; }
      .qm-lockmsg { font-size:12px; color:#6b7280; padding:6px 0 2px; }
      .qm-stages { display:flex; flex-wrap:wrap; gap:18px 24px; align-items:center; }
      .qm-node { position:relative; width:62px; height:62px; border-radius:50%; border:3px solid rgba(255,255,255,.14);
                 background:#161927; cursor:pointer; display:flex; flex-direction:column; align-items:center;
                 justify-content:center; transition:transform .15s, box-shadow .15s; flex-shrink:0; }
      .qm-node:not(.locked):hover { transform:scale(1.1); box-shadow:0 6px 24px rgba(232,121,249,.35); }
      .qm-node.done { border-color:#4ade80; background:rgba(74,222,128,.1); }
      .qm-node.current { border-color:var(--qm-accent,#e879f9); background:rgba(232,121,249,.12); animation:qmPulse 2s infinite; }
      @keyframes qmPulse { 0%,100%{box-shadow:0 0 0 0 rgba(232,121,249,.4)} 50%{box-shadow:0 0 0 10px rgba(232,121,249,0)} }
      .qm-node.locked { cursor:default; opacity:.45; }
      .qm-node.boss { width:78px; height:78px; border-width:4px; border-color:rgba(251,191,36,.5); }
      .qm-node.boss.done { border-color:#4ade80; }
      .qm-emoji { font-size:19px; line-height:1; }
      .qm-node.boss .qm-emoji { font-size:25px; }
      .qm-label { font-size:8.5px; font-weight:800; color:#6b7280; margin-top:2px; max-width:58px; text-align:center;
                  overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
      .qm-done-mark { position:absolute; bottom:-13px; font-size:10px; }
      .qm-avatar { position:absolute; top:-30px; left:50%; transform:translateX(-50%); animation:qmBob 2.4s ease-in-out infinite; }
      @keyframes qmBob { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(-4px)} }
      .qm-arrow { color:#3c4157; font-size:17px; flex-shrink:0; }
    `
    const el = document.createElement('style')
    el.textContent = css
    document.head.appendChild(el)
  }

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;') }

  function render() {
    ensureStyles()
    let overlay = document.getElementById('qm-overlay')
    if (!overlay) {
      overlay = document.createElement('div')
      overlay.id = 'qm-overlay'
      document.body.appendChild(overlay)
    }
    document.documentElement.style.setProperty('--qm-accent', cfg.accent || '#e879f9')

    let total = 0, done = 0
    for (const w of cfg.worlds) if (w.live && w.stages) {
      total += w.stages.length
      done += w.stages.filter(s => s.done).length
    }

    let html = '<div class="qm-hero">'
      + '<h1>' + cfg.title + '</h1>'
      + '<p>' + esc(cfg.subtitle || '') + '</p>'
      + '<button class="qm-close" onclick="QuestMap.hide()">✕</button>'
      + '<div class="qm-stats"><span class="qm-stat">✅ <b>' + done + '</b>/' + total + ' stages</span></div>'
      + '</div><div class="qm-map">'

    let prevWorldDone = true
    let foundCurrent = false
    for (const w of cfg.worlds) {
      if (!w.live) {
        html += '<div class="qm-world locked"><div class="qm-whead"><div>'
          + '<div class="qm-wname">' + w.name + '</div><div class="qm-wsub">' + esc(w.sub || '') + '</div></div>'
          + '<div class="qm-wprog">🔒 ' + (w.count || '?') + ' stages</div></div>'
          + '<div class="qm-lockmsg">Coming soon!</div></div>'
        continue
      }
      const wDone = w.stages.filter(s => s.done).length
      const allDone = wDone === w.stages.length
      // Clicking the chapter header opens its first unfinished stage
      const firstOpen = (w.stages.find(s => !s.done) || w.stages[0])
      html += '<div class="qm-world"><div class="qm-whead" style="cursor:pointer"'
        + (firstOpen ? ' onclick="QuestMap._open(\'' + esc(firstOpen.id) + '\')"' : '') + '><div>'
        + '<div class="qm-wname">' + w.name + ' <span style="font-size:11px;color:#6b7280;font-weight:600;">→ open</span></div>'
        + '<div class="qm-wsub">' + esc(w.sub || '') + '</div></div>'
        + '<div class="qm-wprog">' + (allDone ? '🏆 COMPLETE' : wDone + '/' + w.stages.length) + '</div></div>'
        + '<div class="qm-stages">'
      w.stages.forEach((s, i) => {
        const unlocked = cfg.freeRoam || (prevWorldDone && (i === 0 || w.stages[i - 1].done || s.done))
        const isCurrent = !cfg.freeRoam && unlocked && !s.done && !foundCurrent
        if (isCurrent) foundCurrent = true
        const cls = 'qm-node' + (s.boss ? ' boss' : '') + (s.done ? ' done' : '')
          + (isCurrent ? ' current' : '') + (unlocked ? '' : ' locked')
        html += (i > 0 ? '<span class="qm-arrow">›</span>' : '')
          + '<div class="' + cls + '"' + (unlocked ? ' onclick="QuestMap._open(\'' + esc(s.id) + '\')"' : '')
          + ' title="' + esc(s.label) + '">'
          + (isCurrent && cfg.avatarSvg ? '<span class="qm-avatar">' + cfg.avatarSvg + '</span>' : '')
          + '<span class="qm-emoji">' + (unlocked ? (s.emoji || '📘') : '🔒') + '</span>'
          + '<span class="qm-label">' + esc(s.label) + '</span>'
          + (s.done ? '<span class="qm-done-mark">' + (s.boss ? '🏆' : '⭐') + '</span>' : '')
          + '</div>'
      })
      html += '</div></div>'
      prevWorldDone = allDone
    }
    html += '</div>'
    overlay.innerHTML = html
  }

  return {
    show(config) { cfg = config; render() },
    refresh() { if (cfg && document.getElementById('qm-overlay')) render() },
    hide() {
      const el = document.getElementById('qm-overlay')
      if (el) el.remove()
    },
    _open(id) {
      const cb = cfg && cfg.onOpen
      QuestMap.hide()
      if (cb) cb(id)
    },
  }
})()
