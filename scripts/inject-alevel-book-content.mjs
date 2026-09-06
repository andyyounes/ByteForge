// One-off script: wires the 70 real Cambridge coursebook lesson pages
// (public/lessons/as-level-book/16-*.html .. 30-*.html) into public/lessons/a-level.html's
// existing "AS Level Journey" map — Chapters 16-30, spanning the current
// Paper 3 (theory, ch16-22) and Paper 4 (programming, ch23-30) sidebars.
//
// Chapters 22, 23, 24, 25 and 27 previously held invented "extension" topics
// (AI/graph search, sorting/DP, "recursion" mislabelled onto ch24, "paradigms"
// mislabelled onto ch25, design patterns/SOLID) that do not match the real
// Cambridge book's subject for that chapter number. This script REPLACES
// those chapters' sidebar entries with the real subject matter (Monitoring &
// Control, Computational Thinking, Algorithm Design Methods, Recursion, OOP)
// per an explicit decision to relabel-and-enrich rather than leave mismatched.
//
// TOPICS['chN-M'] did not exist at all for chapters 16-29 before this script
// (the page relied solely on the DB-backed generated-lesson system for those
// ids) — so every TOPICS entry this script adds is new, not an overwrite.
//
// Idempotent: re-running regenerates the same three regions from scratch.
// Run with: node scripts/inject-alevel-book-content.mjs

import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TARGET = path.join(__dirname, '..', 'public', 'lessons', 'a-level.html')
const BOOK_DIR = '/lessons/as-level-book/'

