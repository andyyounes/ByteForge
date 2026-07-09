import { clsx } from 'clsx'
import Image from 'next/image'

const sizes = {
  xs: 'w-6  h-6  text-[10px]',
  sm: 'w-8  h-8  text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
} as const

interface AvatarProps {
  name:       string
  avatarUrl?: string | null
  size?:      keyof typeof sizes
  className?: string
}

// Hash a string to a stable hue (0–359)
function nameHue(name: string): number {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff
  return Math.abs(hash) % 360
}

export function Avatar({ name, avatarUrl, size = 'md', className }: AvatarProps) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')

  const hue = nameHue(name)

  if (avatarUrl) {
    return (
      <div className={clsx('relative rounded-full overflow-hidden shrink-0', sizes[size], className)}>
        <Image
          src={avatarUrl}
          alt={name}
          fill
          className="object-cover"
          sizes={size === 'xl' ? '64px' : size === 'lg' ? '48px' : '40px'}
        />
      </div>
    )
  }

  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center font-semibold shrink-0 select-none',
        sizes[size],
        className
      )}
      style={{
        background: `hsl(${hue}, 55%, 25%)`,
        color:      `hsl(${hue}, 80%, 75%)`,
        border:     `1px solid hsl(${hue}, 50%, 35%)`,
      }}
      aria-label={name}
      title={name}
    >
      {initials}
    </div>
  )
}
