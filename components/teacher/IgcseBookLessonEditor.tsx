'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Teacher visual editor for the IGCSE Year 1 "book" lessons — 89 static,
 * self-contained lesson pages rewritten from the Cambridge coursebook
 * (public/lessons/igcse-y1-book/*.html), listed via lib/igcse-book-manifest.ts.
 *
 * Different shape again from IgcseLessonEditor (which edits the CHALLENGES
 * app's stage objects + separate lesson explainer): there is no data
 * structure here at all, just a title + a body of static HTML per lesson.
 * Editing replaces the WHOLE lesson body for this class. Publishing writes
 * one row to the same class_lesson_overrides table
 * (lesson_key='igcse-y1-book', scope='stage', target_id=<filename>,
 * override_data={ title, html }) — the lesson page itself picks this up via
 * a small merge script injected at build time (scripts/inject-book-overrides.mjs),
 * which only runs when a classId is present in the URL.
 */

interface ManifestLesson { file: string; code: string; title: string; overridden: boolean }
interface ManifestUnit { unit: string; title: string; lessons: ManifestLesson[] }

export function IgcseBookLessonEditor({ classId }: { classId: string }) {
  const [units, setUnits] = useState<ManifestUnit[] | null>(null)
  const [error, setError] = useState('')
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [loadedTitle, setLoadedTitle] = useState('')
  const [loadedHtml, setLoadedHtml] = useState('')
  const [loadingLesson, setLoadingLesson] = useState(false)
  const [saving, setSaving] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)
  const titleRef = useRef<HTMLInputElement>(null)
  const htmlRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')

  const loadManifest = useCallback(async () => {
    try {
      const res = await fetch(`/api/teacher/igcse-book-content?classId=${classId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load')
      setUnits(data.units ?? [])
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Failed to load')
    }
  }, [classId])

  useEffect(() => { loadManifest() }, [loadManifest])

  async function openLesson(file: string) {
    setActiveFile(file)
    setEditing(false)
    setLoadingLesson(true)
    setError('')
    try {
      const res = await fetch(`/api/teacher/igcse-book-content?classId=${classId}&file=${file}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load lesson')
      setLoadedTitle(data.title ?? '')
      setLoadedHtml(data.html ?? '')
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Failed to load lesson')
    } finally {
      setLoadingLesson(false)
    }
  }

  async function handleImageFile(f: File) {
    setUploading(true)
    setUploadErr('')
    try {
      const form = new FormData()
      form.append('file', f)
      form.append('classId', classId)
      const res = await fetch('/api/teacher/upload-image', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      const tag = `<img src="${data.url}" alt="" style="max-width:100%;border-radius:8px;">`
      const ta = htmlRef.current
      if (ta) {
        const pos = ta.selectionStart ?? ta.value.length
        ta.value = ta.value.slice(0, pos) + tag + ta.value.slice(pos)
      }
    } catch (e: unknown) {
      setUploadErr((e as Error).message ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function publish() {
    if (!activeFile) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/class-lesson-overrides', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId, lessonKey: 'igcse-y1-book', scope: 'stage', targetId: activeFile,
          overrideData: { title: titleRef.current?.value ?? '', html: htmlRef.current?.value ?? '' },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to publish')
      setEditing(false)
      await loadManifest()
      await openLesson(activeFile)
      setIframeKey(k => k + 1)
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Failed to publish')
    } finally {
      setSaving(false)
    }
  }

  async function revert() {
    if (!activeFile) return
    if (!confirm('Revert this lesson back to the original, unedited content?')) return
    try {
      const res = await fetch(`/api/class-lesson-overrides?classId=${classId}&lessonKey=igcse-y1-book&scope=stage&targetId=${activeFile}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to revert')
      setEditing(false)
      await loadManifest()
      await openLesson(activeFile)
      setIframeKey(k => k + 1)
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Failed to revert')
    }
  }

  if (error && !units) return <p className="text-xs text-rose p-4">{error}</p>
  if (!units) return <p className="text-xs text-fg-dim p-4">Loading IGCSE Year 1 textbook…</p>

  const activeLesson = activeFile
    ? units.flatMap(u => u.lessons).find(l => l.file === activeFile)
    : undefined

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-4">
      <div className="card p-0 overflow-hidden min-w-0">
        <div className="px-3 sm:px-4 py-2.5 border-b border-b2 flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-semibold text-fg whitespace-nowrap">📗 Live student preview</span>
          <span className="text-[11px] text-t3">Updates after you publish</span>
        </div>
        {activeFile ? (
          <iframe
            key={iframeKey}
            src={`/lessons/igcse-y1-book/${activeFile}?classId=${classId}`}
            className="w-full h-[60vh] min-h-[420px] lg:h-[620px] lg:min-h-0"
            style={{ border: 0 }}
            title="Lesson preview"
          />
        ) : (
          <div className="h-[60vh] min-h-[420px] lg:h-[620px] lg:min-h-0 flex items-center justify-center text-xs text-fg-dim px-6 text-center">
            Pick a lesson from the list to preview and edit it.
          </div>
        )}
      </div>

      <div className="card p-3 sm:p-4 min-w-0 lg:max-h-[660px] lg:overflow-y-auto">
        {error && <p className="text-xs text-rose mb-3">{error}</p>}

        {activeFile ? (
          editing ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-fg truncate min-w-0">Editing: {activeLesson?.code} {activeLesson?.title}</span>
                <button onClick={() => setEditing(false)} className="text-[11px] text-t3 hover:text-fg transition-colors shrink-0">← back</button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold text-fg">Lesson title</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="text-[10.5px] font-semibold px-2 py-1 rounded-md bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {uploading ? 'Uploading…' : '📷 Add image'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = '' }}
                />
              </div>
              {uploadErr && <p className="text-[10.5px] text-rose">{uploadErr}</p>}
              <input
                ref={titleRef}
                defaultValue={loadedTitle}
                placeholder="Lesson title"
                className="w-full h-8 px-2 text-[11px] bg-s2 border border-b2 rounded-md text-fg focus:border-accent focus:outline-none"
              />
              <p className="text-[11px] text-fg-dim">
                The full lesson content (key terms, theory, practice questions — everything shown
                on the page). This only affects <strong>this class</strong> — the original stays the
                same for everyone else, and you can revert any time.
              </p>
              <textarea
                ref={htmlRef}
                defaultValue={loadedHtml}
                placeholder="Lesson HTML"
                className="w-full h-96 text-[11px] font-mono bg-s2 border border-b2 rounded-md p-2.5 text-fg focus:border-accent focus:outline-none"
                spellCheck={false}
              />
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={publish}
                  disabled={saving}
                  className="text-xs font-semibold px-3 py-1.5 rounded-md bg-emerald/10 border border-emerald/30 text-emerald hover:bg-emerald/20 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Publishing…' : 'Publish to this class'}
                </button>
                {activeLesson?.overridden && (
                  <button
                    onClick={revert}
                    className="text-xs font-semibold px-3 py-1.5 rounded-md bg-rose/10 border border-rose/30 text-rose hover:bg-rose/20 transition-colors"
                  >
                    Revert to original
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-fg truncate min-w-0">{activeLesson?.code} {activeLesson?.title}</span>
                <button onClick={() => setActiveFile(null)} className="text-[11px] text-t3 hover:text-fg transition-colors shrink-0">← back to list</button>
              </div>
              {loadingLesson ? (
                <p className="text-xs text-fg-dim">Loading…</p>
              ) : (
                <>
                  {activeLesson?.overridden && (
                    <p className="text-[10.5px] px-2 py-1 rounded-md bg-emerald/10 text-emerald border border-emerald/25 inline-block">edited for this class</p>
                  )}
                  <button
                    onClick={() => setEditing(true)}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-md bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors"
                  >
                    ✎ Edit this lesson
                  </button>
                </>
              )}
            </div>
          )
        ) : (
          <>
            <h3 className="font-semibold text-fg text-sm mb-1">Lessons</h3>
            <p className="text-[11px] text-fg-dim mb-3">Click any lesson below to preview and edit it.</p>
            <div className="space-y-3">
              {units.map(u => (
                <div key={u.unit} className="border border-b2 rounded-md p-2.5">
                  <p className="text-xs font-semibold text-fg px-1.5">{u.unit} — {u.title}</p>
                  <div className="mt-1.5 space-y-1">
                    {u.lessons.map(l => (
                      <button
                        key={l.file}
                        onClick={() => openLesson(l.file)}
                        className="w-full flex items-center justify-between gap-2 text-left px-2 py-1.5 rounded-md border border-transparent hover:border-b2 hover:bg-s2 transition-colors group"
                      >
                        <span className="text-[11px] text-t2 group-hover:text-fg transition-colors truncate min-w-0">
                          <span className="text-fg-faint font-mono mr-1.5">{l.code}</span>{l.title}
                        </span>
                        <span className="flex items-center gap-1.5 shrink-0">
                          {l.overridden && (
                            <span className="text-[9px] px-1 py-0.5 rounded bg-emerald/10 text-emerald border border-emerald/25 whitespace-nowrap">edited</span>
                          )}
                          <span className="text-[10px] text-accent opacity-70 group-hover:opacity-100 transition-opacity">✎ Edit</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
