import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { SkillTreeCanvas } from './SkillTreeCanvas'
import type { Profile, ConceptMastery, MasteryMap } from '@/types'

export const metadata: Metadata = { title: 'Skill Tree' }
export const dynamic = 'force-dynamic'

export default async function PathwayPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, masteryRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single<Profile>(),
    supabase.from('concept_mastery').select('*').eq('student_id', user.id),
  ])

  const profile = profileRes.data
  if (!profile) redirect('/login')

  const masteryMap: MasteryMap = {}
  for (const row of (masteryRes.data ?? []) as ConceptMastery[]) {
    masteryMap[row.concept_id] = row
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-fg">Skill Tree</h1>
        <p className="text-fg-dim text-sm mt-1">
          Navigate your learning journey — click a concept to start
        </p>
      </div>
      <SkillTreeCanvas masteryMap={masteryMap} />
    </div>
  )
}
