'use client'

import { useState, useEffect, useRef, Suspense, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { clsx } from 'clsx'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Button } from '@/components/ui/Button'
import { LogoMark, CheckIcon, UserIcon, BookIcon } from '@/components/ui/Icons'
import { useToast } from '@/components/ui/Toast'
import type { UserRole } from '@/types'

type AuthMode = 'login' | 'register'

// Shared input class — used throughout this form
const inputCls = [
  'w-full h-10 px-3 rounded-md',
  'bg-s2 border border-b2',
  'text-fg text-sm placeholder:text-t3',
  'focus:border-accent focus:outline-none',
  'transition-colors',
].join(' ')

// ── Saved login profiles ──────────────────────────────────────────────────
// A shared/lab computer's browser remembers up to 5 {name, email} pairs so
// returning to the login page shows "who's logging in?" instead of a blank
// email field every time — same idea as the desktop app's profile picker,
// just backed by localStorage (per-browser) instead of a file on disk.
// Never stores a password; a saved profile still always needs one typed in.
const PROFILES_KEY = 'bf_login_profiles'
const MAX_PROFILES = 5

interface SavedProfile { name: string; email: string }

function loadSavedProfiles(): SavedProfile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}
function addSavedProfile(name: string, email: string) {
  try {
    const profiles = loadSavedProfiles().filter(p => p.email !== email)
    profiles.unshift({ name: name || email.split('@')[0], email })
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles.slice(0, MAX_PROFILES)))
  } catch { /* localStorage unavailable (private window, quota, etc.) — skip silently */ }
}
function removeSavedProfile(email: string) {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(loadSavedProfiles().filter(p => p.email !== email)))
  } catch { /* same as above */ }
}

