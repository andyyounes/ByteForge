'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Teacher visual editor for Grade 9 ("The Deep Diver" Mission IDE). Same
 * shape as Grade6/7/8LessonEditor, adapted to Grade 9's different structure:
 * TIERS (24 chapters, each just {name, ids: mission ids}) instead of
 * worlds/modules with a real `stages` array — the actual mission objects
 * live in a separate flat MISSIONS list, looked up by id here.
 *
 * A tier has no own id field — its ARRAY INDEX (stable, order never
 * changes) is the override key, not its name (see lib/grade9-content.ts).
 *
 * Missions carry real functions too (e.g. a battle enemy's adaptive
 * `attack: ctx => ...`), nested rather than a top-level check() — never
 * sent to the browser at all, same guarantee as Grade 7/8's stripped
 * check() (JSON.stringify silently drops function-valued properties at
 * any depth, confirmed with a real round-trip test).
 */

interface Mission { id: string; type: string; title: string; emoji?: string; xp?: number; phase?: string; [key: string]: unknown }
interface Tier { name: string; ids: string[] }
interface MissionLesson { title: string; html: string }
interface OverrideRow { scope: 'world' | 'stage' | 'lesson'; target_id: string; override_data: Record<string, unknown> }

type EditTarget =
  | { scope: 'world'; tierIndex: number; tier: Tier }
  | { scope: 'stage'; tierIndex: number; tier: Tier; mission: Mission }

