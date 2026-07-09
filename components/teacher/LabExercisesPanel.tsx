'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Teacher panel for the students' A Level Code Lab.
 * Tabs = the built-in exercise categories + "⭐ Custom".
 *  - Built-in exercises can be EDITED — the edit is saved as a per-class
 *    override (override_key = 'setId/exId') and replaces the default for
 *    this class only. "Reset" deletes the override.
 *  - The Custom tab holds the teacher's own exercises (add/edit/delete),
 *    shown to students as "⭐ From your teacher".
 *
 * Checking model: expected output lines → auto-checked on Run
 * (Pseudocode/Python); no expected lines → AI-checked against the task.
 */

interface LabExercise {
  id:           string
  title:        string
  descr:        string
  expect:       string[]
  starter:      string | null
  xp:           number
  override_key: string | null
}

interface BuiltinExercise {
  id:      string
  title:   string
  xp:      number
  desc:    string
  expect:  string[]
  starter: string
}

interface BuiltinSet {
  name:      string
  icon:      string
  exercises: BuiltinExercise[]
}

const inputCls = 'w-full px-3 py-2 text-sm rounded-md bg-s2 border border-b2 text-fg placeholder:text-t3 focus:border-accent focus:outline-none transition-colors'

// What's being edited: a custom row, a built-in (by key), or a brand-new custom
type EditTarget =
  | { kind: 'new' }
  | { kind: 'custom'; row: LabExercise }
  | { kind: 'builtin'; setId: string; ex: BuiltinExercise; override: LabExercise | null }

