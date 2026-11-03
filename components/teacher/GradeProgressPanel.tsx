'use client'

import { useState, useEffect, useCallback, Fragment } from 'react'

/**
 * Teacher view into per-student progress for Grade 6, 7, or 8 — the same
 * idea as G9MissionsPanel, generalised. Reads /api/teacher/grade-progress,
 * which derives module/stage names straight from the live grade*.html
 * curriculum, so this can never silently drift out of sync with it.
 */

interface ModuleProgress { id: string; name: string; done: number; total: number }

interface AssessmentResult {
  stageId:     string
  stageName:   string
  score:       number
  total:       number
  passed:      boolean
  attemptedAt: string | null
}

interface ExamResult {
  stageId:             string
  stageName:           string
  passed:              boolean
  submitted:           boolean
  tabSwitches:         number
  awaySeconds:         number
  snapshotCount:       number
  examDurationSeconds: number
  attemptedAt:         string | null
}

interface StudentProgress {
  studentId:     string
  name:          string
  email:         string
  stagesPassed:  number
  stagesTotal:   number
  currentModule: string | null
  modules:       ModuleProgress[]
  lastStageName: string | null
  lastActive:    string | null
  assessments:   AssessmentResult[]
  exams:         ExamResult[]
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
  const [students, setStudents]   = useState<StudentProgress[] | null>(null)
  const [error,    setError]      = useState('')
  const [open,     setOpen]       = useState<string | null>(null)   // student whose chapters are expanded
  const [grantingFor, setGrantingFor] = useState<string | null>(null)   // `${studentId}:${stageId}` while a request is in flight

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

  async function reopenExam(studentId: string, stageId: string) {
    const key = `${studentId}:${stageId}`
    setGrantingFor(key)
    try {
      const res = await fetch('/api/teacher/exam-reopen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, lessonKey: grade, challengeId: stageId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to re-open exam')
      await load()
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Failed to re-open exam')
    } finally {
      setGrantingFor(null)
    }
  }

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
              <th className="py-2 pr-3 font-medium">Chapters done</th>
              <th className="py-2 pr-3 font-medium">Current module</th>
              <th className="py-2 pr-3 font-medium">Test score</th>
              <th className="py-2 pr-3 font-medium">Exam</th>
              <th className="py-2 pr-3 font-medium">Last stage</th>
              <th className="py-2 pr-3 font-medium">Last activity</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => {
              const pct = s.stagesTotal > 0 ? Math.round((s.stagesPassed / s.stagesTotal) * 100) : 0
              const finished = (s.modules ?? []).filter(m => m.total > 0 && m.done >= m.total).length
              const isOpen = open === s.studentId
              const assessments = s.assessments ?? []
              const exams = s.exams ?? []
              return (
                <Fragment key={s.studentId}>
                <tr className="border-b border-b2/60">
                  <td className="py-2 pr-3 font-medium text-fg">
                    <button onClick={() => setOpen(isOpen ? null : s.studentId)} className="flex items-start gap-1.5 hover:text-accent transition-colors text-left" aria-expanded={isOpen}>
                      <span className="text-t3 text-[10px] mt-0.5">{isOpen ? '▾' : '▸'}</span>
                      <span>
                        <div>{s.name}</div>
                        <div className="text-[10px] font-normal text-t3">{s.email}</div>
                      </span>
                    </button>
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 rounded-full bg-s2 overflow-hidden">
                        <div className="h-full bg-emerald rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-t2 tabular-nums">{s.stagesPassed}/{s.stagesTotal}</span>
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-t2 tabular-nums">{finished}/{(s.modules ?? []).length}</td>
                  <td className="py-2 pr-3 text-t2">
                    {s.currentModule ?? <span className="text-emerald font-semibold">🏆 complete</span>}
                  </td>
                  <td className="py-2 pr-3 tabular-nums">
                    {assessments.length === 0
                      ? <span className="text-t3">not taken</span>
                      : assessments.map(a => (
                          <span key={a.stageId} className={`font-semibold ${a.passed ? 'text-emerald' : 'text-amber-400'}`} title={a.stageName}>
                            {a.score}/{a.total}
                          </span>
                        ))}
                  </td>
                  <td className="py-2 pr-3">
                    {exams.length === 0
                      ? <span className="text-t3">not taken</span>
                      : exams.map(ex => (
                          <span key={ex.stageId} className={`font-semibold ${ex.passed ? 'text-emerald' : 'text-amber-400'}`} title={ex.stageName}>
                            {ex.passed ? '✓ passed' : '✗ not yet'}
                          </span>
                        ))}
                  </td>
                  <td className="py-2 pr-3 text-t2">{s.lastStageName ?? '—'}</td>
                  <td className="py-2 pr-3 text-t3">{s.lastActive ? timeAgo(s.lastActive) : '—'}</td>
                </tr>
                {isOpen && (
                  <tr className="border-b border-b2/60 bg-s2/40">
                    <td colSpan={8} className="py-3 px-3">
                      {exams.length > 0 && (
                        <div className="mb-3 space-y-1.5">
                          <div className="text-[10px] font-semibold uppercase tracking-wide text-t3">Exam integrity — {s.name} ({s.email})</div>
                          {exams.map(ex => {
                            const key = `${s.studentId}:${ex.stageId}`
                            const granting = grantingFor === key
                            return (
                              <div key={ex.stageId} className="flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-md bg-s1 border border-b2 text-t2">
                                <span className="truncate">{ex.stageName}</span>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="tabular-nums text-t3">
                                    {ex.tabSwitches} tab switch{ex.tabSwitches === 1 ? '' : 'es'} &middot; {ex.awaySeconds}s away &middot; {ex.snapshotCount} code snapshot{ex.snapshotCount === 1 ? '' : 's'} &middot; {Math.round(ex.examDurationSeconds / 60)} min
                                  </span>
                                  {ex.submitted && !ex.passed && (
                                    <button
                                      onClick={() => {
                                        if (window.confirm(`Re-open "${ex.stageName}" for ${s.name}? They'll be able to keep editing and resubmit it.`)) {
                                          reopenExam(s.studentId, ex.stageId)
                                        }
                                      }}
                                      disabled={granting}
                                      className="text-[10px] font-semibold px-2 py-1 rounded-md bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors disabled:opacity-50"
                                    >
                                      {granting ? '…' : 'Allow resubmit'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                      <div className="grid gap-1.5 sm:grid-cols-2">
                        {(s.modules ?? []).map(m => {
                          const complete = m.total > 0 && m.done >= m.total
                          const started  = m.done > 0
                          return (
                            <div key={m.id} className="flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-md bg-s1 border border-b2">
                              <span className="truncate text-t2">{m.name}</span>
                              <span className={`shrink-0 tabular-nums font-semibold ${complete ? 'text-emerald' : started ? 'text-amber-400' : 'text-t3'}`}>
                                {complete ? '✓ done' : started ? `${m.done}/${m.total}` : 'not started'}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </td>
                  </tr>
                )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
