'use client'

import { useState } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { MasteryHeatmap } from '@/components/teacher/MasteryHeatmap'
import { AIEngineTab } from '@/components/teacher/AIEngineTab'
import { CreateClassModal } from '@/components/teacher/CreateClassModal'
import { InviteModal } from '@/components/teacher/InviteModal'
import {
  ChartBarIcon,
  TargetIcon,
  ZapIcon,
  FlameIcon,
  TrophyIcon,
  BookIcon,
} from '@/components/ui/Icons'
import { getClassType } from '@/lib/class-types'
import { STAGE_MAP } from '@/lib/stage-config'
import type { Profile, ConceptMastery, Topic, StageId } from '@/types'

interface HeatmapData {
  student:   Profile
  masteries: Record<string, ConceptMastery>
}

interface TeacherClassSummary {
  id: string; name: string; join_code: string
  level: string; grade: string; description: string
  created_at: string; studentCount: number
}

interface TeacherTabsProps {
  heatmapData:  HeatmapData[]
  atRisk:       Profile[]
  students:     Profile[]
  topics:       Topic[]
  memberships:  { student_id: string; class_id: string }[]
  classId:      string
  className:    string
  joinCode:     string
  teacherId:    string
  classes:      TeacherClassSummary[]
}

type Tab = 'overview' | 'heatmap' | 'ai'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview',        icon: <ChartBarIcon size={14} strokeWidth={1.8} /> },
  { id: 'heatmap',  label: 'Mastery Heatmap', icon: <TargetIcon   size={14} strokeWidth={1.8} /> },
  { id: 'ai',       label: 'AI Engine',        icon: <ZapIcon      size={14} strokeWidth={1.8} /> },
]