export function Grade9LessonEditor({ classId }: { classId: string }) {
  const [tiers,        setTiers]        = useState<Tier[] | null>(null)
  const [missions,     setMissions]     = useState<Record<string, Mission>>({})
  const [lessons,      setLessons]      = useState<Record<string, MissionLesson>>({})
  const [overridden,   setOverridden]   = useState<Set<string>>(new Set())
  const [error,        setError]        = useState('')
  const [edit,         setEdit]         = useState<EditTarget | null>(null)
  const [saving,       setSaving]       = useState(false)
  const [iframeKey,    setIframeKey]    = useState(0)
  const jsonRef        = useRef<HTMLTextAreaElement>(null)
  const lessonTitleRef = useRef<HTMLInputElement>(null)
  const lessonHtmlRef  = useRef<HTMLTextAreaElement>(null)
  const fileInputRef   = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')

  const load = useCallback(async () => {
    try {
      const [contentRes, overridesRes] = await Promise.all([
        fetch(`/api/teacher/grade9-content?classId=${classId}`),
        fetch(`/api/class-lesson-overrides?classId=${classId}&lessonKey=grade9-missions`),
      ])
      const content   = await contentRes.json()
      const overrides = await overridesRes.json()
      if (!contentRes.ok) throw new Error(content.error ?? 'Failed to load')
      setTiers(content.tiers ?? [])
      setMissions(content.missions ?? {})
      setLessons(content.missionLessons ?? {})
      const keys = new Set<string>((overrides.overrides ?? []).map((o: OverrideRow) => `${o.scope}:${o.target_id}`))
      setOverridden(keys)
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Failed to load')
    }
  }, [classId])

  useEffect(() => { load() }, [load])

  function openEdit(target: EditTarget) { setEdit(target) }

  async function handleImageFile(file: File) {
    setUploading(true)
    setUploadErr('')
    try {
      const form = new FormData()
      form.append('file', file)
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
      const targetId = edit.scope === 'world' ? String(edit.tierIndex) : edit.mission.id
      const raw = jsonRef.current?.value ?? '{}'
      let overrideData: Record<string, unknown>
      try { overrideData = JSON.parse(raw) } catch { throw new Error('Invalid JSON — check the field for a typo') }

      const res = await fetch('/api/class-lesson-overrides', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, lessonKey: 'grade9-missions', scope: edit.scope, targetId, overrideData }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to publish')

      if (edit.scope === 'stage') {
        const lessonRes = await fetch('/api/class-lesson-overrides', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            classId, lessonKey: 'grade9-missions', scope: 'lesson', targetId,
            overrideData: { title: lessonTitleRef.current?.value ?? '', html: lessonHtmlRef.current?.value ?? '' },
          }),
        })
        const lessonData = await lessonRes.json()
        if (!lessonRes.ok) throw new Error(lessonData.error ?? 'Failed to publish lesson content')
      }

      setEdit(null)
      await load()
      setIframeKey(k => k + 1)
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Failed to publish')
    } finally {
      setSaving(false)
    }
  }

  async function revert(target: EditTarget) {
    if (!confirm('Revert this back to the original, unedited content?')) return
    const targetId = target.scope === 'world' ? String(target.tierIndex) : target.mission.id
    try {
      const res = await fetch(`/api/class-lesson-overrides?classId=${classId}&lessonKey=grade9-missions&scope=${target.scope}&targetId=${targetId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to revert')
      if (target.scope === 'stage') {
        await fetch(`/api/class-lesson-overrides?classId=${classId}&lessonKey=grade9-missions&scope=lesson&targetId=${targetId}`, { method: 'DELETE' })
      }
      setEdit(null)
      await load()
      setIframeKey(k => k + 1)
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Failed to revert')
    }
  }

  if (error && !tiers) return <p className="text-xs text-rose p-4">{error}</p>
  if (!tiers) return <p className="text-xs text-fg-dim p-4">Loading Grade 9 content…</p>

  const editIsOverridden = edit
    ? (edit.scope === 'world'
        ? overridden.has(`world:${edit.tierIndex}`)
        : overridden.has(`stage:${edit.mission.id}`) || overridden.has(`lesson:${edit.mission.id}`))
    : false

  const label = edit
    ? (edit.scope === 'world' ? edit.tier.name : (edit.mission.title ?? edit.mission.id))
    : ''
  const currentLesson = edit && edit.scope === 'stage' ? lessons[edit.mission.id] : undefined
  const obj = edit ? (edit.scope === 'world' ? { name: edit.tier.name } : edit.mission) : {}

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-4">
      <div className="card p-0 overflow-hidden min-w-0">
        <div className="px-3 sm:px-4 py-2.5 border-b border-b2 flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-semibold text-fg whitespace-nowrap">🌊 Live student preview</span>
          <span className="text-[11px] text-t3">Updates after you publish</span>
        </div>
        <iframe
          key={iframeKey}
          src={`/lessons/grade9-missions.html?classId=${classId}&teacher=1`}
          className="w-full h-[60vh] min-h-[420px] lg:h-[620px] lg:min-h-0"
          style={{ border: 0 }}
          title="Grade 9 student preview"
        />
      </div>

      <div className="card p-3 sm:p-4 min-w-0 lg:max-h-[660px] lg:overflow-y-auto">
        <h3 className="font-semibold text-fg text-sm mb-3">Chapters &amp; missions</h3>
        {error && <p className="text-xs text-rose mb-3">{error}</p>}

        {edit ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-fg truncate min-w-0">Editing: {label}</span>
              <button onClick={() => setEdit(null)} className="text-[11px] text-t3 hover:text-fg transition-colors shrink-0">← back</button>
            </div>

            {edit.scope === 'stage' && (
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
                  {edit.mission.type === 'learn'
                    ? 'This mission has its OWN inline theory (edit it in the raw fields below, under learn.theory) — this box is an extra explainer some non-learn missions use instead.'
                    : 'The real explainer text shown for this mission.'}
                  {' '}Leave blank to have none. Click "Add image" to upload a real photo/diagram.
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
            )}

            <p className="text-[11px] text-fg-dim">
              {edit.scope === 'stage'
                ? 'Mission fields below (title, xp, brief, starter code, battle stats, etc. — never any nested function like an adaptive enemy attack pattern, which stays fixed for safety), then Publish.'
                : 'Chapter name below, then Publish.'}
              {' '}This only affects <strong>this class</strong> — the original stays the same for everyone else, and you can revert any time.
            </p>
            <textarea
              ref={jsonRef}
              defaultValue={JSON.stringify(obj, null, 2)}
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
                  onClick={() => revert(edit)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-md bg-rose/10 border border-rose/30 text-rose hover:bg-rose/20 transition-colors"
                >
                  Revert to original
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[11px] text-fg-dim -mt-1">Click any chapter or mission below to edit it.</p>
            {tiers.map((t, tierIndex) => (
              <div key={tierIndex} className="border border-b2 rounded-md p-2.5">
                <button
                  onClick={() => openEdit({ scope: 'world', tierIndex, tier: t })}
                  className="w-full flex items-center justify-between gap-2 text-left group rounded-md px-1.5 py-1 -mx-1.5 hover:bg-s2 border border-transparent hover:border-b2 transition-colors"
                >
                  <span className="text-xs font-semibold text-fg group-hover:text-accent transition-colors truncate min-w-0">{t.name}</span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    {overridden.has(`world:${tierIndex}`) && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald/10 text-emerald border border-emerald/25 whitespace-nowrap">edited</span>
                    )}
                    <span className="text-[11px] text-accent">✎ Edit</span>
                  </span>
                </button>
                <div className="mt-1.5 space-y-1">
                  {t.ids.map(id => {
                    const m = missions[id]
                    if (!m) return null
                    return (
                      <button
                        key={id}
                        onClick={() => openEdit({ scope: 'stage', tierIndex, tier: t, mission: m })}
                        className="w-full flex items-center justify-between gap-2 text-left px-2 py-1.5 rounded-md border border-transparent hover:border-b2 hover:bg-s2 transition-colors group"
                      >
                        <span className="text-[11px] text-t2 group-hover:text-fg transition-colors truncate min-w-0">
                          {m.emoji} {m.title ?? m.id}
                        </span>
                        <span className="flex items-center gap-1.5 shrink-0">
                          {(overridden.has(`stage:${id}`) || overridden.has(`lesson:${id}`)) && (
                            <span className="text-[9px] px-1 py-0.5 rounded bg-emerald/10 text-emerald border border-emerald/25 whitespace-nowrap">edited</span>
                          )}
                          <span className="text-[10px] text-accent opacity-70 group-hover:opacity-100 transition-opacity">✎ Edit</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