// ── Manifest: real Cambridge chapters 16-30, one entry per lesson file ──────
// label = short sidebar text (no leading section-number duplication across
// lessons that share one book subsection, e.g. 16.03 split into 3 lessons).
const CHAPTERS = [
  { num: 16, title: 'Data Representation', lessons: [
    ['16-1a-user-defined-types.html', 'User-Defined Data Types'],
    ['16-2a-file-organisation.html', 'File Organisation'],
    ['16-3a-floating-point-representation.html', 'Fixed-Point vs. Floating-Point'],
    ['16-4a-normalisation.html', 'Precision and Normalisation'],
    ['16-5a-conversion-and-problems.html', 'Converting to Floating-Point'],
  ]},
  { num: 17, title: 'Communication & Internet Technologies', lessons: [
    ['17-1a-network-topologies.html', 'Isolated Network Topologies'],
    ['17-2a-transmission-concepts.html', 'Transmission Concepts'],
    ['17-3a-hardware-devices.html', 'Hardware Connection Devices'],
    ['17-4a-tcp-ip-suite.html', 'The TCP/IP Protocol Suite'],
    ['17-5a-application-layer-protocols.html', 'Application-Layer Protocols'],
    ['17-6a-ethernet.html', 'The Ethernet Protocol'],
    ['17-7a-peer-to-peer.html', 'Peer-to-Peer (P2P) File Sharing'],
    ['17-8a-wireless-networks.html', 'Wireless Networks'],
  ]},
  { num: 18, title: 'Boolean Algebra and Logic Circuits', lessons: [
    ['18-1a-boolean-algebra-basics.html', 'Boolean Algebra Basics'],
    ['18-2a-half-and-full-adders.html', 'Half and Full Adders'],
    ['18-3a-flip-flops.html', 'SR and JK Flip-Flops'],
    ['18-4a-sum-of-products.html', 'Sum of Products'],
    ['18-5a-karnaugh-maps.html', 'Karnaugh Maps (K-maps)'],
  ]},
  { num: 19, title: 'Processor and Computer Architecture', lessons: [
    ['19-1a-cisc-and-risc.html', 'The Control Unit, CISC and RISC'],
    ['19-2a-pipelining.html', 'Pipelining'],
    ['19-3a-parallel-processing.html', 'Parallel Processing'],
  ]},
  { num: 20, title: 'System Software', lessons: [
    ['20-1a-os-purposes.html', 'Purposes of an Operating System'],
    ['20-2a-process-scheduling.html', 'Process Scheduling'],
    ['20-3a-memory-management-and-vm.html', 'Memory Management & Virtual Machines'],
    ['20-4a-compiler-front-end.html', 'Compiler Front End & Grammar'],
    ['20-5a-reverse-polish-notation.html', 'Reverse Polish Notation'],
  ]},
  { num: 21, title: 'Security', lessons: [
    ['21-1a-encryption-fundamentals.html', 'Encryption Fundamentals'],
    ['21-2a-digital-signatures-certificates.html', 'Digital Signatures & Certificates'],
    ['21-3a-ssl-and-tls.html', 'SSL and TLS'],
    ['21-4a-malware.html', 'Malware'],
  ]},
  { num: 22, title: 'Monitoring and Control Systems', lessons: [
    ['22-1a-sensors-actuators-feedback.html', 'Sensors, Actuators and Feedback'],
    ['22-2a-real-time-programming.html', 'Real-Time Programming'],
    ['22-3a-bit-manipulation.html', 'Bit Manipulation'],
  ]},
  { num: 23, title: 'Computational Thinking and Problem-Solving', lessons: [
    ['23-1a-computational-thinking.html', 'What Is Computational Thinking?'],
    ['23-2a-bubble-and-insertion-sort.html', 'Bubble Sort and Insertion Sort'],
    ['23-3a-binary-search.html', 'Binary Search'],
    ['23-4a-adts-stacks-queues.html', 'ADTs, Stacks and Queues'],
    ['23-5a-linked-lists-concept.html', 'Linked Lists: The Concept'],
    ['23-6a-linked-lists-implementation.html', 'Linked Lists: Array Implementation'],
    ['23-7a-binary-trees.html', 'Binary Trees'],
    ['23-8a-hash-tables.html', 'Hash Tables'],
    ['23-9a-dictionaries.html', 'Dictionaries'],
  ]},
  { num: 24, title: 'Algorithm Design Methods', lessons: [
    ['24-1a-decision-tables.html', 'Decision Tables'],
    ['24-2a-jackson-structured-programming.html', 'Jackson Structured Programming'],
    ['24-3a-state-transition-diagrams.html', 'State-Transition Diagrams'],
  ]},
  { num: 25, title: 'Recursion', lessons: [
    ['25-1a-concept-of-recursion.html', 'The Concept of Recursion'],
    ['25-2a-tracing-recursion.html', 'Tracing a Recursive Subroutine'],
    ['25-3a-running-recursion-stack-frames.html', 'Stack Frames'],
    ['25-4a-benefits-and-drawbacks.html', 'Benefits and Drawbacks'],
  ]},
  { num: 26, title: 'Further Programming', lessons: [
    ['26-1a-programming-paradigms.html', 'Programming Paradigms'],
    ['26-2a-records.html', 'Records'],
    ['26-3a-sequential-file-processing.html', 'Sequential File Processing'],
    ['26-4a-random-access-file-processing.html', 'Random-Access File Processing'],
    ['26-5a-exception-handling.html', 'Exception Handling'],
  ]},
  { num: 27, title: 'Object-Oriented Programming (OOP)', lessons: [
    ['27-1a-concept-of-oop.html', 'Concept of OOP'],
    ['27-2a-designing-classes.html', 'Designing Classes and Objects'],
    ['27-3a-writing-oop-code.html', 'Writing Object-Oriented Code'],
    ['27-4a-inheritance.html', 'Inheritance'],
    ['27-5a-polymorphism-garbage-collection.html', 'Polymorphism & Garbage Collection'],
    ['27-6a-containment-aggregation.html', 'Containment (Aggregation)'],
  ]},
  { num: 28, title: 'Low-Level Programming', lessons: [
    ['28-1a-instruction-set-addressing-modes.html', 'Instruction Set & Symbolic Addresses'],
    ['28-2a-assignment-and-selection.html', 'Assembly Patterns: Assignment & Selection'],
    ['28-3a-repetition-and-io.html', 'Assembly Patterns: Repetition & I/O'],
    ['28-4a-absolute-relative-addressing.html', 'Absolute and Relative Addressing'],
    ['28-5a-indirect-addressing.html', 'Indirect Addressing'],
  ]},
  { num: 29, title: 'Declarative Programming', lessons: [
    ['29-1a-declarative-programming-prolog-basics.html', 'Declarative Programming & Prolog Basics'],
    ['29-2a-facts-in-prolog.html', 'Facts in Prolog'],
    ['29-3a-variables-anonymous-variable.html', 'Prolog Variables & the Anonymous Variable'],
    ['29-4a-rules-in-prolog.html', 'Rules in Prolog'],
    ['29-5a-backtracking.html', 'Instantiation and Backtracking'],
    ['29-6a-recursion-in-prolog.html', 'Recursion in Prolog'],
    ['29-7a-lists-in-prolog.html', 'Lists in Prolog'],
  ]},
  { num: 30, title: 'Software Development', lessons: [
    ['30-1a-program-generators-why-errors-occur.html', 'Program Generators & Why Errors Occur'],
    ['30-2a-testing-methods.html', 'Testing Methods'],
    ['30-3a-test-plans-and-data.html', 'Test Plans and Test Data'],
    ['30-4a-error-prevention-pert-charts.html', 'Preventing Errors & PERT Charts'],
    ['30-5a-gantt-charts.html', 'Gantt Charts'],
  ]},
]

