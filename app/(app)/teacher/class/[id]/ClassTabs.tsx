'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
// useRef kept — used by ExercisesTab if needed; useRouter used by ExercisesTab
import { clsx } from 'clsx'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { InviteModal } from '@/components/teacher/InviteModal'
import { BookLessonsPanel } from '@/components/teacher/BookLessonsPanel'
import { PastPapersPanel } from '@/components/teacher/PastPapersPanel'
import { G9MissionsPanel } from '@/components/teacher/G9MissionsPanel'
import {
  UserIcon, BookIcon, ZapIcon, ChartBarIcon,
  FlameIcon, ArrowRightIcon,
} from '@/components/ui/Icons'
import type { ClassType, SyllabusUnit } from '@/lib/class-types'
import type { Profile, ConceptMastery, Topic } from '@/types'

interface StudentData {
  student:       Profile
  masteries:     Record<string, ConceptMastery>
  masteredCount: number
  lastActive:    string | null
  progressSummary: {
    attempts: number
    completed: number
    passed: number
    avgScore: number | null
    lastSubmitted: string | null
  }
  recentProgress: {
    student_id: string
    exercise_id: string | null
    completed: boolean
    score: number | null
    passed: boolean
    submitted_at: string
  }[]
}

interface ClassTabsProps {
  cls:             { id: string; name: string; join_code: string; description: string; auto_accept?: boolean }
  classType:       ClassType
  studentData:     StudentData[]
  topics:          Topic[]
  draftExercises:  { id: string; title: string; type: string; difficulty: number; draft_status: string; created_at: string }[]
  teacherId:       string
}

type Tab = 'students' | 'lessons' | 'resources' | 'exercises' | 'settings'

// ── Exam paper styles ─────────────────────────────────────────────────────────
const PAPER_STYLES = [
  { id: 'practice',    label: 'Practice',    desc: 'Standard questions for understanding'   },
  { id: 'exam-style',  label: 'Exam Style',  desc: 'Similar to past paper questions'        },
  { id: 'challenging', label: 'Challenging', desc: 'Harder than exam — stretch questions'   },
]

export function ClassTabs({ cls, classType, studentData, topics, draftExercises, teacherId }: ClassTabsProps) {
  const [tab, setTab] = useState<Tab>('students')
  const [showInvite, setShowInvite] = useState(false)

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'students',  label: 'Students',       icon: <UserIcon     size={13} /> },
    { id: 'lessons',   label: '📚 Book Lessons', icon: null },
    { id: 'resources', label: 'Resources',       icon: <BookIcon     size={13} /> },
    { id: 'exercises', label: 'Exercises',       icon: <ZapIcon      size={13} /> },
    { id: 'settings',  label: 'Settings',        icon: <ChartBarIcon size={13} /> },
  ]

  return (
    <>
      <InviteModal
        open={showInvite}
        onClose={() => setShowInvite(false)}
        classId={cls.id}
        className={cls.name}
        joinCode={cls.join_code}
      />

      {/* Tab bar */}
      <div className="flex items-center gap-0.5 border-b border-b2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              tab === t.id ? 'border-accent text-accent' : 'border-transparent text-fg-dim hover:text-fg'
            )}>
            {t.icon && <span className={tab === t.id ? 'text-accent' : 'text-fg-faint'}>{t.icon}</span>}
            {t.label}
          </button>
        ))}
        <div className="flex-1" />
        <Button size="sm" variant="ghost" onClick={() => setShowInvite(true)} className="mb-1">
          Invite students
        </Button>
      </div>

      {/* ── Students tab ─────────────────────────────────────────────────── */}
      {tab === 'students' && (
        <StudentsTab studentData={studentData} classType={classType} />
      )}

      {/* ── Book Lessons tab ─────────────────────────────────────────────── */}
      {tab === 'lessons' && (
        <div className="pt-4">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-fg">Book Lessons</h2>
            <p className="text-sm text-fg-dim mt-0.5">
              Upload a Cambridge textbook PDF — ByteForge reads each chapter and auto-generates
              structured lessons (key terms, theory, worked examples, exam questions) for
              <strong className="text-fg"> AS Level &amp; A Level</strong> students in this class.
            </p>
          </div>
          <BookLessonsPanel classId={cls.id} className={cls.name} teacherId={teacherId} isALevel={classType.id === 'a-level'} />
        </div>
      )}

      {/* ── Resources tab ────────────────────────────────────────────────── */}
      {tab === 'resources' && (
        <ResourcesTab cls={cls} classType={classType} topics={topics} teacherId={teacherId} />
      )}

      {/* ── Exercises tab ────────────────────────────────────────────────── */}
      {tab === 'exercises' && (
        <div className="pt-4 space-y-6">
          {classType.id === 'a-level' && (
            <div className="card p-5 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="font-semibold text-fg text-sm">🧪 Code Lab — the student view, editable</h3>
                <p className="text-xs text-fg-dim mt-1 max-w-xl">
                  Opens the exact Code Lab your students use. Browse every exercise as they see it,
                  then use ✏️ Edit / ➕ Add in the toolbar — changes apply to this class only.
                </p>
              </div>
              <a
                href={`/lessons/a-level.html?classId=${cls.id}&teacher=1#codelab`}
                target="_blank" rel="noopener noreferrer"
                className="text-xs font-semibold px-4 py-2 rounded-md bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors whitespace-nowrap"
              >
                Open as student →
              </a>
            </div>
          )}
          {classType.id === 'grade9' && <G9MissionsPanel classId={cls.id} />}
          <ExercisesTab
            cls={cls}
            classType={classType}
            topics={topics}
            draftExercises={draftExercises}
            teacherId={teacherId}
          />
        </div>
      )}

      {/* ── Settings tab ─────────────────────────────────────────────────── */}
      {tab === 'settings' && (
        <SettingsTab cls={cls} classType={classType} onInvite={() => setShowInvite(true)} />
      )}
    </>
  )
}

