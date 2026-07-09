import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ACHIEVEMENTS, ACHIEVEMENT_MAP } from '@/lib/concepts'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { LockIcon, CheckIcon, ZapIcon } from '@/components/ui/Icons'
import type { Profile, UserAchievement } from '@/types'

export const metadata: Metadata = { title: 'Achievements' }
export const dynamic = 'force-dynamic'

export default async function AchievementsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, achievementsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single<Profile>(),
    supabase.from('user_achievements').select('*').eq('student_id', user.id),
  ])

  const profile   = profileRes.data
  if (!profile) redirect('/login')

  const unlocked    = (achievementsRes.data ?? []) as UserAchievement[]
  const unlockedMap = new Map(unlocked.map(a => [a.achievement_id, a]))
  const totalXp     = unlocked.reduce((s, a) => s + a.xp_earned, 0)

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Page header */}
      <div>
        <p className="label-caps mb-2">Progress</p>
        <h1 className="text-2xl font-bold text-fg">Achievements</h1>
        <p className="text-sm text-fg-dim mt-1">
          {unlockedMap.size} of {ACHIEVEMENTS.length} earned
        </p>
      </div>

      {/* Summary stats — stripped of emoji, numbers carry the weight */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: unlockedMap.size,              label: 'Earned',  icon: <CheckIcon size={14} strokeWidth={2} className="text-emerald" /> },
          { value: ACHIEVEMENTS.length - unlockedMap.size, label: 'Locked', icon: <LockIcon  size={14} strokeWidth={1.8} className="text-fg-faint" /> },
          { value: totalXp,                       label: 'Bonus XP', icon: <ZapIcon   size={14} strokeWidth={1.8} className="text-amber"  /> },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="label-caps">{s.label}</p>
              {s.icon}
            </div>
            <p className="text-2xl font-bold text-fg tabular-nums">{s.value.toLocaleString()}</p>
          </Card>
        ))}
      </div>

      {/* ── Earned section ── */}
      {unlockedMap.size > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-fg mb-3 flex items-center gap-2">
            <CheckIcon size={14} strokeWidth={2.2} className="text-emerald" />
            Earned
            <span className="text-fg-faint font-normal">({unlockedMap.size})</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {ACHIEVEMENTS.filter(a => unlockedMap.has(a.id)).map(ach => {
              const earned    = unlockedMap.get(ach.id)!
              const tierColor =
                ach.xp >= 500 ? 'var(--amber)'  :
                ach.xp >= 100 ? 'var(--violet)'  :
                ach.xp >= 75  ? 'var(--amber)'  :
                ach.xp >= 50  ? 'var(--sky)'    :
                                'var(--emerald)'
              return (
                <div key={ach.id} className="bg-s1 border border-b2 hover:border-b3 rounded-lg p-4 flex flex-col gap-2.5 transition-all">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      background: `color-mix(in srgb, ${tierColor} 14%, var(--s2))`,
                      border:     `1px solid ${tierColor}35`,
                    }}
                  >
                    <span className="text-lg leading-none" style={{ color: tierColor }} aria-hidden="true">
                      {ach.icon}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-fg leading-snug">{ach.name}</p>
                    <p className="text-xs text-fg-dim leading-snug mt-0.5">{ach.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    {ach.xp > 0 && (
                      <Badge variant="yellow" size="sm" className="tabular-nums">+{ach.xp} XP</Badge>
                    )}
                    <p className="text-[10px] text-fg-faint ml-auto">
                      {new Date(earned.unlocked_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Still to earn section ── */}
      {ACHIEVEMENTS.filter(a => !unlockedMap.has(a.id)).length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-fg-dim mb-3 flex items-center gap-2">
            <LockIcon size={13} strokeWidth={1.8} className="text-fg-faint" />
            Still to earn
            <span className="text-fg-faint font-normal">
              ({ACHIEVEMENTS.filter(a => !unlockedMap.has(a.id)).length})
            </span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {ACHIEVEMENTS.filter(a => !unlockedMap.has(a.id)).map(ach => (
              <div key={ach.id} className="bg-s1 border border-b2 rounded-lg p-4 flex flex-col gap-2.5 opacity-45">
                <div className="w-10 h-10 rounded-lg bg-s2 border border-b2 flex items-center justify-center">
                  <LockIcon size={14} strokeWidth={1.8} className="text-fg-faint" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-fg leading-snug">{ach.name}</p>
                  <p className="text-xs text-fg-dim leading-snug mt-0.5">{ach.description}</p>
                </div>
                <div className="mt-auto">
                  {ach.xp > 0 && (
                    <Badge variant="default" size="sm" className="tabular-nums">+{ach.xp} XP</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
