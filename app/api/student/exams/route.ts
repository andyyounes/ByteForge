/**
 * GET /api/student/exams?classId=xxx
 *
 * Returns all APPROVED unit exams for a class the student is enrolled in.
 * Full content (questions + mark schemes) included.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const classId = req.nextUrl.searchParams.get('classId')
  if (!classId) return NextResponse.json({ error: 'classId required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify student is in the class
  const { data: membership } = await supabase
    .from('class_members')
    .select('class_id')
    .eq('class_id', classId)
    .eq('student_id', user.id)
    .maybeSingle()

  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = await createAdminClient()
  const { data: exams, error } = await admin
    .from('unit_exams')
    .select('id, chapter_num, chapter_label, title, content, status, created_at')
    .eq('class_id', classId)
    .eq('status', 'approved')
    .order('chapter_num', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ exams: exams ?? [] })
}
