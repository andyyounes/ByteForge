// Runs every P4 challenge STARTER through the interpreter — starters may give
// wrong output (TODOs unfilled) but must not crash on first Run.
import { readFileSync } from 'fs'

const html  = readFileSync('c:/Users/user/Downloads/ICT website/public/lessons/a-level.html', 'utf8')
const s1 = html.indexOf('const KEYWORDS = new Set([')
const e1 = html.indexOf('CodeMirror.defineSimpleMode')
const Interpreter = new Function(html.slice(s1, e1) + '\nreturn Interpreter')()

const s2 = html.indexOf('const P2_CHALLENGES=[')
const e2 = html.indexOf('const p2Completed')
const CHALLENGES = new Function(html.slice(s2, e2) + '\nreturn P2_CHALLENGES')()

let crash = 0
for (const ch of CHALLENGES) {
  try {
    new Interpreter().run(ch.starter.replace(/<-/g, '←'), [])
    console.log(`✓ ${ch.mod} ${ch.name}`)
  } catch (e) {
    crash++
    console.log(`✗ ${ch.mod} ${ch.name} — starter crashes: ${e?.message ?? JSON.stringify(e)}`)
  }
}
console.log(`\n${CHALLENGES.length} challenges, ${crash} crashing starters`)
process.exit(crash ? 1 : 0)