// Inner component uses useSearchParams — must live inside <Suspense>
function LoginContent() {
  const { supabase }  = useSupabase()
  const router        = useRouter()
  const searchParams  = useSearchParams()
  const { toast }     = useToast()

  const [mode,      setMode]      = useState<AuthMode>('login')
  const [role,      setRole]      = useState<UserRole>('student')
  const [name,      setName]      = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [joinCode,  setJoinCode]  = useState('')
  const [classInfo, setClassInfo] = useState<{ name: string; teacher: { name: string } } | null>(null)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([])
  const [showPicker,    setShowPicker]    = useState(false)
  const passwordRef = useRef<HTMLInputElement>(null)

  // localStorage only exists client-side — read it after mount, and show
  // the picker only when there's actually something to pick from.
  useEffect(() => {
    const profiles = loadSavedProfiles()
    setSavedProfiles(profiles)
    setShowPicker(profiles.length > 0)
  }, [])

  function pickProfile(p: SavedProfile) {
    setEmail(p.email)
    setShowPicker(false)
    setError(null)
    setTimeout(() => passwordRef.current?.focus(), 0)
  }

  // Live join-code lookup
  useEffect(() => {
    setClassInfo(null)
    setCodeError(null)
    if (joinCode.length < 4) return
    const timer = setTimeout(async () => {
      const res  = await fetch(`/api/classes/join?code=${joinCode}`)
      const json = await res.json()
      if (res.ok) setClassInfo(json.class)
      else        setCodeError('Invalid code')
    }, 500)
    return () => clearTimeout(timer)
  }, [joinCode])

  const redirectTo = searchParams.get('redirectTo')
  const errorParam = searchParams.get('error')

  // Arriving from a join link (/join → "Create account"): pre-fill the code
  // and open the register tab.
  useEffect(() => {
    const codeParam = searchParams.get('joinCode')
    if (codeParam) { setJoinCode(codeParam.toUpperCase()); setRole('student') }
    if (searchParams.get('mode') === 'register') setMode('register')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Trim (and lowercase) the email before it ever reaches Supabase — a
    // stray leading/trailing space from autofill or copy-paste makes
    // "user@x.com " a genuinely different string to Supabase's lookup,
    // which fails with the same generic "Invalid login credentials" as a
    // wrong password, even though the account is real and confirmed.
    const cleanEmail = email.trim().toLowerCase()

    try {
      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password })
        if (signInError) throw signInError

        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, role, placement_confirmed')
            .eq('id', user.id)
            .single<{ name: string; role: string; placement_confirmed: boolean }>()

          addSavedProfile(profile?.name ?? '', cleanEmail)

          if (profile?.role === 'teacher') {
            router.push('/teacher/dashboard')
          } else {
            router.push(redirectTo ?? '/student/dashboard')
          }
          router.refresh()
        }
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { name, role },
            emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          },
        })
        if (signUpError) throw signUpError

        if (role === 'student') {
          // Sign in immediately so we can call server-side APIs
          await supabase.auth.signInWithPassword({ email: cleanEmail, password })
          addSavedProfile(name, cleanEmail)

          if (joinCode.trim() && classInfo) {
            // Arrived via a join link — the class grade sets their level
            const joinRes  = await fetch('/api/classes/join', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({ joinCode: joinCode.trim() }),
            })
            const joinData = await joinRes.json().catch(() => ({}))
            if (joinData.pending) {
              toast.info(`Request sent — ${joinData.class?.name ?? 'your teacher'} will approve you shortly.`)
            }
            router.push('/student/dashboard')
          } else {
            // No code — next step asks how they want to join
            router.push('/onboarding')
          }
          router.refresh()
          return
        }

        toast.success('Teacher account created — sign in to continue.')
        setMode('login')
      }
    } catch (err: unknown) {
      setError((err as Error)?.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-s0 flex items-center justify-center p-4">
      {/* Subtle top-radial wash — one, not everywhere */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute -top-48 left-1/2 -translate-x-1/2 w-[600px] h-[400px]"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--accent) 7%, transparent) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Wordmark */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-s2 border border-b2 mb-4">
            <LogoMark size={20} />
          </div>
          <h1 className="text-xl font-bold text-fg">ByteForge</h1>
          <p className="text-sm text-t2 mt-1">Master ICT, one concept at a time</p>
        </div>

        {/* Auth card */}
        <div className="bg-s1 border border-b2 rounded-lg p-6">

          {mode === 'login' && showPicker ? (
            // ── Saved profile picker — shown first whenever this browser has
            // signed in before, so returning to a shared/lab computer shows
            // "who's signing in?" instead of a blank email field. Picking a
            // profile only pre-fills the email — a password is always still
            // required, nothing here bypasses a real sign-in.
            <div>
              <p className="text-sm font-semibold text-fg mb-1">Who&#39;s signing in?</p>
              <p className="text-xs text-t3 mb-4">Remembered on this device — you&#39;ll still need your password.</p>
              <div className="flex flex-wrap gap-3 mb-2">
                {savedProfiles.map(p => (
                  <div key={p.email} className="relative group w-[76px]">
                    <button
                      type="button"
                      onClick={() => pickProfile(p)}
                      className="w-full flex flex-col items-center gap-1.5"
                    >
                      <span className="w-14 h-14 rounded-full bg-accent/15 border border-accent/30 text-accent
                                        flex items-center justify-center text-base font-bold
                                        group-hover:border-accent transition-colors">
                        {(p.name || p.email).slice(0, 1).toUpperCase()}
                      </span>
                      <span className="text-xs text-t2 text-center truncate w-full">{p.name || p.email}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSavedProfiles(prev => { removeSavedProfile(p.email); return prev.filter(x => x.email !== p.email) })}
                      title="Remove this profile"
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-s2 border border-b2 text-t3
                                 flex items-center justify-center text-[11px] opacity-0 group-hover:opacity-100 transition-opacity
                                 hover:text-rose hover:border-rose/40"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => { setShowPicker(false); setEmail(''); setPassword('') }}
                  className="w-[76px] flex flex-col items-center gap-1.5"
                >
                  <span className="w-14 h-14 rounded-full bg-s2 border border-dashed border-b3 text-t3
                                    flex items-center justify-center text-xl hover:border-accent hover:text-accent transition-colors">
                    +
                  </span>
                  <span className="text-xs text-t3 text-center">Add account</span>
                </button>
              </div>
            </div>
          ) : (
          <>
          {/* Mode tabs */}
          <div className="flex rounded-md bg-s2 border border-b2 p-0.5 mb-6">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null) }}
                className={clsx(
                  'flex-1 py-1.5 text-sm font-medium rounded transition-all',
                  mode === m
                    ? 'bg-accent text-s0'
                    : 'text-t2 hover:text-t1',
                )}
              >
                {m === 'login' ? 'Sign in' : 'Register'}
              </button>
            ))}
          </div>

          {/* Error */}
          {(error || errorParam) && (
            <div className="mb-4 px-3 py-2.5 rounded-md bg-rose/10 border border-rose/20 text-rose text-sm">
              {error ?? 'Authentication failed. Please try again.'}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ── Register-only fields ── */}
            {mode === 'register' && (
              <>
                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-t2 mb-1.5" htmlFor="name">
                    Full name
                  </label>
                  <input
                    id="name" type="text" required
                    value={name} onChange={e => setName(e.target.value)}
                    placeholder="Alex Johnson"
                    className={inputCls}
                  />
                </div>

                {/* Role selector — clean, no emoji */}
                <div>
                  <label className="block text-xs font-medium text-t2 mb-1.5">I am a…</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { value: 'student', label: 'Student',  icon: <UserIcon  size={14} /> },
                      { value: 'teacher', label: 'Teacher',  icon: <BookIcon  size={14} /> },
                    ] as const).map(r => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value as UserRole)}
                        className={clsx(
                          'flex items-center justify-center gap-2',
                          'py-2.5 rounded-md border text-sm font-medium transition-all',
                          role === r.value
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-b2 bg-s2 text-t2 hover:text-t1 hover:border-b3',
                        )}
                      >
                        {r.icon}
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Join-link arrival — code came from the URL, just confirm it */}
                {role === 'student' && joinCode && (
                  <div className={clsx(
                    'px-3 py-2.5 rounded-md text-sm border',
                    classInfo ? 'bg-emerald/10 border-emerald/25 text-emerald' :
                    codeError ? 'bg-rose/10 border-rose/25 text-rose' :
                                'bg-s2 border-b2 text-t2',
                  )}>
                    {classInfo ? (
                      <span className="flex items-center gap-1.5">
                        <CheckIcon size={12} strokeWidth={2.5} />
                        <span>You&#39;ll join <strong>{classInfo.name}</strong> — {classInfo.teacher?.name}</span>
                      </span>
                    ) : codeError ? (
                      `Join code ${joinCode} is invalid — you can still sign up and join later.`
                    ) : (
                      `Checking join code ${joinCode}…`
                    )}
                  </div>
                )}
              </>
            )}

            {/* Email */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-t2" htmlFor="email">
                  Email
                </label>
                {mode === 'login' && savedProfiles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowPicker(true)}
                    className="text-xs text-t3 hover:text-accent transition-colors"
                  >
                    ← Switch profile
                  </button>
                )}
              </div>
              <input
                id="email" type="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@school.com"
                className={inputCls}
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-t2" htmlFor="password">
                  Password
                </label>
                {mode === 'login' && (
                  <Link href="/forgot-password" className="text-xs text-t3 hover:text-accent transition-colors">
                    Forgot password?
                  </Link>
                )}
              </div>
              <input
                ref={passwordRef}
                id="password" type="password" required minLength={6}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputCls}
              />
            </div>

            <Button type="submit" loading={loading} className="w-full mt-2">
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>
          </>
          )}
        </div>

        <p className="text-center text-xs text-t3 mt-4">
          By signing up you agree to our{' '}
          <Link href="/terms" className="text-accent">Terms of Service</Link>.
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-s0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-b2 border-t-accent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
