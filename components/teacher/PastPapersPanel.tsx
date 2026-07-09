'use client'

import { useState, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Question {
  num:   number | string
  stem:  string
  marks: number
  ms:    string
}

interface PastPaper {
  id:          string
  title:       string
  year:        string
  session:     string
  paper_num:   string
  total_marks: number
  due_date:    string | null
  assigned:    boolean
  created_at:  string
  questions:   Question[]
}

interface SubmissionResult {
  id:           string
  student_id:   string
  score:        number
  total_marks:  number
  pct:          number
  submitted_at: string
  student:      { name: string; email: string }
  feedback:     { num: number | string; score: number; maxScore: number; badge: string; comment: string }[]
}

// ── Badge colour ──────────────────────────────────────────────────────────────
function badgeColor(b: string) {
  if (b === 'full')    return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
  if (b === 'partial') return 'text-amber-400   bg-amber-400/10   border-amber-400/30'
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

// ── Results drawer ────────────────────────────────────────────────────────────
function ResultsDrawer({ paperId, paperTitle, onClose }: {
  paperId:    string
  paperTitle: string
  onClose:    () => void
}) {
  const [results,  setResults]  = useState<SubmissionResult[] | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [error,    setError]    = useState('')

  useState(() => {
    fetch(`/api/teacher/past-papers/${paperId}/results`)
      .then(r => r.json())
      .then(d => { setResults(d.results ?? []); setLoading(false) })
      .catch(() => { setError('Failed to load results'); setLoading(false) })
  })

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-s1 border border-b2 rounded-xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-b2 shrink-0">
          <div>
            <h2 className="font-bold text-fg text-sm">Results — {paperTitle}</h2>
            <p className="text-xs text-t3 mt-0.5">{results?.length ?? '…'} submissions</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md text-t3 hover:text-fg hover:bg-s2 transition-colors text-lg"
          >×</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-t3">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Loading results…
            </div>
          )}
          {error && <p className="text-sm text-rose-400">{error}</p>}
          {!loading && !error && results?.length === 0 && (
            <div className="text-center py-8">
              <p className="text-2xl mb-2 opacity-30">📋</p>
              <p className="text-sm text-t3">No submissions yet.</p>
            </div>
          )}
          {!loading && (results ?? []).length > 0 && (
            <div className="space-y-2">
              {results!.map(sub => {
                const grade = gradeBand(sub.pct)
                const isOpen = expanded === sub.id
                return (
                  <div key={sub.id} className="rounded-lg border border-b2 bg-s2 overflow-hidden">
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-s3 transition-colors"
                      onClick={() => setExpanded(isOpen ? null : sub.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-fg truncate">{sub.student.name}</p>
                        <p className="text-xs text-t3">{new Date(sub.submitted_at).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-bold text-fg">{sub.score}/{sub.total_marks}</p>
                          <p className="text-xs text-t3">{sub.pct}%</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${badgeColor(sub.pct >= 50 ? 'partial' : 'low')} ${grade.color}`}>
                          {grade.label}
                        </span>
                        <span className="text-t3 text-xs">{isOpen ? '▲' : '▼'}</span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-b2 px-4 py-3 space-y-3">
                        {(sub.feedback ?? []).map(fb => (
                          <div key={String(fb.num)} className="flex gap-3">
                            <div className="w-8 text-xs font-mono text-t3 pt-0.5 shrink-0">Q{fb.num}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs px-1.5 py-0.5 rounded border font-semibold ${badgeColor(fb.badge)}`}>
                                  {fb.score}/{fb.maxScore}
                                </span>
                                {fb.badge === 'full' && <span className="text-xs">✅</span>}
                                {fb.badge === 'partial' && <span className="text-xs">⚠️</span>}
                                {fb.badge === 'low' && <span className="text-xs">❌</span>}
                              </div>
                              {fb.comment && <p className="text-xs text-t3 leading-relaxed">{fb.comment}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Add / Edit paper modal ────────────────────────────────────────────────────
function PaperModal({ classId, paper, onSave, onClose }: {
  classId: string
  paper:   PastPaper | null  // null = create new
  onSave:  (p: PastPaper) => void
  onClose: () => void
}) {
  const [title,      setTitle]      = useState(paper?.title      ?? '')
  const [year,       setYear]       = useState(paper?.year       ?? '')
  const [session,    setSession]    = useState(paper?.session     ?? '')
  const [paperNum,   setPaperNum]   = useState(paper?.paper_num  ?? '')
  const [dueDate,    setDueDate]    = useState(paper?.due_date ? paper.due_date.slice(0, 16) : '')
  const [questions,  setQuestions]  = useState<Question[]>(
    paper?.questions ?? [{ num: 1, stem: '', marks: 2, ms: '' }]
  )
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')

  // PDF extraction
  const [pdfFile,    setPdfFile]    = useState<File | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [extractErr, setExtractErr] = useState('')

  async function extractFromPdf(file: File) {
    setExtracting(true)
    setExtractErr('')
    const form = new FormData()
    form.append('file', file)
    form.append('classId', classId)
    const res  = await fetch('/api/teacher/past-papers/extract', { method: 'POST', body: form })
    const data = await res.json()
    setExtracting(false)
    if (!res.ok) { setExtractErr(data.error ?? 'Extraction failed'); return }
    if (data.title)    setTitle(data.title)
    if (data.year)     setYear(data.year)
    if (data.session)  setSession(data.session)
    if (data.paperNum) setPaperNum(data.paperNum)
    if (data.questions?.length) setQuestions(data.questions)
  }

  function addQuestion() {
    setQuestions(qs => [...qs, { num: qs.length + 1, stem: '', marks: 2, ms: '' }])
  }

  function removeQuestion(i: number) {
    setQuestions(qs => qs.filter((_, idx) => idx !== i))
  }

  function updateQ(i: number, field: keyof Question, val: string | number) {
    setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, [field]: val } : q))
  }

  async function save() {
    if (!title.trim()) { setError('Title is required'); return }
    if (questions.some(q => !q.stem.trim())) { setError('All questions need text'); return }
    setSaving(true)
    setError('')

    const url    = paper ? `/api/teacher/past-papers/${paper.id}` : '/api/teacher/past-papers'
    const method = paper ? 'PATCH' : 'POST'
    const res    = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        classId, title, year, session, paperNum, questions,
        dueDate: dueDate || null,
        ...(paper ? {} : {}),
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Save failed'); return }
    onSave(data.paper)
  }

  const totalMarks = questions.reduce((s, q) => s + (Number(q.marks) || 0), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-s1 border border-b2 rounded-xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-b2 shrink-0">
          <h2 className="font-bold text-fg text-sm">{paper ? 'Edit Past Paper' : 'Add Past Paper'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-md text-t3 hover:text-fg hover:bg-s2 transition-colors text-lg">×</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* PDF upload strip */}
          <div className="rounded-lg border border-dashed border-accent/40 bg-accent/5 p-4">
            <p className="text-xs font-semibold text-accent mb-2">📄 Auto-extract from PDF</p>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) { setPdfFile(f); extractFromPdf(f) }
                  }}
                />
                <span className="text-xs px-3 py-1.5 rounded-md bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors cursor-pointer">
                  {pdfFile ? pdfFile.name : 'Choose PDF…'}
                </span>
              </label>
              {extracting && (
                <span className="flex items-center gap-1 text-xs text-t3">
                  <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Extracting questions…
                </span>
              )}
              {extractErr && <p className="text-xs text-rose-400">{extractErr}</p>}
              {!extracting && pdfFile && !extractErr && (
                <span className="text-xs text-emerald-400">✅ Extracted — review and edit below</span>
              )}
            </div>
            <p className="text-xs text-t3 mt-2">Upload the past paper PDF — ByteForge will extract questions and mark schemes automatically. Or fill in manually below.</p>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-t2 mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Cambridge AS Level CS 9618 Paper 1"
                className="w-full h-9 px-3 text-sm rounded-md bg-s2 border border-b2 text-fg focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-t2 mb-1">Year</label>
              <input
                type="text"
                value={year}
                onChange={e => setYear(e.target.value)}
                placeholder="e.g. 2023"
                className="w-full h-9 px-3 text-sm rounded-md bg-s2 border border-b2 text-fg focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-t2 mb-1">Session</label>
              <select
                value={session}
                onChange={e => setSession(e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-md bg-s2 border border-b2 text-fg focus:border-accent focus:outline-none"
              >
                <option value="">— Select —</option>
                <option>May/June</option>
                <option>Oct/Nov</option>
                <option>Feb/Mar</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-t2 mb-1">Paper Number</label>
              <input
                type="text"
                value={paperNum}
                onChange={e => setPaperNum(e.target.value)}
                placeholder="e.g. 11, 21, 31"
                className="w-full h-9 px-3 text-sm rounded-md bg-s2 border border-b2 text-fg focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-t2 mb-1">Due Date (optional)</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-md bg-s2 border border-b2 text-fg focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          {/* Questions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold text-t2">Questions</p>
                <p className="text-xs text-t3">{questions.length} questions · {totalMarks} total marks</p>
              </div>
            </div>
            <div className="space-y-4">
              {questions.map((q, i) => (
                <div key={i} className="rounded-lg border border-b2 bg-s2 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-accent">Q{String(q.num)}</span>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={q.marks}
                        onChange={e => updateQ(i, 'marks', parseInt(e.target.value) || 1)}
                        className="w-16 h-7 px-2 text-xs rounded-md bg-s1 border border-b2 text-fg focus:border-accent focus:outline-none"
                      />
                      <span className="text-xs text-t3">marks</span>
                    </div>
                    <button
                      onClick={() => removeQuestion(i)}
                      className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                    >Remove</button>
                  </div>
                  <div>
                    <label className="block text-xs text-t3 mb-1">Question *</label>
                    <textarea
                      rows={2}
                      value={q.stem}
                      onChange={e => updateQ(i, 'stem', e.target.value)}
                      placeholder="Question text…"
                      className="w-full px-3 py-2 text-sm rounded-md bg-s1 border border-b2 text-fg focus:border-accent focus:outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-t3 mb-1">Mark Scheme (optional but improves AI marking)</label>
                    <textarea
                      rows={2}
                      value={q.ms}
                      onChange={e => updateQ(i, 'ms', e.target.value)}
                      placeholder="Mark scheme / model answer…"
                      className="w-full px-3 py-2 text-sm rounded-md bg-s1 border border-b2 text-fg focus:border-accent focus:outline-none resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={addQuestion}
              className="mt-3 w-full py-2 text-xs font-semibold text-accent border border-dashed border-accent/40 rounded-lg hover:bg-accent/5 transition-colors"
            >
              + Add Question
            </button>
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-b2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border border-b2 text-t2 hover:text-fg hover:border-b3 transition-colors"
          >Cancel</button>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold rounded-md bg-accent text-black hover:bg-accent/90 disabled:opacity-40 transition-colors"
          >
            {saving ? 'Saving…' : paper ? 'Save Changes' : 'Create Paper'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────
export function PastPapersPanel({ classId }: { classId: string }) {
  const [papers,       setPapers]       = useState<PastPaper[] | null>(null)
  const [loading,      setLoading]      = useState(false)
  const [loaded,       setLoaded]       = useState(false)
  const [showModal,    setShowModal]    = useState(false)
  const [editPaper,    setEditPaper]    = useState<PastPaper | null>(null)
  const [resultsFor,   setResultsFor]   = useState<PastPaper | null>(null)
  const [togglingId,   setTogglingId]   = useState<string | null>(null)
  const [deletingId,   setDeletingId]   = useState<string | null>(null)
  const [error,        setError]        = useState('')

  const load = useCallback(async () => {
    if (loaded) return
    setLoading(true)
    const res  = await fetch(`/api/teacher/past-papers?classId=${classId}`)
    const data = await res.json()
    setPapers(data.papers ?? [])
    setLoaded(true)
    setLoading(false)
  }, [classId, loaded])

  // Trigger load once on mount
  useState(() => { load() })

  async function toggleAssigned(paper: PastPaper) {
    setTogglingId(paper.id)
    const res  = await fetch(`/api/teacher/past-papers/${paper.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ assigned: !paper.assigned }),
    })
    const data = await res.json()
    setTogglingId(null)
    if (res.ok) setPapers(ps => (ps ?? []).map(p => p.id === paper.id ? data.paper : p))
    else setError(data.error ?? 'Failed')
  }

  async function deletePaper(paper: PastPaper) {
    if (!confirm(`Delete "${paper.title}"? This will also delete all student submissions.`)) return
    setDeletingId(paper.id)
    const res = await fetch(`/api/teacher/past-papers/${paper.id}`, { method: 'DELETE' })
    setDeletingId(null)
    if (res.ok) setPapers(ps => (ps ?? []).filter(p => p.id !== paper.id))
    else setError('Delete failed')
  }

  function onSave(saved: PastPaper) {
    setPapers(ps => {
      const existing = (ps ?? []).find(p => p.id === saved.id)
      return existing
        ? (ps ?? []).map(p => p.id === saved.id ? saved : p)
        : [saved, ...(ps ?? [])]
    })
    setShowModal(false)
    setEditPaper(null)
  }

  const assignedCount = (papers ?? []).filter(p => p.assigned).length

  return (
    <>
      {/* Modals */}
      {(showModal || editPaper) && (
        <PaperModal
          classId={classId}
          paper={editPaper}
          onSave={onSave}
          onClose={() => { setShowModal(false); setEditPaper(null) }}
        />
      )}
      {resultsFor && (
        <ResultsDrawer
          paperId={resultsFor.id}
          paperTitle={resultsFor.title}
          onClose={() => setResultsFor(null)}
        />
      )}

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-fg">Past Papers</h3>
            <p className="text-xs text-t3 mt-0.5">
              {loading ? 'Loading…' : `${(papers ?? []).length} papers · ${assignedCount} assigned to students`}
            </p>
          </div>
          <button
            onClick={() => { setEditPaper(null); setShowModal(true) }}
            className="text-xs font-semibold px-3 py-1.5 rounded-md bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors"
          >
            + Add Paper
          </button>
        </div>

        {error && <p className="text-xs text-rose-400">{error}</p>}

        {/* Paper list */}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-t3 py-4">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Loading past papers…
          </div>
        )}

        {!loading && (papers ?? []).length === 0 && (
          <div className="rounded-lg border border-dashed border-b3 p-6 text-center">
            <p className="text-2xl mb-2 opacity-30">📝</p>
            <p className="text-sm text-t3">No past papers yet.</p>
            <p className="text-xs text-t3 mt-1">Upload a PDF or enter questions manually — students get instant AI marking.</p>
          </div>
        )}

        {!loading && (papers ?? []).length > 0 && (
          <div className="space-y-2">
            {(papers ?? []).map(paper => (
              <div
                key={paper.id}
                className="rounded-lg border border-b2 bg-s2 p-4"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-fg truncate">{paper.title}</p>
                      {paper.year && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-s1 border border-b2 text-t3">
                          {paper.year} {paper.session}
                        </span>
                      )}
                      {paper.paper_num && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-s1 border border-b2 text-t3">
                          Paper {paper.paper_num}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-t3 mt-1">
                      {paper.questions.length} questions · {paper.total_marks} marks
                      {paper.due_date && ` · Due ${new Date(paper.due_date).toLocaleDateString()}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* Results */}
                    <button
                      onClick={() => setResultsFor(paper)}
                      className="text-xs px-2.5 py-1 rounded-md bg-s1 border border-b2 text-t2 hover:text-fg hover:border-b3 transition-colors"
                    >
                      📊 Results
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => { setEditPaper(paper); setShowModal(false) }}
                      className="text-xs px-2.5 py-1 rounded-md bg-s1 border border-b2 text-t2 hover:text-fg hover:border-b3 transition-colors"
                    >
                      ✏️ Edit
                    </button>

                    {/* Assign toggle */}
                    <button
                      onClick={() => toggleAssigned(paper)}
                      disabled={togglingId === paper.id}
                      className={`text-xs px-3 py-1 rounded-md border font-semibold transition-colors disabled:opacity-40 ${
                        paper.assigned
                          ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/20'
                          : 'bg-s1 border-b2 text-t2 hover:text-fg hover:border-b3'
                      }`}
                    >
                      {togglingId === paper.id
                        ? '…'
                        : paper.assigned ? '✅ Assigned' : 'Assign to class'}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => deletePaper(paper)}
                      disabled={deletingId === paper.id}
                      title="Delete paper"
                      className="w-7 h-7 flex items-center justify-center rounded-md text-fg-faint hover:text-rose-400 hover:bg-rose-400/10 transition-colors disabled:opacity-40"
                    >
                      {deletingId === paper.id
                        ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      }
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-accent/5 border border-accent/20 text-xs text-fg-dim">
          <span>🤖</span>
          <span>Each student answer is marked by AI against the mark scheme — keyword matching + Groq model. Students see per-question scores and feedback instantly on submission.</span>
        </div>
      </div>
    </>
  )
}
