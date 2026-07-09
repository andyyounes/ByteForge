import { xpToLevel, levelTitle, xpBar } from '@/lib/xp'
import { ZapIcon, FlameIcon, TargetIcon, ChartBarIcon, StarIcon } from '@/components/ui/Icons'
import type { Profile, MasteryStatus } from '@/types'

interface StatsRowProps {
  profile:       Profile
  masteredCount: number
  statusCounts:  Record<MasteryStatus, number>
}

export function StatsRow({ profile, masteredCount, statusCounts }: StatsRowProps) {
  const level     = xpToLevel(profile.xp)
  const title     = levelTitle(level)
  const { pct }   = xpBar(profile.xp)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* Level — featured stat, taller visual weight */}
      <div className="col-span-2 sm:col-span-1 lg:col-span-2 metric-card p-5 flex flex-col justify-between gap-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="label-caps mb-1.5">Rank</p>
            <p className="text-4xl font-extrabold text-fg leading-none tabular-nums">
              {level}
            </p>
            <p className="text-xs text-fg-dim mt-2">{title}</p>
          </div>
          <span className="p-2 rounded-md bg-accent/10 text-accent border border-accent/20">
            <StarIcon size={16} strokeWidth={1.8} />
          </span>
        </div>
        {/* Level progress bar */}
        <div>
          <div className="xp-bar-track h-1.5 w-full">
            <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[11px] text-fg-faint mt-1.5">{pct}% to next level</p>
        </div>
      </div>

      {/* XP */}
      <StatCard
        label="Total XP"
        value={profile.xp.toLocaleString()}
        sub="experience"
        icon={<ZapIcon size={15} strokeWidth={1.8} />}
        iconColor="text-amber"
      />

      {/* Streak */}
      <StatCard
        label="Streak"
        value={`${profile.streak}`}
        sub={`Best: ${profile.longest_streak} days`}
        icon={<FlameIcon size={15} strokeWidth={1.8} />}
        iconColor="text-orange"
        suffix="d"
      />

      {/* Mastered */}
      <StatCard
        label="Mastered"
        value={String(masteredCount)}
        sub="of 42 concepts"
        icon={<TargetIcon size={15} strokeWidth={1.8} />}
        iconColor="text-emerald"
      />

      {/* Practicing */}
      <StatCard
        label="In Progress"
        value={String(statusCounts.practicing ?? 0)}
        sub="concepts active"
        icon={<ChartBarIcon size={15} strokeWidth={1.8} />}
        iconColor="text-sky"
      />
    </div>
  )
}

// ── Sub-component ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  suffix,
  icon,
  iconColor,
}: {
  label:      string
  value:      string
  sub:        string
  suffix?:    string
  icon:       React.ReactNode
  iconColor:  string
}) {
  return (
    <div className="metric-card p-4 flex min-h-32 flex-col justify-between gap-3">
      <div className="flex items-start justify-between">
        <p className="label-caps">{label}</p>
        <span className={`${iconColor} rounded-md bg-s2 p-1.5`}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold text-fg leading-none tabular-nums">
          {value}
          {suffix && <span className="text-base font-semibold text-fg-dim ml-0.5">{suffix}</span>}
        </p>
        <p className="text-[11px] text-fg-faint mt-1">{sub}</p>
      </div>
    </div>
  )
}
