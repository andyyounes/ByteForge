'use client'

import { useState } from 'react'
import { clsx } from 'clsx'
import { Card, CardTitle } from '@/components/ui/Card'
import { CONCEPTS } from '@/lib/concepts'
import { conceptCode } from '@/lib/concept-glyphs'
import type { Profile, ConceptMastery, MasteryStatus } from '@/types'

interface HeatmapData {
  student:   Profile
  masteries: Record<string, ConceptMastery>
}

interface MasteryHeatmapProps {
  data:            HeatmapData[]
  conceptFilter?:  string[]
}

// Colour scale — uses new semantic palette
function heatColor(score: number, status: MasteryStatus): string {
  if (status === 'locked'     || score === 0)   return 'var(--s2)'
  if (status === 'mastered'   || score >= 85)   return 'var(--emerald)'
  if (status === 'practicing' || score >= 50)   return 'var(--sky)'
  if (status === 'started'    || score >= 1)    return 'var(--amber)'
  return 'var(--s2)'
}

const TIER_LABELS = ['Foundation', 'Tier 1', 'Tier 2', 'Tier 3', 'Tier 4', 'Tier 5', 'Tier 6', 'Tier 7', 'Expert']

export function MasteryHeatmap({ data, conceptFilter }: MasteryHeatmapProps) {
  const [selectedTier, setSelectedTier] = useState<number | null>(null)
  const [hoveredCell,  setHoveredCell]  = useState<{ studentId: string; conceptId: string } | null>(null)

  const visibleConcepts = CONCEPTS.filter(c =>
    (selectedTier === null || selectedTier === undefined ? true : c.tier === selectedTier) &&
    (conceptFilter ? conceptFilter.includes(c.id) : true)
  )

  return (
    <Card noPadding>
      {/* Header */}
      <div className="p-5 border-b border-b2">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle>Mastery Heatmap</CardTitle>

          {/* Tier filter — clean buttons, no emoji */}
          <div className="flex gap-1 flex-wrap">
            <TierBtn
              active={selectedTier === null}
              onClick={() => setSelectedTier(null)}
            >
              All
            </TierBtn>
            {[0,1,2,3,4,5,6,7,8].map(t => (
              <TierBtn
                key={t}
                active={selectedTier === t}
                onClick={() => setSelectedTier(t === selectedTier ? null : t)}
                title={TIER_LABELS[t]}
              >
                T{t}
              </TierBtn>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 px-5 py-2.5 border-b border-b2">
        {[
          { color: 'var(--emerald)', label: 'Mastered'    },
          { color: 'var(--sky)',     label: 'Practicing'  },
          { color: 'var(--amber)',   label: 'Started'     },
          { color: 'var(--s2)',      label: 'Locked/None', border: true },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5 text-xs text-fg-faint">
            <div
              className="w-3 h-3 rounded-sm shrink-0"
              style={{
                background:  l.color,
                border:      l.border ? '1px solid var(--b3)' : 'none',
              }}
            />
            {l.label}
          </div>
        ))}
      </div>

      {/* Scrollable grid */}
      <div className="overflow-auto max-h-[480px] p-4">
        <table className="border-collapse text-xs" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr>
              {/* Student column header */}
              <th className="sticky left-0 bg-s1 w-32 min-w-[8rem] text-left pb-3 pr-3 text-fg-faint font-medium z-10">
                Student
              </th>

              {/* Concept column headers — short code, NOT emoji */}
              {visibleConcepts.map(c => (
                <th
                  key={c.id}
                  className="pb-3 px-0.5 text-center"
                  style={{ width: 24, minWidth: 24 }}
                  title={`${c.name} (Tier ${c.tier})`}
                >
                  <div
                    className="text-[9px] font-bold font-mono text-fg-faint"
                    style={{
                      transform:       'rotate(-60deg)',
                      transformOrigin: 'bottom left',
                      whiteSpace:      'nowrap',
                      color:           'var(--t3)',
                    }}
                  >
                    {/* 3-char abbreviation — no emoji, platform-safe */}
                    {conceptCode(c).slice(0, 3)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map(({ student, masteries }) => (
              <tr key={student.id} className="hover:bg-s2/40 transition-colors">
                {/* Student name */}
                <td className="sticky left-0 bg-s1 py-1 pr-3 z-10 font-medium text-fg truncate max-w-[8rem]">
                  {student.name}
                </td>

                {/* Mastery cells */}
                {visibleConcepts.map(c => {
                  const m        = masteries[c.id]
                  const color    = heatColor(m?.mastery_score ?? 0, m?.status ?? 'locked')
                  const isHovered = hoveredCell?.studentId === student.id && hoveredCell?.conceptId === c.id

                  return (
                    <td
                      key={c.id}
                      className="py-1 px-0.5"
                      onMouseEnter={() => setHoveredCell({ studentId: student.id, conceptId: c.id })}
                      onMouseLeave={() => setHoveredCell(null)}
                      title={`${student.name} · ${c.name}: ${m?.mastery_score ?? 0}% (${m?.status ?? 'locked'})`}
                    >
                      <div
                        className="w-5 h-5 rounded-sm cursor-default transition-transform"
                        style={{
                          background: color,
                          transform:  isHovered ? 'scale(1.35)' : 'scale(1)',
                          outline:    isHovered ? `2px solid ${color}` : 'none',
                          border:     m?.status === 'locked' || !m ? '1px solid var(--b2)' : 'none',
                        }}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

// ── Tier filter button ────────────────────────────────────────────────────────
function TierBtn({
  active, onClick, title, children,
}: {
  active:    boolean
  onClick:   () => void
  title?:    string
  children:  React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={clsx(
        'px-2 py-1 rounded text-xs font-semibold transition-colors',
        active
          ? 'bg-accent text-s0'
          : 'bg-s2 text-fg-dim hover:text-fg hover:bg-s3',
      )}
    >
      {children}
    </button>
  )
}
