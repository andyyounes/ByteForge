'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Teacher view into the Grade 9 Mission IDE (grade9-missions.html): current
 * mission per student, pass/fail history, tournament bot lock status, last
 * bracket result, and an expandable code peek for the locked tournament bot.
 * Reads /api/teacher/g9-progress, which is just the same lesson_saves rows
 * the static mission page already writes — no separate progress system.
 */

interface StudentProgress {
  studentId:      string
  name:           string
  missionsPassed: number
  currentIdx:     number
  botLocked:      boolean
  botLang:        'py' | 'ps' | null
  botCode:        string | null
  lastBracket:    { champion: string; isChampion: boolean; rounds: number; at: number } | null
  lastMission:    { idx: number; passed: boolean; savedAt: string } | null
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function G9MissionsPanel({ classId }: { classId: string }) {
  const [students, setStudents] = useState<StudentProgress[] | null>(null)
  const [error,    setError]    = useState('')
  const [peekId,   setPeekId]   = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/teacher/g9-progress?classId=${classId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load')
      setStudents(data.students ?? [])
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Failed to load')
    }
  }, [classId])

  useEffect(() => { load() }, [load])

  if (error) return <p className="text-xs text-rose p-4">{error}</p>
  if (!students) return <p className="text-xs text-fg-dim p-4">Loading mission progress…</p>
  if (students.length === 0) return <p className="text-xs text-fg-dim p-4">No students in this class yet.</p>

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">🌊</span>
        <h3 className="font-semibold text-fg text-sm">Deep Diver — Mission IDE progress</h3>
      </div>
      <p className="text-xs text-fg-dim mb-4">
        Turtle → Agent Battles → Data Missions → Tournament. Click a locked bot to peek at the code.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-t3 border-b border-b2">
              <th className="py-2 pr-3 font-medium">Student</th>
              <th className="py-2 pr-3 font-medium">Missions passed</th>
              <th className="py-2 pr-3 font-medium">Current mission #</th>
              <th className="py-2 pr-3 font-medium">Last activity</th>
              <th className="py-2 pr-3 font-medium">Tournament bot</th>
              <th className="py-2 pr-3 font-medium">Bracket result</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <>
                <tr key={s.studentId} className="border-b border-b2/60">
                  <td className="py-2 pr-3 font-medium text-fg">{s.name}</td>
                  <td className="py-2 pr-3 text-t2">{s.missionsPassed}</td>
                  <td className="py-2 pr-3 text-t2">#{s.currentIdx}</td>
                  <td className="py-2 pr-3 text-t3">
                    {s.lastMission
                      ? <>{timeAgo(s.lastMission.savedAt)} {s.lastMission.passed ? '✓' : '✗'} (#{s.lastMission.idx})</>
                      : '—'}
                  </td>
                  <td className="py-2 pr-3">
                    {s.botLocked ? (
                      <button
                        onClick={() => setPeekId(peekId === s.studentId ? null : s.studentId)}
                        className="text-xs font-semibold px-2 py-1 rounded-md bg-emerald/10 border border-emerald/30 text-emerald hover:bg-emerald/20 transition-colors"
                      >
                        🔒 locked ({s.botLang === 'ps' ? 'pseudocode' : 'Python'}) — peek
                      </button>
                    ) : (
                      <span className="text-t3">✎ not locked in</span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-t2">
                    {s.lastBracket
                      ? (s.lastBracket.isChampion
                          ? <span className="text-amber-400 font-semibold">🏆 champion</span>
                          : <>lost to {s.lastBracket.champion}</>)
                      : '—'}
                  </td>
                </tr>
                {peekId === s.studentId && s.botCode && (
                  <tr key={s.studentId + '-peek'}>
                    <td colSpan={6} className="pb-3">
                      <pre className="text-[11px] bg-s2 border border-b2 rounded-md p-3 overflow-x-auto text-t2 whitespace-pre-wrap">
                        {s.botCode}
                      </pre>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
