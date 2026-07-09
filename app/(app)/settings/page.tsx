import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from './SettingsForm'
import type { Profile } from '@/types'

export const metadata: Metadata = { title: 'Settings' }
export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  if (!profile) redirect('/login')

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <p className="label-caps mb-2">Account</p>
        <h1 className="text-2xl font-bold text-fg">Settings</h1>
        <p className="text-sm text-fg-dim mt-1">
          Update your display name and profile picture.
        </p>
      </div>

      <SettingsForm profile={profile} />
    </div>
  )
}
