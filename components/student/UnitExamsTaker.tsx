'use client'

import { useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ExamQuestion {
  num?:  number
  stem:  string
  marks: number
  ms:    string
}

interface ExamContent {
  questions:   ExamQuestion[]
  totalMarks?: number
  duration?:   number
}

interface UnitExam {
  id:            string
  chapter_num:   number
  chapter_label: string
  title:         string
  content:       ExamContent
  status:        string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(pct: number) {
  if (pct >= 70) return 'text-emerald-400'
  if (pct >= 50) return 'text-amber-400'
  return 'text-rose-400'
}

function gradeBand(pct: number) {
  if (pct >= 80) return 'A*'
  if (pct >= 70) return 'A'
  if (pct >= 60) return 'B'
  if (pct >= 50) return 'C'
  if (pct >= 40) return 'D'
  return 'U'
}

// ── Single exam taker ─────────────────────────────────────────────────────────

function ExamTaker({ exam, onBack }: { exam: UnitExam; onBack: () => void }) {
  const questions  = exam.content?.questions ?? []
  const totalMarks = exam.content?.totalMarks ?? questions.reduce((s, q) => s + (q.marks ?? 0), 0)
  const duration   = exam.content?.duration ?? 40

  const [answers,  setAnswers]  = useState<Record<number, string>>({})
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score,    setScore]    = useState(0)

  function toggleMS(i: number) {
    setRevealed(r => ({ ...r, [i]: !r[i] }))
  }

  function selfMark(i: number, got: number) {
    // simple self-mark: student picks how many marks they got
    setScore(s => {
      // remove old score for this Q if any, add new
      const key = `q${i}`
      const prev = parseInt(sessionStorage.getItem(key) ?? '0')
      sessionStorage.setItem(key, String(got))
      return s - prev + got
    })
  }

  function submit() {
    if (Object.keys(answers).length < questions.length) {
      if (!confirm('You have unanswered questions. Submit anyway?')) return
    }
    // Reveal all mark schemes on submit
    const all: Record<number, boolean> = {}
    questions.forEach((_, i) => { all[i] = true })
    setRevealed(all)
    setSubmitted(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const pct   = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0
  const grade = gradeBand(pct)
  const answeredCount = Object.values(answers).filter(a => a.trim()).length

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <button onClick={onBack} className="text-xs text-t3 hover:text-fg transition-colors mb-3 flex items-center gap-1">
          ← All Exams
        </button>
        <div className="rounded-xl border border-b2 bg-s2 px-5 py-4">
          <p className="text-xs font-bold text-accent uppercase tracking-wider mb-1">{exam.chapter_label}</p>
          <h2 className="text-lg font-bold text-fg">{exam.title}</h2>
          <p className="text-xs text-t3 mt-1">{totalMarks} marks · {duration} minutes · {questions.length} questions</p>
        </div>
      </div>

      {/* Score summary after submission */}
      {submitted && (
        <div className={`rounded-xl border p-5 ${pct >= 50 ? 'bg-emerald-400/5 border-emerald-400/20' : 'bg-amber-400/5 border-amber-400/20'}`}>
          <p className="text-xs font-bold text-t3 uppercase tracking-wider mb-2">Your self-marked score</p>
          <div className="flex items-center gap-4">
            <span className={`text-4xl font-black ${scoreColor(pct)}`}>{grade}</span>
            <div>
              <p className="text-xl font-bold text-fg">{score} / {totalMarks}</p>
              <p className="text-sm text-t3">{pct}%</p>
            </div>
          </div>
          <p className="text-xs text-t3 mt-3">Mark schemes are shown below each question. Adjust your marks using the buttons if needed.</p>
        </div>
      )}

      {/* Instructions */}
      {!submitted && (
        <div className="px-4 py-3 rounded-lg bg-accent/5 border border-accent/20 text-xs text-fg-dim">
          <strong className="text-accent">Instructions:</strong> Answer all questions in the boxes. After submitting, use the mark scheme to self-mark each question.
        </div>
      )}

      {/* Questions */}
      <div className="space-y-5">
        {questions.map((q, i) => (
          <div key={i} className="rounded-xl border border-b2 bg-s2 p-5">
            {/* Q header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">Q{q.num ?? i + 1}</span>
                <span className="text-xs text-t3">[{q.marks} mark{q.marks !== 1 ? 's' : ''}]</span>
              </div>
              {submitted && (
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs text-t3">Marks:</span>
                  {Array.from({ length: q.marks + 1 }, (_, v) => (
                    <button
                      key={v}
                      onClick={() => selfMark(i, v)}
                      className={`w-6 h-6 text-xs rounded flex items-center justify-center border transition-colors ${
                        parseInt(sessionStorage.getItem(`q${i}`) ?? '0') === v
                          ? 'bg-accent text-black border-accent font-bold'
                          : 'bg-s1 border-b2 text-t2 hover:border-accent/50'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Stem */}
            <p className="text-sm text-fg leading-relaxed mb-4 whitespace-pre-wrap">{q.stem}</p>

            {/* Answer box */}
            <textarea
              rows={q.marks <= 2 ? 3 : q.marks <= 4 ? 5 : 7}
              value={answers[i] ?? ''}
              onChange={e => setAnswers(a => ({ ...a, [i]: e.target.value }))}
              disabled={submitted}
              placeholder={`Your answer… (${q.marks} mark${q.marks !== 1 ? 's' : ''})`}
              className="w-full px-4 py-3 text-sm rounded-lg bg-s1 border border-b2 text-fg focus:border-accent focus:outline-none resize-none placeholder:text-t3 disabled:opacity-70"
            />

            {/* Mark scheme toggle */}
            {(submitted || revealed[i]) ? (
              <div className="mt-3">
                <p className="text-xs font-bold text-t3 uppercase tracking-wider mb-2">Mark Scheme</p>
                <div className="px-4 py-3 rounded-lg bg-s1 border border-emerald-400/20 text-sm text-fg-dim leading-relaxed whitespace-pre-wrap">
                  {q.ms || 'No mark scheme available.'}
                </div>
              </div>
            ) : (
              <button
                onClick={() => toggleMS(i)}
                className="mt-3 text-xs text-t3 hover:text-fg transition-colors underline"
              >
                Show mark scheme
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Submit / Retake */}
      {!submitted ? (
        <div className="sticky bottom-4">
          <div className="flex items-center justify-between mb-2 text-xs text-t3">
            <span>{answeredCount}/{questions.length} answered</span>
            {answeredCount < questions.length && <span className="text-amber-400">⚠️ {questions.length - answeredCount} unanswered</span>}
          </div>
          <button
            onClick={submit}
            className="w-full py-3 rounded-xl bg-accent text-black font-bold text-sm hover:bg-accent/90 transition-colors shadow-lg"
          >
            Submit & Mark →
          </button>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={() => { setAnswers({}); setRevealed({}); setSubmitted(false); setScore(0); sessionStorage.clear() }}
            className="flex-1 py-2.5 rounded-lg border border-b2 text-t2 hover:text-fg text-sm transition-colors"
          >
            🔄 Retake
          </button>
          <button
            onClick={onBack}
            className="flex-1 py-2.5 rounded-lg bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 text-sm transition-colors"
          >
            ← All Exams
          </button>
        </div>
      )}
    </div>
  )
}

// ── Exam list ─────────────────────────────────────────────────────────────────

export function UnitExamsTaker({ classId, className }: {
  classId:   string | null
  className: string | null
}) {
  const [exams,    setExams]    = useState<UnitExam[] | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [loaded,   setLoaded]   = useState(false)
  const [selected, setSelected] = useState<UnitExam | null>(null)
  const [error,    setError]    = useState('')

  useState(() => {
    if (!classId) { setLoaded(true); return }
    setLoading(true)
    fetch(`/api/student/exams?classId=${classId}`)
      .then(r => r.json())
      .then(d => { setExams(d.exams ?? []); setLoaded(true); setLoading(false) })
      .catch(() => { setError('Failed to load exams'); setLoaded(true); setLoading(false) })
  })

  if (!classId) {
    return (
      <div className="rounded-xl border border-dashed border-b3 p-8 text-center">
        <p className="text-3xl mb-3 opacity-30">📝</p>
        <p className="text-sm text-fg-dim">Join a class to access unit exams.</p>
      </div>
    )
  }

  if (selected) {
    return <ExamTaker exam={selected} onBack={() => setSelected(null)} />
  }

  return (
    <div className="space-y-4">
      {className && <p className="text-xs text-t3">Exams for <strong className="text-fg">{className}</strong></p>}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-t3 py-6">
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading exams…
        </div>
      )}

      {error && <p className="text-sm text-rose-400">{error}</p>}

      {loaded && !loading && (exams ?? []).length === 0 && (
        <div className="rounded-xl border border-dashed border-b3 p-8 text-center">
          <p className="text-3xl mb-3 opacity-30">🔒</p>
          <p className="text-sm text-fg-dim">No exams released yet.</p>
          <p className="text-xs text-t3 mt-1">Your teacher will unlock chapter exams here when ready.</p>
        </div>
      )}

      {loaded && (exams ?? []).length > 0 && (
        <div className="space-y-3">
          {(exams ?? []).map(exam => {
            const qs = exam.content?.questions ?? []
            const marks = exam.content?.totalMarks ?? qs.reduce((s, q) => s + (q.marks ?? 0), 0)
            const dur   = exam.content?.duration ?? 40
            return (
              <button
                key={exam.id}
                onClick={() => setSelected(exam)}
                className="w-full text-left rounded-xl border border-b2 bg-s2 p-5 hover:border-accent/40 hover:bg-s3 transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-accent font-semibold mb-1">{exam.chapter_label}</p>
                    <p className="text-sm font-bold text-fg group-hover:text-accent transition-colors">{exam.title}</p>
                    <p className="text-xs text-t3 mt-1">{qs.length} questions · {marks} marks · {dur} min</p>
                  </div>
                  <span className="text-xs px-3 py-1.5 rounded-full bg-accent/10 border border-accent/30 text-accent shrink-0">
                    Start →
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-accent/5 border border-accent/20 text-xs text-fg-dim">
        <span>💡</span>
        <span>Answer all questions, then submit to reveal the mark scheme and self-mark your work.</span>
      </div>
    </div>
  )
}
