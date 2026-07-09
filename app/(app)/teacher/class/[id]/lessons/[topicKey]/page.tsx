import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { LessonStudentEditor } from '@/components/teacher/LessonStudentEditor'

interface Props { params: Promise<{ id: string; topicKey: string }> }

export const metadata: Metadata = { title: 'Edit Lesson' }
export const dynamic = 'force-dynamic'

export default async function LessonEditPage({ params }: Props) {
  const { id, topicKey } = await params
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
    <LessonStudentEditor
      topicKey={topicKey}
      classId={id}
      backHref={`/teacher/class/${id}`}
    />
  )
}
