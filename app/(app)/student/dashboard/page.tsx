import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { suggestNext } from '@/lib/adaptive'
import { masteryStatusCounts, initialMasteryMap, recalculateAvailability } from '@/lib/mastery'
import { stageToGrade, CONCEPTS } from '@/lib/concepts'
import { XPBar } from '@/components/ui/XPBar'
import { StatsRow } from '@/components/student/StatsRow'
import { DailyChallengeCard } from '@/components/student/DailyChallengeCard'
import { AdaptiveSuggestions } from '@/components/student/AdaptiveSuggestions'
import { LearningPath } from '@/components/student/LearningPath'
import { AchievementsTeaser } from '@/components/student/AchievementsTeaser'
import { JoinClassInput } from '@/components/student/JoinClassInput'
import { Card } from '@/components/ui/Card'
import { BookIcon, ChevronRightIcon, CodeIcon } from '@/components/ui/Icons'
import Link from 'next/link'
import type { Profile, ConceptMastery, DailyChallenge, UserAchievement, MasteryMap } from '@/types'

// ── Grade 6–13 interactive lesson quick-start ────────────────────────────────
const GRADE_LESSONS: Record<number, { url: string; title: string; subtitle: string; badge: string }> = {
  6:  { url: '/lessons/grade6.html',         title: 'The Creator Quest',          subtitle: 'Walk the adventure map — robots, art, music, games & AI',        badge: 'Grade 6'  },
  7:  { url: '/lessons/grade7.html',         title: 'Block + Code Editor',        subtitle: 'Build animations and games with Blockly and JavaScript',         badge: 'Grade 7'  },
  8:  { url: '/lessons/grade8.html',         title: 'Python Editor',              subtitle: 'Write real Python 3 code with a live drawing canvas',           badge: 'Grade 8'  },
  // Was '/lessons/grade9.html' — an early 13-challenge prototype (W6-W12
  // only). The real, fully-built curriculum is grade9-missions.html: 31
  // missions across 3 phases (Turtle -> Agent Battles -> Data/SQL), tested
  // via scripts/test-g9-missions.mjs, matching the documented 30-week "Deep
  // Diver" spec far more closely. It was built and finished in July but the
  // dashboard link was never updated to point at it — students had no way to
  // reach it. grade9.html is left in place (unlinked) rather than deleted.
  9:  { url: '/lessons/grade9-missions.html', title: 'Mission IDE',               subtitle: 'Turtle piloting, agent battles, and real data missions',        badge: 'Grade 9'  },
  10: { url: '/lessons/igcse-y1.html',       title: 'IGCSE Year 1 — Theory',      subtitle: 'Data representation, hardware, networking & security',          badge: 'IGCSE Y1' },
  11: { url: '/lessons/igcse-y2.html',       title: 'IGCSE Year 2 — Programming', subtitle: 'Pseudocode, algorithms, data structures & trace tables',        badge: 'IGCSE Y2' },
  12: { url: '/lessons/as-level.html',       title: 'AS Level',                   subtitle: 'Paper 1 theory + Paper 2 programming — Cambridge 9618',        badge: 'AS Level' },
  13: { url: '/lessons/a-level.html',        title: 'A Level',                    subtitle: 'Advanced Computer Science — Papers 3 & 4 (Cambridge 9618)',   badge: 'A Level'  },
}

// Supabase returns nested one-to-many as an array; cast to the shape we know it is.
interface ClassRow {
  id:    string
  name:  string
  grade: string   // e.g. "7", "Grade 7", "grade7" — used to pick the lesson card
  units: { id: string; title: string; sort_order: number; exercises: { id: string; title: string; concept_id: string }[] }[]
}

export const metadata: Metadata = { title: 'Dashboard' }

// ── Force dynamic (personalised per user) ────────────────────────────────────
export const dynamic = 'force-dynamic'

