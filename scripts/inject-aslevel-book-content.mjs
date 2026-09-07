// One-off script: wires the 92 real Cambridge coursebook lesson pages
// (public/lessons/as-level-book/1-*.html .. 15-*.html) into public/lessons/as-level.html's
// existing "AS Level Journey" map — Chapters 1-15, spanning the current
// Paper 1 (theory, ch1-10 + the standalone db-x Databases Practice Lab) and
// Paper 2 (programming, ch11-15) sidebars.
//
// Unlike a-level.html, as-level.html's existing chapters ALL already hold
// real hand-authored content (videos, keyTerms, mark-scheme questions) — but
// from roughly Chapter 7 onward every id is shifted one number below its
// on-screen label, AND several ids hold content that doesn't match the real
// book chapter of that number at all:
//   id ch3  labeled "Hardware"            → actual topics are CPU architecture/
//                                            cache/VMs, not real Ch3 (memory,
//                                            secondary storage, I/O devices)
//   id ch4  labeled "Logic & Boolean"      → includes Karnaugh Maps, which is
//                                            real A-Level (9618) content, not AS Ch4
//   id ch7  labeled "Monitoring & Control" → that whole subject is real A-Level
//                                            Ch22, not part of the AS 1-15 book at all
//   id ch8  labeled "System Software"      → is really Ch7's subject
//   id ch9  labeled "Security & Privacy"   → is really Ch8's subject
//   id ch10 labeled "Ethics & Ownership"   → is really Ch9's subject
//   ids ch11..ch14 (Paper 2) labeled "Ch12..Ch15" → each one number ahead of
//     its id, and ch13/ch14's actual topics (stacks/queues/linked lists/trees;
//     file operations) are real A-Level content, not part of the AS 1-15 book
//
// Per the same "relabel the mismatched chapters to match the real book, then
// enrich" decision already applied to a-level.html: every id chN below is
// relabelled AND repopulated to hold real book Chapter N — its label, its
// CHAPTER_TOPICS entry, and its TOPICS content all become chapter N's real
// subject. This REPLACES the previous (shifted/mismatched) sidebar entries
// and TOPICS content for ids ch1-ch14, and adds a new ch15 (the book has no
// site chapter for real Ch15 "Software Development" at all yet).
//
// The one deliberate exception: the existing "Ch 11 — Databases" block (the
// db-1/db-2/db-3 ids) is a fully custom, working SQL practice lab (its own
// IDE tab, seeded tables, graded exercises) — real, valuable hand-built
// content with no equivalent in the plain iframe-embed pattern used
// elsewhere in this script. It is left completely untouched (not moved,
// relabelled, or overwritten) rather than risk breaking it; the new ch10
// (real book Ch10 — Database & Data Modelling theory: ER modelling,
// normalisation, SQL as a language) sits right above it as a natural
// theory-then-practice pairing, even though both now nominally reference
// "chapter 10/11 databases" under two different numbering schemes in the
// same sidebar.
//
// Idempotent: re-running regenerates the same regions from scratch.
// Run with: node scripts/inject-aslevel-book-content.mjs

import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TARGET = path.join(__dirname, '..', 'public', 'lessons', 'as-level.html')
const BOOK_DIR = '/lessons/as-level-book/'
const BOOK_SRC_DIR = path.join(__dirname, '..', 'public', 'lessons', 'as-level-book')

