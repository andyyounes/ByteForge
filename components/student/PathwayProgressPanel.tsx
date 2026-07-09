import Link from 'next/link'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { ArrowRightIcon } from '@/components/ui/Icons'
import type { PathwayProgress } from '@/types'

interface PathwayProgressPanelProps {
  pathways: PathwayProgress[]
}

export function PathwayProgressPanel({ pathways }: PathwayProgressPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pathways</CardTitle>
        <Link
          href="/student/pathway"
          className="flex items-center gap-1 text-xs text-fg-dim hover:text-accent transition-colors"
        >
          Skill tree
          <ArrowRightIcon size={12} strokeWidth={2} />
        </Link>
      </CardHeader>

      <div className="space-y-4">
        {pathways.map(({ pathway, mastered, total, pct }) => (
          <div key={pathway.id}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                {/* Color dot instead of emoji icon */}
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: pathway.color }}
                />
                <span className="text-sm font-medium text-fg truncate">
                  {pathway.name}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span className="text-xs text-fg-faint tabular-nums">
                  {mastered}/{total}
                </span>
                <span
                  className="text-xs font-semibold tabular-nums w-9 text-right"
                  style={{ color: pathway.color }}
                >
                  {pct}%
                </span>
              </div>
            </div>

            {/* Progress bar — thinner, more refined */}
            <div className="h-1 bg-s2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width:      `${pct}%`,
                  background: pathway.color,
                  opacity:    pct > 0 ? 1 : 0,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
