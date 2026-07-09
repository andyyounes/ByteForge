import Link from 'next/link'
import { clsx } from 'clsx'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { LockIcon, ArrowRightIcon } from '@/components/ui/Icons'
import { ACHIEVEMENTS, ACHIEVEMENT_MAP } from '@/lib/concepts'
import type { UserAchievement } from '@/types'

interface AchievementsTeaserProps {
  unlocked: UserAchievement[]
}

export function AchievementsTeaser({ unlocked }: AchievementsTeaserProps) {
  const unlockedIds = new Set(unlocked.map(a => a.achievement_id))
  const recent = unlocked
    .sort((a, b) => new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime())
    .slice(0, 5)
    .map(a => ACHIEVEMENT_MAP.get(a.achievement_id))
    .filter(Boolean)

  const lockedSample = ACHIEVEMENTS
    .filter(a => !unlockedIds.has(a.id))
    .slice(0, 5 - recent.length)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Achievements</CardTitle>
        <Link
          href="/student/achievements"
          className="flex items-center gap-1 text-xs text-fg-dim hover:text-accent transition-colors"
        >
          All {ACHIEVEMENTS.length}
          <ArrowRightIcon size={12} strokeWidth={2} />
        </Link>
      </CardHeader>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Unlocked achievements */}
        {recent.map(ach => (
          <AchievementBadge
            key={ach!.id}
            icon={ach!.icon}
            name={ach!.name}
            description={ach!.description}
            xp={ach!.xp}
            unlocked
          />
        ))}

        {/* Locked placeholders */}
        {lockedSample.map(ach => (
          <AchievementBadge
            key={ach.id}
            icon={ach.icon}
            name={ach.name}
            description={ach.description}
            xp={ach.xp}
            unlocked={false}
          />
        ))}

        {/* Count summary */}
        <div className="ml-auto flex flex-col items-end">
          <span className="text-xl font-bold text-fg tabular-nums">
            {unlockedIds.size}
          </span>
          <span className="text-[11px] text-fg-faint">earned</span>
        </div>
      </div>
    </Card>
  )
}

// ── Achievement badge tile ────────────────────────────────────────────────────
// Replaces emoji with a styled monogram container.
// Category colour is derived from XP tier.

function AchievementBadge({
  icon,
  name,
  description,
  xp,
  unlocked,
}: {
  icon:        string
  name:        string
  description: string
  xp:          number
  unlocked:    boolean
}) {
  const tierColor =
    xp >= 500 ? 'var(--amber)'   :
    xp >= 100 ? 'var(--violet)'  :
    xp >= 75  ? 'var(--amber)'   :
    xp >= 50  ? 'var(--sky)'     :
                'var(--emerald)'

  return (
    <div
      className={clsx(
        'w-11 h-11 rounded-lg flex items-center justify-center shrink-0',
        'border transition-all duration-150',
        unlocked
          ? 'bg-s2 border-b3 cursor-default'
          : 'bg-s1 border-b2 opacity-35',
      )}
      style={unlocked ? { boxShadow: `inset 0 0 0 1px ${tierColor}30` } : undefined}
      title={`${unlocked ? name : '???'} — ${description}`}
      aria-label={unlocked ? name : 'Locked achievement'}
    >
      {unlocked ? (
        <span
          className="text-base leading-none select-none"
          style={{ color: tierColor }}
          aria-hidden="true"
        >
          {icon}
        </span>
      ) : (
        <LockIcon size={13} strokeWidth={1.8} className="text-fg-faint" />
      )}
    </div>
  )
}
