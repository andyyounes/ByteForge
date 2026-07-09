// ── ProgressRing ──────────────────────────────────────────────────────────────
// SVG circular progress indicator used for pathway progress and concept mastery.

import { clsx } from 'clsx'

interface ProgressRingProps {
  /** 0–100 */
  pct:       number
  size?:     number
  strokeWidth?: number
  color?:    string
  trackColor?: string
  children?: React.ReactNode
  className?: string
  label?:    string
}

export function ProgressRing({
  pct,
  size        = 64,
  strokeWidth = 5,
  color       = 'var(--accent)',
  trackColor  = 'var(--bg-raised)',
  children,
  className,
  label,
}: ProgressRingProps) {
  const r          = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const offset     = circumference - (Math.min(100, Math.max(0, pct)) / 100) * circumference

  return (
    <div
      className={clsx('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      aria-label={label ?? `${pct}% complete`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>

      {/* Centre content */}
      {children && (
        <div className="relative z-10 flex flex-col items-center justify-center">
          {children}
        </div>
      )}
    </div>
  )
}
