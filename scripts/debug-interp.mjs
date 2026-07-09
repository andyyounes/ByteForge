import { readFileSync } from 'fs'
const html  = readFileSync('c:/Users/user/Downloads/ICT website/public/lessons/a-level.html', 'utf8')
const start = html.indexOf('const KEYWORDS = new Set([')
const end   = html.indexOf('CodeMirror.defineSimpleMode')
const Interpreter = new Function(html.slice(start, end) + '\nreturn Interpreter')()

const cases = [
  ['array declare',        'DECLARE a : ARRAY[1:6] OF INTEGER\na[1] ← 5\nOUTPUT a[1]'],
  ['multi declare',        'DECLARE i, j : INTEGER\ni ← 2\nj ← 3\nOUTPUT i + j'],
  ['array + multi',        'DECLARE a : ARRAY[1:3] OF INTEGER\nDECLARE i, j : INTEGER\na[1] ← 9\nOUTPUT a[1]'],
  ['colon chaining',       'DECLARE x : INTEGER\nx ← 1 : x ← x + 1\nOUTPUT x'],
  ['semicolon chaining',   'DECLARE x : INTEGER\nx ← 1; x ← x + 2\nOUTPUT x'],
  ['while do',             'DECLARE i : INTEGER\ni ← 0\nWHILE i < 3 DO\n  i ← i + 1\nENDWHILE\nOUTPUT i'],
]
for (const [name, code] of cases) {
  try {
    const res = new Interpreter().run(code, [])
    console.log(`✓ ${name}: ${JSON.stringify(res.output)}`)
  } catch (e) {
    console.log(`✗ ${name}: ${e?.message ?? JSON.stringify(e)}`)
  }
}
