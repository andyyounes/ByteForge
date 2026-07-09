'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Button } from '@/components/ui/Button'
import { LogoMark, CheckCircleIcon, XIcon, Spinner, BookIcon } from '@/components/ui/Icons'

type JoinState = 'checking' | 'joining' | 'success' | 'pending' | 'login-required' | 'error'

// Inner component that uses useSearchParams — must be inside <Suspense>
function JoinContent() {
  const { user, loading } = useSupabase()
  const router            = useRouter()
  const searchParams      = useSearchParams()
  const code              = searchParams.get('code') ?? ''

  const [state,     setState]     = useState<JoinState>('checking')
  const [className, setClassName] = useState('')
  const [error,     setError]     = useState('')

  useEffect(() => {
    if (!code) { setState('error'); setError('No join code in link.'); return }
    fetch(`/api/classes/join?code=${code}`)
      .then(r => r.json())
      .then(d => {
        if (d.class) setClassName(d.class.name)
        else { setState('error'); setError('Invalid or expired join code.') }
      })
      .catch(() => { setState('error'); setError('Could not validate code.') })
  }, [code])

  useEffect(() => {
    if (loading || !className) return
    if (!user) { setState('login-required'); return }
    autoJoin()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, className])

  async function autoJoin() {
    setState('joining')
    const res  = await fetch('/api/classes/join', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ joinCode: code }),
    })
    const data = await res.json()
    if (data.pending) {
      setState('pending')
      setTimeout(() => router.push('/student/dashboard'), 3500)
    } else if (res.ok || data.message?.includes('Already')) {
      setState('success')
      setTimeout(() => router.push('/student/dashboard'), 2000)
    } else {
      setState('error')
      setError(data.error ?? 'Failed to join class.')
    }
  }

  return (
    <div className="bg-s1 border border-b2 rounded-lg p-6 text-center space-y-4">

      {/* Checking / joining */}
      {(state === 'checking' || state === 'joining') && (
        <>
          <div className="flex justify-center"><Spinner size={28} /></div>
          <p className="text-fg font-medium">
            {state === 'checking' ? 'Validating join code…' : `Joining ${className}…`}
          </p>
        </>
      )}

      {/* Success */}
      {state === 'success' && (
        <>
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-xl bg-emerald/10 border border-emerald/25 flex items-center justify-center">
              <CheckCircleIcon size={24} strokeWidth={1.6} className="text-emerald" />
            </div>
          </div>
          <h2 className="text-lg font-bold text-fg">Joined!</h2>
          <p className="text-fg-dim text-sm">
            You&#39;ve been added to <strong className="text-fg">{className}</strong>.
            Redirecting to your dashboard…
          </p>
        </>
      )}

      {/* Request pending teacher approval */}
      {state === 'pending' && (
        <>
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-xl bg-amber/10 border border-amber/25 flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
          <h2 className="text-lg font-bold text-fg">Request sent!</h2>
          <p className="text-fg-dim text-sm">
            Your teacher has been notified and will add you to{' '}
            <strong className="text-fg">{className}</strong> shortly.
            You can start exploring lessons in the meantime — redirecting…
          </p>
        </>
      )}

      {/* Not logged in */}
      {state === 'login-required' && (
        <>
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-xl bg-s2 border border-b2 flex items-center justify-center">
              <BookIcon size={22} strokeWidth={1.6} className="text-accent" />
            </div>
          </div>
          <h2 className="text-lg font-bold text-fg">Join {className || 'Class'}</h2>
          <p className="text-fg-dim text-sm">
            Sign in or create an account to join this class.{' '}
            Your code <strong className="text-fg font-mono">{code}</strong> will be filled in automatically.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Link href={`/login?joinCode=${code}&mode=register`}>
              <Button className="w-full">Create account</Button>
            </Link>
            <Link href={`/login?joinCode=${code}`}>
              <Button variant="secondary" className="w-full">Sign in</Button>
            </Link>
          </div>
        </>
      )}

      {/* Error */}
      {state === 'error' && (
        <>
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-xl bg-rose/10 border border-rose/25 flex items-center justify-center">
              <XIcon size={22} strokeWidth={2} className="text-rose" />
            </div>
          </div>
          <p className="text-rose font-medium">{error}</p>
          <Link href="/login">
            <Button variant="secondary">Go to login</Button>
          </Link>
        </>
      )}
    </div>
  )
}

// Outer page wraps JoinContent in Suspense — required by Next.js 15 for useSearchParams
export default function JoinPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-s0">
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-s2 border border-b2 mb-3">
            <LogoMark size={20} />
          </div>
          <h1 className="text-xl font-bold text-fg">ByteForge</h1>
        </div>

        <Suspense
          fallback={
            <div className="bg-s1 border border-b2 rounded-lg p-8 text-center">
              <div className="flex justify-center mb-3"><Spinner size={24} /></div>
              <p className="text-fg-dim text-sm">Loading…</p>
            </div>
          }
        >
          <JoinContent />
        </Suspense>
      </div>
    </div>
  )
}