// ── Students Tab ──────────────────────────────────────────────────────────────

function StudentsTab({ studentData, classType }: { studentData: StudentData[]; classType: ClassType }) {
  const [selected, setSelected] = useState<StudentData | null>(null)

  if (studentData.length === 0) {
    return (
      <Card className="p-10 text-center">
        <div className="flex justify-center mb-3"><UserIcon size={32} strokeWidth={1.4} className="text-fg-faint" /></div>
        <p className="text-fg font-semibold">No students yet</p>
        <p className="text-fg-dim text-sm mt-1">Share the join code or use "Invite Students" to add them.</p>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Student list */}
      <div className="lg:col-span-1 space-y-2">
        {studentData.map(s => (
          <button
            key={s.student.id}
            onClick={() => setSelected(s)}
            className={clsx(
              'w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
              selected?.student.id === s.student.id
                ? 'border-accent bg-accent/5'
                : 'border-b2 bg-s1 hover:border-b3'
            )}
          >
            <Avatar name={s.student.name} avatarUrl={s.student.avatar_url} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-fg truncate">{s.student.name}</p>
              <p className="text-xs text-fg-faint">
                {s.masteredCount} mastered - {s.progressSummary.completed} completed
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-semibold text-accent">{s.student.xp.toLocaleString()} XP</p>
              {s.student.streak > 0 && (
                <p className="text-[10px] text-orange flex items-center gap-0.5"><FlameIcon size={9} strokeWidth={2} />{s.student.streak}d</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Student detail */}
      <div className="lg:col-span-2">
        {selected ? (
          <StudentDetail data={selected} />
        ) : (
          <Card className="h-full flex items-center justify-center text-fg-faint text-sm">
            ← Select a student to view their progress
          </Card>
        )}
      </div>
    </div>
  )
}

function StudentDetail({ data }: { data: StudentData }) {
  const { student, masteries, masteredCount, progressSummary, recentProgress } = data
  const totalAttempts = Object.values(masteries).reduce((s, m) => s + m.attempts, 0)
  const avgAccuracy   = totalAttempts > 0
    ? Math.round(Object.values(masteries).reduce((s, m) => s + (m.correct_attempts / Math.max(1, m.attempts)) * 100, 0) / Object.values(masteries).filter(m => m.attempts > 0).length)
    : 0

  const recentConcepts = Object.values(masteries)
    .filter(m => m.last_practiced)
    .sort((a, b) => new Date(b.last_practiced!).getTime() - new Date(a.last_practiced!).getTime())
    .slice(0, 5)

  const struggling = Object.values(masteries)
    .filter(m => m.attempts >= 2 && m.mastery_score < 50)
    .sort((a, b) => a.mastery_score - b.mastery_score)
    .slice(0, 3)

  return (
    <div className="space-y-4">
      {/* Profile header */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Avatar name={student.name} avatarUrl={student.avatar_url} size="lg" />
          <div className="flex-1">
            <h3 className="font-semibold text-fg text-lg">{student.name}</h3>
            <p className="text-sm text-fg-dim">{student.email}</p>
          </div>
          <div className="grid grid-cols-4 gap-3 text-center">
            {[
              { label:'Level',    value: student.level },
              { label:'XP',       value: student.xp.toLocaleString() },
              { label:'Streak',   value: `${student.streak}d` },
              { label:'Done',     value: progressSummary.completed },
            ].map(s => (
              <div key={s.label}>
                <p className="text-lg font-bold text-fg">{s.value}</p>
                <p className="text-[10px] text-fg-faint">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* XP bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-fg-faint mb-1">
            <span>{masteredCount} / 42 concepts mastered</span>
            <span>
              {progressSummary.attempts || totalAttempts} attempts - {progressSummary.avgScore ?? avgAccuracy}% avg score
            </span>
          </div>
          <div className="h-2 bg-s2 rounded-full overflow-hidden">
            <div className="h-full bg-green rounded-full" style={{ width: `${(masteredCount / 42) * 100}%` }} />
          </div>
        </div>
      </Card>

      {/* Exercise progress */}
      {recentProgress.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Recent Exercise Progress</CardTitle></CardHeader>
          <div className="space-y-2">
            {recentProgress.map((row, index) => (
              <div key={`${row.exercise_id ?? 'lesson'}-${row.submitted_at}-${index}`} className="flex items-center gap-3 text-sm">
                <div className="flex-1">
                  <p className="text-fg">Attempt {index + 1}</p>
                  <p className="text-xs text-fg-faint">
                    {new Date(row.submitted_at).toLocaleDateString()} - {row.score ?? 0}% score
                  </p>
                </div>
                <Badge variant={row.passed ? 'green' : row.completed ? 'blue' : 'orange'} size="sm" dot>
                  {row.passed ? 'Passed' : row.completed ? 'Completed' : 'Attempted'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Struggling concepts */}
      {struggling.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Needs Help</CardTitle></CardHeader>
          <div className="space-y-2">
            {struggling.map(m => (
              <div key={m.concept_id} className="flex items-center gap-3 text-sm">
                <div className="flex-1">
                  <p className="text-fg">{m.concept_id.replace(/-/g,' ')}</p>
                  <p className="text-xs text-fg-faint">{m.attempts} attempts · {m.mastery_score}% mastery</p>
                </div>
                <div className="w-20 h-1.5 bg-s2 rounded-full overflow-hidden">
                  <div className="h-full bg-red rounded-full" style={{ width: `${m.mastery_score}%` }} />
                </div>
                <span className="text-xs text-red w-8 text-right">{m.mastery_score}%</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent activity */}
      {recentConcepts.length > 0 && (
        <Card>
          <CardHeader><CardTitle>📅 Recent Activity</CardTitle></CardHeader>
          <div className="space-y-2">
            {recentConcepts.map(m => (
              <div key={m.concept_id} className="flex items-center gap-3 text-sm">
                <div className="flex-1">
                  <p className="text-fg capitalize">{m.concept_id.replace(/-/g,' ')}</p>
                  <p className="text-xs text-fg-faint">
                    {new Date(m.last_practiced!).toLocaleDateString()} · {m.attempts} attempt{m.attempts !== 1 ? 's' : ''}
                  </p>
                </div>
                <Badge
                  variant={m.status as any}
                  size="sm" dot
                >{m.status}</Badge>
                <span className="text-xs font-medium w-10 text-right" style={{
                  color: m.mastery_score >= 85 ? 'var(--green)' : m.mastery_score >= 60 ? 'var(--blue)' : 'var(--yellow)'
                }}>
                  {m.mastery_score}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// ── Resources Tab ─────────────────────────────────────────────────────────────

function ResourcesTab({ cls, classType, topics }: {
  cls: { id: string; name: string }
  classType: ClassType
  topics: Topic[]
  teacherId: string
}) {
  return (
    <div className="space-y-6">

      {/* Syllabus units */}
      {classType.syllabus.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{classType.label} Syllabus</CardTitle>
            <Badge variant="accent" size="sm">{classType.syllabus.length} units</Badge>
          </CardHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {classType.syllabus.map((unit: SyllabusUnit) => (
              <div key={unit.unit} className="p-3 rounded-lg bg-s2 border border-b2">
                <p className="text-xs text-fg-faint mb-0.5">Unit {unit.unit}</p>
                <p className="text-sm font-semibold text-fg">{unit.title}</p>
                <p className="text-xs text-fg-dim mt-1 truncate">{unit.topics.slice(0,4).join(' · ')}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Resource suggestions */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Suggestions</CardTitle>
          <Badge variant="accent" size="sm">{classType.shortLabel}</Badge>
        </CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {classType.resourceSuggestions.map((resource: string) => (
            <div key={resource} className="p-3 rounded-lg bg-s2 border border-b2 text-sm text-fg-dim">
              {resource}
            </div>
          ))}
        </div>
      </Card>

      {/* Extracted topics (from previous uploads) */}
      {topics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📌 Extracted Topics</CardTitle>
            <Badge variant="accent" size="sm">{topics.length} topics</Badge>
          </CardHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {topics.map(t => (
              <div key={t.id} className="p-2.5 rounded-lg bg-s2 border border-b2">
                <p className="text-sm font-medium text-fg truncate">{t.name}</p>
                {t.description && (
                  <p className="text-xs text-fg-faint mt-0.5 truncate">{t.description}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Past Papers ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>📝 Past Papers</CardTitle>
          <Badge variant="accent" size="sm">AI-marked</Badge>
        </CardHeader>
        <PastPapersPanel classId={cls.id} />
      </Card>

      {/* Nudge toward the Book Lessons tab */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-accent/5 border border-accent/20 text-sm text-fg-dim">
        <span className="text-base">📚</span>
        <span>
          To upload a textbook and auto-generate lessons for your students, use the{' '}
          <strong className="text-accent">Book Lessons</strong> tab.
        </span>
      </div>
    </div>
  )
}

// ── Exercises Tab ─────────────────────────────────────────────────────────────

function ExercisesTab({ cls, classType, topics, draftExercises, teacherId }: {
  cls:            { id: string; name: string }
  classType:      ClassType
  topics:         Topic[]
  draftExercises: { id: string; title: string; type: string; difficulty: number; draft_status: string; created_at: string }[]
  teacherId:      string
}) {
  const { toast }  = useToast()
  const router     = useRouter()

  // Source for generation: syllabus unit or extracted topic
  const [sourceType,  setSourceType]  = useState<'syllabus' | 'topic'>('syllabus')
  const [startUnitIdx,setStartUnitIdx]= useState(0)
  const [endUnitIdx,  setEndUnitIdx]  = useState(0)
  const [topicId,     setTopicId]     = useState(topics[0]?.id ?? '')
  const [paper,       setPaper]       = useState(classType.papers[0]?.id ?? 'p1')
  const [style,       setStyle]       = useState('practice')
  const [difficulty,  setDifficulty]  = useState<1|2|3|4>(2)
  const [count,       setCount]       = useState(5)
  const [loading,     setLoading]     = useState(false)
  const [generated,   setGenerated]   = useState<{ id?: string; title: string; description: string; difficulty: number; xp_reward: number; type: string; config: Record<string, unknown> }[]>([])
  const [selected,    setSelected]    = useState<Set<number>>(new Set())
  const [saving,      setSaving]      = useState(false)

  const rangeStart = Math.min(startUnitIdx, endUnitIdx)
  const rangeEnd = Math.max(startUnitIdx, endUnitIdx)
  const selectedUnits = classType.syllabus.slice(rangeStart, rangeEnd + 1)
  const selectedUnit = selectedUnits[0]
  const selectedUnitTitle = selectedUnits.length === 1 && selectedUnit
    ? `${classType.shortLabel} Unit ${selectedUnit.unit}: ${selectedUnit.title}`
    : selectedUnits.map(unit => `${classType.shortLabel} Unit ${unit.unit}: ${unit.title}`).join(' to ')
  const topicName = sourceType === 'syllabus'
    ? selectedUnitTitle
    : (topics.find(t => t.id === topicId)?.name ?? '')

  const paperLabel = classType.papers.find(p => p.id === paper)
  const syllabusRef = sourceType === 'syllabus'
    ? `class:${cls.id}:syllabus:${classType.id}:${paper}:units-${selectedUnits.map(unit => unit.unit).join('-')}`
    : `class:${cls.id}:topic:${topicId || 'uploaded'}:${paper}`

  async function handleGenerate() {
    if (!topicName) { toast.error('Select a syllabus unit or uploaded topic first'); return }
    setLoading(true)
    setGenerated([])
    setSelected(new Set())

    try {
      const res = await fetch('/api/generate/exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic_name:  topicName,
          topic_id:    sourceType === 'topic' ? topicId : null,
          class_type:  classType.id,
          paper:       paperLabel?.label ?? 'Paper 1',
          paper_style: style,
          difficulty,
          count,
          class_id:    cls.id,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      setGenerated(data.exercises)
      toast.success(`Generated ${data.exercises.length} exercises!`)
    } catch (err: unknown) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove() {
    if (selected.size === 0) { toast.error('Select at least one exercise'); return }
    setSaving(true)
    const toSave = generated.filter((_, i) => selected.has(i))
    const res = await fetch('/api/generate/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exercises: toSave,
        topic_id: sourceType === 'topic' ? topicId : null,
        class_id: cls.id,
        syllabus_ref: syllabusRef,
      }),
    })
    setSaving(false)
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Save failed'); return }
    toast.success(`Saved ${data.count} exercises as drafts`)
    setGenerated([])
    setSelected(new Set())
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Generation config */}
      <Card>
        <CardHeader><CardTitle>Generate Exercises with AI</CardTitle></CardHeader>

        <div className="space-y-4">
          {/* Source: syllabus unit or uploaded topic */}
          <div className="flex gap-2">
            <button onClick={() => setSourceType('syllabus')}
              className={clsx('flex-1 py-2 rounded-lg text-sm border transition-colors',
                sourceType === 'syllabus' ? 'border-accent bg-accent/10 text-accent' : 'border-b2 text-fg-dim hover:text-fg')}>
              Syllabus Unit
            </button>
            <button onClick={() => setSourceType('topic')}
              disabled={topics.length === 0}
              className={clsx('flex-1 py-2 rounded-lg text-sm border transition-colors disabled:opacity-40',
                sourceType === 'topic' ? 'border-accent bg-accent/10 text-accent' : 'border-b2 text-fg-dim hover:text-fg')}>
              📌 Uploaded Topic
            </button>
          </div>

          {/* Topic/Unit picker */}
          {sourceType === 'syllabus' && classType.syllabus.length > 0 && (
            <div>
              <label className="block text-xs text-fg-dim mb-1.5">From chapter</label>
              <select value={startUnitIdx} onChange={e => {
                const next = Number(e.target.value)
                setStartUnitIdx(next)
                if (next > endUnitIdx) setEndUnitIdx(next)
              }}
                className="w-full h-10 px-3 rounded-lg bg-s2 border border-b2 text-fg text-sm focus:border-accent focus:outline-none">
                {classType.syllabus.map((u, i) => (
                  <option key={u.unit} value={i}>Unit {u.unit}: {u.title}</option>
                ))}
              </select>
              <label className="block text-xs text-fg-dim mb-1.5 mt-3">To chapter</label>
              <select value={endUnitIdx} onChange={e => setEndUnitIdx(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-lg bg-s2 border border-b2 text-fg text-sm focus:border-accent focus:outline-none">
                {classType.syllabus.map((u, i) => (
                  <option key={u.unit} value={i}>Unit {u.unit}: {u.title}</option>
                ))}
              </select>
              {selectedUnits.length > 0 && (
                <p className="text-xs text-fg-faint mt-1">
                  Topics: {Array.from(new Set(selectedUnits.flatMap(unit => unit.topics))).join(' - ')}
                </p>
              )}
            </div>
          )}

          {sourceType === 'topic' && (
            <div>
              <label className="block text-xs text-fg-dim mb-1.5">Topic</label>
              <select value={topicId} onChange={e => setTopicId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-s2 border border-b2 text-fg text-sm focus:border-accent focus:outline-none">
                {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Paper */}
            {classType.papers.length > 0 && (
              <div>
                <label className="block text-xs text-fg-dim mb-1.5">Paper / Assessment</label>
                <select value={paper} onChange={e => setPaper(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-s2 border border-b2 text-fg text-sm focus:border-accent focus:outline-none">
                  {classType.papers.map(p => (
                    <option key={p.id} value={p.id}>{p.label} — {p.desc}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Count */}
            <div>
              <label className="block text-xs text-fg-dim mb-1.5">Number of questions</label>
              <select value={count} onChange={e => setCount(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-lg bg-s2 border border-b2 text-fg text-sm focus:border-accent focus:outline-none">
                {[3,5,8,10].map(n => <option key={n} value={n}>{n} questions</option>)}
              </select>
            </div>
          </div>

          {/* Style */}
          <div>
            <label className="block text-xs text-fg-dim mb-1.5">Question style</label>
            <div className="grid grid-cols-3 gap-2">
              {PAPER_STYLES.map(s => (
                <button key={s.id} onClick={() => setStyle(s.id)}
                  className={clsx(
                    'p-3 rounded-lg border text-left transition-all',
                    style === s.id ? 'border-accent bg-accent/10' : 'border-b2 hover:border-b3'
                  )}>
                  <p className="text-sm font-medium text-fg">{s.label}</p>
                  <p className="text-xs text-fg-faint mt-0.5">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-xs text-fg-dim mb-1.5">Difficulty</label>
            <div className="flex gap-2">
              {([1,2,3,4] as const).map(d => (
                <button key={d} onClick={() => setDifficulty(d)}
                  className={clsx(
                    'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors',
                    difficulty === d ? 'bg-accent text-bg border-accent' : 'bg-s2 border-b2 text-fg-dim hover:text-fg'
                  )}>
                  {['Easy','Medium','Hard','Expert'][d-1]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleGenerate} loading={loading} icon={<ZapIcon size={14} strokeWidth={1.8} />}>
              Generate for {topicName ? `"${topicName.slice(0,30)}..."` : 'selected topic'}
            </Button>
            {generated.length > 0 && (
              <Button variant="secondary" onClick={handleApprove} loading={saving} disabled={selected.size === 0}>
                Save {selected.size > 0 ? selected.size : ''} to Class
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Generated exercises */}
      {generated.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-fg">Generated Questions</h3>
            <button onClick={() => setSelected(new Set(generated.map((_,i)=>i)))} className="text-xs text-accent hover:underline">Select all</button>
            <button onClick={() => setSelected(new Set())} className="text-xs text-fg-dim hover:text-fg">Clear</button>
          </div>
          {generated.map((ex, i) => (
            <div key={i} onClick={() => {
              const next = new Set(selected)
              next.has(i) ? next.delete(i) : next.add(i)
              setSelected(next)
            }} className={clsx('card p-4 cursor-pointer transition-all',
              selected.has(i) ? 'border-accent bg-accent/5' : 'hover:border-b3')}>
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={selected.has(i)} readOnly className="mt-1 accent-[var(--accent)]" onClick={e=>e.stopPropagation()} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-fg">{ex.title}</span>
                    <Badge variant="accent" size="sm">{ex.type}</Badge>
                    <Badge variant="default" size="sm">D{ex.difficulty}</Badge>
                    <Badge variant="yellow" size="sm">+{ex.xp_reward} XP</Badge>
                  </div>
                  <p className="text-xs text-fg-dim line-clamp-2">{ex.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Draft exercises */}
      {draftExercises.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Draft Queue</CardTitle>
            <Badge variant="orange" size="sm">{draftExercises.length} pending</Badge>
          </CardHeader>
          <div className="space-y-2">
            {draftExercises.map(ex => (
              <div key={ex.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-s2 border border-b2 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="text-fg font-medium truncate">{ex.title}</p>
                  <p className="text-xs text-fg-faint">{ex.type} · D{ex.difficulty} · {new Date(ex.created_at).toLocaleDateString()}</p>
                </div>
                <Badge variant="orange" size="sm">pending</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// ── Settings Tab ──────────────────────────────────────────────────────────────

function SettingsTab({ cls, classType, onInvite }: {
  cls:       { id: string; name: string; join_code: string; description: string; auto_accept?: boolean }
  classType: ClassType
  onInvite:  () => void
}) {
  const { toast }    = useToast()
  const { supabase } = useSupabase()
  const appUrl    = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  const joinUrl   = `${appUrl}/join?code=${cls.join_code}`

  const [autoAccept, setAutoAccept] = useState(cls.auto_accept ?? false)
  const [savingAA,   setSavingAA]   = useState(false)

  async function toggleAutoAccept() {
    const next = !autoAccept
    setSavingAA(true)
    const { error } = await supabase.from('classes').update({ auto_accept: next }).eq('id', cls.id)
    setSavingAA(false)
    if (error) { toast.error('Could not save — run the join_requests.sql migration first.'); return }
    setAutoAccept(next)
    toast.info(next ? 'Students now join instantly with the code.' : 'New joins now need your approval.')
  }

  return (
    <div className="max-w-lg space-y-4">
      {/* Join code card */}
      <Card>
        <CardTitle className="mb-4">Join Code & Link</CardTitle>

        <div className="flex items-center justify-center py-6">
          <code className="text-5xl font-bold font-mono tracking-[0.3em] text-accent">
            {cls.join_code}
          </code>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => { navigator.clipboard.writeText(cls.join_code); toast.info('Code copied!') }}
            className="w-full py-2.5 rounded-lg border border-b2 bg-s2 text-fg text-sm font-medium hover:border-b3 transition-colors"
          >
            Copy Code
          </button>
          <button
            onClick={() => { navigator.clipboard.writeText(joinUrl); toast.info('Link copied!') }}
            className="w-full py-2.5 rounded-lg border border-b2 bg-s2 text-fg text-sm font-medium hover:border-b3 transition-colors"
          >
            Copy Join Link
          </button>
          <Button onClick={onInvite} className="w-full" icon={<ArrowRightIcon size={14} />}>
            Send Email Invites
          </Button>
        </div>

        <p className="text-xs text-fg-faint mt-3 text-center">
          Share this code with students — they enter it at <span className="text-accent">byteforge.app/join</span>
        </p>
      </Card>

      {/* Auto-accept toggle */}
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Auto-accept joins</CardTitle>
            <p className="text-xs text-fg-dim mt-1">
              {autoAccept
                ? 'Students with the code/link are added instantly — best when you’re in the room.'
                : 'Students with the code/link land in your join-requests list until you approve them.'}
            </p>
          </div>
          <button
            onClick={toggleAutoAccept}
            disabled={savingAA}
            role="switch"
            aria-checked={autoAccept}
            className={clsx(
              'relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50',
              autoAccept ? 'bg-emerald' : 'bg-s2 border border-b2',
            )}
          >
            <span
              className={clsx(
                'absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform',
                autoAccept ? 'translate-x-5' : 'translate-x-0.5',
              )}
            />
          </button>
        </div>
      </Card>

      {/* Class info */}
      <Card>
        <CardTitle className="mb-4">Class Info</CardTitle>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-fg-dim">Name</span>
            <span className="text-fg font-medium">{cls.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-fg-dim">Type</span>
            <span className="font-medium" style={{ color: classType.color }}>{classType.label}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-fg-dim">Grade range</span>
            <span className="text-fg">{classType.gradeRange}</span>
          </div>
          {cls.description && (
            <div>
              <span className="text-fg-dim block mb-1">Description</span>
              <span className="text-fg">{cls.description}</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
