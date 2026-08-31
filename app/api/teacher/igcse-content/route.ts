/**
 * GET /api/teacher/igcse-content?classId=x&file=igcse-y1|igcse-y2 — teacher-only.
 *
 * One shared route for both IGCSE years (identical structure). Returns the
 * full CHALLENGES + CHALLENGE_LESSON content, with that class's published
 * overrides already merged in. See lib/igcse-content.ts for why both
 * scopes are keyed by array index rather than a compound mod/name string.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getIgcseContent, applyOverrides, type IgcseFile } from '@/lib/igcse-content'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const classId = req.nextUrl.searchParams.get('classId')
  const file    = req.nextUrl.searchParams.get('file')
  if (!classId) return NextResponse.json({ error: 'classId required' }, { status: 400 })
  if (file !== 'igcse-y1' && file !== 'igcse-y2') {
    return NextResponse.json({ error: "file must be 'igcse-y1' or 'igcse-y2'" }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { data: cls } = await admin.from('classes').select('id').eq('id', classId).eq('teacher_id', user.id).maybeSingle()
  if (!cls) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let content
  try {
    content = getIgcseContent(file as IgcseFile)
  } catch (e) {
    console.error('[teacher/igcse-content] failed to extract curriculum data', e)
    return NextResponse.json({ error: 'Failed to load curriculum data' }, { status: 500 })
  }

  const { data: overrides, error } = await admin
    .from('class_lesson_overrides')
    .select('scope, target_id, override_data')
    .eq('class_id', classId)
    .eq('lesson_key', file)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const merged = applyOverrides(content, overrides ?? [])
  return NextResponse.json({ challenges: merged.challenges, lessons: merged.lessons })
}
