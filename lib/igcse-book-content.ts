// Server-only. Reads one IGCSE Y1 "book" lesson's raw static HTML off disk,
// splits it into the editable pieces (title + body content), and merges in
// a class's override if one exists.
//
// Unlike igcse-content.ts (which evals a CHALLENGES array out of a big JS
// app), these lessons are plain static pages — there's no data structure to
// extract, just <title> and the content inside <body>...</body>. The teacher
// editor lets a teacher replace the WHOLE body (title + inner HTML) for
// their class; publishing writes one row to the existing
// class_lesson_overrides table (lesson_key='igcse-y1-book',
// scope='stage', target_id=<filename>, override_data={ title, html }).
//
// Never import this from a client component — it uses `fs`.
import { readFileSync } from 'fs'
import path from 'path'
import { findBookLesson } from './igcse-book-manifest'

export interface BookLessonContent {
  title: string
  html: string   // inner content of <body>, excluding the injected override-merge script
}

// Must exactly match the comment markers wrapping the injected merge script
// at the end of every lesson file (see scripts/inject-book-overrides.mjs).
const OVERRIDE_SCRIPT_START = '<!-- OVERRIDE-MERGE-SCRIPT-START -->'

export function getBookLessonContent(file: string): BookLessonContent {
  if (!findBookLesson(file)) throw new Error(`Unknown book lesson file: ${file}`)
  const html = readFileSync(path.join(process.cwd(), 'public', 'lessons', 'igcse-y1-book', file), 'utf8')

  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i)
  const title = titleMatch ? titleMatch[1].trim() : file

  const bodyStart = html.indexOf('<body>')
  const bodyEnd = html.lastIndexOf('</body>')
  if (bodyStart === -1 || bodyEnd === -1) throw new Error(`Malformed lesson file: ${file}`)

  let body = html.slice(bodyStart + '<body>'.length, bodyEnd)
  const scriptIdx = body.indexOf(OVERRIDE_SCRIPT_START)
  if (scriptIdx !== -1) body = body.slice(0, scriptIdx)

  return { title, html: body.trim() }
}

export interface BookOverrideRow {
  scope: 'stage'
  target_id: string
  override_data: { title?: string; html?: string }
}

export function applyBookOverride(base: BookLessonContent, overrides: BookOverrideRow[], file: string): BookLessonContent {
  const row = overrides.find(o => o.scope === 'stage' && o.target_id === file)
  if (!row) return base
  return {
    title: row.override_data.title || base.title,
    html: row.override_data.html || base.html,
  }
}
