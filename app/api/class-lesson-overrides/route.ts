/**
 * Per-class lesson-content overrides (Grade 6-9 static lesson pages).
 *
 * GET    ?classId=&lessonKey=          — any class member (student or the
 *                                        owning teacher) reads all overrides
 *                                        for that class+lesson, so the
 *                                        static lesson page can merge them in.
 * PUT                                  — teacher only: upsert one override.
 * DELETE ?classId=&lessonKey=&scope=&targetId= — teacher only: revert one
 *                                        override back to the original.
 *
 * Body/params scope is 'world' | 'stage', targetId is that world/stage's id.
 * See supabase/class_lesson_overrides.sql for the full data-model rationale.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

async function canRead(supabase: Awaited<ReturnType<typeof createClient>>, classId: string, userId: string) {
  const [teacherCheck, memberCheck] = await Promise.all([
    supabase.from('classes').select('id').eq('id', classId).eq('teacher_id', userId).maybeSingle(),
    supabase.from('class_members').select('class_id').eq('class_id', classId).eq('student_id', userId).maybeSingle(),
  ])
  return !!teacherCheck.data || !!memberCheck.data
}

async function ownsClass(supabase: Awaited<ReturnType<typeof createClient>>, classId: string, userId: string) {
  const { data } = await supabase.from('classes').select('id').eq('id', classId).eq('teacher_id', userId).maybeSingle()
  return !!data
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const classId   = req.nextUrl.searchParams.get('classId')
  const lessonKey = req.nextUrl.searchParams.get('lessonKey')
  if (!classId || !lessonKey) return NextResponse.json({ error: 'classId and lessonKey required' }, { status: 400 })

  if (!(await canRead(supabase, classId, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: overrides, error } = await supabase
    .from('class_lesson_overrides')
    .select('scope, target_id, override_data, updated_at')
    .eq('class_id', classId)
    .eq('lesson_key', lessonKey)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ overrides: overrides ?? [] })
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: {
    classId?: string; lessonKey?: string
    scope?: 'world' | 'stage'; targetId?: string; overrideData?: Record<string, unknown>
  }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { classId, lessonKey, scope, targetId, overrideData } = body
  if (!classId || !lessonKey || !scope || !targetId || !overrideData) {
    return NextResponse.json({ error: 'classId, lessonKey, scope, targetId, and overrideData are all required' }, { status: 400 })
  }
  if (scope !== 'world' && scope !== 'stage') {
    return NextResponse.json({ error: "scope must be 'world' or 'stage'" }, { status: 400 })
  }

  if (!(await ownsClass(supabase, classId, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase
    .from('class_lesson_overrides')
    .upsert({
      class_id:      classId,
      lesson_key:    lessonKey,
      scope,
      target_id:     targetId,
      override_data: overrideData,
      updated_by:    user.id,
      updated_at:    new Date().toISOString(),
    }, { onConflict: 'class_id,lesson_key,scope,target_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const classId   = req.nextUrl.searchParams.get('classId')
  const lessonKey = req.nextUrl.searchParams.get('lessonKey')
  const scope     = req.nextUrl.searchParams.get('scope')
  const targetId  = req.nextUrl.searchParams.get('targetId')
  if (!classId || !lessonKey || !scope || !targetId) {
    return NextResponse.json({ error: 'classId, lessonKey, scope, and targetId required' }, { status: 400 })
  }

  if (!(await ownsClass(supabase, classId, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase
    .from('class_lesson_overrides')
    .delete()
    .eq('class_id', classId)
    .eq('lesson_key', lessonKey)
    .eq('scope', scope)
    .eq('target_id', targetId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
