'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Teacher visual editor for Grade 7 ("The Game Maker"). Same shape as
 * Grade6LessonEditor — see that file's comment for the full rationale.
 * Difference: Grade 7 stages carry real check() functions, which the
 * /api/teacher/grade7-content route never sends to the browser at all (see
 * lib/grade7-content.ts) — so pass/fail logic can never be edited here,
 * only the safe fields (name/xp/text/hints/questions/etc.).
 */

interface Stage { id: string; name?: string; emoji?: string; xp?: number; text?: string; boss?: boolean; [key: string]: unknown }
interface World { id: string; name: string; sub: string; live?: boolean; stages: Stage[] }
interface ChallengeLesson { title: string; html: string }
interface OverrideRow { scope: 'world' | 'stage' | 'lesson'; target_id: string; override_data: Record<string, unknown> }

type EditTarget =
  | { scope: 'world'; world: World }
  | { scope: 'stage'; world: World; stage: Stage }

export function Grade7LessonEditor({ classId }: { classId: string }) {
  const [worlds,       setWorlds]       = useState<World[] | null>(null)
  const [lessons,      setLessons]      = useState<Record<string, ChallengeLesson>>({})
  const [overridden,   setOverridden]   = useState<Set<string>>(new Set())
  const [error,        setError]        = useState('')
  const [edit,         setEdit]         = useState<EditTarget | null>(null)
  const [saving,       setSaving]       = useState(false)
  const [iframeKey,    setIframeKey]    = useState(0)
  const jsonRef        = useRef<HTMLTextAreaElement>(null)
  const lessonTitleRef = useRef<HTMLInputElement>(null)
  const lessonHtmlRef  = useRef<HTMLTextAreaElement>(null)

  const load = useCallback(async () => {
    try {
      const [contentRes, overridesRes] = await Promise.all([
        fetch(`/api/teacher/grade7-content?classId=${classId}`),
        fetch(`/api/class-lesson-overrides?classId=${classId}&lessonKey=grade7`),
      ])
      const content   = await contentRes.json()
      const overrides = await overridesRes.json()
      if (!contentRes.ok) throw new Error(content.error ?? 'Failed to load')
      setWorlds(content.worlds ?? [])
      setLessons(content.challengeLessons ?? {})
      const keys = new Set<string>((overrides.overrides ?? []).map((o: OverrideRow) => `${o.scope}:${o.target_id}`))
      setOverridden(keys)
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Failed to load')
    }
  }, [classId])

  useEffect(() => { load() }, [load])

  function openEdit(target: EditTarget) { setEdit(target) }

  async function publish() {
    if (!edit) return
    setSaving(true)
    try {
      const targetId = edit.scope === 'world' ? edit.world.id : edit.stage.id
      const raw = jsonRef.current?.value ?? '{}'
      let overrideData: Record<string, unknown>
      try { overrideData = JSON.parse(raw) } catch { throw new Error('Invalid JSON — check the field for a typo') }

      const res = await fetch('/api/class-lesson-overrides', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, lessonKey: 'grade7', scope: edit.scope, targetId, overrideData }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to publish')

      if (edit.scope === 'stage') {
        const lessonRes = await fetch('/api/class-lesson-overrides', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            classId, lessonKey: 'grade7', scope: 'lesson', targetId,
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
    const targetId = target.scope === 'world' ? target.world.id : target.stage.id
    try {
      const res = await fetch(`/api/class-lesson-overrides?classId=${classId}&lessonKey=grade7&scope=${target.scope}&targetId=${targetId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to revert')
      if (target.scope === 'stage') {
        await fetch(`/api/class-lesson-overrides?classId=${classId}&lessonKey=grade7&scope=lesson&targetId=${targetId}`, { method: 'DELETE' })
      }
      setEdit(null)
      await load()
      setIframeKey(k => k + 1)
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Failed to revert')
    }
  }

  if (error && !worlds) return <p className="text-xs text-rose p-4">{error}</p>
  if (!worlds) return <p className="text-xs text-fg-dim p-4">Loading Grade 7 content…</p>

  const editIsOverridden = edit
    ? (edit.scope === 'world'
        ? overridden.has(`world:${edit.world.id}`)
        : overridden.has(`stage:${edit.stage.id}`) || overridden.has(`lesson:${edit.stage.id}`))
    : false

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-4">
      <div className="card p-0 overflow-hidden min-w-0">
        <div className="px-3 sm:px-4 py-2.5 border-b border-b2 flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-semibold text-fg whitespace-nowrap">🎮 Live student preview</span>
          <span className="text-[11px] text-t3">Updates after you publish</span>
        </div>
        <iframe
          key={iframeKey}
          src={`/lessons/grade7.html?classId=${classId}&teacher=1`}
          className="w-full h-[60vh] min-h-[420px] lg:h-[620px] lg:min-h-0"
          style={{ border: 0 }}
          title="Grade 7 student preview"
        />
      </div>

      <div className="card p-3 sm:p-4 min-w-0 lg:max-h-[660px] lg:overflow-y-auto">
        <h3 className="font-semibold text-fg text-sm mb-3">Worlds &amp; stages</h3>
        {error && <p className="text-xs text-rose mb-3">{error}</p>}

        {edit ? (
          <EditPanel
            edit={edit}
            jsonRef={jsonRef}
            lessonTitleRef={lessonTitleRef}
            lessonHtmlRef={lessonHtmlRef}
            currentLesson={edit.scope === 'stage' ? lessons[edit.stage.id] : undefined}
            saving={saving}
            onCancel={() => setEdit(null)}
            onPublish={publish}
            onRevert={() => revert(edit)}
            isOverridden={editIsOverridden}
          />
        ) : (
          <div className="space-y-3">
            <p className="text-[11px] text-fg-dim -mt-1">Click any world or stage below to edit it.</p>
            {worlds.map(w => (
              <div key={w.id} className="border border-b2 rounded-md p-2.5">
                <button
                  onClick={() => openEdit({ scope: 'world', world: w })}
                  className="w-full flex items-center justify-between gap-2 text-left group rounded-md px-1.5 py-1 -mx-1.5 hover:bg-s2 border border-transparent hover:border-b2 transition-colors"
                >
                  <span className="text-xs font-semibold text-fg group-hover:text-accent transition-colors truncate min-w-0">{w.name}</span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    {overridden.has(`world:${w.id}`) && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald/10 text-emerald border border-emerald/25 whitespace-nowrap">edited</span>
                    )}
                    <span className="text-[11px] text-accent">✎ Edit</span>
                  </span>
                </button>
                <div className="mt-1.5 space-y-1">
                  {w.stages.map(s => (
                    <button
                      key={s.id}
                      onClick={() => openEdit({ scope: 'stage', world: w, stage: s })}
                      className="w-full flex items-center justify-between gap-2 text-left px-2 py-1.5 rounded-md border border-transparent hover:border-b2 hover:bg-s2 transition-colors group"
                    >
                      <span className="text-[11px] text-t2 group-hover:text-fg transition-colors truncate min-w-0">
                        {s.emoji} {s.name ?? s.id}
                      </span>
                      <span className="flex items-center gap-1.5 shrink-0">
                        {(overridden.has(`stage:${s.id}`) || overridden.has(`lesson:${s.id}`)) && (
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

function EditPanel({
  edit, jsonRef, lessonTitleRef, lessonHtmlRef, currentLesson, saving, onCancel, onPublish, onRevert, isOverridden,
}: {
  edit:           EditTarget
  jsonRef:        React.RefObject<HTMLTextAreaElement | null>
  lessonTitleRef: React.RefObject<HTMLInputElement | null>
  lessonHtmlRef:  React.RefObject<HTMLTextAreaElement | null>
  currentLesson:  { title: string; html: string } | undefined
  saving:         boolean
  onCancel:       () => void
  onPublish:      () => void
  onRevert:       () => void
  isOverridden:   boolean
}) {
  const obj = edit.scope === 'world'
    ? { name: edit.world.name, sub: edit.world.sub }
    : edit.stage
  const label = edit.scope === 'world' ? edit.world.name : (edit.stage.name ?? edit.stage.id)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-fg truncate min-w-0">Editing: {label}</span>
        <button onClick={onCancel} className="text-[11px] text-t3 hover:text-fg transition-colors shrink-0">← back</button>
      </div>

      {edit.scope === 'stage' && (
        <div className="space-y-2 border border-b2 rounded-md p-2.5 bg-s2/40">
          <p className="text-[11px] font-semibold text-fg">📘 Lesson content</p>
          <p className="text-[10.5px] text-fg-dim">
            The real explainer text shown above this stage. Leave blank to hide the lesson panel for it.
          </p>
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
          ? 'Stage fields below (name, xp, text, hints, quiz questions, etc. — never the pass/fail check logic itself, which stays fixed for safety), then Publish.'
          : 'Content below, then Publish.'}
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
          onClick={onPublish}
          disabled={saving}
          className="text-xs font-semibold px-3 py-1.5 rounded-md bg-emerald/10 border border-emerald/30 text-emerald hover:bg-emerald/20 transition-colors disabled:opacity-50"
        >
          {saving ? 'Publishing…' : 'Publish to this class'}
        </button>
        {isOverridden && (
          <button
            onClick={onRevert}
            className="text-xs font-semibold px-3 py-1.5 rounded-md bg-rose/10 border border-rose/30 text-rose hover:bg-rose/20 transition-colors"
          >
            Revert to original
          </button>
        )}
      </div>
    </div>
  )
}
