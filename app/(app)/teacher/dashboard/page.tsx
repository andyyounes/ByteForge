import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { BookIcon, UserIcon, ZapIcon, ChartBarIcon } from '@/components/ui/Icons'
import TeacherTabs from './TeacherTabs'
import { JoinRequestsPanel } from '@/components/teacher/JoinRequestsPanel'
import type { Profile, ConceptMastery, Topic } from '@/types'

export const metadata: Metadata = { title: 'Teacher Dashboard' }
export const dynamic = 'force-dynamic'

export default async function TeacherDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  if (!profile || profile.role !== 'teacher') redirect('/student/dashboard')

  const { data: rawClasses } = await supabase
    .from('classes')
    .select('*')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: true })

  // Sort by grade progression (6,7,8,9,IGCSE Y1=10,IGCSE Y2=11,AS=12,A=13),
  // not creation order — `grade` is TEXT, so a plain .order('grade') would
  // sort alphabetically ("10" before "6"), which is exactly as wrong as the
  // creation-date order this replaces.
  const classes = [...(rawClasses ?? [])].sort((a, b) => (parseInt(a.grade, 10) || 0) - (parseInt(b.grade, 10) || 0))

  const classIds   = (classes ?? []).map((c: { id: string }) => c.id)
  const firstClass = (classes ?? [])[0] as { id: string; name: string; join_code: string } | undefined

  const { data: memberships } = await supabase
    .from('class_members')
    .select('student_id, class_id')
    .in('class_id', classIds.length ? classIds : ['__none__'])

  const studentIds = [...new Set((memberships ?? []).map((m: { student_id: string }) => m.student_id))]

  const [studentsRes, masteriesRes, topicsRes] = await Promise.all([
    supabase.from('profiles').select('*').in('id', studentIds.length ? studentIds : ['__none__']),
    supabase.from('concept_mastery').select('*').in('student_id', studentIds.length ? studentIds : ['__none__']),
    supabase.from('topics').select('*').eq('teacher_id', user.id),
  ])

  const students  = (studentsRes.data  ?? []) as Profile[]
  const masteries = (masteriesRes.data ?? []) as ConceptMastery[]
  const topics    = (topicsRes.data    ?? []) as Topic[]

  const classSummaries = (classes ?? []).map((cls: {
    id: string; name: string; join_code: string
    level: string; grade: string; description: string; created_at: string
  }) => ({
    ...cls,
    studentCount: (memberships ?? []).filter((m: { class_id: string }) => m.class_id === cls.id).length,
  }))

  const heatmapData = students.map(s => ({
    student:   s,
    masteries: masteries
      .filter(m => m.student_id === s.id)
      .reduce((acc, m) => { acc[m.concept_id] = m; return acc }, {} as Record<string, ConceptMastery>),
  }))

  const atRisk = students.filter(s => {
    const masteredCount = masteries.filter(m => m.student_id === s.id && m.status === 'mastered').length
    return s.streak === 0 || masteredCount < 3
  })

  const classCount   = classes?.length ?? 0
  const studentCount = students.length
  const avgXp        = students.length
    ? Math.round(students.reduce((sum, p) => sum + p.xp, 0) / students.length)
    : 0

  const overviewStats = [
    { label: 'Classes',   value: classCount,   icon: <BookIcon     size={15} strokeWidth={1.7} />, color: 'text-accent'  },
    { label: 'Students',  value: studentCount, icon: <UserIcon     size={15} strokeWidth={1.7} />, color: 'text-sky'    },
    { label: 'Avg XP',    value: avgXp,        icon: <ZapIcon      size={15} strokeWidth={1.7} />, color: 'text-amber'  },
    { label: 'At Risk',   value: atRisk.length,icon: <ChartBarIcon size={15} strokeWidth={1.7} />, color: 'text-rose'   },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <p className="label-caps mb-2">Teacher workspace</p>
        <h1 className="text-2xl font-bold text-fg">Dashboard</h1>
        <p className="text-sm text-fg-dim mt-1">
          {profile.name} · {classCount} class{classCount !== 1 ? 'es' : ''} · {studentCount} student{studentCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Pending join requests — shows only when students are waiting */}
      <JoinRequestsPanel
        classes={(classes ?? []).map((c: { id: string; name: string; grade: string }) => ({ id: c.id, name: c.name, grade: c.grade }))}
      />

      {/* Overview stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {overviewStats.map(stat => (
          <div key={stat.label} className="metric-card p-4">
            <div className="flex items-start justify-between mb-3">
              <p className="label-caps">{stat.label}</p>
              <span className={`${stat.color} bg-s2 p-1.5 rounded-md`}>{stat.icon}</span>
            </div>
            <p className="text-2xl font-bold text-fg tabular-nums leading-none">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <TeacherTabs
        heatmapData={heatmapData}
        atRisk={atRisk}
        students={students}
        topics={topics}
        memberships={(memberships ?? []) as { student_id: string; class_id: string }[]}
        classId={firstClass?.id ?? ''}
        className={firstClass?.name ?? ''}
        joinCode={firstClass?.join_code ?? ''}
        teacherId={profile.id}
        classes={classSummaries}
      />
    </div>
  )
}
