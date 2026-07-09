// Locate the syntax error inside a-level.html's TOPICS object using acorn.
import { readFileSync } from 'fs'
import * as acorn from 'acorn'

const file = 'c:/Users/user/Downloads/ICT website/public/lessons/a-level.html'
const html = readFileSync(file, 'utf8')
const start = html.indexOf('const TOPICS = {')
const openIdx = html.indexOf('{', start)
const startLine = html.slice(0, openIdx).split('\n').length

// Take a generous slice (past the last candidate end) and parse as expression
const tail = html.slice(openIdx, openIdx + 220000)
try {
  acorn.parseExpressionAt('(' + tail + ')', 0, { ecmaVersion: 'latest' })
  console.log('parsed fine!?')
} catch (e) {
  const errLine = startLine + ('(' + tail).slice(0, e.pos).split('\n').length - 1
  console.log(`syntax error: ${e.message}`)
  console.log(`→ approx line ${errLine} of a-level.html`)
  const ctx = html.split('\n').slice(errLine - 3, errLine + 2)
  ctx.forEach((l, i) => console.log(`${errLine - 2 + i}: ${l.slice(0, 160)}`))
}
