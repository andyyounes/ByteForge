'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

// ── Per-chapter exam widget ────────────────────────────────────────────────────
interface UnitExamQuestion {
  num?:  number
  stem:  string
  marks: number
  ms:    string
}

interface UnitExam {
  id:            string
  chapter_num:   number
  chapter_label: string
  title:         string
  status:        'pending' | 'approved' | 'rejected'
  created_at:    string
  content?: {
    questions:   UnitExamQuestion[]
    totalMarks?: number
    duration?:   number
  }
}

// ── Exam preview modal ───────────────────────────────────────────────────────
function ExamPreviewModal({ exam, onClose }: { exam: UnitExam; onClose: () => void }) {
  const questions  = exam.content?.questions  ?? []
  const totalMarks = exam.content?.totalMarks ?? questions.reduce((s, q) => s + (q.marks ?? 0), 0)
  const duration   = exam.content?.duration   ?? 40

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-s1 border border-b2 rounded-xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-b2 shrink-0">
          <div>
            <p className="text-xs font-bold text-accent uppercase tracking-wider">📝 Exam Preview</p>
            <h2 className="font-bold text-fg text-sm mt-0.5">{exam.title}</h2>
            <p className="text-xs text-t3">{totalMarks} marks · {duration} min · {questions.length} questions · {exam.status}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-md text-t3 hover:text-fg hover:bg-s2 transition-colors text-lg">×</button>
        </div>
        {/* Questions */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {questions.map((q, i) => (
            <div key={i} className="rounded-lg border border-b2 bg-s2 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-accent">Q{i + 1}</span>
                <span className="text-xs text-t3 shrink-0">[{q.marks} mark{q.marks !== 1 ? 's' : ''}]</span>
              </div>
              <p className="text-sm text-fg leading-relaxed mb-3">{q.stem}</p>
              <details className="text-xs">
                <summary className="cursor-pointer text-t3 hover:text-fg transition-colors select-none">Mark scheme</summary>
                <div className="mt-2 px-3 py-2 rounded bg-s1 border border-b2 text-fg-dim leading-relaxed whitespace-pre-wrap">{q.ms}</div>
              </details>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ChapterExamWidget({ classId, chapterNum, exam: initialExam }: {
  classId:    string
  chapterNum: number
  exam:       UnitExam | null
}) {
  const [exam,      setExam]      = useState<UnitExam | null>(initialExam)
  const [loading,   setLoading]   = useState<string | null>(null)  // 'generate' | 'approve' | 'reject'
  const [error,     setError]     = useState('')
  const [previewing, setPreviewing] = useState(false)

  async function generate() {
    setLoading('generate')
    setError('')
    const res  = await fetch('/api/teacher/generate-unit-exam', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId, chapterNum }),
    })
    const data = await res.json()
    setLoading(null)
    if (!res.ok) { setError(data.error ?? 'Failed'); return }
    setExam(data.exam)
  }

  async function setStatus(status: 'approved' | 'rejected') {
    if (!exam) return
    setLoading(status)
    const res  = await fetch(`/api/teacher/unit-exams/${exam.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const data = await res.json()
    setLoading(null)
    if (!res.ok) { setError(data.error ?? 'Failed'); return }
    setExam(prev => prev ? { ...prev, status } : prev)
  }

  const statusColor = exam?.status === 'approved'
    ? 'text-emerald-400'
    : exam?.status === 'rejected'
    ? 'text-rose-400'
    : 'text-amber-400'

  const statusIcon = exam?.status === 'approved' ? '✅' : exam?.status === 'rejected' ? '❌' : '⏳'

  return (
    <>
      {previewing && exam && <ExamPreviewModal exam={exam} onClose={() => setPreviewing(false)} />}
      <div className="mt-2 pt-2 border-t border-b1">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs">📝</span>
            <span className="text-xs font-semibold text-t2">Unit Exam</span>
            {exam && (
              <span className={`text-xs font-semibold ${statusColor}`}>
                {statusIcon} {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {!exam ? (
              <button
                onClick={generate}
                disabled={loading === 'generate'}
                className="text-xs px-2.5 py-1 rounded-md bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors disabled:opacity-40"
              >
                {loading === 'generate' ? (
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />
                    Generating…
                  </span>
                ) : '✨ Generate Exam'}
              </button>
            ) : (
              <>
                {/* Preview */}
                <button
                  onClick={() => setPreviewing(true)}
                  className="text-xs px-2.5 py-1 rounded-md bg-s2 border border-b2 text-t2 hover:text-fg hover:border-b3 transition-colors"
                >
                  👁 Preview
                </button>
                <button
                  onClick={generate}
                  disabled={!!loading}
                  title="Regenerate"
                  className="text-xs px-2 py-1 rounded-md bg-s2 border border-b2 text-t2 hover:text-fg hover:border-b3 transition-colors disabled:opacity-40"
                >
                  {loading === 'generate' ? '…' : '↺'}
                </button>
                {exam.status !== 'approved' && (
                  <button
                    onClick={() => setStatus('approved')}
                    disabled={!!loading}
                    className="text-xs px-2.5 py-1 rounded-md bg-emerald/10 border border-emerald/30 text-emerald-400 hover:bg-emerald/20 transition-colors disabled:opacity-40"
                  >
                    {loading === 'approved' ? '…' : '✓ Approve'}
                  </button>
                )}
                {exam.status !== 'rejected' && (
                  <button
                    onClick={() => setStatus('rejected')}
                    disabled={!!loading}
                    className="text-xs px-2.5 py-1 rounded-md bg-rose/10 border border-rose/30 text-rose-400 hover:bg-rose/20 transition-colors disabled:opacity-40"
                  >
                    {loading === 'rejected' ? '…' : '✕ Reject'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
      </div>
    </>
  )
}

// ── All built-in lessons — visible to students even without a book ────────────
// Lists every topic from the student lesson pages (default-lessons.json).
// Clicking opens the lesson editor; topics with a class-specific copy get a
// "customized" badge. This is how classes WITHOUT an uploaded book manage
// their lessons.
function AllLessonsSection({ classId, isALevel, customizedKeys }: {
  classId:        string
  isALevel:       boolean
  customizedKeys: Set<string>
}) {
  const router = useRouter()
  const [defaults, setDefaults] = useState<Record<string, { chapter: string; title: string }> | null>(null)

  useEffect(() => {
    fetch('/lessons/default-lessons.json')
      .then(r => r.ok ? r.json() : null)
      .then(setDefaults)
      .catch(() => setDefaults(null))
  }, [])

  if (!defaults) return null

  // Group topics into chapters, filtered to this class's level
  const chapterNumOf = (key: string, chapterLabel: string): number => {
    const fromKey = key.match(/^ch(\d+)-/)?.[1]
    if (fromKey) return parseInt(fromKey)
    const fromLabel = chapterLabel.match(/\d+/)?.[0]
    return fromLabel ? parseInt(fromLabel) : 0
  }

  const chapters = new Map<number, { label: string; topics: { key: string; title: string }[] }>()
  for (const [key, d] of Object.entries(defaults)) {
    const num = chapterNumOf(key, d.chapter)
    const inLevel = isALevel ? num >= 16 : num <= 15
    if (!inLevel) continue
    if (!chapters.has(num)) chapters.set(num, { label: d.chapter || `Chapter ${num}`, topics: [] })
    chapters.get(num)!.topics.push({ key, title: d.title })
  }
  const sorted = [...chapters.entries()].sort((a, b) => a[0] - b[0])
  if (sorted.length === 0) return null

  const customizedCount = [...customizedKeys].filter(k => defaults[k]).length

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-fg text-sm">📖 All Lessons — what students see</h3>
        <span className="text-xs text-t3 bg-s2 px-2 py-0.5 rounded-full border border-b2">
          {customizedCount} customized
        </span>
      </div>
      <p className="text-xs text-fg-dim mb-4">
        Every topic below is already live for your students — no book upload needed.
        Click any lesson to open it and edit the content for this class.
      </p>

      <div className="space-y-4">
        {sorted.map(([num, ch]) => (
          <div key={num} className="rounded-lg border border-b2 p-3 bg-s1">
            <p className="text-xs font-semibold text-t2 mb-2">{ch.label}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ch.topics.map(t => {
                const customized = customizedKeys.has(t.key)
                return (
                  <div
                    key={t.key}
                    onClick={() => router.push(`/teacher/class/${classId}/lessons/${t.key}`)}
                    className="px-3 py-2 rounded-md bg-s2 border border-b2 group relative cursor-pointer hover:border-accent/40 transition-colors"
                    title="Open lesson (student view)"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${customized ? 'bg-emerald-400' : 'bg-s0 border border-b3'}`} />
                      <span className="text-xs font-mono text-t3">{t.key}</span>
                      {customized && <span className="text-[10px] font-semibold text-emerald-400 ml-auto">✓ customized</span>}
                    </div>
                    <p className="text-xs text-fg leading-snug line-clamp-2">{t.title}</p>
                    <span className="absolute top-1.5 right-1.5 text-xs text-t3 opacity-0 group-hover:opacity-100 transition-all">👁</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Small inline button — converts generated lessons → exercises table ────────
function CreateExercisesButton({ classId, lessonCount }: { classId: string; lessonCount: number }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState('')

  async function handle() {
    setStatus('loading')
    const res  = await fetch('/api/teacher/create-exercises-from-book', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId }),
    })
    const data = await res.json()
    if (res.ok) {
      setResult(`✅ ${data.created} exercises created (${data.skipped} already existed)`)
      setStatus('done')
    } else {
      setResult(`❌ ${data.error ?? 'Failed'}`)
      setStatus('error')
    }
  }

  if (lessonCount === 0) return null
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handle}
        disabled={status === 'loading' || status === 'done'}
        className="text-xs font-semibold px-3 py-1.5 rounded-md bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors disabled:opacity-40"
      >
        {status === 'loading' ? 'Creating…' : '⚡ Create exercises from lessons'}
      </button>
      {result && <p className="text-xs text-fg-dim">{result}</p>}
    </div>
  )
}

