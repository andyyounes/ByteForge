// One-off script: adds 48 new "lesson" bubbles (self-check completion, no
// check() function) into public/lessons/igcse-y2.html's CHALLENGES array —
// one per rewritten book lesson under public/lessons/igcse-y2-book/. Each
// bubble opens an iframe of the real static lesson page (which already
// carries the teacher-override merge script from
// scripts/inject-book-overrides.mjs) instead of duplicating the content.
//
// The 4 rewritten chapters (7-10) don't map cleanly onto the existing 6
// Camps (M1-M6, which are all specific programming-game topics like BYVAL/
// BYREF or OOP) — same situation as igcse-y1.html's Units 5/6, so this adds
// 4 brand NEW camps (M7-M10) rather than forcing them into an existing one.
//
// Idempotent: strips any previously-injected block (delimited by the
// BOOK-LESSONS-START/END markers) before inserting a fresh copy.
//
// Run with: node scripts/inject-y2-book-lessons-into-map.mjs

import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TARGET = path.join(__dirname, '..', 'public', 'lessons', 'igcse-y2.html')

const CHAPTER_TO_MOD = {
  'Chapter 7': 'M7',   // Algorithm Design & Problem Solving -> new Camp 7
  'Chapter 8': 'M8',   // Programming                        -> new Camp 8
  'Chapter 9': 'M9',   // Databases                           -> new Camp 9
  'Chapter 10': 'M10', // Logic Gates                         -> new Camp 10
}

// Mirrors lib/igcse-book-manifest.ts's IGCSE_Y2_BOOK_UNITS (kept in sync by
// hand — small, stable list).
const CHAPTERS = [
  { unit: 'Chapter 7', lessons: [
    ['7-1a-program-development-life-cycle.html', '7.1a The Program Development Life Cycle'],
    ['7-2a-computer-systems-decomposition.html', '7.2a Computer Systems & Decomposition'],
    ['7-2b-structure-diagrams.html', '7.2b Structure Diagrams'],
    ['7-2c-flowcharts.html', '7.2c Flowcharts'],
    ['7-2d-pseudocode-assignment.html', '7.2d Pseudocode: Assignment Statements'],
    ['7-2e-pseudocode-conditionals.html', '7.2e Pseudocode: Conditional Statements'],
    ['7-2f-pseudocode-iteration.html', '7.2f Pseudocode: Iteration (Loops)'],
    ['7-2g-pseudocode-input-output.html', '7.2g Pseudocode: Input & Output Statements'],
    ['7-3a-purpose-of-an-algorithm.html', '7.3a Explaining the Purpose of an Algorithm'],
    ['7-4a-totalling-counting-average.html', '7.4a Totalling, Counting, Maximum/Minimum & Average'],
    ['7-4b-linear-search.html', '7.4b Linear Search'],
    ['7-4c-bubble-sort.html', '7.4c Bubble Sort'],
    ['7-5a-validation.html', '7.5a Validation'],
    ['7-5b-verification.html', '7.5b Verification'],
    ['7-6a-test-data.html', '7.6a Test Data'],
    ['7-7a-trace-tables.html', '7.7a Trace Tables'],
    ['7-8a-identifying-errors.html', '7.8a Identifying Errors in Algorithms'],
    ['7-9a-writing-algorithms.html', '7.9a Writing and Amending Algorithms'],
    ['7-9b-nested-loops-worked-example.html', '7.9b A Real Nested-Loop Algorithm'],
    ['7-9c-stacks-and-queues.html', '7.9c Stacks and Queues (Extension)'],
  ]},
  { unit: 'Chapter 8', lessons: [
    ['8-1a-variables-constants-data-types.html', '8.1a Variables, Constants & Data Types'],
    ['8-1b-input-output.html', '8.1b Input and Output in Real Code'],
    ['8-1c-sequence.html', '8.1c Sequence — Getting the Order Right'],
    ['8-1d-selection-case.html', '8.1d Selection in Real Code'],
    ['8-1e-iteration.html', '8.1e Iteration in Real Code'],
    ['8-1f-string-handling.html', '8.1f String Handling'],
    ['8-1g-operators.html', '8.1g Arithmetic, Logical & Boolean Operators'],
    ['8-1h-nested-statements.html', '8.1h Nested Statements'],
    ['8-1i-procedures-functions.html', '8.1i Procedures and Functions'],
    ['8-1j-scope.html', '8.1j Local and Global Variables'],
    ['8-1k-library-routines.html', '8.1k Library Routines'],
    ['8-1l-maintainable-programs.html', '8.1l Writing Maintainable Programs'],
    ['8-2a-one-dimensional-arrays.html', '8.2a One-Dimensional Arrays'],
    ['8-2b-two-dimensional-arrays.html', '8.2b Two-Dimensional Arrays'],
    ['8-3a-file-handling.html', '8.3a File Handling'],
  ]},
  { unit: 'Chapter 9', lessons: [
    ['9-1a-database-structure.html', '9.1a Database Structure — Tables, Records & Fields'],
    ['9-1b-data-types-primary-keys.html', '9.1b Data Types & Primary Keys'],
    ['9-1c-sql-basics.html', '9.1c SQL Basics — SELECT, FROM, WHERE'],
    ['9-1d-sql-order-sum-count.html', '9.1d SQL — ORDER BY, SUM, COUNT'],
    ['9-1e-sql-ddl-extension.html', '9.1e SQL DDL (Extension)'],
  ]},
  { unit: 'Chapter 10', lessons: [
    ['10-1a-logic-gates-intro.html', '10.1a Logic Gates & Truth Tables'],
    ['10-1b-six-gate-functions.html', '10.1b The Six Logic Gates'],
    ['10-2a-circuit-to-truth-table.html', '10.2a Tracing a Circuit into a Truth Table'],
    ['10-2b-circuit-to-expression.html', '10.2b Writing a Logic Expression from a Circuit'],
    ['10-2c-expression-to-circuit.html', '10.2c Building a Circuit from an Expression'],
    ['10-2d-truth-table-to-expression.html', '10.2d Writing an Expression from a Truth Table'],
    ['10-2e-problem-to-logic.html', '10.2e Real-World Problems into Logic Circuits'],
    ['10-3a-adders-extension.html', '10.3a Half & Full Adders (Extension)'],
  ]},
]

