import Link from 'next/link'
import { clsx } from 'clsx'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ConceptGlyph } from '@/components/ui/ConceptGlyph'
import { ChevronRightIcon } from '@/components/ui/Icons'
import type { Suggestion, MasteryStatus } from '@/types'

interface AdaptiveSuggestionsProps {
  suggestions: Suggestion[]
}

type BadgeVariant = 'practicing' | 'started' | 'available' | 'mastered' | 'locked' | 'default'

const STATUS_BADGE: Record<MasteryStatus, { variant: BadgeVariant; label: string }> = {
  practicing: { variant: 'practicing', label: 'Active'    },
  started:    { variant: 'started',    label: 'Started'   },
  available:  { variant: 'available',  label: 'New'       },
  mastered:   { variant: 'mastered',   label: 'Mastered'  },
  locked:     { variant: 'locked',     label: 'Locked'    },
}

// Mastery status → left accent colour
const STATUS_COLOR: Record<MasteryStatus, string> = {
  practicing: 'var(--accent)',   // unified amber — was var(--sky)
  started:    'var(--amber)',
  available:  'var(--b3)',
  mastered:   'var(--emerald)',
  locked:     'var(--b2)',
}

// Difficulty dots — ●●○○ style (1–4)
function DifficultyDots({ level }: { level: number }) {
  return (
    <span className="flex items-center gap-0.5 shrink-0" title={`Difficulty ${level}/4`} aria-label={`Difficulty ${level} of 4`}>
      {[1, 2, 3, 4].map(i => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i <= level ? 'bg-fg-faint' : 'bg-b3'}`}
        />
      ))}
    </span>
  )
}

export function AdaptiveSuggestions({ suggestions }: AdaptiveSuggestionsProps) {
  if (suggestions.length === 0) {
    return (
      <Card>
        <p className="text-sm text-fg-dim">
          All available concepts mastered — impressive work.
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Up Next</CardTitle>
        <span className="text-[11px] text-fg-faint tracking-wide">adaptive · personalised</span>
      </CardHeader>

      <div className="space-y-1">
        {suggestions.map(({ concept, mastery, reason }) => {
          const status     = mastery?.status ?? 'available'
          const statusInfo = STATUS_BADGE[status]
          const accentColor = STATUS_COLOR[status]

          return (
            <Link
              key={concept.id}
              href={concept.lessonUrl}
              className={clsx(
                'group relative flex items-center gap-3 pl-4 pr-3 py-3',
                'rounded-md bg-s2/50 border border-transparent',
                'hover:bg-s2 hover:border-b2 transition-all duration-150',
              )}
            >
              {/* Left accent bar — status colour */}
              <span
                className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full opacity-70"
                style={{ background: accentColor }}
                aria-hidden="true"
              />

              <ConceptGlyph concept={concept} size="sm" muted={status === 'locked'} />

              {/* Concept name + reason */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-fg group-hover:text-fg transition-colors truncate">
                    {concept.name}
                  </span>
                  <Badge variant={statusInfo.variant} size="sm" dot>
                    {statusInfo.label}
                  </Badge>
                  <DifficultyDots level={concept.difficulty} />
                </div>
                <p className="text-xs text-fg-faint mt-0.5 truncate">{reason}</p>
              </div>

              {/* Mastery % — if started */}
              {mastery && mastery.mastery_score > 0 && (
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                  <div className="w-14 h-1 bg-s3 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${mastery.mastery_score}%`, background: accentColor }}
                    />
                  </div>
                  <span className="text-[11px] text-fg-faint tabular-nums w-7 text-right">
                    {mastery.mastery_score}%
                  </span>
                </div>
              )}

              <ChevronRightIcon
                size={14} strokeWidth={2}
                className="shrink-0 text-fg-faint group-hover:text-fg-dim transition-colors"
              />
            </Link>
          )
        })}
      </div>
    </Card>
  )
}