interface CurriculumSource {
  id:         string
  title:      string
  created_at: string
  class_id:   string | null
}

interface GeneratedLesson {
  topic_key:  string
  title:      string | null
  chapter_num: number | null
  created_at: string
}

interface Props {
  classId:   string
  className: string
  teacherId: string
  isALevel?: boolean
}

interface UploadState {
  status:  'idle' | 'uploading' | 'generating' | 'done' | 'error'
  message: string
  generated: number
  total:   number
}

export function BookLessonsPanel({ classId, className, teacherId, isALevel = false }: Props) {
  const { supabase }    = useSupabase()
  const [sources,       setSources]       = useState<CurriculumSource[] | null>(null)
  const [lessons,       setLessons]       = useState<GeneratedLesson[] | null>(null)
  const [exams,         setExams]         = useState<UnitExam[]>([])
  const [uploadState,   setUploadState]   = useState<UploadState>({ status: 'idle', message: '', generated: 0, total: 0 })
  const [dragOver,      setDragOver]      = useState(false)
  const [selectedFile,  setSelectedFile]  = useState<File | null>(null)
  const [bookTitle,     setBookTitle]     = useState('')
  const [loadedClassId, setLoadedClassId] = useState<string | null>(null)
  const [deletingId,    setDeletingId]    = useState<string | null>(null)
  const router = useRouter()

  const loadData = useCallback(async () => {
    if (loadedClassId === classId) return
    setLoadedClassId(classId)

    const [srcRes, lessonRes, examRes] = await Promise.all([
      supabase
        .from('curriculum_sources')
        .select('id, title, created_at, class_id')
        .eq('class_id', classId)
        .order('created_at', { ascending: false }),
      supabase
        .from('generated_lessons')
        .select('topic_key, title, chapter_num, created_at')
        .eq('class_id', classId)
        .order('chapter_num', { ascending: true }),
      fetch('/api/unit-exams', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId }),
      }).then(r => r.ok ? r.json() : { exams: [] }),
    ])

    setSources(srcRes.data ?? [])
    setLessons(lessonRes.data ?? [])
    setExams(examRes.exams ?? [])
  }, [classId, loadedClassId, supabase])

  // Trigger load on first render via a self-calling pattern
  useState(() => { loadData() })

  // ── Upload + extract text ──────────────────────────────────────────────────
  async function handleUpload() {
    if (!selectedFile) return
    setUploadState({ status: 'uploading', message: 'Uploading and reading PDF…', generated: 0, total: 0 })

    try {
      const form = new FormData()
      form.append('file',    selectedFile)
      form.append('classId', classId)
      form.append('title',   bookTitle || selectedFile.name.replace('.pdf', ''))

      const res  = await fetch('/api/classes/upload', { method: 'POST', body: form })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? 'Upload failed')

      setUploadState(s => ({ ...s, message: `Book uploaded — ${data.topicCount ?? 0} topics detected. Generating lessons…` }))

      // Reload sources list
      const srcRes = await supabase
        .from('curriculum_sources')
        .select('id, title, created_at, class_id')
        .eq('class_id', classId)
        .order('created_at', { ascending: false })
      setSources(srcRes.data ?? [])

      // Auto-trigger lesson generation for the new source
      if (srcRes.data?.[0]?.id) {
        await generateLessons(srcRes.data[0].id)
      } else {
        setUploadState({ status: 'done', message: 'Book uploaded. Click "Generate Lessons" to build content.', generated: 0, total: 0 })
      }
    } catch (e: unknown) {
      setUploadState({ status: 'error', message: (e as Error).message ?? 'Upload failed', generated: 0, total: 0 })
    }
  }

  // ── Generate lessons from existing source (pages through the whole book) ──
  async function generateLessons(sourceId: string) {
    setUploadState({ status: 'generating', message: 'Generating lessons from book…', generated: 0, total: 0 })

    let totalGenerated = 0
    let startFrom      = 0
    let totalChunks    = 0

    try {
      // Loop until the API says there are no more chunks
      while (true) {
        const res  = await fetch('/api/teacher/generate-lessons', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ sourceId, classId, startFrom }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Generation failed')

        totalGenerated += data.generated ?? 0
        totalChunks     = data.chunks    ?? totalChunks
        startFrom       = data.nextFrom  ?? startFrom + 30

        setUploadState({
          status:    'generating',
          message:   `Generating lessons… ${totalGenerated} done, ${data.skipped ?? 0} already existed (${startFrom}/${totalChunks} sections processed)`,
          generated: totalGenerated,
          total:     totalChunks,
        })

        if (!data.hasMore) break
      }

      // Reload lessons list from DB
      const lessonRes = await supabase
        .from('generated_lessons')
        .select('topic_key, title, chapter_num, created_at')
        .eq('class_id', classId)
        .order('chapter_num', { ascending: true })
      setLessons(lessonRes.data ?? [])

      setUploadState({
        status:    'done',
        message:   `✅ Done — ${totalGenerated} lessons generated across ${totalChunks} sections.`,
        generated: totalGenerated,
        total:     totalChunks,
      })

      setSelectedFile(null)
      setBookTitle('')
    } catch (e: unknown) {
      setUploadState({ status: 'error', message: (e as Error).message ?? 'Generation failed', generated: 0, total: 0 })
    }
  }

  // ── Delete a curriculum source (and its generated lessons via CASCADE) ───────
  async function deleteSource(sourceId: string) {
    if (!confirm('Delete this book and all its generated lessons? This cannot be undone.')) return
    setDeletingId(sourceId)
    // Delete generated lessons from this source first, then the source itself
    await supabase.from('generated_lessons').delete().eq('source_id', sourceId).eq('class_id', classId)
    await supabase.from('curriculum_sources').delete().eq('id', sourceId)
    setSources(prev => (prev ?? []).filter(s => s.id !== sourceId))
    // Reload lessons list
    const lessonRes = await supabase
      .from('generated_lessons')
      .select('topic_key, title, chapter_num, created_at')
      .eq('class_id', classId)
      .order('chapter_num', { ascending: true })
    setLessons(lessonRes.data ?? [])
    setDeletingId(null)
  }

  // ── Split lessons into two papers depending on AS or A Level ───────────────
  const paper1Lessons = isALevel
    ? (lessons ?? []).filter(l => (l.chapter_num ?? 0) >= 16 && (l.chapter_num ?? 0) <= 22)
    : (lessons ?? []).filter(l => (l.chapter_num ?? 0) >= 1  && (l.chapter_num ?? 0) <= 10)
  const paper2Lessons = isALevel
    ? (lessons ?? []).filter(l => (l.chapter_num ?? 0) >= 23 && (l.chapter_num ?? 0) <= 29)
    : (lessons ?? []).filter(l => (l.chapter_num ?? 0) >= 11 && (l.chapter_num ?? 0) <= 15)

  function groupByChapter(list: GeneratedLesson[]) {
    return list.reduce<Record<number, GeneratedLesson[]>>((acc, l) => {
      const ch = l.chapter_num ?? 0
      if (!acc[ch]) acc[ch] = []
      acc[ch].push(l)
      return acc
    }, {})
  }

  const hasSources = (sources ?? []).length > 0
  const hasLessons = (lessons ?? []).length > 0

  return (
    <div className="space-y-6">

      {/* ── Upload section ─────────────────────────────────────────── */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📚</span>
          <div>
            <h3 className="font-semibold text-fg text-sm">
              Upload Cambridge {isALevel ? 'A Level' : 'AS Level'} Textbook
            </h3>
            <p className="text-xs text-fg-dim mt-0.5">
              Upload the Cambridge 9618 textbook PDF. ByteForge generates lessons for{' '}
              {isALevel ? (
                <>
                  <strong className="text-fg">Paper 3 (Chapters 16–22)</strong> and{' '}
                  <strong className="text-fg">Paper 4 (Chapters 23–29)</strong> — the full A Level syllabus.
                </>
              ) : (
                <>
                  <strong className="text-fg">Paper 1 (Chapters 1–10)</strong> and{' '}
                  <strong className="text-fg">Paper 2 (Chapters 11–15)</strong> — the full AS Level syllabus.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Drag-drop zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer mb-4 ${
            dragOver
              ? 'border-accent bg-accent/5'
              : selectedFile
              ? 'border-emerald bg-emerald/5'
              : 'border-b3 hover:border-accent/50'
          }`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault(); setDragOver(false)
            const f = e.dataTransfer.files[0]
            if (f?.type === 'application/pdf') { setSelectedFile(f); setBookTitle(f.name.replace('.pdf','')) }
          }}
          onClick={() => document.getElementById('book-file-input')?.click()}
        >
          <input
            id="book-file-input"
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) { setSelectedFile(f); setBookTitle(f.name.replace('.pdf','')) }
            }}
          />
          {selectedFile ? (
            <div>
              <div className="text-2xl mb-1">📄</div>
              <p className="text-sm font-medium text-fg">{selectedFile.name}</p>
              <p className="text-xs text-fg-dim mt-1">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
          ) : (
            <div>
              <div className="text-2xl mb-1 opacity-40">📖</div>
              <p className="text-sm text-fg-dim">Drop PDF here or <span className="text-accent">click to browse</span></p>
              <p className="text-xs text-t3 mt-1">PDF only · max 50 MB</p>
            </div>
          )}
        </div>

        {selectedFile && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-t2 mb-1.5">Book title</label>
            <input
              type="text"
              value={bookTitle}
              onChange={e => setBookTitle(e.target.value)}
              placeholder="e.g. Cambridge AS Level Computer Science"
              className="w-full h-9 px-3 text-sm rounded-md bg-s2 border border-b2 text-fg focus:border-accent focus:outline-none"
            />
          </div>
        )}

        {/* Status message */}
        {uploadState.status !== 'idle' && (
          <div className={`mb-4 px-3 py-2.5 rounded-md text-sm border ${
            uploadState.status === 'error'
              ? 'bg-rose/10 border-rose/20 text-rose'
              : uploadState.status === 'done'
              ? 'bg-emerald/10 border-emerald/20 text-emerald'
              : 'bg-accent/10 border-accent/20 text-accent'
          }`}>
            {(uploadState.status === 'uploading' || uploadState.status === 'generating') && (
              <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-2 align-middle" />
            )}
            {uploadState.message}
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploadState.status === 'uploading' || uploadState.status === 'generating'}
            loading={uploadState.status === 'uploading' || uploadState.status === 'generating'}
          >
            {uploadState.status === 'generating' ? 'Generating…' : 'Upload & Generate Lessons'}
          </Button>
          {selectedFile && (
            <button
              onClick={() => { setSelectedFile(null); setBookTitle('') }}
              className="px-3 py-1.5 text-sm rounded-md border border-b2 text-t2 hover:text-fg hover:border-b3 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Existing sources ───────────────────────────────────────── */}
      {hasSources && (
        <div className="card p-5">
          <h3 className="font-semibold text-fg text-sm mb-3">Uploaded Books</h3>
          <div className="space-y-2">
            {(sources ?? []).map(src => (
              <div key={src.id} className="flex items-center justify-between gap-3 py-2 border-b border-b1 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-fg truncate">{src.title}</p>
                  <p className="text-xs text-t3">{new Date(src.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => generateLessons(src.id)}
                    disabled={uploadState.status === 'generating'}
                    className="text-xs font-semibold text-accent border border-accent/30 px-3 py-1 rounded-md hover:bg-accent/10 transition-colors disabled:opacity-40"
                  >
                    {uploadState.status === 'generating' ? '…' : '↺ Re-generate'}
                  </button>
                  <button
                    onClick={() => deleteSource(src.id)}
                    disabled={deletingId === src.id}
                    title="Delete book"
                    className="w-7 h-7 flex items-center justify-center rounded-md text-fg-faint hover:text-rose hover:bg-rose/10 transition-colors disabled:opacity-40"
                  >
                    {deletingId === src.id
                      ? <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Generated lessons grid ─────────────────────────────────── */}
      {hasLessons && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-fg text-sm">Generated Lessons</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-blue-400 bg-s2 px-2 py-0.5 rounded-full border border-b2">{isALevel ? 'P3' : 'P1'}: {paper1Lessons.length}</span>
              <span className="text-xs text-violet-400 bg-s2 px-2 py-0.5 rounded-full border border-b2">{isALevel ? 'P4' : 'P2'}: {paper2Lessons.length}</span>
            </div>
          </div>

          <div className="space-y-6">
            {(
              isALevel
                ? [
                    { label: 'Paper 3 — Advanced Theory', color: 'text-blue-400', dot: 'bg-blue-400', lessons: paper1Lessons, range: 'Chapters 16–22' },
                    { label: 'Paper 4 — Advanced Programming', color: 'text-violet-400', dot: 'bg-violet-400', lessons: paper2Lessons, range: 'Chapters 23–29' },
                  ]
                : [
                    { label: 'Paper 1 — Theory Fundamentals', color: 'text-blue-400', dot: 'bg-blue-400', lessons: paper1Lessons, range: 'Chapters 1–10' },
                    { label: 'Paper 2 — Problem-Solving & Programming', color: 'text-violet-400', dot: 'bg-violet-400', lessons: paper2Lessons, range: 'Chapters 11–15' },
                  ]
            ).map(paper => (
              <div key={paper.label}>
                {/* Paper header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-px bg-b2" />
                  <div className="flex items-center gap-2 px-2">
                    <span className={`text-xs font-bold uppercase tracking-wider ${paper.color}`}>{paper.label}</span>
                    <span className="text-xs text-t3">({paper.range})</span>
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full bg-s2 border border-b2 ${paper.color}`}>
                      {paper.lessons.length} lessons
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-b2" />
                </div>

                {paper.lessons.length === 0 ? (
                  <p className="text-xs text-t3 text-center py-3">No lessons generated yet for this paper.</p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupByChapter(paper.lessons)).sort((a, b) => +a[0] - +b[0]).map(([ch, chLessons]) => {
                      const chNum = parseInt(ch)
                      const chExam = exams.find(e => e.chapter_num === chNum) ?? null
                      return (
                        <div key={ch} className="rounded-lg border border-b2 p-3 bg-s1">
                          <p className="text-xs font-semibold text-t2 mb-2">Chapter {ch}</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {chLessons.map(l => (
                              <div
                                key={l.topic_key}
                                onClick={() => router.push(`/teacher/class/${classId}/lessons/${l.topic_key}`)}
                                className="px-3 py-2 rounded-md bg-s2 border border-b2 group relative cursor-pointer hover:border-accent/40 transition-colors"
                                title="Open lesson (student view)"
                              >
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${paper.dot}`} />
                                  <span className="text-xs font-mono text-t3">{l.topic_key}</span>
                                </div>
                                <p className="text-xs text-fg leading-snug line-clamp-2">{l.title ?? 'Untitled'}</p>
                                <span className="absolute top-1.5 right-1.5 text-xs text-t3 opacity-0 group-hover:opacity-100 transition-all">👁</span>
                              </div>
                            ))}
                          </div>
                          <ChapterExamWidget
                            classId={classId}
                            chapterNum={chNum}
                            exam={chExam}
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-b2 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-t3">
              Students see these lessons in the {isALevel ? 'A Level' : 'AS Level'} lesson page — book content replaces the default theory + practice questions for each topic.
            </p>
            <CreateExercisesButton classId={classId} lessonCount={(lessons ?? []).length} />
          </div>
        </div>
      )}

      {/* ── All built-in lessons — always available, book or not ─────── */}
      <AllLessonsSection
        classId={classId}
        isALevel={isALevel}
        customizedKeys={new Set((lessons ?? []).map(l => l.topic_key))}
      />
    </div>
  )
}
