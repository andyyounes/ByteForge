// Retags THEORY_EXERCISES in a-level.html to the book-aligned chapters
// (16–29) using subject keywords, drops off-syllabus database questions,
// and regenerates the chapter filter buttons.
import { readFileSync, writeFileSync } from 'fs'

const FILE = 'c:/Users/user/Downloads/ICT website/public/lessons/a-level.html'
let html = readFileSync(FILE, 'utf8')

// Extract the array with candidate-end scanning
const marker = 'const THEORY_EXERCISES = ['
const start = html.indexOf(marker)
if (start === -1) throw new Error('THEORY_EXERCISES not found')
const openIdx = html.indexOf('[', start)
const tail = html.slice(openIdx)
const re = /\r?\n\]/g
let arr = null, end = -1, m
while ((m = re.exec(tail)) !== null) {
  const text = tail.slice(0, m.index + m[0].length)
  try {
    const v = (0, eval)('(' + text + ')')
    if (Array.isArray(v) && v.length > 5) { arr = v; end = openIdx + m.index + m[0].length; break }
  } catch { /* keep scanning */ }
}
if (!arr) throw new Error('could not extract THEORY_EXERCISES')

// Keyword → book chapter (order matters: first match wins)
const RULES = [
  [/(sql|normalis|acid|entity.relationship|database|relational)/i, 0],   // 0 = drop (AS content)
  [/(dijkstra|a\*|graph|adjacency|bfs|dfs|breadth|depth.first)/i, 22],
  [/(knowledge representation|inference|expert system|machine learning|neural|back.?propagation|regression)/i, 22],
  [/(schedul|deadlock|paging|virtual memory|interrupt|compiler|translat|lexical|syntax analysis|linker|loader)/i, 20],
  [/(encrypt|cipher|cryptograph|certificate|malware|phishing|firewall|privacy|legislation|security)/i, 21],
  [/(design pattern|solid|polymorph|encapsulat|inherit|abstract class|interface|object.oriented|oop|class diagram)/i, 27],
  [/(recursi|base case|tail call)/i, 24],
  [/(functional|higher.order|lambda|map.*filter|immutab)/i, 25],
  [/(prolog|declarative|logic programming|facts and rules)/i, 29],
  [/(assembly|low.level|addressing|register|bit manipulation|mask|opcode)/i, 28],
  [/(float|mantissa|exponent|user.defined|enumerated|pointer|file organisation|serial|sequential file|random.access|hashing.*file)/i, 16],
  [/(protocol|tcp|packet|circuit switch|router|http|smtp|bittorrent)/i, 17],
  [/(risc|cisc|pipelin|parallel|simd|mimd|virtual machine|hypervisor)/i, 18],
  [/(boolean|karnaugh|k.map|flip.flop|adder|de morgan|logic gate|half adder)/i, 19],
  [/(sort|complexity|big.o|hash table|heap|priority queue|avl|binary search tree|dynamic programming|memoisation|backtrack|stack|queue|linked list)/i, 23],
  [/(exception|try|catch|file mode|text file|binary file)/i, 26],
]

const kept = []
const counts = {}
for (const ex of arr) {
  const hay = ex.title + ' ' + ex.q + ' ' + (ex.ms || '')
  let target = null
  for (const [rx, ch] of RULES) {
    if (rx.test(hay)) { target = ch; break }
  }
  if (target === 0) continue          // dropped (database — AS content)
  if (target === null) target = 23    // default: algorithms
  kept.push({ ...ex, ch: target })
  counts[target] = (counts[target] || 0) + 1
}

kept.sort((a, b) => a.ch - b.ch)
const src = 'const THEORY_EXERCISES = ' + JSON.stringify(kept, null, 2)
html = html.slice(0, start) + src + html.slice(end)

// Regenerate the filter buttons (only chapters that have questions)
const chapters = Object.keys(counts).map(Number).sort((a, b) => a - b)
const btns = chapters.map(n =>
  `          <button class="p1-ch-filter" data-ch="${n}" onclick="filterTheoryPractice('${n}')">Ch ${n}</button>`
).join('\n')
const btnStart = html.indexOf('<button class="p1-ch-filter" data-ch="16"')
const btnEnd = html.indexOf('\n', html.lastIndexOf('<button class="p1-ch-filter"'))
if (btnStart !== -1 && btnEnd > btnStart) {
  const lineStart = html.lastIndexOf('\n', btnStart) + 1
  html = html.slice(0, lineStart) + btns + html.slice(btnEnd)
}

writeFileSync(FILE, html)
console.log(`kept ${kept.length}/${arr.length} theory exercises; dropped ${arr.length - kept.length} (databases)`)
for (const n of chapters) console.log(`  Ch ${n}: ${counts[n]}`)