const PAPER3 = CHAPTERS.filter(c => c.num <= 22)   // matches existing chNum>=23 isP2 split
const PAPER4 = CHAPTERS.filter(c => c.num >= 23)

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
    const topicRows = ch.lessons.map(([, label], i) =>
      `          <div class="topic-item" id="nav-ch${ch.num}-${i + 1}" onclick="loadTopic('ch${ch.num}-${i + 1}')">${ch.num}.${i + 1} ${escHtml(label)}</div>`
    ).join('\n')
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
  const p3lines = PAPER3.map(ch => `  ${ch.num}: [${ch.lessons.map((_, i) => `'ch${ch.num}-${i + 1}'`).join(',')}],`)
  const p4lines = PAPER4.map(ch => `  ${ch.num}: [${ch.lessons.map((_, i) => `'ch${ch.num}-${i + 1}'`).join(',')}],`)
  return `const CHAPTER_TOPICS = {
  // Paper 3 (theory) — book chapters 16–22
${p3lines.join('\n')}
  // Paper 4 (programming) — book chapters 23–30
${p4lines.join('\n')}
}`
}

// ── 3. updateChapterProgress()'s chapterMap ─────────────────────────────────
function buildChapterMap() {
  const lines = CHAPTERS.map(ch =>
    `    ${ch.num}: { topics: [${ch.lessons.map((_, i) => `'ch${ch.num}-${i + 1}'`).join(',')}] },`
  )
  return `  const chapterMap = {
${lines.join('\n')}
  }`
}

