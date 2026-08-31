/**
 * GET /api/teacher/grade8-content?classId=x — teacher-only.
 *
 * Returns the full Grade 8 MODULES + CHALLENGE_LESSON content, with that
 * class's published overrides already merged in, for the visual editor.
 * See lib/grade8-content.ts for why stage check() functions never reach
 * the browser.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getGrade8Content, applyOverrides } from '@/lib/grade8-content'

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
    content = getGrade8Content()
  } catch (e) {
    console.error('[teacher/grade8-content] failed to extract curriculum data', e)
    return NextResponse.json({ error: 'Failed to load curriculum data' }, { status: 500 })
  }

  const { data: overrides, error } = await admin
    .from('class_lesson_overrides')
    .select('scope, target_id, override_data')
    .eq('class_id', classId)
    .eq('lesson_key', 'grade8')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const merged = applyOverrides(content, overrides ?? [])
  return NextResponse.json({ modules: merged.modules, challengeLessons: merged.challengeLessons })
}
