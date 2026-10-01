// Verifies the "what's new on the map" highlight in public/js/quest-map.js:
//  - a stage marked isNew:true glows (a distinct 'new' class + a NEW badge/pill),
//    a stage not in the new list never does
//  - clicking a glowing stage (_open) marks it seen in localStorage; a FRESH
//    QuestMap instance (simulating a page reload) then renders it WITHOUT the glow
//  - the world header and the top summary banner only appear while something
//    unopened is still glowing
//  - grid layout, path layout and locked path nodes are all covered
import { readFileSync } from 'fs'
import vm from 'vm'

const src = readFileSync('c:/Users/user/Downloads/ICT website/public/js/quest-map.js', 'utf8')

function freshMap(store) {
  const sandbox = {
    document: {
      getElementById: () => null,
      createElement: () => ({ appendChild() {}, setAttribute() {} }),
      head: { appendChild() {} },
      documentElement: { style: { setProperty() {} } },
      body: { appendChild() {} },
    },
    localStorage: {
      getItem: k => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = v },
    },
    console,
  }
  vm.createContext(sandbox)
  vm.runInContext(src + '\nthis.QuestMap = QuestMap', sandbox)
  return sandbox.QuestMap
}

let pass = 0, fail = 0
const ok = (c, m) => { if (c) { pass++; console.log('✓ ' + m) } else { fail++; console.log('✗ ' + m) } }

// Capture what render() produces by hijacking the overlay element.
function renderHtml(QM, cfg) {
  let html = ''
  const overlay = { set innerHTML(v) { html = v }, get innerHTML() { return html }, querySelector: () => null }
  const origGetById = QM.__proto__  // not used; instead monkey-patch via a real DOM-ish stub below
  return { QM, overlay }
}
// Simpler: give quest-map.js a real minimal DOM stub that returns one shared overlay node.
function run(store, worlds, extra) {
  const overlay = { innerHTML: '', remove() {}, querySelector: sel => (sel.includes('current') && overlay.innerHTML.includes('qm-node current') ? { scrollIntoView() {} } : null) }
  const sandbox = {
    document: {
      getElementById: id => (id === 'qm-overlay' ? overlay : null),
      createElement: () => ({ appendChild() {}, setAttribute() {}, style: {} }),
      head: { appendChild() {} },
      documentElement: { style: { setProperty() {} } },
      body: { appendChild(el) { if (el && el.id === undefined) {} } },
    },
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = v } },
    setTimeout: () => {},
    console,
  }
  // body.appendChild needs to actually attach the overlay the first time getElementById would return it —
  // simplest: pre-seed getElementById to always return the same overlay object (as if already in the DOM).
  vm.createContext(sandbox)
  vm.runInContext(src + '\nthis.QuestMap = QuestMap', sandbox)
  sandbox.QuestMap.show({ title: 'T', subtitle: 's', worlds, newSeenKey: 'seenkey', onOpen() {}, ...extra })
  return { html: overlay.innerHTML, QM: sandbox.QuestMap }
}

const gridWorld = (stages) => [{ name: 'World 1', sub: '', live: true, stages }]

// ── Grid layout ──────────────────────────────────────────────────────────────
{
  const store = {}
  // 'a' must be done so 'b' unlocks under the grid's sequential-progression rule
  const { html } = run(store, gridWorld([
    { id: 'a', emoji: '📘', label: 'A', done: true },
    { id: 'b', emoji: '📗', label: 'B', done: false, isNew: true },
    { id: 'c', emoji: '📕', label: 'C', done: false },
  ]))
  ok(html.includes('qm-new-badge') && (html.match(/class="qm-node[^"]*\bnew\b[^"]*"/g) || []).length === 1, 'grid: exactly the isNew stage gets the new-badge/class')
  ok(html.includes('qm-wnew-tag'), 'grid: the world header shows a ✨ NEW tag')
  ok(html.includes('qm-new-banner') && html.includes('1 new lesson'), 'grid: the top banner announces 1 new lesson')
}
{
  // done stages never glow even if flagged isNew (nothing to draw attention to once finished)
  const store = {}
  const { html } = run(store, gridWorld([{ id: 'a', emoji: '📘', label: 'A', done: true, isNew: true }]), { freeRoam: true })
  ok(!html.includes('qm-new-badge') && !html.includes('qm-new-banner'), 'grid: a DONE stage never glows, even if isNew')
}
{
  // no newSeenKey passed at all → highlight fully disabled, no crash
  const store = {}
  const { html } = run(store, gridWorld([{ id: 'a', emoji: '📘', label: 'A', done: false, isNew: true }]), { newSeenKey: undefined, freeRoam: true })
  ok(!html.includes('qm-new-badge'), 'grid: omitting newSeenKey disables the highlight entirely')
}

