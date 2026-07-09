'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Teacher notification panel for pending join requests.
 * Renders nothing when there are no requests; otherwise shows an amber
 * notification card with approve / decline actions. Polls every 30s so new
 * requests appear without a refresh.
 */

interface ClassOption { id: string; name: string; grade?: string | null }

interface JoinRequest {
  id:         string
  grade:      string | null
  created_at: string
  class_id:   string | null
  class:      { id: string; name: string; grade: string | null } | null
  student:    { id: string; name: string | null; email: string | null } | null
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function JoinRequestsPanel({ classes }: { classes: ClassOption[] }) {
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [busy,     setBusy]     = useState<string | null>(null)   // request id being handled
  const [picks,    setPicks]    = useState<Record<string, string>>({})  // requestId → classId
  const [error,    setError]    = useState('')

  const load = useCallback(async () => {
    try {
      const res  = await fetch('/api/teacher/join-requests')
      if (!res.ok) return
      const data = await res.json()
      setRequests(data.requests ?? [])
    } catch { /* transient — next poll will retry */ }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 30_000)
    return () => clearInterval(t)
  }, [load])

  async function act(req: JoinRequest, action: 'approve' | 'decline') {
    const classId = req.class_id ?? picks[req.id]
    if (action === 'approve' && !classId) {
      setError('Pick a class for this student first.')
      return
    }
    setBusy(req.id)
    setError('')
    try {
      const res  = await fetch('/api/teacher/join-requests', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ requestId: req.id, action, classId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setRequests(rs => rs.filter(r => r.id !== req.id))
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Failed')
    }
    setBusy(null)
  }

  if (requests.length === 0) return null

  return (
    <div className="card p-5 border-amber-400/30" style={{ background: 'rgba(251,191,36,.03)' }}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="relative">
          <span className="text-lg">🔔</span>
          <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-amber-400 text-black text-[10px] font-bold flex items-center justify-center">
            {requests.length}
          </span>
        </div>
        <div>
          <h3 className="font-semibold text-fg text-sm">Join requests</h3>
          <p className="text-xs text-fg-dim">
            {requests.length} student{requests.length !== 1 ? 's' : ''} waiting to be added to a class
          </p>
        </div>
      </div>

      {error && <p className="text-xs text-rose mb-3">{error}</p>}

      <div className="space-y-2">
        {requests.map(req => (
          <div key={req.id} className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-md bg-s2 border border-b2 flex-wrap">
            <div className="min-w-0">
              <p className="text-sm font-medium text-fg truncate">
                {req.student?.name ?? 'Unknown student'}
                {req.grade && <span className="ml-2 text-xs font-semibold text-amber-400">Grade {req.grade}</span>}
              </p>
              <p className="text-xs text-t3 truncate">
                {req.student?.email} · {timeAgo(req.created_at)}
                {req.class ? <> · wants to join <strong className="text-t2">{req.class.name}</strong></> : ' · no class specified'}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Class picker — only for teacher-email requests with no class */}
              {!req.class_id && (
                <select
                  value={picks[req.id] ?? ''}
                  onChange={e => setPicks(p => ({ ...p, [req.id]: e.target.value }))}
                  className="h-7 px-2 text-xs rounded-md bg-s1 border border-b2 text-fg focus:border-accent focus:outline-none"
                >
                  <option value="">Pick class…</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
              <button
                onClick={() => act(req, 'approve')}
                disabled={busy === req.id}
                className="text-xs font-semibold px-3 py-1.5 rounded-md bg-emerald/10 border border-emerald/30 text-emerald hover:bg-emerald/20 transition-colors disabled:opacity-40"
              >
                {busy === req.id ? '…' : '✓ Add to class'}
              </button>
              <button
                onClick={() => act(req, 'decline')}
                disabled={busy === req.id}
                className="text-xs px-2.5 py-1.5 rounded-md bg-s1 border border-b2 text-t3 hover:text-rose hover:border-rose/30 transition-colors disabled:opacity-40"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
