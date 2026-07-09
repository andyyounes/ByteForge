// Parse every inline <script> block in the lesson pages with acorn and
// report any syntax errors — catches broken pages before students do.
import { readFileSync } from 'fs'
import * as acorn from 'acorn'

const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      'c:/Users/user/Downloads/ICT website/public/lessons/as-level.html',
      'c:/Users/user/Downloads/ICT website/public/lessons/a-level.html',
    ]

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
