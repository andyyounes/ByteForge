'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Which stages are a real bottleneck for this class — aggregated from the
 * same lesson_saves rows grade-progress already reads, just rolled up
 * across every student instead of broken out per student. A stage several
 * students have reached but few have passed is the closest signal the
 * platform can show today to "a common wrong answer" without adding new
 * instrumentation to every quiz/challenge type.
 */

interface StuckPoint {
  stageId:    string
  stageName:  string
  moduleName: string
  attempted:  number
  passed:     number
  stuck:      number
  stuckRate:  number
}

const GRADE_LABEL: Record<'grade6' | 'grade7' | 'grade8', string> = {
  grade6: 'The Creator Quest',
  grade7: 'The Game Maker',
  grade8: 'The App Builder',
}

function rowColor(stuckRate: number): string {
  if (stuckRate >= 0.6) return 'var(--rose)'
  if (stuckRate >= 0.3) return 'var(--amber)'
  return 'var(--sky)'
}

export function StuckPointsPanel({ classId, grade }: { classId: string; grade: 'grade6' | 'grade7' | 'grade8' }) {
  const [points,       setPoints]       = useState<StuckPoint[] | null>(null)
  const [studentCount, setStudentCount] = useState(0)
  const [error,        setError]        = useState('')
  const [showAll,      setShowAll]      = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/teacher/stuck-points?classId=${classId}&grade=${grade}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load')
      setPoints(data.stuckPoints ?? [])
      setStudentCount(data.studentCount ?? 0)
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Failed to load')
    }
  }, [classId, grade])

  useEffect(() => { load() }, [load])

  if (error) return <p className="text-xs text-rose p-4">{error}</p>
  if (!points) return <p className="text-xs text-fg-dim p-4">Loading stuck points…</p>

  const withAttempts = points.filter(p => p.stuck > 0)
  const visible = showAll ? withAttempts : withAttempts.slice(0, 8)

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3 mb-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧩</span>
          <h3 className="font-semibold text-fg text-sm">
            {GRADE_LABEL[grade]} — where students get stuck
          </h3>
        </div>
      </div>
      <p className="text-xs text-fg-faint mb-4">
        Stages students have attempted but not yet passed, out of {studentCount} student{studentCount === 1 ? '' : 's'} in this class.
        Worth a quick in-class check if a stage near the top keeps coming up.
      </p>

      {withAttempts.length === 0 ? (
        <p className="text-xs text-fg-dim">No bottlenecks yet — every attempted stage has been passed by everyone who tried it.</p>
      ) : (
        <>
          <div className="space-y-2">
            {visible.map(p => (
              <div key={p.stageId} className="flex items-center gap-3 px-2.5 py-1.5 rounded-md bg-s1 border border-b2">
                <div
                  className="w-1.5 h-7 rounded-full shrink-0"
                  style={{ background: rowColor(p.stuckRate) }}
                  title={`${Math.round(p.stuckRate * 100)}% stuck`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-fg truncate">{p.stageName}</div>
                  <div className="text-[11px] text-fg-faint truncate">{p.moduleName}</div>
                </div>
                <div className="text-xs font-mono text-fg-dim whitespace-nowrap">
                  {p.passed}/{p.attempted} passed
                </div>
              </div>
            ))}
          </div>

          {withAttempts.length > 8 && (
            <button
              onClick={() => setShowAll(v => !v)}
              className="mt-3 text-xs font-medium text-accent hover:underline"
            >
              {showAll ? 'Show fewer' : `Show all ${withAttempts.length}`}
            </button>
          )}
        </>
      )}
    </div>
  )
}
