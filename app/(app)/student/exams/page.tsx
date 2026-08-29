import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { UnitExamsTaker } from '@/components/student/UnitExamsTaker'

export const metadata: Metadata = { title: 'Unit Exams' }
export const dynamic = 'force-dynamic'

export default async function StudentExamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'student') redirect('/teacher/dashboard')

  // Get student's class
  const admin = await createAdminClient()
  let membership: { class_id: string; classes: { id: string; name: string } } | null = null
  try {
    const { data } = await admin
      .from('class_members')
      .select('class_id, classes(id, name)')
      .eq('student_id', user.id)
      .order('joined_at', { ascending: false })
      .limit(1)
      .single()
    membership = data as typeof membership
  } catch {
    membership = null
  }

  const classId   = (membership?.classes as { id: string; name: string } | null)?.id   ?? null
  const className = (membership?.classes as { id: string; name: string } | null)?.name ?? null

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-fg">Unit Exams</h1>
        <p className="text-sm text-fg-dim mt-1">
          Chapter exams approved by your teacher — answer each question and check your work against the mark scheme.
        </p>
      </div>
      <UnitExamsTaker classId={classId} className={className} />
    </main>
  )
}