const START = '  // ── BOOK-LESSONS-START (scripts/inject-y2-book-lessons-into-map.mjs) ──'
const END = '  // ── BOOK-LESSONS-END ──'

function esc(s) { return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") }

let entries = []
for (const { unit, lessons } of CHAPTERS) {
  const mod = CHAPTER_TO_MOD[unit]
  for (const [file, name] of lessons) {
    entries.push(
      `  { mod:'${mod}', name:'${esc(name)}', xp:15, type:'lesson', bookFile:'${file}', hints:[],\n` +
      `    text:'Read the full lesson (theory, key terms, worked examples) and try its 6 practice questions, then mark it complete.' },`
    )
  }
}

const block = `${START}\n${entries.join('\n')}\n${END}\n`

let html = readFileSync(TARGET, 'utf8')

const s = html.indexOf(START)
const e = html.indexOf(END)
if (s !== -1 && e !== -1) {
  html = html.slice(0, s) + html.slice(e + END.length + 1)
}

const anchor = '// mod+name is the stable identity'
const anchorIdx = html.indexOf(anchor)
if (anchorIdx === -1) throw new Error('Could not find CHALLENGES closing marker — aborting to avoid corrupting the file.')
const closeIdx = html.lastIndexOf(']', anchorIdx)
if (closeIdx === -1) throw new Error('Could not find CHALLENGES closing bracket — aborting to avoid corrupting the file.')
const idx = closeIdx

html = html.slice(0, idx) + block + html.slice(idx)
writeFileSync(TARGET, html, 'utf8')

console.log(`Injected ${entries.length} book-lesson bubbles into igcse-y2.html (chapters: ${CHAPTERS.map(u => u.unit).join(', ')}).`)
