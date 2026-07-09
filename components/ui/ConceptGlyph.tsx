import { clsx } from 'clsx'
import { conceptCode } from '@/lib/concept-glyphs'
import type { Concept } from '@/types'

type ConceptGlyphSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface ConceptGlyphProps {
  concept: Pick<Concept, 'id' | 'name' | 'color'>
  size?: ConceptGlyphSize
  muted?: boolean
  className?: string
}

const sizes: Record<ConceptGlyphSize, string> = {
  xs: 'h-5 w-5 text-[8px]',
  sm: 'h-7 w-7 text-[9px]',
  md: 'h-10 w-10 text-[11px]',
  lg: 'h-14 w-14 text-sm',
  xl: 'h-16 w-16 text-base',
}

export function ConceptGlyph({
  concept,
  size = 'md',
  muted = false,
  className,
}: ConceptGlyphProps) {
  const color = muted ? 'var(--t3)' : concept.color

  return (
    <span
      className={clsx(
        'inline-flex shrink-0 items-center justify-center font-mono font-extrabold leading-none',
        'border select-none tabular-nums',
        sizes[size],
        muted && 'opacity-55',
        className
      )}
      style={{
        color,
        background: muted
          ? 'var(--s2)'
          : `color-mix(in srgb, ${concept.color} 13%, var(--s2))`,
        borderColor: muted
          ? 'var(--b2)'
          : `color-mix(in srgb, ${concept.color} 34%, var(--b2))`,
        clipPath: 'polygon(10% 0, 100% 0, 100% 78%, 78% 100%, 0 100%, 0 10%)',
      }}
      aria-hidden="true"
    >
      {conceptCode(concept)}
    </span>
  )
}
