/**
 * GET /api/teacher/grade7-content?classId=x — teacher-only.
 *
 * Returns the full Grade 7 WORLDS + CHALLENGE_LESSON content, with that
 * class's published overrides already merged in, for the visual editor.
 * Stage check() functions are never present in the response — see the
 * comment at the top of lib/grade7-content.ts for why that's safe by
 * construction, not just an omission.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getGrade7Content, applyOverrides } from '@/lib/grade7-content'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const classId = req.nextUrl.searchParams.get('classId')
  if (!classId) return NextResponse.json({ error: 'classId required' }, { status: 400 })

  const admin = await createAdminClient()
  const { data: cls } = await admin.from('classes').select('id').eq('id', classId).eq('teacher_id', user.id).maybeSingle()
  if (!cls) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let content
  try {
    content = getGrade7Content()
  } catch (e) {
    console.error('[teacher/grade7-content] failed to extract curriculum data', e)
    return NextResponse.json({ error: 'Failed to load curriculum data' }, { status: 500 })
  }

  const { data: overrides, error } = await admin
    .from('class_lesson_overrides')
    .select('scope, target_id, override_data')
    .eq('class_id', classId)
    .eq('lesson_key', 'grade7')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const merged = applyOverrides(content, overrides ?? [])
  return NextResponse.json({ worlds: merged.worlds, challengeLessons: merged.challengeLessons })
}
