// Verifies every AS Level SQL exercise by actually running its own model query
// against its own seed data, in the order a student meets them.
//
// Two pools, neither previously covered by any test:
//   * SQL_EXERCISES  — the Chapter 11 lesson exercises (db-1/db-2/db-3), all on
//                      the hospital schema, run through getSqlDb().
//   * IDE_SETS[*].exercises — the SQL Lab (hospital/school/ecommerce), each with
//                      its own schema, run through getIdeDb().
//
// Real bugs this locks down:
//  1. Expected row counts contradicting the seed data, so an exercise marked its
//     OWN model query wrong: hospital/h3 wanted 5 rows but only four patients
//     are aged 20-50; hospital/h7 wanted 2 but three doctors have >2
//     appointments.
//  2. A single shared database. getSqlDb() kept one _sqlDb and ALWAYS seeded it
//     with HOSPITAL_SQL, so db-1, db-2 and db-3 shared one instance: db-1/4
//     creates the Ward table, so db-2/1's CREATE TABLE Ward failed with
//     "already exists", and a DELETE in db-2/7 changed the row count db-3/7
//     expects. Each topic now gets its own database — which is what running the
//     exercises in order against ONE db per topic below reproduces.
//
// node:sqlite stands in for sql.js: every construct used here is plain SQLite.
import { readFileSync } from 'fs'
import { DatabaseSync } from 'node:sqlite'

const ROOT = 'c:/Users/user/Downloads/ICT website'
const html = readFileSync(`${ROOT}/public/lessons/as-level.html`, 'utf8')

function objectLiteral(opener) {
  const s = html.indexOf(opener)
  if (s < 0) throw new Error(`${opener} not found`)
  const m = html.slice(s).match(/\r?\n\}\r?\n/)
  return html.slice(s, s + m.index + m[0].indexOf('}') + 1)
}
function seedOf(varName) {
  const i = html.indexOf(`const ${varName} = \``)
  const st = html.indexOf('`', i) + 1
  return html.slice(st, html.indexOf('`', st))
}

const HOSPITAL_SQL = seedOf('HOSPITAL_SQL')
const SCHOOL_SQL = seedOf('SCHOOL_SQL')
const ECOMMERCE_SQL = seedOf('ECOMMERCE_SQL')

const { SQL_EXERCISES } = new Function(objectLiteral('const SQL_EXERCISES = {') + '\nreturn { SQL_EXERCISES }')()
const { IDE_SETS } = new Function(
  `const HOSPITAL_SQL=${JSON.stringify(HOSPITAL_SQL)},SCHOOL_SQL=${JSON.stringify(SCHOOL_SQL)},ECOMMERCE_SQL=${JSON.stringify(ECOMMERCE_SQL)};` +
  objectLiteral('const IDE_SETS = {') +
  '\nIDE_SETS.hospital.setup = HOSPITAL_SQL\nreturn { IDE_SETS }')()

function splitSql(sql) {
  const out = []; let cur = '', q = null
  for (const c of sql) {
    if (q) { cur += c; if (c === q) q = null; continue }
    if (c === "'" || c === '"') { q = c; cur += c; continue }
    if (c === ';') { out.push(cur); cur = ''; continue }
    cur += c
  }
  out.push(cur)
  return out.map(x => x.trim()).filter(Boolean)
}
function runAll(db, sql) {
  let last = []
  for (const stmt of splitSql(sql)) {
    if (/^\s*(select|with|pragma)/i.test(stmt)) last = db.prepare(stmt).all()
    else db.exec(stmt)
  }
  return last
}

let n = 0, pass = 0, fail = 0
const t = (ok, label) => {
  n++
  if (ok) { pass++; console.log(`Test ${String(n).padStart(2)}  ✓ ${label}`) }
  else    { fail++; console.log(`Test ${String(n).padStart(2)}  ✗ ${label}`) }
}

function verify(label, db, ex, check) {
  let rows
  try { rows = runAll(db, ex.hint) }
  catch (e) { t(false, `${label} — model query ERRORS: ${e.message}`); return }
  let ok, why
  if (typeof check === 'function') { ok = !!check(rows); why = `returned ${rows.length} rows` }
  else if (check?.type === 'row_count')    { ok = rows.length === check.count; why = `expected ${check.count}, got ${rows.length}` }
  else if (check?.type === 'table_exists') {
    ok = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").all(check.table).length > 0
    why = `table ${check.table} exists`
  }
  else if (check?.type === 'value_check')  { ok = rows.some(r => String(r[check.col]) === String(check.val)); why = `${check.col}=${check.val}` }
  else { ok = Array.isArray(rows); why = 'ran' }
  t(ok, `${label} — model query satisfies its own check (${why})`)
}

// ── Pool 1: Chapter 11 lesson exercises. All hospital; one fresh DB per topic. ──
for (const [topicId, exercises] of Object.entries(SQL_EXERCISES)) {
  console.log(`\n── SQL_EXERCISES / ${topicId} (${exercises.length}) ──`)
  const db = new DatabaseSync(':memory:')
  db.exec(HOSPITAL_SQL)
  for (const ex of exercises) {
    if (!ex.hint) { t(false, `${topicId}/${ex.n} — no model query`); continue }
    verify(`${topicId}/${ex.n}`, db, ex, ex.check)
  }
  db.close()
}

// ── Pool 2: SQL Lab sets, each on its own schema. ──
for (const [setId, set] of Object.entries(IDE_SETS)) {
  const exercises = set.exercises || []
  console.log(`\n── IDE_SETS / ${setId} (${exercises.length}) ──`)
  const db = new DatabaseSync(':memory:')
  db.exec(set.setup)
  for (const ex of exercises) {
    const label = `${setId}/${ex.id}`
    if (ex.check?.type === 'ai') { console.log(`      · ${label} — AI-checked, skipped`); continue }
    if (!ex.hint) { t(false, `${label} — no model query`); continue }
    verify(label, db, ex, ex.check)
  }
  db.close()
}

console.log(`\n${pass} passed, ${fail} failed, ${n} tests total.`)
if (fail > 0) process.exit(1)
console.log('every SQL exercise runs against its own schema, in order, and its model query passes its own check')
