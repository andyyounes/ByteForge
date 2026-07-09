'use client'

// Post-signup step for students who signed up WITHOUT a join link.
// Middleware routes any student with placement_confirmed = false here.
//
// Three ways forward:
//   1. Enter a class code       → join instantly or send a request (auto_accept)
//   2. Request via teacher email → teacher gets a notification and picks the class
//   3. Learning on my own        → pick a grade, placement confirmed directly
//
// The old placement quiz is gone — the class (or the student's own grade pick)
// is the source of truth for their level.

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import { Button } from '@/components/ui/Button'
import { LogoMark, CheckIcon } from '@/components/ui/Icons'
import { useToast } from '@/components/ui/Toast'

const inputCls = [
  'w-full h-10 px-3 rounded-md',
  'bg-s2 border border-b2',
  'text-fg text-sm placeholder:text-t3',
  'focus:border-accent focus:outline-none',
  'transition-colors',
].join(' ')

const GRADES = [
  { value: '6',  label: 'Grade 6' },
  { value: '7',  label: 'Grade 7' },
  { value: '8',  label: 'Grade 8' },
  { value: '9',  label: 'Grade 9' },
  { value: '10', label: 'IGCSE Year 1 (Grade 10)' },
  { value: '11', label: 'IGCSE Year 2 (Grade 11)' },
  { value: '12', label: 'AS Level (Grade 12)' },
  { value: '13', label: 'A Level (Grade 13)' },
]

type Mode = 'code' | 'teacher' | 'solo'

export default function OnboardingPage() {
  const router    = useRouter()
  const { toast } = useToast()

  const [mode,      setMode]      = useState<Mode>('code')
  const [code,      setCode]      = useState('')
  const [classInfo, setClassInfo] = useState<{ name: string; teacher?: { name: string } } | null>(null)
  const [codeError, setCodeError] = useState(false)
  const [tEmail,    setTEmail]    = useState('')
  const [grade,     setGrade]     = useState('7')
  const [loading,   setLoading]   = useState(false)

  // Live class-code preview
  useEffect(() => {
    setClassInfo(null)
    setCodeError(false)
    if (code.length < 4) return
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/classes/join?code=${code}`)
      if (res.ok) setClassInfo((await res.json()).class)
      else        setCodeError(true)
    }, 400)
    return () => clearTimeout(timer)
  }, [code])

  async function joinWithCode() {
    if (!code.trim()) return
    setLoading(true)
    const res  = await fetch('/api/classes/join', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ joinCode: code.trim() }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { toast.error(data.error ?? 'Invalid code'); return }
    if (data.pending) toast.success(`Request sent — your teacher will add you to ${data.class?.name ?? 'the class'} soon.`)
    else              toast.success(`Joined ${data.class?.name ?? 'class'}! 🎉`)
    router.push('/student/dashboard')
    router.refresh()
  }

  async function requestViaTeacher() {
    if (!tEmail.trim()) return
    setLoading(true)
    // 1. Send the join request to the teacher
    const res  = await fetch('/api/classes/request', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ teacherEmail: tEmail.trim(), grade }),
    })
    const data = await res.json()
    if (!res.ok) { setLoading(false); toast.error(data.error ?? 'Could not send request'); return }

    // 2. Confirm placement from the selected grade so the dashboard opens
    await fetch('/api/onboarding', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ grade }),
    })
    setLoading(false)
    toast.success(`Request sent to ${data.teacher ?? 'your teacher'}!`)
    router.push('/student/dashboard')
    router.refresh()
  }

  async function continueSolo() {
    setLoading(true)
    const res = await fetch('/api/onboarding', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ grade }),
    })
    setLoading(false)
    if (!res.ok) { toast.error('Setup failed — try again.'); return }
    router.push('/student/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-dvh bg-s0 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-s2 border border-b2 mb-4">
            <LogoMark size={20} />
          </div>
          <h1 className="text-xl font-bold text-fg">Almost there!</h1>
          <p className="text-sm text-t2 mt-1">How do you want to join?</p>
        </div>

        <div className="bg-s1 border border-b2 rounded-lg p-6 space-y-5">

          {/* Mode tabs */}
          <div className="flex rounded-md bg-s2 border border-b2 p-0.5">
            {([
              { id: 'code',    label: 'Class code' },
              { id: 'teacher', label: 'My teacher' },
              { id: 'solo',    label: 'On my own' },
            ] as const).map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={clsx(
                  'flex-1 py-1.5 text-xs font-medium rounded transition-all',
                  mode === m.id ? 'bg-accent text-s0' : 'text-t2 hover:text-t1',
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* ── Class code ── */}
          {mode === 'code' && (
            <div className="space-y-3">
              <p className="text-xs text-fg-dim">
                Your teacher gave the class a short code — enter it here.
              </p>
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && joinWithCode()}
                placeholder="e.g. BYTE01"
                maxLength={10}
                className={clsx(
                  inputCls, 'font-mono tracking-widest text-center',
                  classInfo ? 'border-emerald' : codeError ? 'border-rose' : '',
                )}
              />
              {classInfo && (
                <p className="text-xs text-emerald flex items-center gap-1.5">
                  <CheckIcon size={11} strokeWidth={2.5} />
                  <span><strong>{classInfo.name}</strong>{classInfo.teacher?.name ? ` — ${classInfo.teacher.name}` : ''}</span>
                </p>
              )}
              {codeError && <p className="text-xs text-rose">Invalid code — double-check with your teacher.</p>}
              <Button onClick={joinWithCode} loading={loading} disabled={!classInfo} className="w-full">
                Join class
              </Button>
            </div>
          )}

          {/* ── Teacher email ── */}
          {mode === 'teacher' && (
            <div className="space-y-3">
              <p className="text-xs text-fg-dim">
                No code? Enter your teacher&#39;s email and your grade — they&#39;ll get a
                notification and add you to the right class.
              </p>
              <input
                type="email"
                value={tEmail}
                onChange={e => setTEmail(e.target.value)}
                placeholder="teacher@school.com"
                className={inputCls}
              />
              <select value={grade} onChange={e => setGrade(e.target.value)} className={clsx(inputCls, 'appearance-none')}>
                {GRADES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
              <Button onClick={requestViaTeacher} loading={loading} disabled={!tEmail.trim()} className="w-full">
                Send request
              </Button>
            </div>
          )}

          {/* ── Solo ── */}
          {mode === 'solo' && (
            <div className="space-y-3">
              <p className="text-xs text-fg-dim">
                Learning without a class? Pick your grade — you can always join a
                class later from your dashboard.
              </p>
              <select value={grade} onChange={e => setGrade(e.target.value)} className={clsx(inputCls, 'appearance-none')}>
                {GRADES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
              <Button onClick={continueSolo} loading={loading} className="w-full">
                Start learning
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
