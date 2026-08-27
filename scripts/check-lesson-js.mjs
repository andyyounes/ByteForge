// Parse every inline <script> block in the lesson pages with acorn and
// report any syntax errors — catches broken pages before students do.
import { readFileSync, readdirSync } from 'fs'
import * as acorn from 'acorn'

// EVERY lesson page, not just two. This used to check only as-level.html and
// a-level.html — and meanwhile grade9.html's entire script had been dead:
// a stray "]" closed the CHALLENGES array early, leaving three further
// challenges orphaned after it as bare syntax, which threw
// "Unexpected identifier 'total'" and stopped the whole page from running.
// The per-grade suites never caught it because they extract only the slice of
// source they need (the Interpreter, the CHALLENGES array) and so never parse
// the file as a whole.
const LESSON_DIR = 'c:/Users/user/Downloads/ICT website/public/lessons'
const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync(LESSON_DIR).filter(f => f.endsWith('.html')).sort().map(f => `${LESSON_DIR}/${f}`)

let bad = 0
for (const file of files) {
  const html = readFileSync(file, 'utf8')
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
  let fileOk = true
  scripts.forEach((m, i) => {
    const code = m[1]
    if (!code.trim()) return
    const offsetLine = html.slice(0, m.index).split('\n').length
    try {
      acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'script' })
    } catch (e) {
      fileOk = false
      bad++
      const errLine = offsetLine + code.slice(0, e.pos).split('\n').length - 1
      console.log(`✗ ${file.split('/').pop()} <script #${i + 1}> — ${e.message}`)
      console.log(`  → line ${errLine}: ${html.split('\n')[errLine - 1]?.trim().slice(0, 140)}`)
    }
  })
  if (fileOk) console.log(`✓ ${file.split('/').pop()} — ${scripts.length} script block(s) parse clean`)
}
process.exit(bad ? 1 : 0)
