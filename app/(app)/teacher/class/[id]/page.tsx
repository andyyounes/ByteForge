import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getClassType } from '@/lib/class-types'
import { ClassTabs } from './ClassTabs'
import type { Profile, ConceptMastery, Topic } from '@/types'

interface Props { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: 'Class' }
export const dynamic = 'force-dynamic'

export default async function ClassPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch class
  const { data: cls } = await supabase
    .from('classes')
    .select('*')
    .eq('id', id)
    .eq('teacher_id', user.id)
    .single()

  if (!cls) notFound()

  const classType = getClassType(cls.level ?? 'general')

  // Fetch students
  const { data: memberships } = await supabase
    .from('class_members')
    .select('student_id')
    .eq('class_id', id)

  const studentIds = (memberships ?? []).map((m: { student_id: string }) => m.student_id)

  const [studentsRes, masteriesRes, topicsRes, exercisesRes, progressRes] = await Promise.all([
    supabase.from('profiles').select('*').in('id', studentIds.length ? studentIds : ['__none__']),
    supabase.from('concept_mastery').select('*').in('student_id', studentIds.length ? studentIds : ['__none__']),
    supabase
      .from('topics')
      .select('*')
      .eq('teacher_id', user.id)
      .or(`class_id.eq.${id},class_id.is.null`)
      .order('created_at', { ascending: false }),
    supabase.from('exercises')
      .select('id, title, type, difficulty, xp_reward, draft_status, created_at, syllabus_ref')
      .like('syllabus_ref', `class:${id}:%`)
      .eq('draft_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('progress')
      .select('student_id, exercise_id, completed, score, passed, submitted_at')
      .in('student_id', studentIds.length ? studentIds : ['__none__'])
      .order('submitted_at', { ascending: false })
      .limit(200),
  ])

  const students  = (studentsRes.data  ?? []) as Profile[]
  const masteries = (masteriesRes.data ?? []) as ConceptMastery[]
  const topics    = (topicsRes.data    ?? []) as Topic[]
  const draftExercises = exercisesRes.data ?? []
  const progressRows = progressRes.data ?? []

  // Per-student mastery maps
  const studentData = students.map(s => {
    const studentProgress = progressRows.filter((row: { student_id: string }) => row.student_id === s.id)
    const scoredProgress = studentProgress.filter((row: { score: number | null }) => typeof row.score === 'number')

    return {
      student:   s,
      masteries: masteries
        .filter(m => m.student_id === s.id)
        .reduce((acc, m) => { acc[m.concept_id] = m; return acc }, {} as Record<string, ConceptMastery>),
      masteredCount: masteries.filter(m => m.student_id === s.id && m.status === 'mastered').length,
      lastActive: s.last_active_date,
      progressSummary: {
        attempts: studentProgress.length,
        completed: studentProgress.filter((row: { completed: boolean }) => row.completed).length,
        passed: studentProgress.filter((row: { passed: boolean }) => row.passed).length,
        avgScore: scoredProgress.length
          ? Math.round(scoredProgress.reduce((sum: number, row: { score: number | null }) => sum + (row.score ?? 0), 0) / scoredProgress.length)
          : null,
        lastSubmitted: studentProgress[0]?.submitted_at ?? null,
      },
      recentProgress: studentProgress.slice(0, 5),
    }
  })

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-fg">{cls.name}</h1>
            <span
              className="px-2.5 py-1 rounded-full text-xs font-semibold border"
              style={{ color: classType.color, borderColor: classType.color + '40', background: classType.color + '15' }}
            >
              {classType.shortLabel}
            </span>
          </div>
          <p className="text-fg-dim text-sm mt-1">
            {students.length} student{students.length !== 1 ? 's' : ''} · Join code:{' '}
            <code className="text-accent font-mono font-bold tracking-widest">{cls.join_code}</code>
          </p>
        </div>
      </div>

      <ClassTabs
        cls={cls}
        classType={classType}
        studentData={studentData}
        topics={topics}
        draftExercises={draftExercises}
        teacherId={user.id}
      />
    </div>
  )
}
