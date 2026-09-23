'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Button } from '@/components/ui/Button'
import { LogoMark, CheckCircleIcon, ChevronRightIcon } from '@/components/ui/Icons'

export default function ForgotPasswordPage() {
  const { supabase } = useSupabase()
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  // Second path — asks the teacher to set a new password directly, instead
  // of depending on an email actually arriving. Doesn't touch the email flow
  // above at all; a student can try either, independently.
  const [showTeacherForm, setShowTeacherForm] = useState(false)
  const [teacherEmail,    setTeacherEmail]    = useState('')
  const [teacherLoading,  setTeacherLoading]  = useState(false)
  const [teacherSent,     setTeacherSent]     = useState<string | null>(null)
  const [teacherError,    setTeacherError]    = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    // Trim/lowercase before sending — same fix as the login page, so a
    // stray space doesn't send the reset email to a technically-different
    // (and likely nonexistent) address than the account actually uses.
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
    })
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  async function handleTeacherSubmit(e: FormEvent) {
    e.preventDefault()
    setTeacherLoading(true)
    setTeacherError(null)
    try {
      const res  = await fetch('/api/auth/password-reset-request', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          studentEmail: email.trim().toLowerCase(),
          teacherEmail: teacherEmail.trim().toLowerCase(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to send request')
      setTeacherSent(data.message ?? 'Request sent')
    } catch (e: unknown) {
      setTeacherError((e as Error).message ?? 'Failed to send request')
    }
    setTeacherLoading(false)
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-s0">
      <div className="w-full max-w-sm">

        {/* Wordmark */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-s2 border border-b2 mb-3">
            <LogoMark size={20} />
          </div>
          <h1 className="text-xl font-bold text-fg">ByteForge</h1>
        </div>

        <div className="bg-s1 border border-b2 rounded-lg p-6">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-14 h-14 rounded-xl bg-emerald/10 border border-emerald/25 flex items-center justify-center">
                  <CheckCircleIcon size={24} strokeWidth={1.6} className="text-emerald" />
                </div>
              </div>
              <h2 className="text-lg font-semibold text-fg">Check your email</h2>
              <p className="text-sm text-fg-dim">
                We sent a reset link to <span className="text-fg font-medium">{email}</span>.
                Click it to choose a new password.
              </p>
              <Link href="/login" className="inline-flex items-center gap-1 text-sm text-accent hover:opacity-80 mt-2">
                <ChevronRightIcon size={12} strokeWidth={2.2} className="rotate-180" />
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-fg mb-1">Forgot password?</h2>
              <p className="text-sm text-fg-dim mb-5">
                Enter your email and we'll send you a reset link.
              </p>

              {error && (
                <div className="mb-4 px-3 py-2.5 rounded-md bg-rose/10 border border-rose/20 text-rose text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-t2 mb-1.5" htmlFor="email">
                    Email address
                  </label>
                  <input
                    id="email" type="email" required
                    value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@school.com"
                    className="w-full h-10 px-3 rounded-md bg-s2 border border-b2 text-fg text-sm placeholder:text-t3 focus:border-accent focus:outline-none transition-colors"
                  />
                </div>
                <Button type="submit" loading={loading} className="w-full">
                  Send reset link
                </Button>
              </form>

              <Link href="/login" className="flex items-center justify-center gap-1 text-sm text-fg-dim hover:text-fg mt-4 transition-colors">
                <ChevronRightIcon size={12} strokeWidth={2.2} className="rotate-180" />
                Back to sign in
              </Link>

              {/* Second path — no email needs to arrive at all */}
              <div className="mt-5 pt-5 border-t border-b2">
                {teacherSent ? (
                  <div className="text-center space-y-2">
                    <div className="flex justify-center">
                      <div className="w-10 h-10 rounded-lg bg-emerald/10 border border-emerald/25 flex items-center justify-center">
                        <CheckCircleIcon size={18} strokeWidth={1.6} className="text-emerald" />
                      </div>
                    </div>
                    <p className="text-sm text-fg-dim">{teacherSent}</p>
                  </div>
                ) : showTeacherForm ? (
                  <form onSubmit={handleTeacherSubmit} className="space-y-3">
                    <p className="text-xs text-fg-dim">
                      Your teacher can set a new password for you directly — no email needed.
                    </p>
                    {teacherError && (
                      <div className="px-3 py-2 rounded-md bg-rose/10 border border-rose/20 text-rose text-xs">
                        {teacherError}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-t2 mb-1.5" htmlFor="email2">
                        Your email
                      </label>
                      <input
                        id="email2" type="email" required
                        value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="you@school.com"
                        className="w-full h-9 px-3 rounded-md bg-s2 border border-b2 text-fg text-sm placeholder:text-t3 focus:border-accent focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-t2 mb-1.5" htmlFor="teacherEmail">
                        Your teacher's email
                      </label>
                      <input
                        id="teacherEmail" type="email" required
                        value={teacherEmail} onChange={e => setTeacherEmail(e.target.value)}
                        placeholder="teacher@school.com"
                        className="w-full h-9 px-3 rounded-md bg-s2 border border-b2 text-fg text-sm placeholder:text-t3 focus:border-accent focus:outline-none transition-colors"
                      />
                    </div>
                    <Button type="submit" loading={teacherLoading} className="w-full" variant="secondary">
                      Ask my teacher instead
                    </Button>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowTeacherForm(true)}
                    className="w-full text-center text-sm text-fg-dim hover:text-fg transition-colors"
                  >
                    Can't get the email? Ask your teacher instead →
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