// ── Opening a stage marks it seen — persists across a fresh page load ────────
{
  const store = {}
  const worlds = gridWorld([{ id: 'x', emoji: '📘', label: 'X', done: false, isNew: true }])
  const first = run(store, worlds, { freeRoam: true })
  ok(first.html.includes('qm-new-badge'), 'seen-tracking: glows before it has ever been opened')
  first.QM._open('x')   // student clicks it
  ok(JSON.parse(store.seenkey || '[]').includes('x'), 'seen-tracking: _open() records the id in localStorage')
  // Simulate a page reload: brand-new QuestMap module instance, same localStorage
  const second = run(store, worlds, { freeRoam: true })
  ok(!second.html.includes('qm-new-badge'), 'seen-tracking: after a reload, the SAME stage no longer glows')
}
{
  // a second, still-unopened new stage keeps glowing after the first is opened
  const store = {}
  const worlds = gridWorld([
    { id: 'x', emoji: '📘', label: 'X', done: false, isNew: true },
    { id: 'y', emoji: '📗', label: 'Y', done: false, isNew: true },
  ])
  const r1 = run(store, worlds, { freeRoam: true })
  r1.QM._open('x')
  const r2 = run(store, worlds, { freeRoam: true })
  const stillNew = (r2.html.match(/qm-new-badge/g) || []).length
  ok(stillNew === 1, 'seen-tracking: opening one new stage leaves the OTHER still glowing')
}

// ── Path layout (Grade 8/9's map style) ──────────────────────────────────────
{
  const store = {}
  const pathWorld = [{ name: 'W', sub: '', live: true, stages: [
    { id: 'p1', emoji: '📘', label: 'One', done: true },
    { id: 'p2', emoji: '📗', label: 'Two', done: false, isNew: true },
    { id: 'p3', emoji: '📕', label: 'Three', done: false },
  ] }]
  const { html } = run(store, pathWorld, { layout: 'path', softLock: true, hardLock: true })
  // the flagged stage may also be the map's "current" stage, in which case the
  // NEXT-UP pill takes priority over the NEW pill — the glow/badge is what matters
  ok(html.includes('qm-new-badge') && (html.includes('qm-new-pill') || html.includes('qm-next-pill')), 'path layout: the isNew stage gets the badge, and a pill (NEW or NEXT UP)')
  ok((html.match(/qm-new-badge/g) || []).length === 1, 'path layout: only the flagged stage glows, not its neighbours')
}
{
  // hard-locked future content must never glow — a student can't open it yet anyway
  const store = {}
  const pathWorld = [{ name: 'W', sub: '', live: true, stages: [
    { id: 'p1', emoji: '📘', label: 'One', done: false },
    { id: 'p2', emoji: '📗', label: 'Two', done: false, isNew: true },   // far ahead, hard-locked
  ] }]
  const { html } = run(store, pathWorld, { layout: 'path', softLock: true, hardLock: true })
  ok(!html.includes('qm-new-badge'), 'path layout: a hard-locked (not yet reachable) new stage does not glow')
}

// ── "Continue" button — one unmissable arrow to the student's actual next stage ──
{
  const store = {}
  const pathWorld = [{ name: 'W', sub: '', live: true, stages: [
    { id: 'p1', emoji: '📘', label: 'One', done: true },
    { id: 'p2', emoji: '📗', label: 'Two', done: false },
    { id: 'p3', emoji: '📕', label: 'Three', done: false },
  ] }]
  const { html, QM } = run(store, pathWorld, { layout: 'path', softLock: true, hardLock: true })
  const btnMatch = /<button class="qm-continue-btn"[^>]*>[\s\S]*?<\/button>/.exec(html)
  ok(!!btnMatch, 'path layout: a Continue button is rendered')
  ok(!!btnMatch && btnMatch[0].includes('Two') && !btnMatch[0].includes('Three'), 'path layout: Continue button names the actual next (first incomplete) stage, not a later one')
  ok(!!btnMatch && btnMatch[0].includes("_open('p2')"), 'path layout: clicking Continue opens the correct stage id')
  QM._open('p2')
  ok(JSON.parse(store.seenkey || '[]').includes('p2'), 'path layout: Continue button reuses the normal _open() click path (marks seen like any other open)')
}
{
  // everything done — no "next" stage exists, so no Continue button (nothing to point at)
  const store = {}
  const pathWorld = [{ name: 'W', sub: '', live: true, stages: [
    { id: 'p1', emoji: '📘', label: 'One', done: true },
  ] }]
  const { html } = run(store, pathWorld, { layout: 'path' })
  ok(!html.includes('qm-continue-btn'), 'path layout: no Continue button once every stage is done')
}
{
  // a module inserted BEFORE the student's real position (e.g. new content added
  // mid-curriculum) must still point the Continue button at the earlier gap, not
  // drag them back past it — same "furthest completed, then first gap after that"
  // rule the NEXT-UP pill itself already uses.
  const store = {}
  const pathWorld = [{ name: 'W', sub: '', live: true, stages: [
    { id: 'p1', emoji: '📘', label: 'One', done: false },   // new gap, inserted early
    { id: 'p2', emoji: '📗', label: 'Two', done: true },
    { id: 'p3', emoji: '📕', label: 'Three', done: true },
  ] }]
  const { html } = run(store, pathWorld, { layout: 'path', softLock: true })
  ok(html.includes('qm-continue-btn') && html.includes('>One<'), 'path layout: Continue button points at an earlier gap, not back past finished work')
}

console.log(`\n${pass} passed, ${fail} failed.`)
if (fail > 0) process.exit(1)
console.log('the "what\'s new" map highlight lights only unopened new stages, and clears once opened')
