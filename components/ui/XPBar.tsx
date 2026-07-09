'use client'

import { clsx } from 'clsx'
import { xpBar, xpToLevel, levelTitle } from '@/lib/xp'

interface XPBarProps {
  xp:         number
  showLabel?: boolean
  showLevel?: boolean
  className?: string
  height?:    'xs' | 'sm' | 'md'
}

export function XPBar({
  xp,
  showLabel = true,
  showLevel = false,
  className,
  height    = 'md',
}: XPBarProps) {
  const { pct, current, next } = xpBar(xp)
  const level = xpToLevel(xp)
  const title = levelTitle(level)

  const trackH =
    height === 'xs' ? 'h-1'   :
    height === 'sm' ? 'h-1.5' :
                      'h-2'

  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      {showLevel && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-fg">
            Level {level}
            <span className="ml-1.5 text-xs font-normal text-fg-faint">— {title}</span>
          </span>
          <span className="text-xs text-fg-faint tabular-nums">
            {current.toLocaleString()} / {next.toLocaleString()} XP
          </span>
        </div>
      )}

      {/* Track */}
      <div
        className={clsx('xp-bar-track w-full', trackH)}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`XP progress: ${pct}%`}
      >
        <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
      </div>

      {showLabel && !showLevel && (
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-fg-faint tabular-nums">
            {current.toLocaleString()} / {next.toLocaleString()} XP
          </span>
          <span className="text-[11px] text-fg-faint">{pct}%</span>
        </div>
      )}
    </div>
  )
}
