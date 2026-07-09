'use client'

import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

interface InviteModalProps {
  open:      boolean
  onClose:   () => void
  classId:   string
  className: string
  joinCode:  string
}

export function InviteModal({ open, onClose, classId, className, joinCode }: InviteModalProps) {
  const { toast }    = useToast()
  const [emails,  setEmails]  = useState('')
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<{ sent: number; failed: { email: string; error: string }[] } | null>(null)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const joinUrl = `${appUrl}/join?code=${joinCode}`

  async function handleSend(e: FormEvent) {
    e.preventDefault()
    const list = emails
      .split(/[\n,;]+/)
      .map(e => e.trim())
      .filter(e => e.includes('@'))

    if (!list.length) { toast.error('Enter at least one valid email'); return }

    setLoading(true)
    setResult(null)

    const res  = await fetch('/api/classes/invite', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ classId, emails: list }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      toast.error(data.error ?? 'Failed to send invites')
    } else {
      setResult(data)
      if (data.sent > 0) toast.success(`Sent ${data.sent} invite${data.sent > 1 ? 's' : ''}!`)
      setEmails('')
    }
  }

  function handleClose() {
    setResult(null)
    setEmails('')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Invite Students" size="md">
      <div className="space-y-5">
        {/* Join link preview */}
        <div className="p-3 rounded-xl bg-bg-raised border border-border">
          <p className="text-xs text-fg-faint mb-1">Students will receive a link to join:</p>
          <p className="font-semibold text-fg">{className}</p>
          <div className="flex items-center gap-2 mt-2">
            <code className="text-xs text-accent bg-bg px-2 py-1 rounded-md flex-1 truncate">{joinUrl}</code>
            <button
              onClick={() => { navigator.clipboard.writeText(joinUrl); toast.info('Link copied!') }}
              className="text-xs text-fg-dim hover:text-fg transition-colors shrink-0"
            >
              Copy
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-fg-faint">Join code:</span>
            <code className="text-sm font-bold font-mono text-accent tracking-widest">{joinCode}</code>
          </div>
        </div>

        {/* Email form */}
        <form onSubmit={handleSend} className="space-y-3">
          <div>
            <label className="block text-xs text-fg-dim mb-1.5">
              Student email addresses
              <span className="text-fg-faint ml-1">(one per line, or comma separated)</span>
            </label>
            <textarea
              value={emails}
              onChange={e => setEmails(e.target.value)}
              placeholder={'student1@school.com\nstudent2@school.com'}
              rows={5}
              className="w-full px-3 py-2.5 rounded-lg bg-bg-raised border border-border text-fg text-sm placeholder:text-fg-faint focus:border-accent focus:outline-none transition-colors resize-none font-mono"
            />
            <p className="text-xs text-fg-faint mt-1">
              {emails.split(/[\n,;]+/).filter(e => e.trim().includes('@')).length} valid email(s) entered
            </p>
          </div>

          <Button type="submit" loading={loading} className="w-full">
            Send Invites
          </Button>
        </form>

        {/* Result */}
        {result && (
          <div className="space-y-2">
            {result.sent > 0 && (
              <div className="px-3 py-2 rounded-lg bg-green/10 border border-green/20 text-green text-sm">
                {result.sent} invite{result.sent > 1 ? 's' : ''} sent successfully
              </div>
            )}
            {result.failed.length > 0 && (
              <div className="px-3 py-2 rounded-lg bg-red/10 border border-red/20 text-red text-sm space-y-1">
                {result.failed.map(f => (
                  <p key={f.email}>{f.email}: {f.error}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
