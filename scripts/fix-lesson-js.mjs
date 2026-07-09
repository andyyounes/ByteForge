// Auto-repair JS syntax errors inside a lesson page's inline <script> blocks:
//   • literal newlines inside '…' strings   → escaped \n
//   • unescaped apostrophes ending a string → \'
// Repeatedly parses with acorn and fixes the reported error until clean.
//
// Usage: node scripts/fix-lesson-js.mjs public/lessons/a-level.html
import { readFileSync, writeFileSync } from 'fs'
import * as acorn from 'acorn'

const file = process.argv[2]
if (!file) { console.error('usage: node scripts/fix-lesson-js.mjs <html file>'); process.exit(1) }

let html = readFileSync(file, 'utf8')
let fixedNewlines = 0
let fixedApostrophes = 0

// Escape literal newlines inside the unterminated string starting at strPos
function fixUnterminatedString(code, strPos) {
  const q = code[strPos]
  let out = code.slice(0, strPos + 1)
  let i = strPos + 1
  let esc = false
  for (; i < code.length; i++) {
    const c = code[i]
    if (esc) { out += c; esc = false; continue }
    if (c === '\\') { out += c; esc = true; continue }
    if (c === '\r') continue                    // drop CR
    if (c === '\n') { out += '\\n'; continue }  // escape LF
    out += c
    if (c === q) { i++; break }                 // string closed
  }
  return out + code.slice(i)
}

for (let pass = 0; pass < 500; pass++) {
  const m = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/i.exec(html)
  if (!m) break
  // Work on the whole file's inline scripts one at a time
  const blocks = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
  let anyError = false

  for (const blk of blocks) {
    const code      = blk[1]
    const codeStart = blk.index + blk[0].indexOf(blk[1])
    if (!code.trim()) continue
    try {
      acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'script' })
    } catch (e) {
      anyError = true
      if (/Unterminated string constant/.test(e.message)) {
        const fixed = fixUnterminatedString(code, e.pos)
        html = html.slice(0, codeStart) + fixed + html.slice(codeStart + code.length)
        fixedNewlines++
      } else if (/Unexpected token|Unexpected identifier/.test(e.message) && code[e.pos - 1] === "'") {
        const abs = codeStart + e.pos - 1
        html = html.slice(0, abs) + "\\'" + html.slice(abs + 1)
        fixedApostrophes++
      } else {
        const line = html.slice(0, codeStart + e.pos).split('\n').length
        console.error(`unfixable: ${e.message} at line ${line} (in-memory)`)
        console.error('--- context before ---')
        console.error(code.slice(Math.max(0, e.pos - 300), e.pos))
        console.error('--- context after ---')
        console.error(code.slice(e.pos, e.pos + 120))
        process.exit(1)
      }
      break   // re-scan from scratch after each fix
    }
  }
  if (!anyError) {
    writeFileSync(file, html)
    console.log(`clean ✓ — fixed ${fixedNewlines} multi-line strings, ${fixedApostrophes} apostrophes`)
    process.exit(0)
  }
}
console.error('gave up after 500 passes')
process.exit(1)
