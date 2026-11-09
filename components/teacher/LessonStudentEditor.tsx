'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'

/**
 * Full-page teacher lesson editor that replicates the STUDENT lesson view
 * (as-level.html), with edit-in-place controls:
 *  - hover a key term / question → edit or delete it
 *  - hover the theory / example block → edit the HTML
 *  - "+ Add" buttons for terms and questions
 * One Save button persists everything via PUT /api/lessons/[topicKey].
 */

interface KeyTerm  { name: string; def: string }
interface Question { stem: string; marks: number; ms: string; img?: string }
interface Video    { id: string; title: string; channel?: string }

// A flexible teacher-added content block. The teacher picks the type:
//  example — extra worked example (lime block)
//  note    — callout / tip (amber block)
//  image   — image or GIF by URL, with caption
//  link    — external resource link card
//  quote   — quoted material rendered with its reference/source
//  html    — free text/HTML section (theory-style block)
type ExtraType = 'example' | 'note' | 'image' | 'link' | 'quote' | 'html'
interface Extra {
  type:     ExtraType
  title?:   string
  html?:    string
  url?:     string
  caption?: string
}

const EXTRA_LABELS: Record<ExtraType, string> = {
  example: '💡 Worked example',
  note:    '📌 Note / tip',
  image:   '🖼 Image / GIF',
  link:    '🔗 Link',
  quote:   '📖 Quote with reference',
  html:    '📄 Text section',
}

// Accepts a full YouTube URL (watch / youtu.be / embed / shorts) or a bare ID
function ytId(input: string): string {
  const m = input.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)
  return m ? m[1] : input.trim()
}

interface Props {
  topicKey: string
  classId:  string
  backHref: string
}

