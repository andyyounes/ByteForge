// Fix unescaped apostrophes inside single-quoted strings in a-level.html's
// TOPICS object (e.g. 'an algorithm's time' → 'an algorithm\'s time').
// Repeatedly parses with acorn and escapes the offending quote until clean.
import { readFileSync, writeFileSync } from 'fs'
import * as acorn from 'acorn'

const file = 'c:/Users/user/Downloads/ICT website/public/lessons/a-level.html'
let html = readFileSync(file, 'utf8')
const fixes = []

for (let i = 0; i < 100; i++) {
  const start   = html.indexOf('const TOPICS = {')
  const openIdx = html.indexOf('{', start)
  const tail    = html.slice(openIdx, openIdx + 260000)
  try {
    // 'x=' forces object-literal context; acorn stops at the end of the
    // expression, so trailing page code doesn't matter.
    acorn.parseExpressionAt('x=' + tail, 0, { ecmaVersion: 'latest' })
    break   // parses clean
  } catch (e) {
    const posInTail = e.pos - 2              // remove the 'x=' prefix offset
    // The string ended one char before the unexpected token — that's the
    // apostrophe that needs escaping.
    const aposIdx = openIdx + posInTail - 1
    if (html[aposIdx] !== "'") {
      console.log(`stopping: char at error-1 is ${JSON.stringify(html[aposIdx])}, not an apostrophe — needs manual fix`)
      console.log(`error: ${e.message}`)
      const line = html.slice(0, aposIdx).split('\n').length
      console.log(`line ${line}: ${html.split('\n')[line - 1]?.slice(0, 160)}`)
      process.exit(1)
    }
    const line = html.slice(0, aposIdx).split('\n').length
    fixes.push(line)
    html = html.slice(0, aposIdx) + "\\'" + html.slice(aposIdx + 1)
  }
}

writeFileSync(file, html)
console.log(`fixed ${fixes.length} unescaped apostrophes at lines: ${fixes.join(', ')}`)
