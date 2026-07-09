// Exports the built-in Code Lab exercise sets from a-level.html to
// public/lessons/al-lab-exercises.json so the teacher dashboard can list and
// edit them (edits are saved as per-class overrides).
// Re-run whenever AL_LAB_SETS changes in a-level.html.
import { readFileSync, writeFileSync, copyFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const html = readFileSync(path.join(ROOT, 'public/lessons/a-level.html'), 'utf8')

const s = html.indexOf('const AL_LAB_SETS = {')
const e = html.indexOf('// ── Lab state, saves & helpers')
if (s === -1 || e === -1) { console.error('AL_LAB_SETS markers not found'); process.exit(1) }

const SETS = new Function(html.slice(s, e) + '\nreturn AL_LAB_SETS')()

const out = {}
for (const [setId, set] of Object.entries(SETS)) {
  out[setId] = {
    name: set.name,
    icon: set.icon,
    exercises: set.exercises.map(ex => ({
      id: ex.id, title: ex.title, xp: ex.xp, desc: ex.desc, expect: ex.expect, starter: ex.ps,
    })),
  }
}

const file = path.join(ROOT, 'public/lessons/al-lab-exercises.json')
writeFileSync(file, JSON.stringify(out, null, 2))
copyFileSync(file, path.join(ROOT, 'lessons/al-lab-exercises.json'))
console.log(`exported ${Object.values(out).reduce((n, s2) => n + s2.exercises.length, 0)} exercises across ${Object.keys(out).length} sets`)