export default function TeacherTabs({
  heatmapData, atRisk, students, topics, memberships,
  classId, className, joinCode, teacherId, classes,
}: TeacherTabsProps) {
  const [tab,             setTab]             = useState<Tab>('overview')
  const [showCreate,      setShowCreate]      = useState(false)
  const [inviteTarget,    setInviteTarget]    = useState<TeacherClassSummary | null>(null)
  const [selectedClassId, setSelectedClassId] = useState<string>('all')

  // Filter students / heatmap data by selected class
  const classStudentIds = selectedClassId === 'all'
    ? null
    : new Set(memberships.filter(m => m.class_id === selectedClassId).map(m => m.student_id))

  const visibleStudents    = classStudentIds
    ? students.filter(s => classStudentIds.has(s.id))
    : students
  const visibleHeatmapData = classStudentIds
    ? heatmapData.filter(d => classStudentIds.has(d.student.id))
    : heatmapData
  const visibleAtRisk      = classStudentIds
    ? atRisk.filter(s => classStudentIds.has(s.id))
    : atRisk

  // Resolve the invite / AI target class
  const activeClassId   = selectedClassId !== 'all' ? selectedClassId : classId
  const activeClassName = classes.find(c => c.id === activeClassId)?.name ?? className
  const activeJoinCode  = classes.find(c => c.id === activeClassId)?.join_code ?? joinCode

  return (
    <div>
      <CreateClassModal open={showCreate} onClose={() => setShowCreate(false)} teacherId={teacherId} />
      <InviteModal
        open={!!inviteTarget} onClose={() => setInviteTarget(null)}
        classId={inviteTarget?.id ?? ''} className={inviteTarget?.name ?? ''}
        joinCode={inviteTarget?.join_code ?? ''}
      />

      {/* Class selector — only shown when there are multiple classes */}
      {classes.length > 1 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs text-fg-faint font-medium uppercase tracking-wide">Viewing:</span>
          {[{ id: 'all', name: 'All classes' }, ...classes].map(cls => (
            <button
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                selectedClassId === cls.id
                  ? 'bg-accent text-bg border-accent'
                  : 'bg-s1 border-b2 text-fg-dim hover:text-fg hover:border-b3',
              )}
            >
              {cls.name}
            </button>
          ))}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex items-center gap-0.5 border-b border-b2 mb-6">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium',
              'transition-colors border-b-2 -mb-px',
              tab === t.id
                ? 'border-accent text-accent'
                : 'border-transparent text-fg-dim hover:text-fg',
            )}
          >
            <span className={tab === t.id ? 'text-accent' : 'text-fg-faint'}>{t.icon}</span>
            {t.label}
          </button>
        ))}
        <div className="flex-1" />
        {activeClassId && (
          <Button
            size="sm" variant="ghost"
            onClick={() => setInviteTarget(
              classes.find(cls => cls.id === activeClassId) ?? {
                id: activeClassId, name: activeClassName, join_code: activeJoinCode,
                level: 'general', grade: '', description: '',
                created_at: '', studentCount: visibleStudents.length,
              }
            )}
            className="mb-1 mr-1"
          >
            Invite students
          </Button>
        )}
        <Button size="sm" variant="secondary" onClick={() => setShowCreate(true)} className="mb-1">
          + New class
        </Button>
      </div>

      {/* ── Overview tab ── */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Classes — full-width card */}
          <Card className="lg:col-span-2" noPadding>
            <div className="p-5 border-b border-b2 flex items-center justify-between gap-3">
              <CardTitle>Classes</CardTitle>
              <Button size="sm" variant="secondary" onClick={() => setShowCreate(true)}>+ New class</Button>
            </div>
            {classes.length === 0 ? (
              /* ── Empty state ── */
              <div className="flex flex-col items-center justify-center gap-4 py-14 px-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-s2 border border-b2 flex items-center justify-center">
                  <BookIcon size={20} strokeWidth={1.6} className="text-fg-faint" />
                </div>
                <div>
                  <p className="font-semibold text-fg">No classes yet</p>
                  <p className="text-sm text-fg-dim mt-1 max-w-xs">
                    Create your first class to invite students, assign exercises, and track progress.
                  </p>
                </div>
                <Button variant="primary" onClick={() => setShowCreate(true)}>
                  Create your first class
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-5">
                {classes.map(cls => {
                  const classType = getClassType(cls.level)
                  return (
                    <div key={cls.id} className="rounded-md border border-b2 bg-s2 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Badge variant="accent" size="sm">{classType.shortLabel}</Badge>
                          <h3 className="font-semibold text-fg mt-2 truncate">{cls.name}</h3>
                          <p className="text-xs text-fg-faint mt-1">
                            {cls.studentCount} student{cls.studentCount !== 1 ? 's' : ''}
                            {cls.grade ? ` · Year ${cls.grade}` : ''}
                          </p>
                        </div>
                        <code className="text-xs font-bold tracking-widest text-accent font-mono">
                          {cls.join_code}
                        </code>
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        <Link href={`/teacher/class/${cls.id}`} className="flex-1">
                          <Button size="sm" variant="secondary" className="w-full">Open</Button>
                        </Link>
                        <Button size="sm" variant="outline" onClick={() => setInviteTarget(cls)}>
                          Share
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* At-risk students */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ChartBarIcon size={14} strokeWidth={1.8} className="text-rose" />
                <CardTitle>At-risk students</CardTitle>
              </div>
              <Badge variant="red" size="sm">{visibleAtRisk.length}</Badge>
            </CardHeader>
            {visibleAtRisk.length === 0 ? (
              <p className="text-fg-dim text-sm">No at-risk students right now 🎉</p>
            ) : (
              <div className="space-y-1.5">
                {visibleAtRisk.map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-md hover:bg-s2 transition-colors">
                    <Avatar name={s.name} avatarUrl={s.avatar_url} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-fg truncate">{s.name}</p>
                      <p className="text-xs text-fg-faint">
                        {s.streak}d streak · {s.xp} XP
                      </p>
                    </div>
                    <Badge variant={s.streak === 0 ? 'red' : 'orange'} size="sm" dot>
                      {s.streak === 0 ? 'No streak' : 'Low progress'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Top performers */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrophyIcon size={14} strokeWidth={1.8} className="text-amber" />
                <CardTitle>Top performers</CardTitle>
              </div>
            </CardHeader>
            {visibleStudents.length === 0 ? (
              <p className="text-fg-dim text-sm">No students enrolled yet.</p>
            ) : (
              <div className="space-y-1.5">
                {[...visibleStudents]
                  .sort((a, b) => b.xp - a.xp)
                  .slice(0, 5)
                  .map((s, i) => (
                    <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-md hover:bg-s2 transition-colors">
                      <span className="text-xs font-bold text-fg-faint w-5 shrink-0 tabular-nums">
                        #{i + 1}
                      </span>
                      <Avatar name={s.name} avatarUrl={s.avatar_url} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-fg truncate">{s.name}</p>
                        <p className="text-xs text-fg-faint tabular-nums">{s.xp.toLocaleString()} XP</p>
                      </div>
                      <Badge variant="green" size="sm">Lv {s.level}</Badge>
                    </div>
                  ))}
              </div>
            )}
          </Card>

          {/* All students table */}
          <Card className="lg:col-span-2" noPadding>
            <div className="p-5 border-b border-b2">
              <CardTitle>
                {selectedClassId === 'all' ? 'All students' : `Students — ${classes.find(c => c.id === selectedClassId)?.name ?? ''}`}
              </CardTitle>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-b2">
                    {['Name', 'XP', 'Level', 'Streak', 'Stage'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-fg-faint uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleStudents.map(s => (
                    <tr key={s.id} className="border-b border-b2/50 hover:bg-s2/40 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={s.name} avatarUrl={s.avatar_url} size="xs" />
                          <span className="font-medium text-fg">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-fg-dim tabular-nums">{s.xp.toLocaleString()}</td>
                      <td className="px-5 py-3">
                        <Badge variant="accent" size="sm">Lv {s.level}</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-1.5 text-fg-dim">
                          <FlameIcon size={12} strokeWidth={2} className="text-orange" />
                          <span className="tabular-nums">{s.streak}d</span>
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {/* Human-readable stage label */}
                        <Badge variant="default" size="sm">
                          {STAGE_MAP.get(s.stage as StageId)?.shortLabel ?? s.stage}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {visibleStudents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-fg-faint text-sm">
                        {classes.length === 0
                          ? 'Create a class and share the join code to enrol students.'
                          : 'No students enrolled yet — share your class join code.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {tab === 'heatmap' && <MasteryHeatmap data={visibleHeatmapData} />}
      {tab === 'ai'      && <AIEngineTab topics={topics} classId={activeClassId} />}
    </div>
  )
}