// ── 4. TOPICS['chN-M'] entries — each embeds the real static lesson page ────
function buildTopicsEntries() {
  const out = []
  for (const ch of CHAPTERS) {
    ch.lessons.forEach(([file, label], i) => {
      const id = `ch${ch.num}-${i + 1}`
      const src = BOOK_DIR + file
      const theory = `<iframe src="${src}" style="width:100%;min-height:900px;border:0;border-radius:10px;background:#0d0f1a;" loading="lazy" title="${escHtml(label)}" onload="try{this.style.height=(this.contentWindow.document.body.scrollHeight+40)+'px'}catch(e){}"></iframe>`
      const example = `<p style="color:#9ca3af;">The full worked example is embedded in the lesson above — scroll down inside it for the complete walkthrough.</p>`
      out.push(`  '${id}': {
    chapter: 'Chapter ${ch.num} — ${esc(ch.title)}',
    title: '${ch.num}.${i + 1} ${esc(label)}',
    subtitle: 'From the Cambridge coursebook — includes a full worked lesson and 6 practice questions with answer keys.',
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

// ── Splice 1: Paper 3 sidebar (Chapters 16-22) ──────────────────────────────
{
  const startMarker = '      <!-- Chapter 16 -->'
  const endMarker = '    <!-- Main content with Practice sub-tabs -->'
  const s = html.indexOf(startMarker)
  const e = html.indexOf(endMarker)
  if (s === -1 || e === -1 || e < s) throw new Error('Could not find Paper 3 sidebar anchors — aborting.')
  const replacement = buildSidebar(PAPER3, 16) + '\n    </div>\n\n'
  html = html.slice(0, s) + replacement + html.slice(e)
}

// ── Splice 2: Paper 4 sidebar (Chapters 23-30) ──────────────────────────────
{
  const startMarker = '      <!-- Chapter 23 -->'
  const endMarker = '    <!-- Right: full-width tabbed panel'
  const s = html.indexOf(startMarker)
  const e = html.indexOf(endMarker)
  if (s === -1 || e === -1 || e < s) throw new Error('Could not find Paper 4 sidebar anchors — aborting.')
  const replacement = buildSidebar(PAPER4, 23) + '\n    </div>\n\n'
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

// ── Splice 4: updateChapterProgress()'s chapterMap ──────────────────────────
{
  const s = html.indexOf('  const chapterMap = {')
  if (s === -1) throw new Error('Could not find chapterMap — aborting.')
  const e = html.indexOf('\n  }', s)
  if (e === -1) throw new Error('Could not find chapterMap closing brace — aborting.')
  html = html.slice(0, s) + buildChapterMap() + html.slice(e + 4)
}

// ── Splice 5: TOPICS entries (idempotent block) ─────────────────────────────
// Inserted just BEFORE the TOPICS object's closing brace, not right after its
// opener: a legacy double-quoted-key block (`"ch16-1": {...}` etc., generated
// by an earlier extract-default-lessons.mjs run) already occupies the middle
// of this object for chapters 16-29. JS object literals resolve duplicate
// keys to whichever one appears LAST in source order, so our entries must
// come after that legacy block to actually take effect — otherwise the old
// (and for ch22/23/24/25/27, subject-mismatched) content silently wins.
{
  const START = '  // ── BOOK-CONTENT-START (scripts/inject-alevel-book-content.mjs) ──'
  const END = '  // ── BOOK-CONTENT-END ──'
  const s0 = html.indexOf(START)
  const e0 = html.indexOf(END)
  if (s0 !== -1 && e0 !== -1) html = html.slice(0, s0) + html.slice(e0 + END.length + 1)

  const topicsStart = html.indexOf('const TOPICS = {')
  if (topicsStart === -1) throw new Error('Could not find TOPICS opener — aborting.')
  // Find TOPICS' own closing brace: the first line that is exactly `}` at
  // column 0 after the opener (matches this file's existing formatting).
  const closeRe = /\n\}/g
  closeRe.lastIndex = topicsStart
  const m = closeRe.exec(html)
  if (!m) throw new Error('Could not find TOPICS closing brace — aborting.')
  const insertAt = m.index
  // The legacy block's last entry has no trailing comma (it was the object's
  // final property before this script started inserting more) — add one so
  // splicing more properties in after it stays valid JS.
  const before = html.slice(0, insertAt)
  const needsComma = !/,\s*$/.test(before)
  const block = `${needsComma ? ',' : ''}\n${START}\n${buildTopicsEntries()}\n${END}\n`
  html = before + block + html.slice(insertAt)
}

writeFileSync(TARGET, html, 'utf8')

const totalLessons = CHAPTERS.reduce((n, c) => n + c.lessons.length, 0)
console.log(`Wired ${totalLessons} book lessons across ${CHAPTERS.length} chapters (16-30) into a-level.html.`)
