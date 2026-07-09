/**
 * PATCH /api/teacher/unit-exams/[id]
 *
 * Approve or reject a unit exam.
 * Body: { status: 'approved' | 'rejected' }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'teacher')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { status } = await req.json().catch(() => ({})) as { status?: string }
  if (!['approved', 'rejected', 'pending'].includes(status ?? ''))
    return NextResponse.json({ error: 'status must be approved, rejected, or pending' }, { status: 400 })

  const admin = await createAdminClient()

  // Verify exam belongs to one of this teacher's classes
  const { data: exam } = await admin
    .from('unit_exams')
    .select('id, class_id')
    .eq('id', id)
    .single()

  if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })

  const { data: cls } = await supabase
    .from('classes').select('id').eq('id', exam.class_id).eq('teacher_id', user.id).single()
  if (!cls) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await admin
    .from('unit_exams')
    .update({ status })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, status })
}
