import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Grade6LessonEditor } from '@/components/teacher/Grade6LessonEditor'

interface Props { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: 'Edit Grade 6 Lessons' }
export const dynamic = 'force-dynamic'

export default async function Grade6EditPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Only the teacher who owns the class may open the editor
  const { data: cls } = await supabase
    .from('classes')
    .select('id')
    .eq('id', id)
    .eq('teacher_id', user.id)
    .maybeSingle()
  if (!cls) notFound()

  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Link href={`/teacher/class/${id}`} className="text-xs text-t3 hover:text-fg transition-colors">
          ← back to class
        </Link>
        <h1 className="text-xl font-bold text-fg mt-1">Edit Grade 6 Lessons</h1>
        <p className="text-xs text-fg-dim mt-1">
          Edits published here only apply to this class — the original stays the same for every other class.
        </p>
      </div>
      <Grade6LessonEditor classId={id} />
    </main>
  )
}
