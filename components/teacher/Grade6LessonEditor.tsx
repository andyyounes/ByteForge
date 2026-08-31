'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Teacher visual editor for Grade 6 ("The Creator Quest").
 *
 * The left panel is the REAL student-facing grade6.html, live, in an iframe
 * (?classId=&teacher=1 — the same param the static page already reads to
 * resolve which class's overrides to merge in, see fetchClassIdG6() there).
 * The right panel lists every world/stage; editing one and publishing writes
 * a row to class_lesson_overrides, then reloads the iframe so the change is
 * visible immediately, proving the whole edit → publish → visual loop.
 *
 * Edits are per-field for the common stuff (title, emoji, xp, goal) plus a
 * raw JSON textarea covering the COMPLETE stage object, since Grade 6's
 * worlds each shape stages differently (a maze's `grid`, a color stage's
 * `target`, a boss's `mazes` array, ...) — one bespoke form per world-type
 * would be a much bigger build for the same "edit everything" outcome.
 */

interface Stage { id: string; title?: string; emoji?: string; xp?: number; goal?: string; boss?: boolean; [key: string]: unknown }
interface World { id: string; name: string; sub: string; live?: boolean; stages: Stage[] }
interface OverrideRow { scope: 'world' | 'stage'; target_id: string; override_data: Record<string, unknown> }

type EditTarget =
  | { scope: 'world'; world: World }
  | { scope: 'stage'; world: World; stage: Stage }

export function Grade6LessonEditor({ classId }: { classId: string }) {
  const [worlds,     setWorlds]     = useState<World[] | null>(null)
  const [overridden, setOverridden] = useState<Set<string>>(new Set())   // "world:w1" / "stage:w1s1"
  const [error,       setError]     = useState('')
  const [edit,        setEdit]      = useState<EditTarget | null>(null)
  const [saving,      setSaving]    = useState(false)
  const [iframeKey,   setIframeKey] = useState(0)
  const jsonRef = useRef<HTMLTextAreaElement>(null)

  const load = useCallback(async () => {
    try {
      const [contentRes, overridesRes] = await Promise.all([
        fetch(`/api/teacher/grade6-content?classId=${classId}`),
        fetch(`/api/class-lesson-overrides?classId=${classId}&lessonKey=grade6-quest`),
      ])
      const content   = await contentRes.json()
      const overrides = await overridesRes.json()
      if (!contentRes.ok) throw new Error(content.error ?? 'Failed to load')
      setWorlds(content.worlds ?? [])
      const keys = new Set<string>((overrides.overrides ?? []).map((o: OverrideRow) => `${o.scope}:${o.target_id}`))
      setOverridden(keys)
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Failed to load')
    }
  }, [classId])

  useEffect(() => { load() }, [load])

  function openEdit(target: EditTarget) {
    setEdit(target)
  }

  async function publish() {
    if (!edit) return
    setSaving(true)
    try {
      const targetId = edit.scope === 'world' ? edit.world.id : edit.stage.id
      const raw = jsonRef.current?.value ?? '{}'
      let overrideData: Record<string, unknown>
      try { overrideData = JSON.parse(raw) } catch { throw new Error('Invalid JSON — check the Advanced field for a typo') }

      const res = await fetch('/api/class-lesson-overrides', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, lessonKey: 'grade6-quest', scope: edit.scope, targetId, overrideData }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to publish')

      setEdit(null)
      await load()
      setIframeKey(k => k + 1)   // force the preview iframe to reload with the new content
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Failed to publish')
    } finally {
      setSaving(false)
    }
  }

  async function revert(scope: 'world' | 'stage', targetId: string) {
    if (!confirm('Revert this back to the original, unedited content?')) return
    try {
      const res = await fetch(`/api/class-lesson-overrides?classId=${classId}&lessonKey=grade6-quest&scope=${scope}&targetId=${targetId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to revert')
      setEdit(null)
      await load()
      setIframeKey(k => k + 1)
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Failed to revert')
    }
  }

  if (error && !worlds) return <p className="text-xs text-rose p-4">{error}</p>
  if (!worlds) return <p className="text-xs text-fg-dim p-4">Loading Grade 6 content…</p>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-4">
      {/* Live student-visual preview */}
      <div className="card p-0 overflow-hidden min-w-0">
        <div className="px-3 sm:px-4 py-2.5 border-b border-b2 flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-semibold text-fg whitespace-nowrap">🏝 Live student preview</span>
          <span className="text-[11px] text-t3">Updates after you publish</span>
        </div>
        <iframe
          key={iframeKey}
          src={`/lessons/grade6.html?classId=${classId}&teacher=1`}
          className="w-full h-[60vh] min-h-[420px] lg:h-[620px] lg:min-h-0"
          style={{ border: 0 }}
          title="Grade 6 student preview"
        />
      </div>

      {/* World/stage list + editor */}
      <div className="card p-3 sm:p-4 min-w-0 lg:max-h-[660px] lg:overflow-y-auto">
        <h3 className="font-semibold text-fg text-sm mb-3">Worlds &amp; stages</h3>
        {error && <p className="text-xs text-rose mb-3">{error}</p>}

        {edit ? (
          <EditPanel
            edit={edit}
            jsonRef={jsonRef}
            saving={saving}
            onCancel={() => setEdit(null)}
            onPublish={publish}
            onRevert={() => revert(edit.scope, edit.scope === 'world' ? edit.world.id : edit.stage.id)}
            isOverridden={overridden.has(edit.scope === 'world' ? `world:${edit.world.id}` : `stage:${edit.stage.id}`)}
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
                        {s.emoji} {s.title ?? s.id}
                      </span>
                      <span className="flex items-center gap-1.5 shrink-0">
                        {overridden.has(`stage:${s.id}`) && (
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
  edit, jsonRef, saving, onCancel, onPublish, onRevert, isOverridden,
}: {
  edit:         EditTarget
  jsonRef:      React.RefObject<HTMLTextAreaElement | null>
  saving:       boolean
  onCancel:     () => void
  onPublish:    () => void
  onRevert:     () => void
  isOverridden: boolean
}) {
  const obj = edit.scope === 'world'
    ? { name: edit.world.name, sub: edit.world.sub }
    : edit.stage
  const label = edit.scope === 'world' ? edit.world.name : (edit.stage.title ?? edit.stage.id)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-fg truncate min-w-0">Editing: {label}</span>
        <button onClick={onCancel} className="text-[11px] text-t3 hover:text-fg transition-colors shrink-0">← back</button>
      </div>
      <p className="text-[11px] text-fg-dim">
        Edit the raw content below (every field — title, xp, goal text, maze grid, colour target, etc.
        can all be changed here), then Publish. This only affects <strong>this class</strong> — the
        original stays the same for everyone else, and you can revert any time.
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
