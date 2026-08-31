// One-off (idempotent) script: appends a small override-merge snippet before
// </body> in every IGCSE Y1 book lesson under public/lessons/igcse-y1-book/
// (skipping index.html, which is just a directory listing). When a teacher
// publishes an edit for their class, this snippet is what actually makes the
// student's browser show it — the static file itself is never touched by
// the teacher editor.
//
// Safe to re-run: it first strips any previously-injected block (delimited
// by the START/END markers) before appending a fresh copy, so re-running
// after editing the template below just updates every file in place.
//
// Run with: node scripts/inject-book-overrides.mjs

import { readdirSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIR = path.join(__dirname, '..', 'public', 'lessons', 'igcse-y1-book')

const START = '<!-- OVERRIDE-MERGE-SCRIPT-START -->'
const END = '<!-- OVERRIDE-MERGE-SCRIPT-END -->'

const SNIPPET = `${START}
<script>
(function () {
  var params = new URLSearchParams(location.search);
  var classId = params.get('classId');
  if (!classId) return;
  var file = location.pathname.split('/').pop();
  fetch('/api/class-lesson-overrides?classId=' + encodeURIComponent(classId) + '&lessonKey=igcse-y1-book')
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data || !Array.isArray(data.overrides)) return;
      var row = data.overrides.find(function (o) { return o.scope === 'stage' && o.target_id === file; });
      if (!row || !row.override_data) return;
      if (row.override_data.html) document.body.innerHTML = row.override_data.html;
      if (row.override_data.title) document.title = row.override_data.title;
    })
    .catch(function () {});
})();
</script>
${END}`

const files = readdirSync(DIR).filter(f => f.endsWith('.html') && f !== 'index.html')
let changed = 0

for (const file of files) {
  const fp = path.join(DIR, file)
  let html = readFileSync(fp, 'utf8')

  // Strip any previously-injected block first (idempotent re-run).
  const startIdx = html.indexOf(START)
  const endIdx = html.indexOf(END)
  if (startIdx !== -1 && endIdx !== -1) {
    html = html.slice(0, startIdx) + html.slice(endIdx + END.length)
  }

  const bodyCloseIdx = html.lastIndexOf('</body>')
  if (bodyCloseIdx === -1) {
    console.warn(`Skipping ${file}: no </body> found`)
    continue
  }

  html = html.slice(0, bodyCloseIdx) + SNIPPET + '\n' + html.slice(bodyCloseIdx)
  writeFileSync(fp, html, 'utf8')
  changed++
}

console.log(`Injected/refreshed override-merge script in ${changed} of ${files.length} lesson files.`)
