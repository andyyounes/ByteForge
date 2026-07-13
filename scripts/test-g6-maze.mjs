// Verifies every Grade 6 Robot Road maze: reachable, stars collectible, and
// par == true optimal command count (BFS over position × collected-star state).
import { readFileSync } from 'fs'

const html = readFileSync('c:/Users/user/Downloads/ICT website/public/lessons/grade6.html', 'utf8')
const s1 = html.indexOf('function runMaze(')
const e1 = html.indexOf('// ══', s1 + 10)
const s2 = html.indexOf('const W1_STAGES = [')
const e2 = html.indexOf('const ALL_STAGES')
const ctx = html.slice(s1, e1) + html.slice(s2, e2)
const { runMaze, W1_STAGES, W2_STAGES } = new Function(ctx + '\nreturn { runMaze, W1_STAGES, W2_STAGES }')()

function optimal(grid) {
  const rows = grid.length, cols = grid[0].length
  let sx = -1, sy = -1
  const stars = []
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (grid[r][c] === 'S') { sx = c; sy = r }
    if (grid[r][c] === '*') stars.push(r + ',' + c)
  }
  const full = (1 << stars.length) - 1
  const seen = new Set()
  let queue = [[sx, sy, 0]]
  seen.add(sx + ',' + sy + ',0')
  let dist = 0
  while (queue.length) {
    const nq = []
    for (const [x, y, mask] of queue) {
      if (grid[y][x] === 'G' && mask === full) return dist
      for (const [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
        const nx = x + dx, ny = y + dy
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || grid[ny][nx] === '#') continue
        let nm = mask
        const si = stars.indexOf(ny + ',' + nx)
        if (si >= 0) nm |= 1 << si
        // can't stop at G without all stars, but can we pass through G? engine ends at G — treat G as terminal
        if (grid[ny][nx] === 'G' && nm !== full) continue
        const key = nx + ',' + ny + ',' + nm
        if (!seen.has(key)) { seen.add(key); nq.push([nx, ny, nm]) }
      }
    }
    queue = nq
    dist++
  }
  return -1
}

let fail = 0
for (const st of W1_STAGES) {
  const mazes = st.boss ? st.mazes : [st]
  mazes.forEach((m, i) => {
    const opt = optimal(m.grid)
    const label = st.id + (st.boss ? ' maze' + (i + 1) : '')
    if (opt === -1) { fail++; console.log(`✗ ${label} — UNSOLVABLE`); return }
    if (opt !== m.par) { fail++; console.log(`✗ ${label} — par ${m.par} but optimal is ${opt}`); return }
    console.log(`✓ ${label} — optimal ${opt} == par`)
  })
}

// ── World 2 — par is CHIPS (with ×2–×5 repeats). Verify each reference chip
// solution solves the maze and uses exactly par chips; mazes must be solvable.
const W2_SOLS = {
  'w2s1':        [['R',5],['R',4]],
  'w2s2':        [['R',4],['U',2],['R',3],['U',2]],
  'w2s3':        [['R',4],['D',3],['L',4]],
  'w2s4':        [['R',5],['R',2],['D',2],['L',5],['L',2],['D',2]],
  'w2s5':        [['R',5],['R',1],['D',5],['D',1],['L',5],['L',1],['U',4],['R',4],['D',2],['L',2]],
  'w2s6':        [['R',5],['R',4],['D',2],['L',5],['L',4],['D',2],['R',5],['R',4]],
  'w2boss-m1':   [['D',3],['R',2],['U',3],['R',2],['D',3],['R',2],['U',3]],
  'w2boss-m2':   [['R',5],['R',1],['D',4],['L',5],['L',1]],
}
function flatten(chips) {
  const flat = []
  for (const [c, n] of chips) for (let k = 0; k < n; k++) flat.push(c)
  return flat
}
for (const st of W2_STAGES) {
  const mazes = st.boss ? st.mazes : [st]
  mazes.forEach((m, i) => {
    const label = st.id + (st.boss ? ' maze' + (i + 1) : '')
    const solKey = st.boss ? st.id + '-m' + (i + 1) : st.id
    if (optimal(m.grid) === -1) { fail++; console.log(`✗ ${label} — UNSOLVABLE`); return }
    const sol = W2_SOLS[solKey]
    if (!sol) { fail++; console.log(`✗ ${label} — no reference chip solution`); return }
    const bad = sol.find(([, n]) => n < 1 || n > 5)
    if (bad) { fail++; console.log(`✗ ${label} — solution uses illegal multiplier`); return }
    const res = runMaze(m.grid, flatten(sol))
    if (!res.ok) { fail++; console.log(`✗ ${label} — reference solution fails (${res.reason})`); return }
    if (sol.length !== m.par) { fail++; console.log(`✗ ${label} — par ${m.par} but solution uses ${sol.length} chips`); return }
    console.log(`✓ ${label} — ${sol.length} chips == par`)
  })
}

console.log(fail ? `\n${fail} problems` : '\nall mazes solvable, all pars honest')
process.exit(fail ? 1 : 0)
