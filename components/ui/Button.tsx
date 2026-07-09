import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { clsx } from 'clsx'
import { Spinner } from '@/components/ui/Icons'

// ── Variants ──────────────────────────────────────────────────────────────────
// No glow, no gradients — depth through precise hover/active states

const variants = {
  primary:  'bg-accent text-bg font-semibold hover:opacity-90 active:opacity-80 active:scale-[0.98]',
  secondary:'bg-s2 border border-b2 text-fg hover:bg-s3 hover:border-b3 active:scale-[0.98]',
  ghost:    'text-fg-dim hover:text-fg hover:bg-s2 active:scale-[0.98]',
  danger:   'bg-rose/10 border border-rose/25 text-rose hover:bg-rose/18 active:scale-[0.98]',
  outline:  'border border-accent/40 text-accent hover:bg-accent/8 hover:border-accent active:scale-[0.98]',
  subtle:   'bg-s2/60 text-fg-dim hover:text-fg hover:bg-s2 active:scale-[0.98]',
} as const

const sizes = {
  sm: 'h-8  px-3   text-xs  gap-1.5 rounded-md',
  md: 'h-9  px-3.5 text-sm  gap-2   rounded-md',
  lg: 'h-11 px-5   text-base gap-2.5 rounded-lg',
} as const

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   keyof typeof variants
  size?:      keyof typeof sizes
  loading?:   boolean
  icon?:      ReactNode
  iconRight?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = 'primary', size = 'md', loading = false, disabled,
      icon, iconRight, children, className, ...props },
    ref
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center justify-center font-medium',
          'transition-all duration-150 cursor-pointer select-none',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {loading
          ? <Spinner size={size === 'sm' ? 13 : 15} />
          : icon
            ? <span className="shrink-0">{icon}</span>
            : null
        }
        {children}
        {iconRight && !loading && (
          <span className="shrink-0">{iconRight}</span>
        )}
      </button>
    )
  }
)
