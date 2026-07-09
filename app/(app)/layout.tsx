import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { STAGE_MAP, DEFAULT_STAGE } from '@/lib/stage-config'
import type { Profile, StageId } from '@/types'

// Force fresh profile on every request — prevents a stale cached profile from
// showing the wrong stage accent after a logout / account switch.
export const dynamic = 'force-dynamic'

// ── Accent resolution ─────────────────────────────────────────────────────────
// Computed server-side so the correct --accent value is embedded in the
// SSR HTML (as an inline style on AppShell's root div).  This means the
// colour is correct from the very first paint, before any JS runs.
// StageAccentProvider still mirrors it to :root for client-side updates.

const TEACHER_ACCENT     = '#f07428'
const TEACHER_ACCENT_DIM = '#c95d1a'

function resolveAccent(profile: Profile | null): { accent: string; accentDim: string } {
  if (profile?.role === 'teacher') {
    return { accent: TEACHER_ACCENT, accentDim: TEACHER_ACCENT_DIM }
  }
  const stageId = ((profile?.stage ?? DEFAULT_STAGE) as StageId)
  const cfg     = STAGE_MAP.get(stageId) ?? STAGE_MAP.get(DEFAULT_STAGE)!
  return { accent: cfg.accent, accentDim: cfg.accentDim }
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  const { accent, accentDim } = resolveAccent(profile)

  return (
    <AppShell profile={profile} accent={accent} accentDim={accentDim}>
      {children}
    </AppShell>
  )
}
