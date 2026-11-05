/**
 * QuestMap — shared adventure-map overlay for ByteForge lesson pages.
 * The Grade 6 Creator Quest look, reusable: worlds → zigzag stage nodes with
 * done/locked/current states, boss nodes, an avatar on the current stage.
 *
 * QuestMap.show({
 *   title, subtitle, accent,          // accent = CSS color for the theme
 *   freeRoam,                         // true = nothing locks (AS/A Level)
 *   avatarSvg,                        // optional — marks the current stage
 *   worlds: [{ name, sub, live, count?, stages?: [{ id, emoji, label, done, boss, isNew }] }],
 *   onOpen(stageId),                  // stage clicked (map hides itself first)
 *   newSeenKey,                       // localStorage key for "which isNew stages has
 *                                     // this student already opened" — a stage glows
 *                                     // and shows a ✨ NEW badge only while isNew:true
 *                                     // AND its id isn't in that seen-set yet; opening
 *                                     // it (via _open) marks it seen permanently, same
 *                                     // idea as an unread-until-clicked notification.
 *                                     // Omit to disable the new-lesson highlight entirely.
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
      .qm-complete-banner { max-width:560px; margin:16px auto 0; padding:12px 20px; text-align:center;
        background:linear-gradient(135deg, rgba(251,191,36,.12), rgba(232,121,249,.12));
        border:1px solid rgba(251,191,36,.35); border-radius:14px; font-size:13px; color:#fde68a; line-height:1.5; }
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
      .qm-node.done { border-color:#86efac; background:linear-gradient(145deg,#16a34a,#4ade80);
                      box-shadow:0 0 14px rgba(74,222,128,.45), inset 0 -4px 8px rgba(0,0,0,.25); }
      .qm-node.current { border-color:#f0abfc; background:linear-gradient(145deg,#a21caf,var(--qm-accent,#e879f9));
                         box-shadow:inset 0 -4px 8px rgba(0,0,0,.25); animation:qmPulse 2s infinite; }
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
      /* ── Duolingo-style winding path layout ─────────────────────── */
      .qm-path { max-width:430px; margin:10px auto 90px; padding:0 16px; }
      .qm-banner { display:flex; align-items:center; justify-content:space-between; gap:10px;
                   border-radius:14px; padding:12px 16px; margin:26px 0 20px;
                   background:linear-gradient(135deg, rgba(232,121,249,.14), rgba(96,165,250,.1));
                   border:1px solid rgba(255,255,255,.12); }
      .qm-banner .qm-wname { font-size:14px; }
      .qm-pcol { display:flex; flex-direction:column; align-items:center; gap:26px; position:relative; }
      .qm-pcol::before { content:''; position:absolute; top:0; bottom:0; left:50%; width:3px;
                         background:repeating-linear-gradient(#2b3044 0 8px, transparent 8px 16px);
                         transform:translateX(-50%); }
      .qm-pwrap { position:relative; z-index:1; display:flex; flex-direction:column; align-items:center;
                  transition:transform .2s; }
      .qm-node.soon { opacity:.5; filter:saturate(.55); }
      .qm-node.soon:hover { opacity:.9; }
      .qm-next-pill { margin-top:6px; font-size:9px; font-weight:900; letter-spacing:1px; color:#0d0f1a;
                      background:var(--qm-accent,#e879f9); border-radius:99px; padding:3px 11px;
                      animation:qmBounceIn .5s; white-space:nowrap; }
      @keyframes qmBounceIn { 0%{transform:scale(0)} 70%{transform:scale(1.15)} 100%{transform:scale(1)} }
      .qm-plabel { font-size:10px; font-weight:800; color:#9ca3af; margin-top:5px; max-width:130px;
                   text-align:center; line-height:1.3; }
      .qm-pstars { font-size:10px; margin-top:2px; letter-spacing:-1px; }
      .qm-node.cp { border-style:dashed; border-color:rgba(96,165,250,.55); }
      .qm-node.cp.done { border-color:#4ade80; }
      .qm-node.rusty { border-color:#f59e0b !important; border-style:dashed !important;
                       background:linear-gradient(145deg,#78350f,#b45309) !important; }
      .qm-rusty-tag { position:absolute; top:-10px; right:-10px; font-size:14px;
                      filter:drop-shadow(0 1px 3px rgba(0,0,0,.6)); }
      /* ── "What's new" highlight — a genuinely different color from done/current/
         boss, so a freshly-added lesson reads as "new", not "already in progress". */
      .qm-node.new:not(.done) { border-color:#2dd4bf; background:linear-gradient(145deg,#0f766e,#2dd4bf);
                                 box-shadow:0 0 14px rgba(45,212,191,.55), inset 0 -4px 8px rgba(0,0,0,.25);
                                 animation:qmNewGlow 1.8s ease-in-out infinite; }
      @keyframes qmNewGlow { 0%,100%{box-shadow:0 0 8px rgba(45,212,191,.4)} 50%{box-shadow:0 0 20px rgba(45,212,191,.85)} }
      .qm-new-badge { position:absolute; top:-9px; right:-9px; font-size:8px; font-weight:900; letter-spacing:.3px;
                      color:#04211d; background:#2dd4bf; border-radius:99px; padding:2px 6px;
                      box-shadow:0 1px 4px rgba(0,0,0,.4); white-space:nowrap; }
      .qm-new-pill { margin-top:6px; font-size:9px; font-weight:900; letter-spacing:1px; color:#04211d;
                     background:#2dd4bf; border-radius:99px; padding:3px 11px; white-space:nowrap; }
      .qm-wname .qm-wnew-tag { font-size:9px; font-weight:900; letter-spacing:.3px; color:#04211d;
                                background:#2dd4bf; border-radius:99px; padding:2px 7px; margin-left:6px;
                                vertical-align:2px; }
      .qm-new-banner { max-width:560px; margin:16px auto 0; padding:11px 18px; text-align:center;
        background:linear-gradient(135deg, rgba(45,212,191,.14), rgba(96,165,250,.1));
        border:1px solid rgba(45,212,191,.4); border-radius:14px; font-size:13px; color:#99f6e4; line-height:1.5; }
      /* ── "Continue" — a single unmissable button pointing straight at
         whatever the student should do next, so they don't have to scan a
         long winding path (or scroll) to work out where they left off. */
      .qm-continue-btn { display:flex; align-items:center; gap:12px; width:100%; max-width:400px;
        margin:4px auto 22px; padding:12px 16px; border-radius:16px; border:1px solid rgba(255,255,255,.14);
        background:linear-gradient(135deg, var(--qm-accent,#e879f9), #60a5fa); color:#0d0f1a; cursor:pointer;
        font-family:inherit; text-align:left; box-shadow:0 8px 24px rgba(232,121,249,.3); }
      .qm-continue-btn:hover { transform:translateY(-1px); box-shadow:0 10px 28px rgba(232,121,249,.45); }
      .qm-continue-emoji { font-size:24px; flex-shrink:0; width:40px; height:40px; border-radius:50%;
        background:rgba(13,15,26,.18); display:flex; align-items:center; justify-content:center; }
      .qm-continue-text { flex:1; min-width:0; display:flex; flex-direction:column; }
      .qm-continue-eyebrow { font-size:10px; font-weight:900; letter-spacing:.08em; text-transform:uppercase; opacity:.75; }
      .qm-continue-name { font-size:13.5px; font-weight:800; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .qm-continue-arrow { font-size:20px; font-weight:900; flex-shrink:0; animation:qmArrowNudge 1.4s ease-in-out infinite; }
      @keyframes qmArrowNudge { 0%,100%{transform:translateX(0)} 50%{transform:translateX(5px)} }
    `
    const el = document.createElement('style')
    el.textContent = css
    document.head.appendChild(el)
  }

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;') }

  // Self-contained — quest-map.js is shared across every grade, and can't
  // assume whichever page embeds it has its own toast/notification system.
  function showLockedToast() {
    const existing = document.getElementById('qm-locked-toast')
    if (existing) existing.remove()
    const el = document.createElement('div')
    el.id = 'qm-locked-toast'
    el.textContent = '🔒 Complete the earlier stages first.'
    el.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);'
      + 'background:#1f2937;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;'
      + 'z-index:100000;box-shadow:0 8px 24px rgba(0,0,0,.3);'
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 2800)
  }

  // "New lesson" highlight persistence — a stage glows until the student opens
  // it once, then it's remembered as seen forever (localStorage, per newSeenKey).
  function seenSet() {
    if (!cfg || !cfg.newSeenKey) return null
    try { return new Set(JSON.parse(localStorage.getItem(cfg.newSeenKey) || '[]')) } catch (_) { return new Set() }
  }
  function isGlowingNew(s) {
    if (!s.isNew || !cfg.newSeenKey || s.done) return false
    const seen = seenSet()
    return !(seen && seen.has(s.id))
  }
  function markSeen(id) {
    if (!cfg || !cfg.newSeenKey) return
    const seen = seenSet() || new Set()
    if (seen.has(id)) return
    seen.add(id)
    try { localStorage.setItem(cfg.newSeenKey, JSON.stringify([...seen])) } catch (_) {}
  }

  function render() {
    ensureStyles()
    let overlay = document.getElementById('qm-overlay')
    if (!overlay) {
      overlay = document.createElement('div')
      overlay.id = 'qm-overlay'
      document.body.appendChild(overlay)
    }
    document.documentElement.style.setProperty('--qm-accent', cfg.accent || '#e879f9')

    let total = 0, done = 0, newCount = 0
    for (const w of cfg.worlds) if (w.live && w.stages) {
      total += w.stages.length
      done += w.stages.filter(s => s.done).length
      newCount += w.stages.filter(isGlowingNew).length
    }

    let html = '<div class="qm-hero">'
      + '<h1>' + cfg.title + '</h1>'
      + '<p>' + esc(cfg.subtitle || '') + '</p>'
      + '<button class="qm-close" onclick="QuestMap.hide()">✕</button>'
      + '<div class="qm-stats"><span class="qm-stat">✅ <b>' + done + '</b>/' + total + ' stages</span></div>'
      + '</div>'

    // Every live stage done, and there's at least one — nothing else to show
    // up next (no unbuilt "coming soon" world queued after the last live
    // one, on any of these pages right now), so say so explicitly instead
    // of the map just quietly ending with no acknowledgement.
    if (total > 0 && done === total) {
      html += '<div class="qm-complete-banner">🎉 <b>You\'ve completed every stage!</b> '
        + 'Keep revisiting any of them for extra practice, or check with your teacher about what\'s next.</div>'
    } else if (newCount > 0) {
      html += '<div class="qm-new-banner">✨ <b>' + newCount + ' new lesson' + (newCount === 1 ? '' : 's') + ' added!</b> '
        + 'Look for the teal glowing ' + (newCount === 1 ? 'stage' : 'stages') + ' below.</div>'
    }

    if (cfg.layout === 'path') {
      overlay.innerHTML = html + renderPath()
      // Bring the current node into view (the path can be very long)
      const cur = overlay.querySelector('.qm-node.current')
      if (cur) setTimeout(() => cur.scrollIntoView({ block: 'center' }), 60)
      return
    }
    html += '<div class="qm-map">'

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
      const wNewCount = w.stages.filter(isGlowingNew).length
      // Clicking the chapter header opens its first unfinished stage
      const firstOpen = (w.stages.find(s => !s.done) || w.stages[0])
      html += '<div class="qm-world"><div class="qm-whead" style="cursor:pointer"'
        + (firstOpen ? ' onclick="QuestMap._open(\'' + esc(firstOpen.id) + '\')"' : '') + '><div>'
        + '<div class="qm-wname">' + w.name + ' <span style="font-size:11px;color:#6b7280;font-weight:600;">→ open</span>'
        + (wNewCount ? '<span class="qm-wnew-tag">✨ NEW</span>' : '') + '</div>'
        + '<div class="qm-wsub">' + esc(w.sub || '') + '</div></div>'
        + '<div class="qm-wprog">' + (allDone ? '🏆 COMPLETE' : wDone + '/' + w.stages.length) + '</div></div>'
        + '<div class="qm-stages">'
      w.stages.forEach((s, i) => {
        const unlocked = cfg.freeRoam || (prevWorldDone && (i === 0 || w.stages[i - 1].done || s.done))
        const isCurrent = !cfg.freeRoam && unlocked && !s.done && !foundCurrent
        if (isCurrent) foundCurrent = true
        const glowNew = unlocked && isGlowingNew(s)
        const cls = 'qm-node' + (s.boss ? ' boss' : '') + (s.done ? ' done' : '')
          + (isCurrent ? ' current' : '') + (glowNew ? ' new' : '') + (unlocked ? '' : ' locked')
        html += (i > 0 ? '<span class="qm-arrow">›</span>' : '')
          + '<div class="' + cls + '"' + (unlocked ? ' onclick="QuestMap._open(\'' + esc(s.id) + '\')"' : '')
          + ' title="' + esc(glowNew ? '✨ New! ' + s.label : s.label) + '">'
          + (isCurrent && cfg.avatarSvg ? '<span class="qm-avatar">' + cfg.avatarSvg + '</span>' : '')
          + (glowNew ? '<span class="qm-new-badge">NEW</span>' : '')
          + '<span class="qm-emoji">' + (unlocked ? (s.emoji || '📘') : '🔒') + '</span>'
          + '<span class="qm-label">' + esc(s.label) + '</span>'
          + (s.stars ? '<span class="qm-done-mark" style="letter-spacing:-1px">' + '⭐'.repeat(s.stars) + '</span>'
             : s.done ? '<span class="qm-done-mark">' + (s.boss ? '🏆' : '⭐') + '</span>' : '')
          + '</div>'
      })
      html += '</div></div>'
      prevWorldDone = allDone
    }
    html += '</div>'
    overlay.innerHTML = html
  }

  // Duolingo-style single winding path: chapter banners, serpentine nodes,
  // one glowing "current" node with the avatar. Soft lock: future nodes are
  // dimmed but stay clickable (exam students revise out of order).
  // "Next up"/lock-gate position — the student's FURTHEST completed real
  // stage, then the first incomplete one AFTER that point (falling back to
  // "first incomplete anywhere" only if everything past their furthest
  // point is already done too, e.g. some earlier gap is all that's left).
  // Two-pass, not "first incomplete anywhere": a stage inserted EARLIER
  // than where a student already is (a new intro module added after some
  // students had finished later ones) must not send them all the way back.
  // Shared by renderPath() (what to show as "Continue"/locked) AND
  // isHardLocked() (what a direct open — map click OR a raw ?stage= URL —
  // is actually allowed to open), so the two can never silently disagree.
  // Grade 6/7/8's per-world "Lesson" bubble (id 'lesson-<world>') is always
  // done:true unconditionally (a pure unlock-chain placeholder, never real
  // progress) — it must never count as "furthest real progress".
  const isRealStage = (s) => !(s.id && s.id.indexOf('lesson-') === 0)
  function computeCurrentIdx() {
    let maxDoneIdx = -1, firstIncompleteIdx = -1, flatIdx = 0
    for (const w of cfg.worlds) {
      if (!w.live || !w.stages) continue
      for (const s of w.stages) {
        if (isRealStage(s)) {
          if (s.done) maxDoneIdx = flatIdx
          else if (firstIncompleteIdx === -1) firstIncompleteIdx = flatIdx
        }
        flatIdx++
      }
    }
    let currentIdx = -1, scanIdx = 0
    for (const w of cfg.worlds) {
      if (!w.live || !w.stages) continue
      for (const s of w.stages) {
        if (isRealStage(s) && !s.done && scanIdx > maxDoneIdx && currentIdx === -1) currentIdx = scanIdx
        scanIdx++
      }
    }
    if (currentIdx === -1) currentIdx = firstIncompleteIdx
    return currentIdx
  }
  // True when a stage genuinely cannot be opened yet — same rule renderPath
  // uses to draw its 🔒 (idx strictly past the student's current position,
  // hardLock on, not forceUnlock), but checkable for ANY stage id directly,
  // not just while rendering the whole map. cfg.layout must be 'path' (the
  // only layout hardLock/the flat idx scheme applies to); freeRoam/non-path
  // configs were never locked in the first place.
  function isHardLocked(id) {
    if (!cfg || cfg.layout !== 'path' || !cfg.hardLock || cfg.freeRoam) return false
    const currentIdx = computeCurrentIdx()
    let idx = 0
    for (const w of cfg.worlds) {
      if (!w.live || !w.stages) continue
      for (const s of w.stages) {
        if (s.id === id) {
          return cfg.softLock && !s.done && idx > currentIdx && !s.forceUnlock
        }
        idx++
      }
    }
    return false // unknown id (e.g. a 'lesson-' bubble) — never gated
  }

  function renderPath() {
    const OFF = [0, 52, 82, 52, 0, -52, -82, -52]
    let html = '<div class="qm-path">'
    const currentIdx = computeCurrentIdx()
    let currentStage = null
    {
      let fi = 0
      find: for (const w of cfg.worlds) {
        if (!w.live || !w.stages) continue
        for (const s of w.stages) {
          if (fi === currentIdx) { currentStage = s; break find }
          fi++
        }
      }
    }
    // One unmissable "Continue" button at the very top, so a student doesn't
    // have to scan or scroll a long winding path to find where they left off.
    if (currentStage) {
      html += '<button class="qm-continue-btn" onclick="QuestMap._open(\'' + esc(currentStage.id) + '\')">'
        + '<span class="qm-continue-emoji">' + (currentStage.emoji || '📘') + '</span>'
        + '<span class="qm-continue-text"><span class="qm-continue-eyebrow">Continue</span>'
        + '<span class="qm-continue-name">' + esc(currentStage.label) + '</span></span>'
        + '<span class="qm-continue-arrow">→</span>'
        + '</button>'
    }
    let k = 0
    let idx = 0
    for (const w of cfg.worlds) {
      const wDone = w.stages ? w.stages.filter(s => s.done).length : 0
      const allDone = w.stages && wDone === w.stages.length
      const wNewCount = w.stages ? w.stages.filter(isGlowingNew).length : 0
      html += '<div class="qm-banner"><div><div class="qm-wname">' + w.name
        + (wNewCount ? '<span class="qm-wnew-tag">✨ NEW</span>' : '') + '</div>'
        + '<div class="qm-wsub">' + esc(w.sub || '') + '</div></div>'
        + '<div class="qm-wprog">' + (w.live ? (allDone ? '🏆 COMPLETE' : wDone + '/' + w.stages.length) : '🔒 soon') + '</div></div>'
      if (!w.live) continue
      html += '<div class="qm-pcol">'
      for (const s of w.stages) {
        const isCurrent = idx === currentIdx
        // "soon" (and hardLock, below) must mean genuinely FUTURE content —
        // strictly after the current node — not just "not currently
        // highlighted". An earlier incomplete gap (idx <= currentIdx, e.g. a
        // module inserted before a student's real position) stays fully
        // open so they can go back and fill it in; only content the
        // student hasn't reached yet gets locked.
        const soon = cfg.softLock && !s.done && idx > currentIdx && !s.forceUnlock
        idx++
        // hardLock: unlike softLock (dimmed but still clickable — meant for
        // exam revision pages where jumping around is fine), a hard-locked
        // "soon" node genuinely cannot be opened until every stage before it
        // is done — no onclick attached at all, shown with a 🔒 instead of
        // its real emoji, exactly like the grid layout already enforces.
        const hardLocked = cfg.hardLock && soon
        const glowNew = !hardLocked && isGlowingNew(s)
        const cls = 'qm-node' + (s.boss ? ' boss' : '') + (s.cp ? ' cp' : '') + (s.done ? ' done' : '')
          + (isCurrent ? ' current' : '') + (soon ? ' soon' : '') + (hardLocked ? ' locked' : '') + (s.rusty ? ' rusty' : '') + (glowNew ? ' new' : '')
        html += '<div class="qm-pwrap" style="transform:translateX(' + OFF[k % OFF.length] + 'px)">'
          + '<div class="' + cls + '"' + (hardLocked ? '' : ' onclick="QuestMap._open(\'' + esc(s.id) + '\')"') + ' title="' + esc(hardLocked ? 'Complete earlier stages first' : (glowNew ? '✨ New! ' + s.label : s.label)) + '">'
          + (isCurrent && cfg.avatarSvg ? '<span class="qm-avatar">' + cfg.avatarSvg + '</span>' : '')
          + (s.rusty ? '<span class="qm-rusty-tag">🩹</span>' : '')
          + (glowNew ? '<span class="qm-new-badge">NEW</span>' : '')
          + '<span class="qm-emoji">' + (hardLocked ? '🔒' : (s.emoji || '📘')) + '</span>'
          + (s.done ? '<span class="qm-done-mark">' + (s.stars ? '⭐'.repeat(s.stars) : (s.boss ? '🏆' : '⭐')) + '</span>' : '')
          + '</div>'
          + '<div class="qm-plabel">' + esc(s.label)
          + (s.rusty ? '<div class="qm-pstars" style="color:#f59e0b">rusty — re-fight the boss!</div>'
             : s.stars && !s.done ? '<div class="qm-pstars">' + '⭐'.repeat(s.stars) + '</div>' : '') + '</div>'
          + (isCurrent ? '<div class="qm-next-pill">▶ NEXT UP</div>' : (glowNew ? '<div class="qm-new-pill">✨ NEW</div>' : ''))
          + '</div>'
        k++
      }
      html += '</div>'
    }
    return html + '</div>'
  }

  return {
    show(config) { cfg = config; render() },
    refresh() { if (cfg && document.getElementById('qm-overlay')) render() },
    hide() {
      const el = document.getElementById('qm-overlay')
      if (el) el.remove()
    },
    // The SINGLE path every stage open goes through — a map-node click, the
    // "Continue" button, AND a direct ?stage=<id> URL (see each grade's own
    // init script) all call this, so the lock check applies no matter how a
    // student got here. Before this, only the MAP's own rendering hid a
    // locked node behind 🔒 — opening one directly by its id (a URL anyone
    // can type or copy, e.g. from a "Start Exam" link's own ?stage=
    // pattern) skipped that check entirely, letting a student jump straight
    // into any later stage, prerequisites or not.
    _open(id) {
      if (isHardLocked(id)) {
        showLockedToast()
        return
      }
      const cb = cfg && cfg.onOpen
      markSeen(id)
      QuestMap.hide()
      if (cb) cb(id)
    },
    // Exposed so a grade's own init script can check BEFORE even calling
    // _open — e.g. to decide whether a ?stage= URL should land on that
    // stage or just fall back to the map.
    isLocked(id) { return isHardLocked(id) },
  }
})()