// Styles copied from public/lessons/as-level.html so the preview matches
// exactly what students see. Scoped under .lsnprev to avoid app-CSS bleed.
const STUDENT_CSS = `
.lsnprev { background:#0d0f1a; color:#e2e8f0; font-family:system-ui,-apple-system,sans-serif; }
.lsnprev .topic-chapter-badge { display:inline-block; font-size:10px; font-weight:700; padding:2px 8px; border-radius:4px; background:rgba(232,121,249,.12); color:#e879f9; border:1px solid rgba(232,121,249,.3); }
.lsnprev .topic-title { font-size:24px; font-weight:800; color:#e2e8f0; margin-bottom:4px; }
.lsnprev .topic-subtitle { font-size:13px; color:#9ca3af; }
.lsnprev .section-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:rgba(255,255,255,.3); margin-bottom:10px; }
.lsnprev .key-terms-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:20px; }
@media (max-width:640px) { .lsnprev .key-terms-grid { grid-template-columns:1fr; } }
.lsnprev .key-term-card { background:#111320; border:1px solid rgba(255,255,255,.08); border-radius:8px; padding:10px 12px; position:relative; }
.lsnprev .key-term-name { font-size:12px; font-weight:700; color:#e879f9; margin-bottom:3px; }
.lsnprev .key-term-def  { font-size:11.5px; color:#9ca3af; line-height:1.5; }
.lsnprev .flow-divider { display:flex; align-items:center; gap:12px; margin:22px 0 14px; }
.lsnprev .flow-divider-line { flex:1; height:1px; background:rgba(255,255,255,.07); }
.lsnprev .flow-divider-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:#9ca3af; white-space:nowrap; display:flex; align-items:center; gap:5px; }
.lsnprev .theory-block { background:#111320; border:1px solid rgba(255,255,255,.08); border-radius:10px; padding:18px 20px; margin-bottom:16px; position:relative; }
.lsnprev .theory-block p { font-size:13px; color:#e2e8f0; line-height:1.75; margin-bottom:10px; }
.lsnprev .theory-block p:last-child { margin-bottom:0; }
.lsnprev .theory-block code { background:rgba(255,255,255,.08); color:#b8ef4a; padding:1px 5px; border-radius:4px; font-family:ui-monospace,monospace; font-size:12px; }
.lsnprev .theory-block pre { background:#0a0c18; border:1px solid rgba(255,255,255,.08); border-radius:8px; padding:12px 14px; font-family:ui-monospace,monospace; font-size:12px; color:#b8ef4a; line-height:1.6; overflow-x:auto; margin:10px 0; white-space:pre; }
.lsnprev .theory-block ul, .lsnprev .theory-block ol { font-size:13px; color:#e2e8f0; line-height:1.75; margin:0 0 10px 20px; }
.lsnprev .theory-block strong { color:#fff; }
.lsnprev .theory-block h3, .lsnprev .theory-block h4 { color:#e2e8f0; font-size:14px; font-weight:700; margin:14px 0 8px; }
.lsnprev .example-block { background:#0a0c18; border:1px solid rgba(184,239,74,.15); border-left:3px solid #b8ef4a; border-radius:0 10px 10px 0; padding:16px 18px; margin-bottom:20px; position:relative; }
.lsnprev .example-block-title { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:#b8ef4a; margin-bottom:10px; }
.lsnprev .example-block p { font-size:13px; color:#e2e8f0; line-height:1.75; margin-bottom:6px; }
.lsnprev .example-block p:last-child { margin-bottom:0; }
.lsnprev .example-block code { background:rgba(184,239,74,.08); color:#b8ef4a; padding:1px 5px; border-radius:4px; font-family:ui-monospace,monospace; font-size:12px; }
.lsnprev .example-block pre { background:#080a14; border:1px solid rgba(184,239,74,.12); border-radius:8px; padding:12px 14px; font-family:ui-monospace,monospace; font-size:12px; color:#b8ef4a; line-height:1.6; overflow-x:auto; margin:10px 0; white-space:pre; }
.lsnprev .example-block strong { color:#b8ef4a; }
.lsnprev .question-card { background:#111320; border:1px solid rgba(255,255,255,.08); border-radius:10px; padding:18px 20px; margin-bottom:14px; position:relative; }
.lsnprev .question-card-header { display:flex; align-items:flex-start; gap:12px; margin-bottom:12px; }
.lsnprev .q-number-badge { flex-shrink:0; width:26px; height:26px; border-radius:6px; background:rgba(232,121,249,.12); border:1px solid rgba(232,121,249,.25); color:#e879f9; font-size:11px; font-weight:700; display:flex; align-items:center; justify-content:center; }
.lsnprev .q-stem { font-size:13px; color:#e2e8f0; line-height:1.7; flex:1; }
.lsnprev .q-stem code { background:rgba(255,255,255,.08); color:#b8ef4a; padding:1px 5px; border-radius:4px; font-family:ui-monospace,monospace; font-size:12px; }
.lsnprev .q-marks { font-size:11px; color:#9ca3af; white-space:nowrap; margin-left:6px; }
.lsnprev .q-textarea { width:100%; padding:8px 12px; border-radius:6px; border:1px solid rgba(255,255,255,.1); background:#0a0c18; color:#6b7280; font-size:12.5px; font-family:ui-monospace,monospace; resize:none; min-height:52px; line-height:1.6; }
.lsnprev .mark-scheme { margin-top:10px; background:rgba(74,222,128,.04); border:1px solid rgba(74,222,128,.2); border-radius:8px; padding:12px 14px; }
.lsnprev .ms-title { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#4ade80; margin-bottom:8px; }
.lsnprev .ms-body  { font-size:12.5px; color:#9ca3af; line-height:1.7; }
.lsnprev .ms-body strong { color:#4ade80; }
.lsnprev .ms-body code { background:rgba(74,222,128,.08); color:#4ade80; padding:1px 5px; border-radius:4px; font-family:ui-monospace,monospace; font-size:12px; }
/* Teacher edit affordances */
.lsnprev .edit-hover-btns { position:absolute; top:8px; right:8px; display:flex; gap:4px; opacity:0; transition:opacity .15s; z-index:2; }
.lsnprev .key-term-card:hover .edit-hover-btns,
.lsnprev .theory-block:hover .edit-hover-btns,
.lsnprev .example-block:hover .edit-hover-btns,
.lsnprev .question-card:hover .edit-hover-btns,
.lsnprev .lsn-header:hover .edit-hover-btns { opacity:1; }
.lsnprev .ehb { width:26px; height:26px; border-radius:6px; border:1px solid rgba(255,255,255,.15); background:#1a1d2e; color:#9ca3af; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .12s; }
.lsnprev .ehb:hover { color:#e879f9; border-color:rgba(232,121,249,.4); background:rgba(232,121,249,.08); }
.lsnprev .ehb.danger:hover { color:#fb7185; border-color:rgba(251,113,133,.4); background:rgba(251,113,133,.08); }
.lsnprev .edit-field { width:100%; background:#0a0c18; border:1px solid rgba(232,121,249,.35); border-radius:6px; color:#e2e8f0; font-size:13px; padding:8px 10px; outline:none; font-family:inherit; }
.lsnprev .edit-field.mono { font-family:ui-monospace,monospace; font-size:12px; color:#b8ef4a; line-height:1.6; resize:vertical; }
.lsnprev .add-btn { width:100%; padding:10px; border-radius:8px; border:1px dashed rgba(232,121,249,.35); background:transparent; color:#e879f9; font-size:12px; font-weight:600; cursor:pointer; transition:background .15s; }
.lsnprev .add-btn:hover { background:rgba(232,121,249,.06); }
.lsnprev .sec-actions { display:flex; gap:6px; margin-top:8px; }
.lsnprev .sec-btn { padding:5px 12px; border-radius:6px; font-size:11px; font-weight:600; cursor:pointer; border:1px solid rgba(255,255,255,.15); background:#1a1d2e; color:#9ca3af; }
.lsnprev .sec-btn.primary { background:rgba(232,121,249,.15); border-color:rgba(232,121,249,.4); color:#e879f9; }
/* Videos */
.lsnprev .video-section-label { font-size:11px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:#a78bfa; margin-bottom:10px; display:flex; align-items:center; gap:6px; }
.lsnprev .video-card { background:#111320; border:1px solid rgba(255,255,255,.08); border-radius:10px; padding:12px; margin-bottom:12px; position:relative; }
.lsnprev .video-card iframe { width:100%; aspect-ratio:16/9; border:0; border-radius:8px; display:block; }
.lsnprev .video-card-meta { font-size:12px; color:#e2e8f0; margin-bottom:8px; }
.lsnprev .video-card-channel { color:#9ca3af; font-weight:400; }
.lsnprev .video-card:hover .edit-hover-btns { opacity:1; }
/* Teacher-added extra content blocks */
.lsnprev .note-block { background:rgba(251,191,36,.05); border:1px solid rgba(251,191,36,.25); border-left:3px solid #fbbf24; border-radius:0 10px 10px 0; padding:14px 16px; margin-bottom:16px; position:relative; }
.lsnprev .note-block-title { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:#fbbf24; margin-bottom:8px; }
.lsnprev .note-block p, .lsnprev .note-block div.nb-body { font-size:13px; color:#e2e8f0; line-height:1.75; }
.lsnprev .note-block:hover .edit-hover-btns { opacity:1; }
.lsnprev .quote-block { background:rgba(74,222,128,.04); border:1px solid rgba(74,222,128,.2); border-left:3px solid #4ade80; border-radius:0 10px 10px 0; padding:14px 16px; margin-bottom:16px; position:relative; }
.lsnprev .quote-body { font-size:13px; color:#e2e8f0; line-height:1.75; font-style:italic; }
.lsnprev .quote-ref { font-size:11px; color:#4ade80; margin-top:10px; font-weight:600; }
.lsnprev .quote-ref a { color:#4ade80; }
.lsnprev .quote-block:hover .edit-hover-btns { opacity:1; }
.lsnprev .link-card { display:flex; align-items:center; gap:12px; background:#111320; border:1px solid rgba(96,165,250,.25); border-radius:10px; padding:14px 16px; margin-bottom:16px; position:relative; text-decoration:none; }
.lsnprev .link-title { display:block; font-size:13px; font-weight:700; color:#60a5fa; }
.lsnprev .link-caption { display:block; font-size:11.5px; color:#9ca3af; margin-top:2px; }
.lsnprev .link-url { display:block; font-size:10.5px; color:#4b5563; margin-top:2px; word-break:break-all; }
.lsnprev .link-card:hover .edit-hover-btns { opacity:1; }
.lsnprev .img-block { position:relative; text-align:center; margin-bottom:20px; }
.lsnprev .img-block img { max-width:100%; border-radius:10px; border:1px solid rgba(255,255,255,.08); }
.lsnprev .img-caption { font-size:11px; color:#9ca3af; margin-top:6px; }
.lsnprev .img-block:hover .edit-hover-btns { opacity:1; }
/* Add-content type picker */
.lsnprev .add-menu { display:flex; flex-wrap:wrap; gap:6px; margin:4px 0 24px; }
.lsnprev .add-menu-btn { padding:8px 12px; border-radius:8px; border:1px dashed rgba(232,121,249,.35); background:transparent; color:#e879f9; font-size:11.5px; font-weight:600; cursor:pointer; transition:background .15s; }
.lsnprev .add-menu-btn:hover { background:rgba(232,121,249,.06); }
.lsnprev .edit-field-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#9ca3af; margin-bottom:4px; }
`