export function LabExercisesPanel({ classId }: { classId: string }) {
  const [builtins, setBuiltins] = useState<Record<string, BuiltinSet> | null>(null)
  const [rows,     setRows]     = useState<LabExercise[] | null>(null)
  const [tab,      setTab]      = useState<string>('custom')
  const [editing,  setEditing]  = useState<EditTarget | null>(null)
  const [busy,     setBusy]     = useState(false)
  const [error,    setError]    = useState('')

  // Form state
  const [title,   setTitle]   = useState('')
  const [descr,   setDescr]   = useState('')
  const [expect,  setExpect]  = useState('')
  const [starter, setStarter] = useState('')
  const [xp,      setXp]      = useState(50)

  const load = useCallback(async () => {
    try {
      const [dbRes, jsonRes] = await Promise.all([
        fetch(`/api/lab-exercises?classId=${classId}`),
        fetch('/lessons/al-lab-exercises.json'),
      ])
      const dbData = await dbRes.json()
      setRows(dbRes.ok ? (dbData.exercises ?? []) : [])
      setBuiltins(jsonRes.ok ? await jsonRes.json() : {})
    } catch { setRows([]); setBuiltins({}) }
  }, [classId])

  useEffect(() => { load() }, [load])

  const customs   = (rows ?? []).filter(r => !r.override_key)
  const overrides = new Map((rows ?? []).filter(r => r.override_key).map(r => [r.override_key as string, r]))

  function openForm(target: EditTarget) {
    setEditing(target)
    setError('')
    if (target.kind === 'new') {
      setTitle(''); setDescr(''); setExpect(''); setStarter(''); setXp(50)
    } else if (target.kind === 'custom') {
      const r = target.row
      setTitle(r.title); setDescr(r.descr); setExpect((r.expect ?? []).join('\n'))
      setStarter(r.starter ?? ''); setXp(r.xp)
    } else {
      // Built-in: prefill from the override if one exists, else the default
      const o = target.override
      setTitle(o?.title ?? target.ex.title)
      setDescr(o?.descr ?? target.ex.desc)
      setExpect((o?.expect ?? target.ex.expect ?? []).join('\n'))
      setStarter(o?.starter ?? target.ex.starter ?? '')
      setXp(o?.xp ?? target.ex.xp)
    }
  }

  async function save() {
    if (!editing) return
    if (!title.trim() || !descr.trim()) { setError('Title and task are required.'); return }
    setBusy(true)
    setError('')
    const base = {
      classId, title, descr,
      expect: expect.split('\n').map(l => l.trim()).filter(l => l !== ''),
      starter, xp,
    }
    try {
      let res: Response
      if (editing.kind === 'custom') {
        res = await fetch('/api/lab-exercises', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...base, id: editing.row.id }),
        })
      } else {
        res = await fetch('/api/lab-exercises', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...base,
            ...(editing.kind === 'builtin' ? { overrideKey: `${editing.setId}/${editing.ex.id}` } : {}),
          }),
        })
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      setEditing(null)
      load()
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Save failed')
    }
    setBusy(false)
  }

  async function removeCustom(row: LabExercise) {
    if (!confirm(`Delete "${row.title}"? Students will no longer see it.`)) return
    await fetch(`/api/lab-exercises?id=${row.id}&classId=${classId}`, { method: 'DELETE' })
    load()
  }

  async function resetOverride(row: LabExercise) {
    if (!confirm('Reset this exercise to the built-in default for your class?')) return
    await fetch(`/api/lab-exercises?id=${row.id}&classId=${classId}`, { method: 'DELETE' })
    load()
  }

  const tabs: { id: string; label: string }[] = [
    { id: 'custom', label: `⭐ Custom (${customs.length})` },
    ...Object.entries(builtins ?? {}).map(([id, set]) => ({ id, label: set.name })),
  ]

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h3 className="font-semibold text-fg text-sm">🧪 Code Lab Exercises</h3>
        {tab === 'custom' && (
          <button
            onClick={() => openForm({ kind: 'new' })}
            className="text-xs font-semibold px-3 py-1.5 rounded-md bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors"
          >
            + Add exercise
          </button>
        )}
      </div>
      <p className="text-xs text-fg-dim mb-3">
        Everything students see in the 🧪 Code Lab. Edit any built-in exercise — your version replaces the
        default <strong className="text-fg">for this class only</strong> — or add your own under ⭐ Custom.
      </p>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setEditing(null) }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
              tab === t.id
                ? 'bg-accent/15 text-accent border border-accent/30'
                : 'text-t2 hover:text-fg hover:bg-s2 border border-transparent'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Custom tab ── */}
      {tab === 'custom' && (
        rows === null ? <p className="text-xs text-t3 py-3 text-center">Loading…</p> :
        customs.length === 0 && editing === null ? (
          <p className="text-xs text-t3 py-3 text-center">No custom exercises yet — click &quot;+ Add exercise&quot;.</p>
        ) : (
          <div className="space-y-2 mb-3">
            {customs.map(row => (
              <div key={row.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-md bg-s2 border border-b2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-fg truncate">
                    {row.title}
                    <span className="ml-2 text-xs font-bold text-amber-400">+{row.xp} XP</span>
                    <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-b2 text-t3">
                      {row.expect?.length ? 'auto-checked' : '🤖 AI-checked'}
                    </span>
                  </p>
                  <p className="text-xs text-t3 truncate">{row.descr}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => openForm({ kind: 'custom', row })}
                    className="text-xs px-2.5 py-1 rounded-md bg-s1 border border-b2 text-t2 hover:text-fg hover:border-b3 transition-colors">Edit</button>
                  <button onClick={() => removeCustom(row)}
                    className="text-xs px-2 py-1 rounded-md bg-s1 border border-b2 text-t3 hover:text-rose hover:border-rose/30 transition-colors">✕</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Built-in category tabs ── */}
      {tab !== 'custom' && builtins?.[tab] && (
        <div className="space-y-2 mb-3">
          {builtins[tab].exercises.map(ex => {
            const key = `${tab}/${ex.id}`
            const override = overrides.get(key) ?? null
            const shown = override ?? null
            return (
              <div key={ex.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-md bg-s2 border border-b2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-fg truncate">
                    {shown?.title ?? ex.title}
                    <span className="ml-2 text-xs font-bold text-amber-400">+{shown?.xp ?? ex.xp} XP</span>
                    {override ? (
                      <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-emerald/30 text-emerald">✓ customized</span>
                    ) : (
                      <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-b2 text-t3">default</span>
                    )}
                  </p>
                  <p className="text-xs text-t3 truncate">{shown?.descr ?? ex.desc}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => openForm({ kind: 'builtin', setId: tab, ex, override })}
                    className="text-xs px-2.5 py-1 rounded-md bg-s1 border border-b2 text-t2 hover:text-fg hover:border-b3 transition-colors">Edit</button>
                  {override && (
                    <button onClick={() => resetOverride(override)}
                      title="Restore the built-in default"
                      className="text-xs px-2.5 py-1 rounded-md bg-s1 border border-b2 text-t3 hover:text-amber-400 hover:border-amber-400/30 transition-colors">↺ Reset</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Editor form ── */}
      {editing !== null && (
        <div className="rounded-lg border border-accent/30 bg-s2 p-4 space-y-3">
          <p className="text-xs font-bold text-accent uppercase tracking-wider">
            {editing.kind === 'new' ? 'New custom exercise'
              : editing.kind === 'custom' ? 'Edit custom exercise'
              : `Edit built-in — ${editing.ex.title} (this class only)`}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_110px] gap-3">
            <div>
              <label className="block text-xs font-medium text-t2 mb-1">Title</label>
              <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. FizzBuzz 1–20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-t2 mb-1">XP reward</label>
              <input type="number" min={10} max={500} className={inputCls} value={xp} onChange={e => setXp(parseInt(e.target.value) || 50)} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-t2 mb-1">Task (what the student must do)</label>
            <textarea className={inputCls} rows={2} value={descr} onChange={e => setDescr(e.target.value)} />
          </div>

          <div>
            <label className="block text-xs font-medium text-t2 mb-1">
              Expected output — one line per line <span className="text-t3 font-normal">(leave empty for AI checking)</span>
            </label>
            <textarea className={`${inputCls} font-mono text-xs`} rows={4} value={expect} onChange={e => setExpect(e.target.value)} />
          </div>

          <div>
            <label className="block text-xs font-medium text-t2 mb-1">
              Pseudocode starter <span className="text-t3 font-normal">(optional — other languages get an auto-generated skeleton)</span>
            </label>
            <textarea className={`${inputCls} font-mono text-xs`} rows={5} value={starter} onChange={e => setStarter(e.target.value)} />
          </div>

          {error && <p className="text-xs text-rose">{error}</p>}

          <div className="flex items-center gap-2">
            <button onClick={save} disabled={busy}
              className="text-xs font-semibold px-4 py-2 rounded-md bg-accent text-s0 hover:opacity-90 transition-opacity disabled:opacity-40">
              {busy ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setEditing(null)}
              className="text-xs px-3 py-2 rounded-md border border-b2 text-t2 hover:text-fg transition-colors">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
