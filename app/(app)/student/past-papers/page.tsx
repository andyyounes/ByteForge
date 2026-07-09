import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { PastPapersTaker } from '@/components/student/PastPapersTaker'

export const metadata: Metadata = { title: 'Past Papers' }
export const dynamic = 'force-dynamic'

export default async function PastPapersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'student') redirect('/teacher/dashboard')

  // Get student's class (if any)
  const admin = await createAdminClient()
  const { data: membership } = await admin
    .from('class_members')
    .select('class_id, classes(id, name)')
    .eq('student_id', user.id)
    .order('joined_at', { ascending: false })
    .limit(1)
    .single()
    .catch(() => ({ data: null }))

  const classId   = (membership?.classes as { id: string; name: string } | null)?.id   ?? null
  const className = (membership?.classes as { id: string; name: string } | null)?.name ?? null

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-fg">Past Papers</h1>
        <p className="text-sm text-fg-dim mt-1">
          Answer past paper questions — each answer is marked by AI instantly.
        </p>
      </div>
      <PastPapersTaker classId={classId} className={className} studentId={user.id} />
    </main>
  )
}
