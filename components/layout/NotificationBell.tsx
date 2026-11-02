'use client'

import { useState, useEffect, useCallback } from 'react'
import { clsx } from 'clsx'
import { BellIcon } from '@/components/ui/Icons'

interface NotificationRow {
  id:         string
  type:       string
  title:      string
  body:       string
  read:       boolean
  created_at: string
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function NotificationBell() {
  const [items, setItems] = useState<NotificationRow[] | null>(null)
  const [open,  setOpen]  = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = await res.json()
      setItems(data.notifications ?? [])
    } catch { /* stay quiet — a failed poll shouldn't disrupt the page */ }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [load])

  const unread = (items ?? []).filter(n => !n.read)

  async function markRead(id: string) {
    setItems(prev => (prev ?? []).map(n => (n.id === id ? { ...n, read: true } : n)))
    await fetch('/api/notifications', { method: 'PATCH', body: JSON.stringify({ id }) })
  }

  async function markAllRead() {
    setItems(prev => (prev ?? []).map(n => ({ ...n, read: true })))
    await fetch('/api/notifications', { method: 'PATCH', body: JSON.stringify({ all: true }) })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="relative p-1.5 rounded-md text-fg-dim hover:text-fg hover:bg-s2 transition-colors"
        aria-label={`Notifications${unread.length ? ` (${unread.length} unread)` : ''}`}
      >
        <BellIcon size={18} />
        {unread.length > 0 && (
          <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-rose" />
        )}
      </button>

      {open && (
        <>
          {/* Click-outside backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-lg
                           bg-s2 border border-b2 shadow-overlay z-50">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-b2 sticky top-0 bg-s2">
              <p className="text-xs font-semibold text-fg-dim uppercase tracking-wide">Notifications</p>
              {unread.length > 0 && (
                <button onClick={markAllRead} className="text-xs text-accent hover:underline">
                  Mark all read
                </button>
              )}
            </div>

            {!items || items.length === 0 ? (
              <p className="text-sm text-fg-faint px-4 py-6 text-center">
                {items === null ? 'Loading…' : 'Nothing yet.'}
              </p>
            ) : (
              <div className="divide-y divide-b2">
                {items.map(n => (
                  <button
                    key={n.id}
                    onClick={() => !n.read && markRead(n.id)}
                    className={clsx(
                      'w-full text-left px-4 py-3 transition-colors hover:bg-s1',
                      !n.read && 'bg-accent/5',
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-accent shrink-0" />}
                      <div className={clsx('flex-1 min-w-0', n.read && 'pl-3.5')}>
                        <p className="text-sm font-medium text-fg leading-snug">{n.title}</p>
                        <p className="text-xs text-fg-dim mt-0.5 leading-snug">{n.body}</p>
                        <p className="text-[11px] text-fg-faint mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
