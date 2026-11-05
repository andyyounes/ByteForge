'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { useToast } from '@/components/ui/Toast'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { STAGE_MAP } from '@/lib/stage-config'
import type { Profile, StageId } from '@/types'

const inputCls = [
  'w-full h-10 px-3 rounded-md',
  'bg-s2 border border-b2',
  'text-fg text-sm placeholder:text-t3',
  'focus:border-accent focus:outline-none',
  'transition-colors',
].join(' ')

interface SettingsFormProps {
  profile: Profile
}

export function SettingsForm({ profile }: SettingsFormProps) {
  const router      = useRouter()
  const { toast }   = useToast()
  const { supabase } = useSupabase()
  const [name,      setName]      = useState(profile.name)
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '')
  const [saving,    setSaving]    = useState(false)

  // ── Change password ──────────────────────────────────────────────────────
  // A student locked out used to need a teacher to reset their password for
  // them (see /forgot-password's teacher-mediated flow) — this lets anyone
  // already signed in just change it themselves. supabase.auth.updateUser()
  // works off the current live session, no re-entered current password
  // needed (standard Supabase behaviour — the active session IS the proof).
  const [newPassword,     setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPw,      setChangingPw]      = useState(false)

  async function handleChangePassword() {
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters.'); return }
    if (newPassword !== confirmPassword) { toast.error('Passwords don\'t match.'); return }
    setChangingPw(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success('Password changed.')
      setNewPassword('')
      setConfirmPassword('')
    } catch (e) {
      toast.error((e as Error).message ?? 'Could not change password. Please try again.')
    } finally {
      setChangingPw(false)
    }
  }

  const isDirty = name.trim() !== profile.name || avatarUrl.trim() !== (profile.avatar_url ?? '')

  async function handleSave() {
    if (!isDirty) return
    if (!name.trim()) { toast.error('Name cannot be empty.'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:       name.trim(),
          avatar_url: avatarUrl.trim() || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as {error?: string}).error ?? 'Failed to save')
      }
      toast.success('Profile updated.')
      router.refresh()           // revalidate server-rendered profile data
    } catch (e) {
      toast.error((e as Error).message ?? 'Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const stageLabel = STAGE_MAP.get(profile.stage as StageId)?.label ?? profile.stage

  return (
    <div className="space-y-8 max-w-lg">

      {/* Avatar preview */}
      <div className="flex items-center gap-4">
        <Avatar name={name || profile.name} avatarUrl={avatarUrl || null} size="lg" />
        <div>
          <p className="text-sm font-semibold text-fg">{name || profile.name}</p>
          <p className="text-xs text-fg-faint capitalize">{profile.role} · {stageLabel}</p>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="label-caps block mb-1.5" htmlFor="settings-name">Display name</label>
        <input
          id="settings-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={100}
          className="w-full rounded-md border border-b2 bg-s2 px-3 py-2 text-sm text-fg
                     placeholder:text-fg-faint focus:outline-none focus:border-accent
                     focus:ring-1 focus:ring-accent transition-colors"
          placeholder="Your display name"
        />
      </div>

      {/* Avatar URL */}
      <div>
        <label className="label-caps block mb-1.5" htmlFor="settings-avatar">Avatar URL <span className="text-fg-faint normal-case font-normal">(optional)</span></label>
        <input
          id="settings-avatar"
          type="url"
          value={avatarUrl}
          onChange={e => setAvatarUrl(e.target.value)}
          className="w-full rounded-md border border-b2 bg-s2 px-3 py-2 text-sm text-fg
                     placeholder:text-fg-faint focus:outline-none focus:border-accent
                     focus:ring-1 focus:ring-accent transition-colors"
          placeholder="https://example.com/avatar.png"
        />
        <p className="text-xs text-fg-faint mt-1.5">
          Leave empty to use your initials. Must be a publicly accessible image URL.
        </p>
      </div>

      {/* Read-only fields */}
      <div className="rounded-md border border-b2 bg-s1 divide-y divide-b2 text-sm">
        {[
          { label: 'Email',   value: profile.email },
          { label: 'Role',    value: profile.role.charAt(0).toUpperCase() + profile.role.slice(1) },
          { label: 'Stage',   value: stageLabel },
          { label: 'Account', value: `Created ${new Date(profile.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}` },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between px-4 py-3">
            <span className="text-fg-faint">{row.label}</span>
            <span className="text-fg font-medium">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          onClick={handleSave}
          loading={saving}
          disabled={!isDirty}
        >
          Save changes
        </Button>
        {isDirty && !saving && (
          <span className="text-xs text-fg-faint">Unsaved changes</span>
        )}
      </div>

      {/* Change password */}
      <div className="pt-6 border-t border-b2">
        <p className="label-caps mb-1.5">Password</p>
        <p className="text-xs text-fg-faint mb-4">
          Change your own password — no need to ask your teacher to reset it.
        </p>
        <div className="space-y-3 max-w-sm">
          <div>
            <label className="label-caps block mb-1.5" htmlFor="settings-new-password">New password</label>
            <input
              id="settings-new-password"
              type="password"
              minLength={6}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className={inputCls}
            />
          </div>
          <div>
            <label className="label-caps block mb-1.5" htmlFor="settings-confirm-password">Confirm new password</label>
            <input
              id="settings-confirm-password"
              type="password"
              minLength={6}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className={inputCls}
            />
          </div>
          <Button
            variant="secondary"
            onClick={handleChangePassword}
            loading={changingPw}
            disabled={!newPassword || !confirmPassword}
          >
            Change password
          </Button>
        </div>
      </div>
    </div>
  )
}
