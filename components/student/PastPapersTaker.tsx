'use client'

import { useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Question {
  num:   number | string
  stem:  string
  marks: number
  ms?:   string
}

interface PastPaper {
  id:          string
  title:       string
  year:        string
  session:     string
  paper_num:   string
  total_marks: number
  due_date:    string | null
  questions:   Question[]
  submission:  Submission | null
}

interface Submission {
  score:        number
  total_marks:  number
  feedback:     FeedbackItem[]
  submitted_at: string
}

interface FeedbackItem {
  num:      number | string
  score:    number
  maxScore: number
  badge:    string
  comment:  string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function badgeStyle(b: string) {
  if (b === 'full')    return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
  if (b === 'partial') return 'text-amber-400 bg-amber-400/10 border-amber-400/30'
  return 'text-rose-400 bg-rose-400/10 border-rose-400/30'
}

function gradeBand(pct: number) {
  if (pct >= 80) return { label: 'A*', color: 'text-emerald-400' }
  if (pct >= 70) return { label: 'A',  color: 'text-emerald-400' }
  if (pct >= 60) return { label: 'B',  color: 'text-blue-400'    }
  if (pct >= 50) return { label: 'C',  color: 'text-blue-400'    }
  if (pct >= 40) return { label: 'D',  color: 'text-amber-400'   }
  return { label: 'U', color: 'text-rose-400' }
}

// ── Paper taker (full-screen per paper) ───────────────────────────────────────

function PaperTaker({ paper, classId, onBack }: {
  paper:   PastPaper
  classId: string
  onBack:  () => void
}) {
  const [answers,    setAnswers]    = useState<Record<string, string>>(() => {
    // Pre-fill from existing submission if any
    if (!paper.submission) return {}
    return {}
  })
  const [submitting, setSubmitting] = useState(false)
  const [result,     setResult]     = useState<{ score: number; totalMarks: number; pct: number; feedback: FeedbackItem[] } | null>(
    paper.submission ? {
      score:      paper.submission.score,
      totalMarks: paper.submission.total_marks,
      pct:        paper.submission.total_marks > 0
                    ? Math.round((paper.submission.score / paper.submission.total_marks) * 100)
                    : 0,
      feedback:   paper.submission.feedback,
    } : null
  )
  const [error, setError] = useState('')

  async function submit() {
    // Check all questions have some answer
    const emptyQs = paper.questions.filter(q => !answers[String(q.num)]?.trim())
    if (emptyQs.length > 0) {
      setError(`Please answer all questions before submitting. (${emptyQs.length} unanswered)`)
      return
    }
    setSubmitting(true)
    setError('')

    const answerArr = paper.questions.map(q => ({
      num:    q.num,
      answer: answers[String(q.num)] ?? '',
    }))

    const res  = await fetch(`/api/student/past-papers/${paper.id}/submit`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ classId, answers: answerArr }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) { setError(data.error ?? 'Submission failed'); return }
    setResult({ score: data.score, totalMarks: data.totalMarks, pct: data.pct, feedback: data.feedback })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const fbMap = Object.fromEntries((result?.feedback ?? []).map(f => [String(f.num), f]))
  const grade = result ? gradeBand(result.pct) : null

  return (
    <div className="space-y-6">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-xs text-t3 hover:text-fg transition-colors flex items-center gap-1"
        >
          ← Back
        </button>
        <div className="flex-1">
          <h2 className="text-base font-bold text-fg">{paper.title}</h2>
          <p className="text-xs text-t3">
            {paper.year} {paper.session}{paper.paper_num && ` · Paper ${paper.paper_num}`}
            {' · '}{paper.total_marks} marks
          </p>
        </div>
      </div>

      {/* Result banner */}
      {result && (
        <div className={`rounded-xl border p-5 ${result.pct >= 50 ? 'bg-emerald-400/5 border-emerald-400/20' : 'bg-rose-400/5 border-rose-400/20'}`}>
          <div className="flex items-center gap-4 flex-wrap">
            <div className={`text-4xl font-black ${grade?.color}`}>{grade?.label}</div>
            <div>
              <p className="text-lg font-bold text-fg">{result.score} / {result.totalMarks}</p>
              <p className="text-sm text-t3">{result.pct}% · AI-marked</p>
            </div>
            {result.pct >= 70 && <span className="text-2xl">🎉</span>}
            {result.pct >= 50 && result.pct < 70 && <span className="text-2xl">✅</span>}
            {result.pct < 50 && <span className="text-2xl">📚</span>}
          </div>
          <button
            onClick={() => setResult(null)}
            className="mt-3 text-xs text-t3 hover:text-fg transition-colors underline"
          >
            Retake paper
          </button>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-5">
        {paper.questions.map((q, i) => {
          const fb = fbMap[String(q.num)]
          const answered = !!answers[String(q.num)]?.trim()

          return (
            <div
              key={i}
              className={`rounded-xl border p-5 transition-colors ${
                fb
                  ? fb.badge === 'full'    ? 'border-emerald-400/30 bg-emerald-400/5'
                  : fb.badge === 'partial' ? 'border-amber-400/30 bg-amber-400/5'
                  :                         'border-rose-400/30 bg-rose-400/5'
                  : 'border-b2 bg-s2'
              }`}
            >
              {/* Q header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-accent">Q{String(q.num)}</span>
                  <span className="text-xs text-t3">[{q.marks} mark{q.marks > 1 ? 's' : ''}]</span>
                </div>
                {fb && (
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${badgeStyle(fb.badge)}`}>
                    {fb.score}/{fb.maxScore}
                  </span>
                )}
                {!fb && answered && (
                  <span className="text-xs text-emerald-400">✓ answered</span>
                )}
              </div>

              {/* Question stem */}
              <p className="text-sm text-fg leading-relaxed mb-3 whitespace-pre-wrap">{q.stem}</p>

              {/* Answer textarea */}
              {!result && (
                <textarea
                  rows={q.marks <= 2 ? 3 : q.marks <= 4 ? 5 : 7}
                  value={answers[String(q.num)] ?? ''}
                  onChange={e => setAnswers(a => ({ ...a, [String(q.num)]: e.target.value }))}
                  placeholder={`Write your answer here… (${q.marks} mark${q.marks > 1 ? 's' : ''})`}
                  className="w-full px-4 py-3 text-sm rounded-lg bg-s1 border border-b2 text-fg focus:border-accent focus:outline-none resize-none placeholder:text-t3"
                />
              )}

              {/* Show previous answer + feedback after submission */}
              {result && (
                <div className="space-y-3">
                  <div className="px-3 py-2.5 rounded-lg bg-s1 border border-b2 text-sm text-fg-dim whitespace-pre-wrap min-h-[48px]">
                    {answers[String(q.num)] || <span className="italic text-t3">No answer given</span>}
                  </div>
                  {fb?.comment && (
                    <div className={`flex gap-2 text-xs px-3 py-2 rounded-lg border ${badgeStyle(fb.badge)}`}>
                      <span className="shrink-0">{fb.badge === 'full' ? '✅' : fb.badge === 'partial' ? '⚠️' : '❌'}</span>
                      <span>{fb.comment}</span>
                    </div>
                  )}
                  {/* Reveal mark scheme after submission */}
                  {q.ms && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-t3 hover:text-fg transition-colors">Show mark scheme</summary>
                      <div className="mt-2 px-3 py-2 rounded-lg bg-s1 border border-b2 text-fg-dim leading-relaxed">{q.ms}</div>
                    </details>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Submit bar */}
      {!result && (
        <div className="sticky bottom-4 flex flex-col gap-2">
          {error && (
            <div className="px-4 py-2.5 rounded-lg bg-rose-400/10 border border-rose-400/20 text-rose-400 text-sm">
              {error}
            </div>
          )}
          <button
            onClick={submit}
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-accent text-black font-bold text-sm hover:bg-accent/90 disabled:opacity-40 transition-colors shadow-lg"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Marking your answers…
              </span>
            ) : '📤 Submit & Get Results'}
          </button>
        </div>
      )}

      {/* Retake */}
      {result && (
        <div className="flex gap-3">
          <button
            onClick={() => { setResult(null); setAnswers({}) }}
            className="flex-1 py-2.5 rounded-lg border border-b2 text-t2 hover:text-fg hover:border-b3 text-sm transition-colors"
          >
            🔄 Retake
          </button>
          <button
            onClick={onBack}
            className="flex-1 py-2.5 rounded-lg bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 text-sm transition-colors"
          >
            ← Back to papers
          </button>
        </div>
      )}
    </div>
  )
}

// ── Paper list ────────────────────────────────────────────────────────────────

export function PastPapersTaker({ classId, className, studentId }: {
  classId:   string | null
  className: string | null
  studentId: string
}) {
  const [papers,    setPapers]    = useState<PastPaper[] | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [loaded,    setLoaded]    = useState(false)
  const [selected,  setSelected]  = useState<PastPaper | null>(null)
  const [error,     setError]     = useState('')

  // Load on mount
  useState(() => {
    if (!classId) { setLoaded(true); return }
    setLoading(true)
    fetch(`/api/student/past-papers?classId=${classId}`)
      .then(r => r.json())
      .then(d => { setPapers(d.papers ?? []); setLoaded(true); setLoading(false) })
      .catch(() => { setError('Failed to load'); setLoaded(true); setLoading(false) })
  })

  if (!classId) {
    return (
      <div className="rounded-xl border border-dashed border-b3 p-8 text-center">
        <p className="text-3xl mb-3 opacity-30">📝</p>
        <p className="text-sm text-fg-dim">You need to join a class first.</p>
        <p className="text-xs text-t3 mt-1">Ask your teacher for the class join code.</p>
      </div>
    )
  }

  if (selected) {
    return <PaperTaker paper={selected} classId={classId} onBack={() => setSelected(null)} />
  }

  return (
    <div className="space-y-4">
      {className && (
        <p className="text-xs text-t3">Past papers for <strong className="text-fg">{className}</strong></p>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-t3 py-6">
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading past papers…
        </div>
      )}

      {error && <p className="text-sm text-rose-400">{error}</p>}

      {loaded && !loading && (papers ?? []).length === 0 && (
        <div className="rounded-xl border border-dashed border-b3 p-8 text-center">
          <p className="text-3xl mb-3 opacity-30">📝</p>
          <p className="text-sm text-fg-dim">No past papers assigned yet.</p>
          <p className="text-xs text-t3 mt-1">Your teacher will assign past papers here when ready.</p>
        </div>
      )}

      {loaded && (papers ?? []).length > 0 && (
        <div className="space-y-3">
          {(papers ?? []).map(paper => {
            const sub  = paper.submission
            const pct  = sub && sub.total_marks > 0 ? Math.round((sub.score / sub.total_marks) * 100) : null
            const grade = pct !== null ? gradeBand(pct) : null
            const overdue = paper.due_date && !sub && new Date(paper.due_date) < new Date()

            return (
              <button
                key={paper.id}
                onClick={() => setSelected(paper)}
                className="w-full text-left rounded-xl border border-b2 bg-s2 p-5 hover:border-accent/40 hover:bg-s3 transition-all group"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-fg group-hover:text-accent transition-colors">{paper.title}</p>
                    <p className="text-xs text-t3 mt-1">
                      {paper.year} {paper.session}{paper.paper_num && ` · Paper ${paper.paper_num}`}
                      {' · '}{paper.total_marks} marks · {paper.questions.length} questions
                    </p>
                    {paper.due_date && (
                      <p className={`text-xs mt-1 ${overdue ? 'text-rose-400' : 'text-t3'}`}>
                        {overdue ? '⚠️ Overdue' : '📅 Due'} {new Date(paper.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {sub ? (
                      <>
                        <div className="text-right">
                          <p className="text-sm font-bold text-fg">{sub.score}/{sub.total_marks}</p>
                          <p className="text-xs text-t3">{pct}%</p>
                        </div>
                        <span className={`text-sm font-black ${grade?.color}`}>{grade?.label}</span>
                        <span className="text-xs text-t3 bg-s1 border border-b2 px-2 py-0.5 rounded-full">Done ✓</span>
                      </>
                    ) : (
                      <span className={`text-xs px-3 py-1.5 rounded-full border font-semibold ${
                        overdue
                          ? 'bg-rose-400/10 border-rose-400/30 text-rose-400'
                          : 'bg-accent/10 border-accent/30 text-accent'
                      }`}>
                        {overdue ? 'Overdue →' : 'Start →'}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-accent/5 border border-accent/20 text-xs text-fg-dim">
        <span>🤖</span>
        <span>Your answers are marked by AI against the Cambridge mark scheme. You can retake any paper to improve your score.</span>
      </div>
    </div>
  )
}
