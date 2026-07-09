'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Button } from '@/components/ui/Button'
import { LogoMark } from '@/components/ui/Icons'

const inputCls = 'w-full h-10 px-3 rounded-md bg-s2 border border-b2 text-fg text-sm placeholder:text-t3 focus:border-accent focus:outline-none transition-colors'

export default function ResetPasswordPage() {
  const { supabase } = useSupabase()
  const router       = useRouter()

  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm)  { setError('Passwords do not match'); return }
    if (password.length < 6)   { setError('Password must be at least 6 characters'); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) setError(error.message)
    else { router.push('/student/dashboard'); router.refresh() }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-s0">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-s2 border border-b2 mb-3">
            <LogoMark size={20} />
          </div>
          <h1 className="text-xl font-bold text-fg">ByteForge</h1>
        </div>

        <div className="bg-s1 border border-b2 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-fg mb-1">Set new password</h2>
          <p className="text-sm text-fg-dim mb-5">Choose a strong password for your account.</p>

          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-md bg-rose/10 border border-rose/20 text-rose text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-t2 mb-1.5" htmlFor="password">
                New password
              </label>
              <input
                id="password" type="password" required minLength={6}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-t2 mb-1.5" htmlFor="confirm">
                Confirm password
              </label>
              <input
                id="confirm" type="password" required minLength={6}
                value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••" className={inputCls}
              />
            </div>
            <Button type="submit" loading={loading} className="w-full">
              Update password
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