export default async function StudentDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── Fetch primary data in parallel ──────────────────────────────────────
  const [profileRes, masteryRes, dailyRes, achievementsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single<Profile>(),
    supabase.from('concept_mastery').select('*').eq('student_id', user.id),
    supabase
      .from('daily_challenges')
      .select('*')
      .eq('student_id', user.id)
      .eq('date', new Date().toISOString().slice(0, 10))
      .maybeSingle<DailyChallenge>(),
    supabase.from('user_achievements').select('*').eq('student_id', user.id),
  ])

  const profile        = profileRes.data
  const masteryRows    = (masteryRes.data ?? []) as ConceptMastery[]
  const dailyChallenge = dailyRes.data as DailyChallenge | null
  const achievements   = (achievementsRes.data ?? []) as UserAchievement[]

  if (!profile) redirect('/login')
  if (profile.role !== 'student') redirect('/teacher/dashboard')

  // ── Fetch Class Curriculum & Progress ───────────────────────────────────
  // Step 1: simple membership check — own_membership RLS policy, no joins,
  // no chance of RLS recursion from the classes ↔ class_members cycle.
  const { data: membership } = await supabase
    .from('class_members')
    .select('class_id')
    .eq('student_id', user.id)
    .maybeSingle()

  const hasClass = !!membership

  // Step 2: fetch class details + curriculum via admin client so nested
  // units → exercises joins are never blocked by RLS edge-cases.
  let classObj: ClassRow | null = null
  let allClassExercises: { id: string; title: string; concept_id: string; unitTitle: string }[] = []

  if (membership) {
    const admin = await createAdminClient()
    const { data: cls } = await admin
      .from('classes')
      .select(`
        id, name, grade,
        units (
          id, title, sort_order,
          exercises (id, title, concept_id)
        )
      `)
      .eq('id', membership.class_id)
      .single()

    classObj = cls as ClassRow | null

    allClassExercises = (classObj?.units ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .flatMap(u => (u.exercises ?? []).map(ex => ({ ...ex, unitTitle: u.title })))
  }

  // Find the next incomplete exercise for the student
  const nextExercise = allClassExercises.find(ex => {
    const m = masteryRows.find(row => row.concept_id === ex.concept_id)
    return !m || m.status !== 'mastered'
  })

  // ── Seed mastery rows ───────────────────────────────────────────────────
  // Full seed for brand-new accounts; partial seed for existing accounts
  // that are missing rows for newly added concepts (e.g. g6-pixels, g7-arena).
  let allMasteryRows = masteryRows

  if (masteryRows.length === 0) {
    // Fresh account — seed all concepts at once
    const seedRows = initialMasteryMap(user.id)
    for (let i = 0; i < seedRows.length; i += 20) {
      await supabase.from('concept_mastery').insert(seedRows.slice(i, i + 20))
    }
    allMasteryRows = seedRows
  } else {
    // Existing account — find any concepts added since their last seeding
    const seededIds = new Set(masteryRows.map(r => r.concept_id))
    const missing   = CONCEPTS.filter(c => !seededIds.has(c.id))

    if (missing.length > 0) {
      const newRows: ConceptMastery[] = missing.map(c => ({
        id:               crypto.randomUUID(),
        student_id:       user.id,
        concept_id:       c.id,
        mastery_score:    0,
        status:           'locked' as const,
        attempts:         0,
        correct_attempts: 0,
        accuracy_history: [],
        weaknesses:       [],
        time_spent_ms:    0,
        last_practiced:   null,
      }))
      for (let i = 0; i < newRows.length; i += 20) {
        await supabase.from('concept_mastery').insert(newRows.slice(i, i + 20))
      }
      allMasteryRows = [...masteryRows, ...newRows]
    }
  }

  // ── Build mastery map ───────────────────────────────────────────────────
  const rawMasteryMap: MasteryMap = {}
  for (const row of allMasteryRows) {
    rawMasteryMap[row.concept_id] = row
  }

  // ── Recalculate availability ────────────────────────────────────────────
  // This unlocks concepts whose prerequisites were removed (e.g. grade-track
  // entry points like variables-visual, functions-params, pseudocode-intro).
  // Existing accounts were seeded with the old prereq chain → still 'locked'.
  // recalculateAvailability() flips locked→available whenever prereqs are met
  // (empty prereqs always pass, so entry-point concepts become available now).
  const masteryMap = recalculateAvailability(rawMasteryMap)

  // Persist any rows that just changed locked → available so next load is fast
  const nowUnlocked = Object.values(masteryMap).filter(row => {
    const prev = rawMasteryMap[row.concept_id]
    return prev?.status === 'locked' && row.status === 'available'
  })
  if (nowUnlocked.length > 0) {
    await supabase.from('concept_mastery').upsert(nowUnlocked, { onConflict: 'id' })
  }

  // ── Compute derived data ────────────────────────────────────────────────
  const studentGrade  = stageToGrade(profile.stage)
  const statusCounts  = masteryStatusCounts(masteryMap)
  const suggestions   = suggestNext(masteryMap, 4, studentGrade)
  const masteredCount = statusCounts.mastered ?? 0

  // All grades 6–13 get a direct link to their interactive lesson.
  // If the student is in a class, use that class's grade (e.g. "7", "Grade 7", "grade7",
  // "IGCSE Year 1", "10", "AS Level", "12") so joining any class shows the right lesson.
  const classGradeRaw = classObj?.grade ?? ''
  // Normalise text grades: "IGCSE Year 1"→10, "IGCSE Year 2"→11, "AS Level"→12, "A Level"→13
  const textGradeMap: Record<string, number> = {
    'igcse year 1': 10, 'igcse y1': 10, 'igcse1': 10,
    'igcse year 2': 11, 'igcse y2': 11, 'igcse2': 11,
    'as level': 12, 'as-level': 12, 'aslevel': 12,
    'a level': 13,  'a-level': 13,  'alevel': 13,
  }
  const normalised = classGradeRaw.toLowerCase().trim()
  const classGradeNum = textGradeMap[normalised]
    ?? parseInt(classGradeRaw.replace(/\D/g, ''), 10)   // "Grade 7" → 7, "7" → 7
  const effectiveGrade = !isNaN(classGradeNum) && GRADE_LESSONS[classGradeNum]
    ? classGradeNum
    : studentGrade
  const firstLesson = GRADE_LESSONS[effectiveGrade] ?? null

  // If in a class with an incomplete exercise, show that as the primary CTA
  const showCurriculumCallout = hasClass && !!nextExercise

  // Chapter Exams only ever has content for AS/A Level (the only class type that
  // can upload a Cambridge textbook via the Book Lessons tab and generate them).
  const isCambridgeLevel = effectiveGrade >= 10   // IGCSE Y1/Y2, AS Level, A Level

  return (
    <div className="max-w-6xl mx-auto space-y-7">

      {/* ── Hero banner ─────────────────────────────────────────────── */}
      <div className="focus-surface p-5 md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="label-caps text-accent mb-2">Command Center</p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-fg">
              Keep the streak. Sharpen the weak spots.
            </h1>
            <p className="text-fg-dim text-sm mt-3">
              {profile.name.split(' ')[0]}, your next few moves are already queued for today.
            </p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-sm font-semibold text-fg">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long' })}
            </p>
            <p className="text-xs text-fg-faint mt-0.5">
              {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
        <div className="mt-5">
          <XPBar xp={profile.xp} showLevel height="md" />
        </div>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────── */}
      <StatsRow
        profile={profile}
        masteredCount={masteredCount}
        statusCounts={statusCounts}
      />

      {/* ── Two-column grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left col ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* ── Grade lesson quick-start (Grade 6–9 only) ────────────── */}
          {firstLesson && (
            <Card className="border-accent/25 bg-accent/5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10 text-accent shrink-0">
                    <CodeIcon size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-accent uppercase tracking-wider">
                      {firstLesson.badge} — Start Here
                    </p>
                    <h3 className="text-lg font-bold text-fg">{firstLesson.title}</h3>
                    <p className="text-xs text-fg-faint mt-0.5">{firstLesson.subtitle}</p>
                  </div>
                </div>
                <Link
                  href={membership?.class_id
                    ? `${firstLesson.url}?classId=${membership.class_id}`
                    : firstLesson.url}
                  className="btn-primary py-2 px-4 text-sm flex items-center gap-2 shrink-0"
                >
                  Open Lesson <ChevronRightIcon size={16} />
                </Link>
              </div>
            </Card>
          )}

          {/* ── Class: next-exercise callout ─────────────────────────── */}
          {showCurriculumCallout && nextExercise && classObj && (
            <Card className="border-accent/30 bg-accent/5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10 text-accent shrink-0">
                    <BookIcon size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-accent uppercase tracking-wider">
                      Up Next in {classObj.name}
                    </p>
                    <h3 className="text-lg font-bold text-fg">{nextExercise.title}</h3>
                    <p className="text-xs text-fg-faint">{nextExercise.unitTitle}</p>
                  </div>
                </div>
                <Link
                  href={`/student/concept/${nextExercise.concept_id}`}
                  className="btn-primary py-2 px-4 text-sm flex items-center gap-2 shrink-0"
                >
                  Start <ChevronRightIcon size={16} />
                </Link>
              </div>
            </Card>
          )}

          {/* ── Class curriculum list ────────────────────────────────── */}
          {hasClass && classObj && (
            <Card className="p-0 overflow-hidden">
              <div className="p-4 border-b border-b2 bg-s1/50 flex items-center justify-between">
                <h3 className="font-bold text-fg flex items-center gap-2">
                  <BookIcon size={16} className="text-accent" />
                  Class Curriculum: {classObj.name}
                </h3>
                <span className="text-xs text-fg-faint">
                  {allClassExercises.length} exercise{allClassExercises.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="divide-y divide-b2 max-h-[400px] overflow-y-auto">
                {allClassExercises.map(ex => {
                  const m      = masteryMap[ex.concept_id]
                  const isDone = m?.status === 'mastered'
                  return (
                    <Link
                      key={ex.id}
                      href={`/student/concept/${ex.concept_id}`}
                      className="flex items-center justify-between p-4 hover:bg-s1 transition-colors group"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-fg group-hover:text-accent transition-colors">
                          {ex.title}
                        </span>
                        <span className="text-[10px] text-fg-faint uppercase">{ex.unitTitle}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isDone ? 'bg-emerald border-emerald text-white' : 'border-b3'
                      }`}>
                        {isDone && <ChevronRightIcon size={12} strokeWidth={3} />}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Show join input only when not yet in any class */}
          {!hasClass && <JoinClassInput />}

          {/* ── Exams + Past Papers quick-links ───────────────────────────
              Cambridge levels (IGCSE/AS/A Level) only — these map to real
              Cambridge past papers and chapter exams uploaded via Book
              Lessons. Grade 6-9 have no such papers and no exam content, so
              this card was clutter there (removed per product decision — the
              same one that dropped the Skill Tree link for those grades). */}
          {hasClass && membership?.class_id && isCambridgeLevel && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card className="border-b2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10 text-accent shrink-0 text-lg">📝</div>
                    <div>
                      <p className="text-xs font-bold text-accent uppercase tracking-wider">Unit Exams</p>
                      <p className="text-sm font-semibold text-fg">Chapter Exams</p>
                      <p className="text-xs text-fg-faint mt-0.5">Self-mark with mark scheme</p>
                    </div>
                  </div>
                  <Link
                    href="/student/exams"
                    className="py-2 px-3 text-sm font-semibold rounded-lg bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors shrink-0 flex items-center gap-1.5"
                  >
                    Open <ChevronRightIcon size={14} />
                  </Link>
                </div>
              </Card>
              <Card className="border-b2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-violet-400/10 text-violet-400 shrink-0 text-lg">📋</div>
                    <div>
                      <p className="text-xs font-bold text-violet-400 uppercase tracking-wider">Past Papers</p>
                      <p className="text-sm font-semibold text-fg">Cambridge Papers</p>
                      <p className="text-xs text-fg-faint mt-0.5">AI-marked instantly</p>
                    </div>
                  </div>
                  <Link
                    href="/student/past-papers"
                    className="py-2 px-3 text-sm font-semibold rounded-lg bg-violet-400/10 border border-violet-400/30 text-violet-400 hover:bg-violet-400/20 transition-colors shrink-0 flex items-center gap-1.5"
                  >
                    Open <ChevronRightIcon size={14} />
                  </Link>
                </div>
              </Card>
            </div>
          )}

          <DailyChallengeCard challenge={dailyChallenge} />
          {/* Up Next / Learning Path — only for grades 6–9 (mastery-graph learners).
              Grades 10–13 use dedicated lesson pages and have no concept mastery graph. */}
          {studentGrade <= 9 && (
            <>
              <AdaptiveSuggestions suggestions={suggestions} />
              <LearningPath masteryMap={masteryMap} studentGrade={studentGrade} />
            </>
          )}
        </div>

        {/* Right col: achievements ────────────────────────────────────
            PathwayProgressPanel ("Game Maker" etc. % complete tile) removed
            per product decision — redundant with LearningPath/AdaptiveSuggestions
            already shown in the left column, and cluttered the dashboard. */}
        <div className="space-y-4">
          <AchievementsTeaser unlocked={achievements} />
        </div>
      </div>
    </div>
  )
}
