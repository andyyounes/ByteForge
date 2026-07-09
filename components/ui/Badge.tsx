import { type HTMLAttributes } from 'react'
import { clsx } from 'clsx'

// ── Badge ─────────────────────────────────────────────────────────────────────
// Intentionally minimal — color only where it carries meaning

const variants = {
  default:    'bg-s2 border-b2 text-fg-dim',
  accent:     'bg-accent/12  border-accent/25  text-accent',
  green:      'bg-emerald/10 border-emerald/22 text-emerald',
  blue:       'bg-sky/10     border-sky/22     text-sky',
  purple:     'bg-violet/10  border-violet/22  text-violet',
  yellow:     'bg-amber/10   border-amber/22   text-amber',
  orange:     'bg-orange/10  border-orange/22  text-orange',
  red:        'bg-rose/10    border-rose/22    text-rose',
  cyan:       'bg-cyan/10    border-cyan/22    text-cyan',
  mastered:   'bg-emerald/10 border-emerald/22 text-emerald',
  practicing: 'bg-sky/10     border-sky/22     text-sky',
  started:    'bg-amber/10   border-amber/22   text-amber',
  available:  'bg-s2         border-b2         text-fg-dim',
  locked:     'bg-s2         border-b2         text-fg-faint opacity-50',
} as const

const sizes = {
  sm: 'px-1.5 py-0.5 text-[10px] rounded',
  md: 'px-2   py-0.5 text-xs     rounded-md',
  lg: 'px-2.5 py-1   text-sm     rounded-md',
} as const

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants
  size?:    keyof typeof sizes
  dot?:     boolean
}

export function Badge({
  variant = 'default',
  size    = 'md',
  dot,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium border',
        'leading-none whitespace-nowrap',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {dot && (
        <span className={clsx(
          'w-1.5 h-1.5 rounded-full shrink-0',
          variant === 'mastered'   ? 'bg-emerald' :
          variant === 'practicing' ? 'bg-sky'     :
          variant === 'started'    ? 'bg-amber'   :
          'bg-current',
        )} />
      )}
      {children}
    </span>
  )
}
