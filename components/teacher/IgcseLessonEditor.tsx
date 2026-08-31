'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Teacher visual editor for IGCSE Year 1 or Year 2 (one shared component —
 * both files have the identical CHALLENGES/CHALLENGE_LESSON shape). Same
 * pattern as Grade6-9LessonEditor. Different structure again: CHALLENGES is
 * one FLAT array (no world/module container), and challenges have no
 * stable id — only a `mod` display tag ('M1') + `name`. Both stage and
 * lesson overrides are keyed by the challenge's ARRAY INDEX instead (see
 * lib/igcse-content.ts for why a name-keyed override would be unsafe).
 */

interface Challenge { mod: string; name: string; xp?: number; type?: string; text?: string; [key: string]: unknown }
interface Lesson { title: string; html: string }
interface OverrideRow { scope: 'stage' | 'lesson'; target_id: string; override_data: Record<string, unknown> }

type EditTarget = { index: number; challenge: Challenge }

export function IgcseLessonEditor({ classId, file }: { classId: string; file: 'igcse-y1' | 'igcse-y2' }) {
  const [challenges,  setChallenges]  = useState<Challenge[] | null>(null)
  const [lessons,     setLessons]     = useState<Record<string, Lesson>>({})
  const [overridden,  setOverridden]  = useState<Set<string>>(new Set())
  const [error,       setError]       = useState('')
  const [edit,        setEdit]        = useState<EditTarget | null>(null)
  const [saving,      setSaving]      = useState(false)
  const [iframeKey,   setIframeKey]   = useState(0)
  const jsonRef        = useRef<HTMLTextAreaElement>(null)
  const lessonTitleRef = useRef<HTMLInputElement>(null)
  const lessonHtmlRef  = useRef<HTMLTextAreaElement>(null)
  const fileInputRef   = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')

  const load = useCallback(async () => {
    try {
      const [contentRes, overridesRes] = await Promise.all([
        fetch(`/api/teacher/igcse-content?classId=${classId}&file=${file}`),
        fetch(`/api/class-lesson-overrides?classId=${classId}&lessonKey=${file}`),
      ])
      const content   = await contentRes.json()
      const overrides = await overridesRes.json()
      if (!contentRes.ok) throw new Error(content.error ?? 'Failed to load')
      setChallenges(content.challenges ?? [])
      setLessons(content.lessons ?? {})
      const keys = new Set<string>((overrides.overrides ?? []).map((o: OverrideRow) => `${o.scope}:${o.target_id}`))
      setOverridden(keys)
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Failed to load')
    }
  }, [classId, file])

  useEffect(() => { load() }, [load])

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
      const ta = lessonHtmlRef.current
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
    if (!edit) return
    setSaving(true)
    try {
      const targetId = String(edit.index)
      const raw = jsonRef.current?.value ?? '{}'
      let overrideData: Record<string, unknown>
      try { overrideData = JSON.parse(raw) } catch { throw new Error('Invalid JSON — check the field for a typo') }

      const res = await fetch('/api/class-lesson-overrides', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, lessonKey: file, scope: 'stage', targetId, overrideData }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to publish')

      const lessonRes = await fetch('/api/class-lesson-overrides', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId, lessonKey: file, scope: 'lesson', targetId,
          overrideData: { title: lessonTitleRef.current?.value ?? '', html: lessonHtmlRef.current?.value ?? '' },
        }),
      })
      const lessonData = await lessonRes.json()
      if (!lessonRes.ok) throw new Error(lessonData.error ?? 'Failed to publish lesson content')

      setEdit(null)
      await load()
      setIframeKey(k => k + 1)
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Failed to publish')
    } finally {
      setSaving(false)
    }
  }

  async function revert(index: number) {
    if (!confirm('Revert this back to the original, unedited content?')) return
    const targetId = String(index)
    try {
      const res = await fetch(`/api/class-lesson-overrides?classId=${classId}&lessonKey=${file}&scope=stage&targetId=${targetId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to revert')
      await fetch(`/api/class-lesson-overrides?classId=${classId}&lessonKey=${file}&scope=lesson&targetId=${targetId}`, { method: 'DELETE' })
      setEdit(null)
      await load()
      setIframeKey(k => k + 1)
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Failed to revert')
    }
  }

  if (error && !challenges) return <p className="text-xs text-rose p-4">{error}</p>
  if (!challenges) return <p className="text-xs text-fg-dim p-4">Loading {file === 'igcse-y1' ? 'IGCSE Year 1' : 'IGCSE Year 2'} content…</p>

  const editIsOverridden = edit ? (overridden.has(`stage:${edit.index}`) || overridden.has(`lesson:${edit.index}`)) : false
  const currentLesson = edit ? lessons[String(edit.index)] : undefined

  // Group by `mod` for display only — it's a plain string tag, not a real
  // grouping object like Grade 6-9's worlds/modules/tiers.
  const groups = new Map<string, { challenge: Challenge; index: number }[]>()
  challenges.forEach((ch, index) => {
    const list = groups.get(ch.mod) ?? []
    list.push({ challenge: ch, index })
    groups.set(ch.mod, list)
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-4">
      <div className="card p-0 overflow-hidden min-w-0">
        <div className="px-3 sm:px-4 py-2.5 border-b border-b2 flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-semibold text-fg whitespace-nowrap">📗 Live student preview</span>
          <span className="text-[11px] text-t3">Updates after you publish</span>
        </div>
        <iframe
          key={iframeKey}
          src={`/lessons/${file}.html?classId=${classId}&teacher=1`}
          className="w-full h-[60vh] min-h-[420px] lg:h-[620px] lg:min-h-0"
          style={{ border: 0 }}
          title={`${file} student preview`}
        />
      </div>

      <div className="card p-3 sm:p-4 min-w-0 lg:max-h-[660px] lg:overflow-y-auto">
        <h3 className="font-semibold text-fg text-sm mb-3">Modules &amp; challenges</h3>
        {error && <p className="text-xs text-rose mb-3">{error}</p>}

        {edit ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-fg truncate min-w-0">Editing: {edit.challenge.name}</span>
              <button onClick={() => setEdit(null)} className="text-[11px] text-t3 hover:text-fg transition-colors shrink-0">← back</button>
            </div>

            <div className="space-y-2 border border-b2 rounded-md p-2.5 bg-s2/40">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold text-fg">📘 Lesson content</p>
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
              <p className="text-[10.5px] text-fg-dim">
                The real explainer text shown above this challenge. Leave blank to have none.
              </p>
              {uploadErr && <p className="text-[10.5px] text-rose">{uploadErr}</p>}
              <input
                ref={lessonTitleRef}
                defaultValue={currentLesson?.title ?? ''}
                placeholder="Lesson title"
                className="w-full h-8 px-2 text-[11px] bg-s2 border border-b2 rounded-md text-fg focus:border-accent focus:outline-none"
              />
              <textarea
                ref={lessonHtmlRef}
                defaultValue={currentLesson?.html ?? ''}
                placeholder="HTML content"
                className="w-full h-28 text-[11px] font-mono bg-s2 border border-b2 rounded-md p-2 text-fg focus:border-accent focus:outline-none"
                spellCheck={false}
              />
            </div>

            <p className="text-[11px] text-fg-dim">
              Challenge fields below (name, xp, text, hints, etc. — never the pass/fail check logic itself,
              which stays fixed for safety), then Publish. This only affects <strong>this class</strong> —
              the original stays the same for everyone else, and you can revert any time.
            </p>
            <textarea
              ref={jsonRef}
              defaultValue={JSON.stringify(edit.challenge, null, 2)}
              className="w-full h-64 text-[11px] font-mono bg-s2 border border-b2 rounded-md p-2.5 text-fg focus:border-accent focus:outline-none"
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
              {editIsOverridden && (
                <button
                  onClick={() => revert(edit.index)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-md bg-rose/10 border border-rose/30 text-rose hover:bg-rose/20 transition-colors"
                >
                  Revert to original
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[11px] text-fg-dim -mt-1">Click any challenge below to edit it.</p>
            {[...groups.entries()].map(([mod, items]) => (
              <div key={mod} className="border border-b2 rounded-md p-2.5">
                <p className="text-xs font-semibold text-fg px-1.5">{mod}</p>
                <div className="mt-1.5 space-y-1">
                  {items.map(({ challenge, index }) => (
                    <button
                      key={index}
                      onClick={() => setEdit({ index, challenge })}
                      className="w-full flex items-center justify-between gap-2 text-left px-2 py-1.5 rounded-md border border-transparent hover:border-b2 hover:bg-s2 transition-colors group"
                    >
                      <span className="text-[11px] text-t2 group-hover:text-fg transition-colors truncate min-w-0">
                        {challenge.name}
                      </span>
                      <span className="flex items-center gap-1.5 shrink-0">
                        {(overridden.has(`stage:${index}`) || overridden.has(`lesson:${index}`)) && (
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
        )}
      </div>
    </div>
  )
}