// Reads the lesson's own <div class="topic-title"> and splits it into its
// real book subsection number (e.g. "13.02", "14.01–14.02") and label text —
// rather than inventing a sequential "13.1, 13.2, ..." number, so the
// sidebar always shows the exact number the embedded page itself displays.
const _metaCache = new Map()
function getLessonMeta(file) {
  if (_metaCache.has(file)) return _metaCache.get(file)
  const src = readFileSync(path.join(BOOK_SRC_DIR, file), 'utf8')
  const m = src.match(/<div class="topic-title">([^<]*)<\/div>/)
  if (!m) throw new Error('No topic-title found in ' + file)
  const raw = m[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'")
  const nm = raw.match(/^([\d.–]+)\s+(.*)$/)
  if (!nm) throw new Error('Could not parse number/title from: ' + raw)
  const meta = { number: nm[1], label: nm[2] }
  _metaCache.set(file, meta)
  return meta
}

// ── Manifest: real Cambridge chapters 1-15, one entry per lesson file ───────
const CHAPTERS = [
  { num: 1, title: 'Information Representation', lessons: [
    ['1-1a-number-systems.html', 'Number Systems'],
    ['1-2a-twos-complement.html', "Two's Complement"],
    ['1-2b-binary-coded-decimal.html', 'Binary Coded Decimal (BCD)'],
    ['1-3a-character-coding.html', 'Internal Coding of Text: ASCII & Unicode'],
    ['1-4a-vector-graphics.html', 'Vector Graphics'],
    ['1-4b-bitmaps-file-size.html', 'Bitmaps & File Size'],
    ['1-5a-sound-representation.html', 'Sound Representation'],
    ['1-6a-video-representation.html', 'Video Representation'],
    ['1-7a-compression.html', 'Compression Techniques & Multimedia Packaging'],
  ]},
  { num: 2, title: 'Communication & Internet Technologies', lessons: [
    ['2-1a-cable-transmission.html', 'Cable Transmission Media'],
    ['2-1b-wireless-transmission.html', 'Wireless Transmission'],
    ['2-2a-internet-structure-isps.html', 'The Internet: Structure & ISPs'],
    ['2-2b-satellites.html', 'Satellite Communication'],
    ['2-3a-www-vs-internet.html', 'The World Wide Web vs the Internet'],
    ['2-4a-internet-hardware.html', 'Internet-Supporting Hardware'],
    ['2-5a-client-server.html', 'Client-Server Architecture'],
    ['2-6a-bit-streaming.html', 'Bit Streaming'],
  ]},
  { num: 3, title: 'Hardware', lessons: [
    ['3-1a-memory-system.html', 'The Memory System'],
    ['3-2a-ram-rom.html', 'Memory Components: RAM & ROM'],
    ['3-3a-secondary-storage.html', 'Secondary Storage Devices'],
    ['3-4a-computer-graphics.html', 'Computer Graphics: Halftoning'],
    ['3-5a-screens-and-mouse.html', 'Screens and Associated Technologies'],
    ['3-6a-keyboards-keypads.html', 'Keyboards and Keypads'],
    ['3-7a-printers-scanners-plotters.html', 'Printers, Scanners and Plotters'],
    ['3-8a-sound-io.html', 'Input and Output of Sound'],
  ]},
  { num: 4, title: 'Logic Gates & Logic Circuits', lessons: [
    ['4-1a-boolean-logic-problem-statements.html', 'Boolean Logic and Problem Statements'],
    ['4-2a-boolean-operators.html', 'Boolean Operators'],
    ['4-3a-truth-tables.html', 'Truth Tables'],
    ['4-4a-logic-circuits-gates.html', 'Logic Circuits and Logic Gates'],
    ['4-5a-alternative-circuits-universal-gates.html', 'Alternative Circuits'],
  ]},
  { num: 5, title: 'Processor Fundamentals', lessons: [
    ['5-1a-von-neumann-model.html', 'The Von Neumann Model'],
    ['5-2a-cpu-architecture-registers.html', 'CPU Architecture & Registers'],
    ['5-3a-system-bus.html', 'The System Bus'],
    ['5-4a-fetch-execute-cycle.html', 'The Fetch-Execute Cycle'],
    ['5-5a-register-transfer-notation.html', 'Register Transfer Notation'],
    ['5-6a-interrupt-handling.html', 'Interrupt Handling'],
  ]},
  { num: 6, title: 'Assembly Language Programming', lessons: [
    ['6-1a-machine-code-instructions.html', 'Machine Code Instructions'],
    ['6-2a-assembly-language.html', 'Assembly Language'],
    ['6-3a-addressing-modes.html', 'Addressing Modes'],
    ['6-4a-assembly-language-instructions.html', 'Assembly Language Instructions'],
  ]},
  { num: 7, title: 'System Software', lessons: [
    ['7-1a-system-software.html', 'System Software'],
    ['7-2a-operating-system-activities.html', 'Operating System Activities'],
    ['7-3a-utility-programs.html', 'Utility Programs Used by a PC'],
    ['7-4a-library-programs.html', 'Library Programs'],
    ['7-5a-language-translators.html', 'Language Translators'],
  ]},
  { num: 8, title: 'Data Security, Privacy & Integrity', lessons: [
    ['8-1a-integrity-privacy-security-definitions.html', 'Definitions of Data Integrity, Privacy and Security'],
    ['8-2a-protecting-computer-systems.html', 'Security Measures for Protecting Computer Systems'],
    ['8-3a-protecting-data.html', 'Security Measures for Protecting Data'],
    ['8-4a-validation-verification.html', 'Data Validation and Verification'],
  ]},
  { num: 9, title: 'Ethics & Ownership', lessons: [
    ['9-1a-ethics-definitions.html', 'Ethics'],
    ['9-2a-acm-ieee-code.html', 'The ACM/IEEE Software Engineering Code of Ethics'],
    ['9-3a-public-good.html', 'The Public Good'],
    ['9-4a-ownership-copyright.html', 'Ownership and Copyright'],
    ['9-5a-internet-copyright-consequences.html', "The Internet's Consequences for Copyright"],
    ['9-6a-software-licensing.html', 'Software Licensing'],
  ]},
  { num: 10, title: 'Database & Data Modelling', lessons: [
    ['10-1a-file-based-limitations.html', 'Limitations of a File-Based Approach'],
    ['10-2a-database-approach-three-level.html', 'The Database Approach'],
    ['10-3a-relational-database.html', 'The Relational Database'],
    ['10-4a-er-modelling.html', 'Entity-Relationship Modelling'],
    ['10-5a-logical-er-model.html', 'A Logical Entity-Relationship Model'],
    ['10-6a-normalisation.html', 'Normalisation'],
    ['10-7a-sql.html', 'Structured Query Language (SQL)'],
    ['10-8a-dbms-features.html', 'DBMS Features'],
  ]},
  { num: 11, title: 'Algorithm Design & Problem Solving', lessons: [
    ['11-1a-what-is-an-algorithm.html', 'What Is an Algorithm?'],
    ['11-2a-expressing-algorithms.html', 'Expressing Algorithms'],
    ['11-3a-variables.html', 'Variables'],
    ['11-4a-assignments.html', 'Assignments'],
    ['11-5a-logic-statements.html', 'Logic Statements'],
    ['11-6a-loops.html', 'Loops'],
    ['11-7a-arrays.html', 'Working with Arrays'],
  ]},
  { num: 12, title: 'Stepwise Refinement & Structure Charts', lessons: [
    ['12-1a-stepwise-refinement.html', 'Stepwise Refinement'],
    ['12-2a-modules.html', 'Modules'],
    ['12-3a-structure-charts.html', 'Structure Charts'],
    ['12-4a-pseudocode-from-structure-chart.html', 'Deriving Pseudocode from a Structure Chart'],
  ]},
  { num: 13, title: 'Programming & Data Representation', lessons: [
    ['13-2a-programming-basics.html', 'Programming Basics'],
    ['13-3a-data-types.html', 'Data Types'],
    ['13-4a-boolean-expressions.html', 'Boolean Expressions'],
    ['13-5a-selection.html', 'Selection'],
    ['13-6a-iteration.html', 'Iteration'],
    ['13-7a-arrays.html', 'Arrays'],
    ['13-8a-built-in-functions.html', 'Built-in Functions'],
  ]},
  { num: 14, title: 'Structured Programming', lessons: [
    ['14-1a-procedures.html', 'Procedures'],
    ['14-3a-functions.html', 'Functions'],
    ['14-4a-passing-parameters.html', 'Passing Parameters to Subroutines and Functions'],
    ['14-6a-by-value-by-reference.html', 'Passing Parameters to Procedures'],
    ['14-7a-putting-it-together.html', 'Putting It All Together'],
  ]},
  { num: 15, title: 'Software Development', lessons: [
    ['15-1a-development-cycle.html', 'Stages in the Program Development Cycle'],
    ['15-2a-ide-features.html', 'Features of a Typical IDE'],
    ['15-3a-testing-strategies.html', 'Testing Strategies'],
    ['15-4a-debugging-tools.html', 'Program Testing Using the IDE'],
    ['15-5a-trace-tables.html', 'Dry-Running an Algorithm'],
    ['15-6a-maintenance.html', 'Corrective & Adaptive Maintenance'],
  ]},
]

const PAPER1 = CHAPTERS.filter(c => c.num <= 10)   // matches existing isP2 = chNum >= 11 split
const PAPER2 = CHAPTERS.filter(c => c.num >= 11)

function esc(s) { return String(s).replace(/'/g, "\\'") }
function escHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;') }

// ── 1. Sidebar chapter blocks ────────────────────────────────────────────────
function buildSidebar(chapters, firstUnlocked) {
  return chapters.map(ch => {
    const ids = ch.lessons.map((_, i) => `ch${ch.num}-${i + 1}`)
    const unlocked = ch.num === firstUnlocked
    const progText = unlocked ? `0/${ids.length}` : 'Soon'
    const collapsedCls = unlocked ? '' : ' collapsed'
    const arrowCls = unlocked ? ' open' : ''
    const topicRows = ch.lessons.map(([file], i) => {
      const meta = getLessonMeta(file)
      return `          <div class="topic-item" id="nav-ch${ch.num}-${i + 1}" onclick="loadTopic('ch${ch.num}-${i + 1}')">${escHtml(meta.number)} ${escHtml(meta.label)}</div>`
    }).join('\n')
    return `      <!-- Chapter ${ch.num} -->
      <div class="chapter-block">
        <div class="chapter-toggle" onclick="toggleChapter('ch${ch.num}')">
          <span class="chapter-toggle-label">Ch ${ch.num} — ${escHtml(ch.title)}</span>
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="ch-prog${unlocked ? ' unlocked' : ''}" id="ch${ch.num}-prog">${progText}</span>
            <span class="chapter-toggle-arrow${arrowCls}" id="ch${ch.num}-arrow">▶</span>
          </div>
        </div>
        <div class="chapter-topics${collapsedCls}" id="ch${ch.num}-topics">
${topicRows}
          <div class="topic-item exam-item" id="nav-ch${ch.num}-exam" onclick="loadExam(${ch.num})" title="Not yet released">🔒 Chapter ${ch.num} Exam</div>
        </div>
      </div>`
  }).join('\n\n')
}

// ── 2. CHAPTER_TOPICS object body ───────────────────────────────────────────
function buildChapterTopics() {
  const p1lines = PAPER1.map(ch => `  ${String(ch.num).padStart(2, ' ')}: [${ch.lessons.map((_, i) => `'ch${ch.num}-${i + 1}'`).join(',')}],`)
  const p2lines = PAPER2.map(ch => `  ${ch.num}: [${ch.lessons.map((_, i) => `'ch${ch.num}-${i + 1}'`).join(',')}],`)
  return `const CHAPTER_TOPICS = {
${p1lines.join('\n')}
  // ch11+ IDs belong to Paper 2; Paper 1's separate Databases Practice Lab
  // (real book Ch10 content lives in ch10-x above) uses db-x IDs — see DB_TOPICS
${p2lines.join('\n')}
}`
}

// ── 3. TOPICS['chN-M'] entries — each embeds the real static lesson page ────
function buildTopicsEntries() {
  const out = []
  for (const ch of CHAPTERS) {
    ch.lessons.forEach(([file], i) => {
      const meta = getLessonMeta(file)
      const id = `ch${ch.num}-${i + 1}`
      const src = BOOK_DIR + file
      const theory = `<iframe src="${src}" style="width:100%;min-height:900px;border:0;border-radius:10px;background:#0d0f1a;" loading="lazy" title="${escHtml(meta.label)}" onload="try{this.style.height=(this.contentWindow.document.body.scrollHeight+40)+'px'}catch(e){}"></iframe>`
      const example = `<p style="color:#9ca3af;">The full worked example is embedded in the lesson above — scroll down inside it for the complete walkthrough.</p>`
      out.push(`  '${id}': {
    chapter: 'Chapter ${ch.num} — ${esc(ch.title)}',
    title: '${esc(meta.number)} ${esc(meta.label)}',
    subtitle: 'From the Cambridge coursebook — includes a full worked lesson and 6 practice questions with answer keys.',
    videos: [],
    keyTerms: [],
    theory: \`${theory}\`,
    example: \`${example}\`,
    questions: [],
  },`)
    })
  }
  return out.join('\n')
}

let html = readFileSync(TARGET, 'utf8')

// ── Splice 1: Paper 1 sidebar (Chapters 1-10) ───────────────────────────────
// Leaves the "<!-- Chapter 11 — Databases (Paper 1) -->" db-x block (which
// immediately follows) completely untouched.
{
  const startMarker = '      <!-- Chapter 1 -->'
  const endMarker = '      <!-- Chapter 11 — Databases (Paper 1) -->'
  const s = html.indexOf(startMarker)
  const e = html.indexOf(endMarker)
  if (s === -1 || e === -1 || e < s) throw new Error('Could not find Paper 1 sidebar anchors — aborting.')
  const replacement = buildSidebar(PAPER1, 1) + '\n\n'
  html = html.slice(0, s) + replacement + html.slice(e)
}

// ── Splice 2: Paper 2 sidebar (Chapters 11-15) ──────────────────────────────
{
  const startMarker = '      <!-- Chapter 11 -->'
  const endMarker = '    <!-- Right: challenges + output'
  const s = html.indexOf(startMarker)
  const e = html.indexOf(endMarker)
  if (s === -1 || e === -1 || e < s) throw new Error('Could not find Paper 2 sidebar anchors — aborting.')
  const replacement = buildSidebar(PAPER2, 11) + '\n    </div>\n\n'
  html = html.slice(0, s) + replacement + html.slice(e)
}

// ── Splice 3: CHAPTER_TOPICS object ─────────────────────────────────────────
{
  const s = html.indexOf('const CHAPTER_TOPICS = {')
  if (s === -1) throw new Error('Could not find CHAPTER_TOPICS — aborting.')
  const e = html.indexOf('\n}', s)
  if (e === -1) throw new Error('Could not find CHAPTER_TOPICS closing brace — aborting.')
  html = html.slice(0, s) + buildChapterTopics() + html.slice(e + 2)
}

// ── Splice 4: TOPICS entries (idempotent block, replaces ch1-1..ch14-* range)
// Unlike a-level.html, as-level.html has NO hidden duplicate-key shadow block
// and every id ch1-1..ch14-4 already exists as a real (single-quoted) entry
// earlier in this same object. We therefore strip each of those existing
// entries by name first, then insert the full replacement set (ch1-1..ch15-6)
// just before TOPICS' own closing brace — avoiding both "duplicate key silently
// shadowed" (a-level bug #1) and any leftover old entries that no longer
// correspond to anything in the rebuilt sidebar.
{
  const START = '  // ── BOOK-CONTENT-START (scripts/inject-aslevel-book-content.mjs) ──'
  const END = '  // ── BOOK-CONTENT-END ──'
  const s0 = html.indexOf(START)
  const e0 = html.indexOf(END)
  if (s0 !== -1 && e0 !== -1) html = html.slice(0, s0) + html.slice(e0 + END.length + 1)

  const topicsStart = html.indexOf('const TOPICS = {')
  if (topicsStart === -1) throw new Error('Could not find TOPICS opener — aborting.')
  const closeRe = /\n\}/g
  closeRe.lastIndex = topicsStart
  const m = closeRe.exec(html)
  if (!m) throw new Error('Could not find TOPICS closing brace — aborting.')
  const topicsEnd = m.index
  let body = html.slice(topicsStart, topicsEnd)

  // Strip every existing 'chN-M': { ... } entry for N in 1-14 (single-quoted
  // key, top-level within TOPICS — matches this file's consistent 2-space
  // indent formatting) so the old mismatched content can't linger unused.
  const OLD_IDS = []
  for (const ch of CHAPTERS.filter(c => c.num <= 14)) {
    // old sidebar had at most 6 sub-ids per chapter; strip generously (1-9)
    for (let i = 1; i <= 9; i++) OLD_IDS.push(`ch${ch.num}-${i}`)
  }
  for (const id of OLD_IDS) {
    const key = `'${id}':`
    const ks = body.indexOf(`\n  ${key}`)
    if (ks === -1) continue
    // Find the matching closing "  },\n" for this entry by brace counting
    // from the entry's opening "{".
    const braceOpen = body.indexOf('{', ks)
    let depth = 0, i = braceOpen
    for (; i < body.length; i++) {
      if (body[i] === '{') depth++
      else if (body[i] === '}') { depth--; if (depth === 0) break }
    }
    // consume trailing ",\n" (or just "\n") after the closing brace
    let end = i + 1
    if (body[end] === ',') end++
    if (body[end] === '\n') end++
    body = body.slice(0, ks + 1) + body.slice(end)
  }

  html = html.slice(0, topicsStart) + body + html.slice(topicsEnd)

  // Recompute the (now-shifted) closing-brace position and insert the new
  // block immediately before it.
  closeRe.lastIndex = topicsStart
  const m2 = closeRe.exec(html)
  if (!m2) throw new Error('Could not re-find TOPICS closing brace after stripping — aborting.')
  const insertAt = m2.index
  const before = html.slice(0, insertAt)
  const needsComma = !/,\s*$/.test(before)
  const block = `${needsComma ? ',' : ''}\n${START}\n${buildTopicsEntries()}\n${END}\n`
  html = before + block + html.slice(insertAt)
}

// ── Splice 5: cosmetic cleanup ───────────────────────────────────────────────
// (a) Dead section-divider comments (e.g. "// ── Chapter 7 — Monitoring &
//     Control ──") left behind over now-empty gaps by Splice 4's entry
//     stripping — these described the OLD mismatched content and no longer
//     precede anything. Strip any such divider that isn't immediately
//     followed by a real entry (the db-1 block's own header is real and kept).
// (b) A stale doc comment quoting the old Paper 1 topic count.
// (c) The standalone SQL Practice Lab's sidebar label still says "Ch 11 —
//     Databases", which now collides with the real Chapter 11 (Algorithm
//     Design) shown in the Paper 2 panel. Rename it so both can't be read as
//     the same numbered chapter.
{
  const topicsStart2 = html.indexOf('const TOPICS = {')
  const db1Start = html.indexOf("'db-1':")
  if (topicsStart2 !== -1 && db1Start !== -1 && db1Start > topicsStart2) {
    const headerEnd = topicsStart2 + 'const TOPICS = {'.length
    let header = html.slice(headerEnd, db1Start)
    // Drop every dead divider comment except the real one right above db-1
    // ("Chapter 11 — Databases (Paper 1) — uses db-x IDs..."), then collapse
    // the resulting run of blank lines down to a single blank line.
    header = header
      .split('\n')
      .filter(line => !/^\s*\/\/ ── Chapter \d+.*── *\r?$/.test(line) || /Databases \(Paper 1\)/.test(line))
      .join('\n')
      .replace(/(\r\n|\n){3,}/g, '\r\n\r\n')
    html = html.slice(0, headerEnd) + header + html.slice(db1Start)
  }
  html = html.replace('45 Paper 1 topics', '66 Paper 1 topics')
  html = html.replace(
    '<span class="chapter-toggle-label">Ch 11 — Databases</span>',
    '<span class="chapter-toggle-label">Databases — SQL Practice Lab</span>'
  )
}

writeFileSync(TARGET, html, 'utf8')

const totalLessons = CHAPTERS.reduce((n, c) => n + c.lessons.length, 0)
console.log(`Wired ${totalLessons} book lessons across ${CHAPTERS.length} chapters (1-15) into as-level.html.`)
