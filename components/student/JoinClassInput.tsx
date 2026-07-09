'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import { Button } from '@/components/ui/Button'
import { BookIcon } from '@/components/ui/Icons'
import { useToast } from '@/components/ui/Toast'

interface MyRequest {
  id:         string
  status:     'pending' | 'approved' | 'declined'
  created_at: string
  class:      { name: string } | null
  teacher:    { name: string } | null
}

const inputCls = clsx(
  'h-9 px-3 rounded-md',
  'bg-s2 border border-b2',
  'text-fg text-sm placeholder:text-t3',
  'focus:border-accent focus:outline-none transition-colors',
)

export function JoinClassInput() {
  const router    = useRouter()
  const { toast } = useToast()

  const [code,     setCode]     = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showAlt,  setShowAlt]  = useState(false)      // "no code" panel
  const [tEmail,   setTEmail]   = useState('')
  const [grade,    setGrade]    = useState('7')
  const [requests, setRequests] = useState<MyRequest[]>([])

  // Show any pending / recently handled requests
  useEffect(() => {
    fetch('/api/classes/request')
      .then(r => r.ok ? r.json() : { requests: [] })
      .then(d => setRequests(d.requests ?? []))
      .catch(() => {})
  }, [])

  const pending = requests.filter(r => r.status === 'pending')

  async function handleJoin() {
    if (!code.trim()) return
    setLoading(true)
    const res  = await fetch('/api/classes/join', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ joinCode: code.trim() }),
    })
    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      toast.error(json.error ?? 'Invalid code')
    } else if (json.pending) {
      toast.success(`Request sent — your teacher will add you to "${json.class.name}" soon.`)
      setCode('')
      setRequests(rs => [{ id: 'tmp', status: 'pending', created_at: new Date().toISOString(), class: { name: json.class.name }, teacher: null }, ...rs])
    } else if (json.message?.includes('Already')) {
      toast.success(`Already in "${json.class.name}" — refreshing…`)
      setCode('')
      router.refresh()
    } else {
      toast.success(`Joined "${json.class.name}"! 🎉`)
      setCode('')
      router.refresh()
    }
  }

  async function handleRequest() {
    if (!tEmail.trim()) return
    setLoading(true)
    const res  = await fetch('/api/classes/request', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ teacherEmail: tEmail.trim(), grade }),
    })
    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      toast.error(json.error ?? 'Could not send request')
    } else {
      toast.success(`Request sent to ${json.teacher ?? 'your teacher'}!`)
      setTEmail('')
      setShowAlt(false)
      setRequests(rs => [{ id: 'tmp', status: 'pending', created_at: new Date().toISOString(), class: null, teacher: { name: json.teacher ?? '' } }, ...rs])
    }
  }

  return (
    <div className="card p-4 space-y-3">
      {/* Pending request banner */}
      {pending.length > 0 && (
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-amber/5 border border-amber/25">
          <span className="text-base">⏳</span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-fg">Waiting for your teacher</p>
            <p className="text-xs text-fg-dim truncate">
              {pending[0].class
                ? <>Your request to join <strong className="text-fg">{pending[0].class.name}</strong> is pending approval.</>
                : <>Your request to <strong className="text-fg">{pending[0].teacher?.name ?? 'your teacher'}</strong> is pending — they&apos;ll pick your class.</>}
            </p>
          </div>
        </div>
      )}

      {/* Code row */}
      <div className="flex items-center gap-3">
        <span className="shrink-0 text-fg-faint">
          <BookIcon size={16} strokeWidth={1.7} />
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-fg">Join a class</p>
          <p className="text-xs text-fg-dim">Enter the join code your teacher gave you</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            placeholder="BYTE01"
            maxLength={10}
            className={clsx(inputCls, 'w-24 font-mono tracking-widest')}
          />
          <Button size="sm" loading={loading && !showAlt} onClick={handleJoin}>
            Join
          </Button>
        </div>
      </div>

      {/* No-code fallback */}
      {!showAlt ? (
        <button
          onClick={() => setShowAlt(true)}
          className="text-xs text-t3 hover:text-accent transition-colors"
        >
          Don&apos;t have a code? Request to join with your teacher&apos;s email →
        </button>
      ) : (
        <div className="pt-2 border-t border-b1 space-y-2">
          <p className="text-xs text-fg-dim">
            Enter your teacher&apos;s email and your grade — they&apos;ll get a notification and add you to the right class.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="email"
              value={tEmail}
              onChange={e => setTEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRequest()}
              placeholder="teacher@school.com"
              className={clsx(inputCls, 'flex-1 min-w-[180px]')}
            />
            <select
              value={grade}
              onChange={e => setGrade(e.target.value)}
              className={clsx(inputCls, 'appearance-none w-28')}
            >
              <option value="6">Grade 6</option>
              <option value="7">Grade 7</option>
              <option value="8">Grade 8</option>
              <option value="9">Grade 9</option>
              <option value="10">Grade 10</option>
              <option value="11">Grade 11</option>
              <option value="12">AS Level</option>
              <option value="13">A Level</option>
            </select>
            <Button size="sm" loading={loading && showAlt} onClick={handleRequest}>
              Send request
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
