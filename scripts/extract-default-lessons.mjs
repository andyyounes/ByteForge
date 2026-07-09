// Extracts the built-in TOPICS lesson content from the student lesson pages
// into public/lessons/default-lessons.json (+ default-videos.json) so the
// teacher dashboard can list and edit every lesson even when a class has no
// uploaded book.
//
// Usage: node scripts/extract-default-lessons.mjs
// Re-run whenever the TOPICS objects in as-level.html / a-level.html change.
import { readFileSync, writeFileSync, copyFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT  = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FILES = [
  path.join(ROOT, 'public/lessons/as-level.html'),
  path.join(ROOT, 'public/lessons/a-level.html'),
]

function extractTopics(html, file) {
  const start = html.indexOf('const TOPICS = {')
  if (start === -1) { console.error(`no TOPICS in ${file}`); return {} }
  const openIdx = html.indexOf('{', start)
  // The TOPICS object closes with a "}" at column 0 (start of line) — but a
  // "\n}" can also appear inside theory strings, so try each candidate end
  // until one evals to a valid object.
  const tail = html.slice(openIdx)
  const re = /\r?\n\}/g
  let m
  while ((m = re.exec(tail)) !== null) {
    const objText = tail.slice(0, m.index + m[0].length)
    try {
      const obj = (0, eval)('(' + objText + ')')
      if (obj && typeof obj === 'object' && Object.keys(obj).length > 3) return obj
    } catch { /* not the real end yet — keep scanning */ }
  }
  console.error(`could not locate end of TOPICS in ${file}`)
  return {}
}

const lessons = {}
const videos  = {}

for (const file of FILES) {
  const html   = readFileSync(file, 'utf8')
  const topics = extractTopics(html, file)
  let count = 0
  for (const [key, t] of Object.entries(topics)) {
    lessons[key] = {
      chapter:   t.chapter  || '',
      title:     t.title    || key,
      subtitle:  t.subtitle || '',
      keyTerms:  t.keyTerms  || [],
      theory:    t.theory    || '',
      example:   t.example   || '',
      questions: (t.questions || []).map(q => ({ stem: q.stem ?? '', marks: q.marks ?? 1, ms: q.ms ?? '' })),
    }
    const vids = []
    if (t.video)  vids.push(t.video)
    if (Array.isArray(t.videos)) vids.push(...t.videos)
    if (vids.length) videos[key] = vids.map(v => ({ id: v.id, title: v.title || '', channel: v.channel || '' }))
    count++
  }
  console.log(`${path.basename(file)}: ${count} topics`)
}

const lessonsOut = path.join(ROOT, 'public/lessons/default-lessons.json')
const videosOut  = path.join(ROOT, 'public/lessons/default-videos.json')
writeFileSync(lessonsOut, JSON.stringify(lessons))
writeFileSync(videosOut, JSON.stringify(videos, null, 2))
copyFileSync(lessonsOut, path.join(ROOT, 'lessons/default-lessons.json'))
copyFileSync(videosOut,  path.join(ROOT, 'lessons/default-videos.json'))
console.log(`wrote ${Object.keys(lessons).length} lessons, ${Object.keys(videos).length} video lists`)
