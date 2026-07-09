import { type HTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

// ── Card ──────────────────────────────────────────────────────────────────────
// Matte surfaces, depth through layering — no glass, no glow

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?:     'default' | 'raised' | 'flush'
  /** Coloured left-border accent — uses current --accent */
  accented?:    boolean
  /** Strip internal padding */
  noPadding?:   boolean
  /** Hover lift effect for interactive cards */
  interactive?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  function Card(
    { variant = 'default', accented, noPadding, interactive, className, children, ...props },
    ref
  ) {
    return (
      <div
        ref={ref}
        className={clsx(
          'rounded-lg border transition-colors duration-150',
          variant === 'raised' ? 'bg-s2 border-b2'  :
          variant === 'flush'  ? 'bg-transparent border-transparent' :
                                 'bg-s1 border-b2',
          accented && 'border-l-2 border-l-accent',
          !noPadding && 'p-5',
          interactive && 'hover:border-b3 hover:bg-s2 cursor-pointer',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

// ── CardHeader ────────────────────────────────────────────────────────────────

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('flex items-center justify-between mb-4', className)} {...props}>
      {children}
    </div>
  )
}

// ── CardTitle ─────────────────────────────────────────────────────────────────

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={clsx('text-sm font-semibold text-fg', className)} {...props}>
      {children}
    </h3>
  )
}

// ── CardSection — labeled section within a card ───────────────────────────────

export function CardSection({ label, className, children, ...props }: HTMLAttributes<HTMLDivElement> & { label?: string }) {
  return (
    <div className={clsx('', className)} {...props}>
      {label && (
        <p className="label-caps mb-3">{label}</p>
      )}
      {children}
    </div>
  )
}

// ── CardFooter ────────────────────────────────────────────────────────────────

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('flex items-center gap-3 pt-4 mt-4 border-t border-b2', className)}
      {...props}
    >
      {children}
    </div>
  )
}