export function LessonStudentEditor({ topicKey, classId, backHref }: Props) {
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [dirty,   setDirty]   = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [missing, setMissing] = useState(false)
  // True when showing built-in default content (no class-specific copy saved yet)
  const [isDefault, setIsDefault] = useState(false)

  // Lesson data
  const [chapter,   setChapter]   = useState('')
  const [title,     setTitle]     = useState('')
  const [subtitle,  setSubtitle]  = useState('')
  const [theory,    setTheory]    = useState('')
  const [example,   setExample]   = useState('')
  const [keyTerms,  setKeyTerms]  = useState<KeyTerm[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [videos,    setVideos]    = useState<Video[]>([])
  const [extras,    setExtras]    = useState<Extra[]>([])

  // Videos are only persisted once the teacher touches them — otherwise a save
  // would write an empty list and hide the topic's built-in default videos.
  const [videosTouched, setVideosTouched] = useState(false)

  // Per-section edit toggles
  const [editHeader,   setEditHeader]   = useState(false)
  const [editTheory,   setEditTheory]   = useState(false)
  const [editExample,  setEditExample]  = useState(false)
  const [editTermIdx,  setEditTermIdx]  = useState<number | null>(null)
  const [editQIdx,     setEditQIdx]     = useState<number | null>(null)
  const [editVideoIdx, setEditVideoIdx] = useState<number | null>(null)
  const [editExtraIdx, setEditExtraIdx] = useState<number | null>(null)

  // Image upload plumbing — one hidden file input shared by all upload buttons.
  // pickImage() stores where the resulting URL should go, then opens the picker.
  const [uploading, setUploading] = useState(false)
  const fileInputRef   = useRef<HTMLInputElement>(null)
  const uploadTargetRef = useRef<((url: string) => void) | null>(null)

  function pickImage(onDone: (url: string) => void) {
    uploadTargetRef.current = onDone
    fileInputRef.current?.click()
  }

  async function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('classId', classId)
      const res  = await fetch('/api/teacher/upload-image', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      uploadTargetRef.current?.(data.url)
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Upload failed')
    }
    setUploading(false)
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res  = await fetch(`/api/lessons/${topicKey}?classId=${classId}`)
      const data = await res.json()
      let l      = data.lesson

      // No class-specific copy saved — fall back to the built-in lesson that
      // students already see (extracted from the lesson pages into a static
      // JSON). Saving then creates the class's own copy.
      if (!l) {
        try {
          const dres = await fetch('/lessons/default-lessons.json')
          if (dres.ok) {
            const map = await dres.json()
            l = map[topicKey] ?? null
          }
        } catch { /* fall through to missing */ }
        if (!l) { setMissing(true); setLoading(false); return }
        setIsDefault(true)
      }

      setChapter(l.chapter    ?? '')
      setTitle(l.title        ?? '')
      setSubtitle(l.subtitle  ?? '')
      setTheory(l.theory      ?? '')
      setExample(l.example    ?? '')
      setKeyTerms((l.keyTerms  ?? []).map((k: KeyTerm)   => ({ name: k.name ?? '', def: k.def ?? '' })))
      setQuestions((l.questions ?? []).map((q: Question) => ({ stem: q.stem ?? '', marks: q.marks ?? 1, ms: q.ms ?? '', img: q.img })))
      setExtras(Array.isArray(l.extras) ? l.extras : [])
      if (Array.isArray(l.videos)) {
        setVideos(l.videos)
        setVideosTouched(true)   // videos already saved before — keep persisting them
      } else {
        // No custom videos saved — show the built-in defaults students see.
        try {
          const dres = await fetch('/lessons/default-videos.json')
          if (dres.ok) {
            const map = await dres.json() as Record<string, Video[]>
            if (Array.isArray(map[topicKey]) && map[topicKey].length) {
              setVideos(map[topicKey])
              // videosTouched stays false — defaults aren't persisted until edited
            }
          }
        } catch { /* defaults are cosmetic — ignore fetch failures */ }
      }
    } catch {
      setError('Failed to load lesson.')
    }
    setLoading(false)
  }, [topicKey, classId])

  useEffect(() => { load() }, [load])

  // Warn before leaving the page with unsaved changes
  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  function touch() { setDirty(true); setSaved(false) }

  async function save() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/lessons/${topicKey}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          classId, title, subtitle, chapterLabel: chapter,
          content: {
            keyTerms, theory, example, questions, extras,
            ...(videosTouched ? { videos: videos.map(v => ({ ...v, id: ytId(v.id) })) } : {}),
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      setDirty(false)
      setSaved(true)
      setIsDefault(false)   // the class now has its own copy
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Save failed')
    }
    setSaving(false)
  }

  // ── mutations ──────────────────────────────────────────────────────────────
  function updateTerm(i: number, f: keyof KeyTerm, v: string) {
    setKeyTerms(t => t.map((kt, idx) => idx === i ? { ...kt, [f]: v } : kt)); touch()
  }
  function removeTerm(i: number) {
    setKeyTerms(t => t.filter((_, idx) => idx !== i)); setEditTermIdx(null); touch()
  }
  function addTerm() {
    setKeyTerms(t => [...t, { name: '', def: '' }])
    setEditTermIdx(keyTerms.length); touch()
  }
  function updateQ(i: number, f: keyof Question, v: string | number) {
    setQuestions(q => q.map((qt, idx) => idx === i ? { ...qt, [f]: v } : qt)); touch()
  }
  function removeQ(i: number) {
    setQuestions(q => q.filter((_, idx) => idx !== i)); setEditQIdx(null); touch()
  }
  function addQ() {
    setQuestions(q => [...q, { stem: '', marks: 2, ms: '' }])
    setEditQIdx(questions.length); touch()
  }
  function moveQ(i: number, dir: -1 | 1) {
    setQuestions(q => {
      const arr = [...q]; const j = i + dir
      if (j < 0 || j >= arr.length) return arr
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return arr
    })
    setEditQIdx(null); touch()
  }

  // Videos
  function updateVideo(i: number, f: keyof Video, v: string) {
    setVideos(vs => vs.map((vd, idx) => idx === i ? { ...vd, [f]: v } : vd))
    setVideosTouched(true); touch()
  }
  function removeVideo(i: number) {
    setVideos(vs => vs.filter((_, idx) => idx !== i))
    setEditVideoIdx(null); setVideosTouched(true); touch()
  }
  function addVideo() {
    setVideos(vs => [...vs, { id: '', title: '', channel: '' }])
    setEditVideoIdx(videos.length); setVideosTouched(true); touch()
  }

  // Extra content blocks
  function updateExtra(i: number, patch: Partial<Extra>) {
    setExtras(ex => ex.map((e, idx) => idx === i ? { ...e, ...patch } : e)); touch()
  }
  function removeExtra(i: number) {
    setExtras(ex => ex.filter((_, idx) => idx !== i)); setEditExtraIdx(null); touch()
  }
  function addExtra(type: ExtraType) {
    setExtras(ex => [...ex, { type }])
    setEditExtraIdx(extras.length); touch()
  }
  function moveExtra(i: number, dir: -1 | 1) {
    setExtras(ex => {
      const arr = [...ex]; const j = i + dir
      if (j < 0 || j >= arr.length) return arr
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return arr
    })
    setEditExtraIdx(null); touch()
  }

  return (
    <div className="min-h-screen" style={{ background: '#0d0f1a' }}>
      <style dangerouslySetInnerHTML={{ __html: STUDENT_CSS }} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
        style={{ display: 'none' }}
        onChange={handleFileChosen}
      />

      {/* Sticky toolbar (teacher chrome, not part of student view) */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between px-6 py-3"
        style={{ background: 'rgba(19,22,39,.92)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,.08)' }}
      >
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href={backHref}
            className="text-xs font-semibold px-3 py-1.5 rounded-md whitespace-nowrap transition-opacity hover:opacity-80"
            style={{ background: '#1a1d2e', border: '1px solid rgba(255,255,255,.12)', color: '#9ca3af' }}
          >
            ← Back to class
          </Link>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#e879f9' }}>Student View — Editable</p>
            <p className="text-[11px] truncate" style={{ color: '#6b7280' }}>
              {isDefault
                ? 'Built-in lesson — saving creates your class’s own copy · '
                : 'Hover any section to edit · '}
              {topicKey}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {dirty  && <span className="text-[11px] font-semibold" style={{ color: '#fbbf24' }}>● Unsaved changes</span>}
          {saved  && <span className="text-[11px] font-semibold" style={{ color: '#4ade80' }}>✓ Saved</span>}
          {error  && <span className="text-[11px]" style={{ color: '#fb7185' }}>{error}</span>}
          <button
            onClick={save}
            disabled={saving || !dirty}
            className="text-xs font-semibold px-4 py-1.5 rounded-md transition-opacity disabled:opacity-35"
            style={{ background: 'rgba(232,121,249,.15)', border: '1px solid rgba(232,121,249,.4)', color: '#e879f9' }}
          >
            {saving ? 'Saving…' : '💾 Save'}
          </button>
        </div>
      </div>

      {/* Student-view body */}
      <div className="lsnprev mx-auto" style={{ maxWidth: 860, padding: '32px 32px 80px' }}>
        {loading ? (
          <p style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', padding: '80px 0' }}>Loading lesson…</p>
        ) : missing ? (
          <p style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', padding: '80px 0' }}>
            This lesson hasn&apos;t been generated yet — upload a book and generate lessons first.
          </p>
        ) : (
          <>
            {/* ── Header ──────────────────────────────────────────── */}
            <div className="lsn-header" style={{ position: 'relative', marginBottom: 24 }}>
              {!editHeader ? (
                <>
                  <div className="edit-hover-btns">
                    <button className="ehb" title="Edit title" onClick={() => setEditHeader(true)}>✏️</button>
                  </div>
                  <div style={{ marginBottom: 8 }}><span className="topic-chapter-badge">{chapter || 'Chapter'}</span></div>
                  <div className="topic-title">{title || topicKey}</div>
                  <div className="topic-subtitle">{subtitle}</div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input className="edit-field" value={chapter} onChange={e => { setChapter(e.target.value); touch() }} placeholder="Chapter label" />
                  <input className="edit-field" value={title} onChange={e => { setTitle(e.target.value); touch() }} placeholder="Topic title" style={{ fontSize: 16, fontWeight: 700 }} />
                  <input className="edit-field" value={subtitle} onChange={e => { setSubtitle(e.target.value); touch() }} placeholder="Subtitle" />
                  <div className="sec-actions">
                    <button className="sec-btn primary" onClick={() => setEditHeader(false)}>Done</button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Videos ──────────────────────────────────────────── */}
            <div style={{ marginBottom: 20 }}>
              <div className="video-section-label">🎬 Watch &amp; Learn</div>
              {videos.length === 0 ? (
                <p style={{ fontSize: 11.5, color: '#6b7280', marginBottom: 8 }}>
                  No videos on this topic yet — add one below.
                </p>
              ) : !videosTouched && (
                <p style={{ fontSize: 11.5, color: '#6b7280', marginBottom: 8 }}>
                  These are the <strong style={{ color: '#9ca3af' }}>built-in default videos</strong> students
                  already see. Edit, remove or add to customise — your version then replaces the defaults for this topic.
                </p>
              )}
              {videos.map((v, i) => (
                <div key={i} className="video-card">
                  {editVideoIdx === i ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div>
                        <div className="edit-field-label">YouTube URL or video ID</div>
                        <input className="edit-field" value={v.id} onChange={e => updateVideo(i, 'id', e.target.value)} placeholder="https://www.youtube.com/watch?v=… or dQw4w9WgXcQ" />
                      </div>
                      <input className="edit-field" value={v.title} onChange={e => updateVideo(i, 'title', e.target.value)} placeholder="Video title" />
                      <input className="edit-field" value={v.channel ?? ''} onChange={e => updateVideo(i, 'channel', e.target.value)} placeholder="Channel name (optional)" />
                      <div className="sec-actions">
                        <button className="sec-btn primary" onClick={() => setEditVideoIdx(null)}>Done</button>
                        <button className="sec-btn" onClick={() => removeVideo(i)}>Delete</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="edit-hover-btns">
                        <button className="ehb" title="Edit video" onClick={() => setEditVideoIdx(i)}>✏️</button>
                        <button className="ehb danger" title="Remove video" onClick={() => removeVideo(i)}>×</button>
                      </div>
                      <div className="video-card-meta">
                        ▶ <strong>{v.title || 'Untitled video'}</strong>{' '}
                        <span className="video-card-channel">{v.channel}</span>
                      </div>
                      {ytId(v.id) ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${ytId(v.id)}?rel=0&modestbranding=1&playsinline=1`}
                          title={v.title || 'Video'}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                          loading="lazy"
                        />
                      ) : (
                        <p style={{ fontSize: 11.5, color: '#6b7280' }}>No video URL yet — hover and click ✏️ to add one.</p>
                      )}
                    </>
                  )}
                </div>
              ))}
              <button className="add-btn" onClick={addVideo}>+ Add video (YouTube)</button>
            </div>

            {/* ── Key Terms ───────────────────────────────────────── */}
            <div className="section-label">Key Terms</div>
            <div className="key-terms-grid">
              {keyTerms.map((kt, i) => (
                <div key={i} className="key-term-card">
                  {editTermIdx === i ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <input className="edit-field" value={kt.name} onChange={e => updateTerm(i, 'name', e.target.value)} placeholder="Term" style={{ fontSize: 12, fontWeight: 700 }} />
                      <textarea className="edit-field" rows={3} value={kt.def} onChange={e => updateTerm(i, 'def', e.target.value)} placeholder="Definition" style={{ fontSize: 11.5, resize: 'vertical' }} />
                      <div className="sec-actions">
                        <button className="sec-btn primary" onClick={() => setEditTermIdx(null)}>Done</button>
                        <button className="sec-btn" onClick={() => removeTerm(i)}>Delete</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="edit-hover-btns">
                        <button className="ehb" title="Edit term" onClick={() => setEditTermIdx(i)}>✏️</button>
                        <button className="ehb danger" title="Delete term" onClick={() => removeTerm(i)}>×</button>
                      </div>
                      <div className="key-term-name">{kt.name || <em style={{ color: '#4b5563' }}>New term</em>}</div>
                      <div className="key-term-def">{kt.def}</div>
                    </>
                  )}
                </div>
              ))}
              <button className="add-btn" onClick={addTerm}>+ Add key term</button>
            </div>

            {/* ── Theory ──────────────────────────────────────────── */}
            <div className="flow-divider">
              <div className="flow-divider-line" />
              <div className="flow-divider-label">📚 Theory</div>
              <div className="flow-divider-line" />
            </div>
            {editTheory ? (
              <div style={{ marginBottom: 16 }}>
                <textarea
                  className="edit-field mono"
                  rows={20}
                  value={theory}
                  onChange={e => { setTheory(e.target.value); touch() }}
                  placeholder="Theory HTML — <p>, <pre>, <ul>, <strong>, <code>…"
                />
                <div className="sec-actions">
                  <button className="sec-btn primary" onClick={() => setEditTheory(false)}>Done — show preview</button>
                </div>
              </div>
            ) : (
              <div className="theory-block">
                <div className="edit-hover-btns">
                  <button className="ehb" title="Edit theory" onClick={() => setEditTheory(true)}>✏️</button>
                </div>
                <div dangerouslySetInnerHTML={{ __html: theory || '<p style="color:#6b7280;">No theory yet — hover and click ✏️ to write some.</p>' }} />
              </div>
            )}

            {/* ── Worked Example ──────────────────────────────────── */}
            <div className="flow-divider">
              <div className="flow-divider-line" />
              <div className="flow-divider-label">💡 Worked Example</div>
              <div className="flow-divider-line" />
            </div>
            {editExample ? (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                  <button
                    className="sec-btn"
                    disabled={uploading}
                    onClick={() => pickImage(url => {
                      setExample(x => (x ? x + '\n' : '') + `<img src="${url}" alt="" style="max-width:100%;border-radius:8px;margin:10px 0;" />`)
                      touch()
                    })}
                  >
                    {uploading ? 'Uploading…' : '📤 Insert image (upload)'}
                  </button>
                  <button
                    className="sec-btn"
                    onClick={() => {
                      const u = window.prompt('Image / GIF URL:')
                      if (!u) return
                      setExample(x => (x ? x + '\n' : '') + `<img src="${u}" alt="" style="max-width:100%;border-radius:8px;margin:10px 0;" />`)
                      touch()
                    }}
                  >
                    🖼 Insert image URL
                  </button>
                  <button
                    className="sec-btn"
                    onClick={() => {
                      const u = window.prompt('YouTube URL or video ID:')
                      if (!u) return
                      const id = ytId(u)
                      setExample(x => (x ? x + '\n' : '') + `<div style="margin:10px 0;"><iframe src="https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1" style="width:100%;aspect-ratio:16/9;border:0;border-radius:8px;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe></div>`)
                      touch()
                    }}
                  >
                    🎬 Insert video
                  </button>
                </div>
                <textarea
                  className="edit-field mono"
                  rows={12}
                  value={example}
                  onChange={e => { setExample(e.target.value); touch() }}
                  placeholder="Worked example HTML…"
                />
                <div className="sec-actions">
                  <button className="sec-btn primary" onClick={() => setEditExample(false)}>Done — show preview</button>
                </div>
              </div>
            ) : (
              <div className="example-block">
                <div className="edit-hover-btns">
                  <button className="ehb" title="Edit example" onClick={() => setEditExample(true)}>✏️</button>
                </div>
                <div className="example-block-title">Worked Example</div>
                <div dangerouslySetInnerHTML={{ __html: example || '<p style="color:#6b7280;">No worked example yet — hover and click ✏️ to write one.</p>' }} />
              </div>
            )}

            {/* ── Teacher-added content blocks ────────────────────── */}
            {extras.map((ex, i) => {
              const hoverBtns = (
                <div className="edit-hover-btns">
                  <button className="ehb" title="Move up" onClick={() => moveExtra(i, -1)} disabled={i === 0} style={i === 0 ? { opacity: .3 } : undefined}>↑</button>
                  <button className="ehb" title="Move down" onClick={() => moveExtra(i, 1)} disabled={i === extras.length - 1} style={i === extras.length - 1 ? { opacity: .3 } : undefined}>↓</button>
                  <button className="ehb" title="Edit block" onClick={() => setEditExtraIdx(i)}>✏️</button>
                  <button className="ehb danger" title="Delete block" onClick={() => removeExtra(i)}>×</button>
                </div>
              )

              if (editExtraIdx === i) {
                return (
                  <div key={i} className="theory-block" style={{ borderColor: 'rgba(232,121,249,.35)' }}>
                    <div className="edit-field-label" style={{ marginBottom: 8 }}>{EXTRA_LABELS[ex.type]}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(ex.type === 'image' || ex.type === 'link') && (
                        <div>
                          <div className="edit-field-label">{ex.type === 'image' ? 'Image / GIF' : 'Link URL'}</div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <input className="edit-field" value={ex.url ?? ''} onChange={e => updateExtra(i, { url: e.target.value })} placeholder="https://…" style={{ flex: 1 }} />
                            {ex.type === 'image' && (
                              <button className="sec-btn primary" disabled={uploading} onClick={() => pickImage(url => updateExtra(i, { url }))} style={{ whiteSpace: 'nowrap' }}>
                                {uploading ? 'Uploading…' : '📤 Upload'}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      {ex.type !== 'image' && (
                        <div>
                          <div className="edit-field-label">{ex.type === 'quote' ? 'Source / reference (e.g. Langfield & Duddell, Ch. 13.08)' : 'Title'}</div>
                          <input className="edit-field" value={ex.title ?? ''} onChange={e => updateExtra(i, { title: e.target.value })} placeholder={ex.type === 'quote' ? 'Book / website / paper this comes from' : 'Block title'} />
                        </div>
                      )}
                      {(ex.type === 'image' || ex.type === 'link') && (
                        <div>
                          <div className="edit-field-label">Caption / description (optional)</div>
                          <input className="edit-field" value={ex.caption ?? ''} onChange={e => updateExtra(i, { caption: e.target.value })} placeholder="Shown under the block" />
                        </div>
                      )}
                      {ex.type === 'quote' && (
                        <div>
                          <div className="edit-field-label">Source link (optional)</div>
                          <input className="edit-field" value={ex.url ?? ''} onChange={e => updateExtra(i, { url: e.target.value })} placeholder="https://… (leave empty if from a book)" />
                        </div>
                      )}
                      {(ex.type === 'example' || ex.type === 'note' || ex.type === 'quote' || ex.type === 'html') && (
                        <div>
                          <div className="edit-field-label">{ex.type === 'quote' ? 'Quoted text' : 'Content (HTML supported)'}</div>
                          <textarea className="edit-field mono" rows={ex.type === 'note' ? 5 : 8} value={ex.html ?? ''} onChange={e => updateExtra(i, { html: e.target.value })} placeholder={ex.type === 'quote' ? 'The exact text being quoted…' : '<p>…</p>, <pre>…</pre>, <strong>…</strong>'} />
                        </div>
                      )}
                      <div className="sec-actions">
                        <button className="sec-btn primary" onClick={() => setEditExtraIdx(null)}>Done — show preview</button>
                        <button className="sec-btn" onClick={() => removeExtra(i)}>Delete block</button>
                      </div>
                    </div>
                  </div>
                )
              }

              // Display mode — rendered exactly like the student page
              if (ex.type === 'image') return (
                <div key={i} className="img-block">
                  {hoverBtns}
                  {ex.url
                    ? <img src={ex.url} alt={ex.caption || ''} loading="lazy" />
                    : <p style={{ fontSize: 11.5, color: '#6b7280' }}>No image URL yet — hover and click ✏️.</p>}
                  {ex.caption && <div className="img-caption">{ex.caption}</div>}
                </div>
              )
              if (ex.type === 'note') return (
                <div key={i} className="note-block">
                  {hoverBtns}
                  <div className="note-block-title">{ex.title || '📌 Note'}</div>
                  <div className="nb-body" dangerouslySetInnerHTML={{ __html: ex.html || '<p style="color:#6b7280;">Empty note — hover and click ✏️.</p>' }} />
                </div>
              )
              if (ex.type === 'quote') return (
                <div key={i} className="quote-block">
                  {hoverBtns}
                  <div className="quote-body" dangerouslySetInnerHTML={{ __html: ex.html || '<p style="color:#6b7280;">Empty quote — hover and click ✏️.</p>' }} />
                  <div className="quote-ref">
                    — {ex.title || 'Source'}
                    {ex.url && <> · <a href={ex.url} target="_blank" rel="noopener noreferrer">{ex.caption || 'view source'}</a></>}
                  </div>
                </div>
              )
              if (ex.type === 'link') return (
                <div key={i} className="link-card">
                  {hoverBtns}
                  <span style={{ fontSize: 18 }}>🔗</span>
                  <span style={{ minWidth: 0 }}>
                    <span className="link-title">{ex.title || ex.url || 'Resource link'}</span>
                    {ex.caption && <span className="link-caption">{ex.caption}</span>}
                    <span className="link-url">{ex.url}</span>
                  </span>
                </div>
              )
              if (ex.type === 'example') return (
                <div key={i} className="example-block">
                  {hoverBtns}
                  <div className="example-block-title">{ex.title || 'Worked Example'}</div>
                  <div dangerouslySetInnerHTML={{ __html: ex.html || '<p style="color:#6b7280;">Empty example — hover and click ✏️.</p>' }} />
                </div>
              )
              return (
                <div key={i} className="theory-block">
                  {hoverBtns}
                  {ex.title && <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>{ex.title}</div>}
                  <div dangerouslySetInnerHTML={{ __html: ex.html || '<p style="color:#6b7280;">Empty section — hover and click ✏️.</p>' }} />
                </div>
              )
            })}

            {/* ── Add content picker ──────────────────────────────── */}
            <div className="section-label" style={{ marginTop: 8 }}>Add content to this lesson</div>
            <div className="add-menu">
              {(Object.keys(EXTRA_LABELS) as ExtraType[]).map(t => (
                <button key={t} className="add-menu-btn" onClick={() => addExtra(t)}>+ {EXTRA_LABELS[t]}</button>
              ))}
              <button className="add-menu-btn" onClick={addQ}>+ ✏️ Practice question</button>
            </div>

            {/* ── Practice Questions ──────────────────────────────── */}
            <div className="flow-divider">
              <div className="flow-divider-line" />
              <div className="flow-divider-label">✏️ Practice</div>
              <div className="flow-divider-line" />
            </div>
            {questions.map((q, i) => (
              <div key={i} className="question-card">
                {editQIdx === i ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <textarea className="edit-field" rows={3} value={q.stem} onChange={e => updateQ(i, 'stem', e.target.value)} placeholder="Question stem…" style={{ resize: 'vertical' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>Marks</span>
                      <input
                        type="number" min={1} max={20}
                        className="edit-field"
                        value={q.marks}
                        onChange={e => updateQ(i, 'marks', parseInt(e.target.value) || 1)}
                        style={{ width: 64, textAlign: 'center', fontSize: 12 }}
                      />
                    </div>
                    <div>
                      <div className="edit-field-label">Image / figure (optional — shown under the question)</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input className="edit-field" value={q.img ?? ''} onChange={e => updateQ(i, 'img', e.target.value)} placeholder="https://… (image or GIF)" style={{ flex: 1 }} />
                        <button className="sec-btn primary" disabled={uploading} onClick={() => pickImage(url => updateQ(i, 'img', url))} style={{ whiteSpace: 'nowrap' }}>
                          {uploading ? 'Uploading…' : '📤 Upload'}
                        </button>
                        {q.img && <button className="sec-btn" onClick={() => updateQ(i, 'img', '')}>Remove</button>}
                      </div>
                    </div>
                    <textarea className="edit-field mono" rows={4} value={q.ms} onChange={e => updateQ(i, 'ms', e.target.value)} placeholder="Mark scheme…" />
                    <div className="sec-actions">
                      <button className="sec-btn primary" onClick={() => setEditQIdx(null)}>Done</button>
                      <button className="sec-btn" onClick={() => removeQ(i)}>Delete question</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="edit-hover-btns">
                      <button className="ehb" title="Move up" onClick={() => moveQ(i, -1)} disabled={i === 0} style={i === 0 ? { opacity: .3 } : undefined}>↑</button>
                      <button className="ehb" title="Move down" onClick={() => moveQ(i, 1)} disabled={i === questions.length - 1} style={i === questions.length - 1 ? { opacity: .3 } : undefined}>↓</button>
                      <button className="ehb" title="Edit question" onClick={() => setEditQIdx(i)}>✏️</button>
                      <button className="ehb danger" title="Delete question" onClick={() => removeQ(i)}>×</button>
                    </div>
                    <div className="question-card-header">
                      <div className="q-number-badge">Q{i + 1}</div>
                      <div className="q-stem">
                        <span dangerouslySetInnerHTML={{ __html: q.stem || '<em style="color:#4b5563">New question — hover and click ✏️</em>' }} />
                        <span className="q-marks">[{q.marks} mark{q.marks !== 1 ? 's' : ''}]</span>
                      </div>
                    </div>
                    {q.img && (
                      <div style={{ marginBottom: 12, textAlign: 'center' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={q.img} alt={`Question ${i + 1} figure`} loading="lazy" style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid rgba(255,255,255,.08)' }} />
                      </div>
                    )}
                    <textarea className="q-textarea" rows={2} placeholder="Your answer…" disabled />
                    <div className="mark-scheme">
                      <div className="ms-title">Mark Scheme <span style={{ color: '#4b5563', fontWeight: 400, textTransform: 'none' }}>(hidden from students until they check)</span></div>
                      <div className="ms-body" dangerouslySetInnerHTML={{ __html: q.ms }} />
                    </div>
                  </>
                )}
              </div>
            ))}
            <button className="add-btn" onClick={addQ} style={{ marginBottom: 24 }}>+ Add practice question</button>
          </>
        )}
      </div>
    </div>
  )
}
