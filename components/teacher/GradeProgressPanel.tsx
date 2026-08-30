'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Teacher view into per-student progress for Grade 6, 7, or 8 — the same
 * idea as G9MissionsPanel, generalised. Reads /api/teacher/grade-progress,
 * which derives module/stage names straight from the live grade*.html
 * curriculum, so this can never silently drift out of sync with it.
 */

interface StudentProgress {
  studentId:     string
  name:          string
  stagesPassed:  number
  stagesTotal:   number
  currentModule: string | null
  lastStageName: string | null
  lastActive:    string | null
}

const GRADE_META: Record<'grade6' | 'grade7' | 'grade8', { emoji: string; title: string }> = {
  grade6: { emoji: '🧭', title: 'The Creator Quest — progress' },
  grade7: { emoji: '🎮', title: 'The Game Maker — progress' },
  grade8: { emoji: '💻', title: 'The App Builder — progress' },
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function GradeProgressPanel({ classId, grade }: { classId: string; grade: 'grade6' | 'grade7' | 'grade8' }) {
  const [students, setStudents] = useState<StudentProgress[] | null>(null)
  const [error,    setError]    = useState('')

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/teacher/grade-progress?classId=${classId}&grade=${grade}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load')
      setStudents(data.students ?? [])
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Failed to load')
    }
  }, [classId, grade])

  useEffect(() => { load() }, [load])

  const meta = GRADE_META[grade]

  if (error) return <p className="text-xs text-rose p-4">{error}</p>
  if (!students) return <p className="text-xs text-fg-dim p-4">Loading progress…</p>
  if (students.length === 0) return <p className="text-xs text-fg-dim p-4">No students in this class yet.</p>

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">{meta.emoji}</span>
        <h3 className="font-semibold text-fg text-sm">{meta.title}</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-t3 border-b border-b2">
              <th className="py-2 pr-3 font-medium">Student</th>
              <th className="py-2 pr-3 font-medium">Progress</th>
              <th className="py-2 pr-3 font-medium">Current module</th>
              <th className="py-2 pr-3 font-medium">Last stage</th>
              <th className="py-2 pr-3 font-medium">Last activity</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => {
              const pct = s.stagesTotal > 0 ? Math.round((s.stagesPassed / s.stagesTotal) * 100) : 0
              return (
                <tr key={s.studentId} className="border-b border-b2/60">
                  <td className="py-2 pr-3 font-medium text-fg">{s.name}</td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 rounded-full bg-s2 overflow-hidden">
                        <div className="h-full bg-emerald rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-t2 tabular-nums">{s.stagesPassed}/{s.stagesTotal}</span>
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-t2">
                    {s.currentModule ?? <span className="text-emerald font-semibold">🏆 complete</span>}
                  </td>
                  <td className="py-2 pr-3 text-t2">{s.lastStageName ?? '—'}</td>
                  <td className="py-2 pr-3 text-t3">{s.lastActive ? timeAgo(s.lastActive) : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
