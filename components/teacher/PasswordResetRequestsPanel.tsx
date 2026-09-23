'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Teacher notification panel for pending student password-reset requests.
 * Same shape as JoinRequestsPanel — renders nothing when empty, polls every
 * 30s. Approving asks the teacher to type a new password right here (never
 * emailed), which they then hand to the student in person.
 */

interface ResetRequest {
  id:         string
  created_at: string
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

export function PasswordResetRequestsPanel() {
  const [requests, setRequests] = useState<ResetRequest[]>([])
  const [busy,     setBusy]     = useState<string | null>(null)
  const [pwds,     setPwds]     = useState<Record<string, string>>({})
  const [done,     setDone]     = useState<Record<string, string>>({})  // requestId → new password, shown once
  const [error,    setError]    = useState('')

  const load = useCallback(async () => {
    try {
      const res  = await fetch('/api/teacher/password-reset-requests')
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

  async function act(req: ResetRequest, action: 'approve' | 'decline') {
    const newPassword = pwds[req.id]?.trim()
    if (action === 'approve' && (!newPassword || newPassword.length < 6)) {
      setError('Type a new password of at least 6 characters first.')
      return
    }
    setBusy(req.id)
    setError('')
    try {
      const res  = await fetch('/api/teacher/password-reset-requests', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ requestId: req.id, action, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      if (action === 'approve') {
        // Shown once so the teacher can copy it down for the student —
        // never stored anywhere in plaintext, never emailed.
        setDone(d => ({ ...d, [req.id]: newPassword! }))
      } else {
        setRequests(rs => rs.filter(r => r.id !== req.id))
      }
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
          <span className="text-lg">🔑</span>
          <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-amber-400 text-black text-[10px] font-bold flex items-center justify-center">
            {requests.length}
          </span>
        </div>
        <div>
          <h3 className="font-semibold text-fg text-sm">Password reset requests</h3>
          <p className="text-xs text-fg-dim">
            {requests.length} student{requests.length !== 1 ? 's' : ''} locked out
          </p>
        </div>
      </div>

      {error && <p className="text-xs text-rose mb-3">{error}</p>}

      <div className="space-y-2">
        {requests.map(req => (
          <div key={req.id} className="py-2.5 px-3 rounded-md bg-s2 border border-b2">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="text-sm font-medium text-fg truncate">{req.student?.name ?? 'Unknown student'}</p>
                <p className="text-xs text-t3 truncate">{req.student?.email} · {timeAgo(req.created_at)}</p>
              </div>

              {done[req.id] ? (
                <div className="text-xs text-emerald font-medium shrink-0">
                  ✓ New password set: <code className="text-fg bg-s1 px-1.5 py-0.5 rounded">{done[req.id]}</code> — tell the student directly.
                </div>
              ) : (
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="text"
                    value={pwds[req.id] ?? ''}
                    onChange={e => setPwds(p => ({ ...p, [req.id]: e.target.value }))}
                    placeholder="New password…"
                    className="h-7 w-32 px-2 text-xs rounded-md bg-s1 border border-b2 text-fg focus:border-accent focus:outline-none"
                  />
                  <button
                    onClick={() => act(req, 'approve')}
                    disabled={busy === req.id}
                    className="text-xs font-semibold px-3 py-1.5 rounded-md bg-emerald/10 border border-emerald/30 text-emerald hover:bg-emerald/20 transition-colors disabled:opacity-40"
                  >
                    {busy === req.id ? '…' : '✓ Set password'}
                  </button>
                  <button
                    onClick={() => act(req, 'decline')}
                    disabled={busy === req.id}
                    className="text-xs px-2.5 py-1.5 rounded-md bg-s1 border border-b2 text-t3 hover:text-rose hover:border-rose/30 transition-colors disabled:opacity-40"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
