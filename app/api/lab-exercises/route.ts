/**
 * Teacher-authored Code Lab exercises (shown in students' a-level Code Lab).
 *
 * GET    /api/lab-exercises?classId=x — list (teacher-owner or class member)
 * POST   /api/lab-exercises           — create   (teacher only)
 * PUT    /api/lab-exercises           — update   (teacher only)
 * DELETE /api/lab-exercises?id=x      — delete   (teacher only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

async function teacherOwnsClass(classId: string, userId: string) {
  const admin = await createAdminClient()
  const { data } = await admin
    .from('classes').select('id').eq('id', classId).eq('teacher_id', userId).maybeSingle()
  return !!data
}

export async function GET(req: NextRequest) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const classId = req.nextUrl.searchParams.get('classId')
  if (!classId) return NextResponse.json({ error: 'classId required' }, { status: 400 })

  const admin = await createAdminClient()
  const [isTeacher, memberRes] = await Promise.all([
    teacherOwnsClass(classId, user.id),
    admin.from('class_members').select('class_id').eq('class_id', classId).eq('student_id', user.id).maybeSingle(),
  ])
  if (!isTeacher && !memberRes.data) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: exercises, error } = await admin
    .from('lab_exercises')
    .select('id, title, descr, expect, starter, xp, sort_order, override_key, category, created_at')
    .eq('class_id', classId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ exercises: exercises ?? [] })
}

export async function POST(req: NextRequest) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    classId: string; title?: string; descr?: string
    expect?: string[]; starter?: string; xp?: number
    overrideKey?: string   // e.g. 'rec/r1' — edits a built-in exercise for this class
    category?: string      // 'rec' | 'srt' | 'adt' | 'str' — where a custom exercise appears
  }
  if (!body.classId || !body.title?.trim() || !body.descr?.trim()) {
    return NextResponse.json({ error: 'classId, title and descr are required' }, { status: 400 })
  }
  if (!await teacherOwnsClass(body.classId, user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = await createAdminClient()
  const row = {
    class_id:     body.classId,
    title:        body.title.trim(),
    descr:        body.descr.trim(),
    expect:       Array.isArray(body.expect) ? body.expect.filter(l => l.trim() !== '') : [],
    starter:      body.starter?.trim() || null,
    xp:           Math.max(10, Math.min(500, body.xp ?? 50)),
    override_key: body.overrideKey?.trim() || null,
    category:     body.category?.trim() || null,
  }
  // Overrides upsert (one per built-in exercise per class); customs insert
  const { data, error } = row.override_key
    ? await admin.from('lab_exercises').upsert(row, { onConflict: 'class_id,override_key' }).select().single()
    : await admin.from('lab_exercises').insert(row).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ exercise: data })
}

export async function PUT(req: NextRequest) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    id: string; classId: string; title?: string; descr?: string
    expect?: string[]; starter?: string; xp?: number; category?: string
  }
  if (!body.id || !body.classId) {
    return NextResponse.json({ error: 'id and classId required' }, { status: 400 })
  }
  if (!await teacherOwnsClass(body.classId, user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = await createAdminClient()
  const { error } = await admin
    .from('lab_exercises')
    .update({
      title:   body.title?.trim(),
      descr:   body.descr?.trim(),
      expect:  Array.isArray(body.expect) ? body.expect.filter(l => l.trim() !== '') : [],
      starter:  body.starter?.trim() || null,
      xp:       Math.max(10, Math.min(500, body.xp ?? 50)),
      category: body.category?.trim() || null,
    })
    .eq('id', body.id)
    .eq('class_id', body.classId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id      = req.nextUrl.searchParams.get('id')
  const classId = req.nextUrl.searchParams.get('classId')
  if (!id || !classId) return NextResponse.json({ error: 'id and classId required' }, { status: 400 })
  if (!await teacherOwnsClass(classId, user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = await createAdminClient()
  const { error } = await admin.from('lab_exercises').delete().eq('id', id).eq('class_id', classId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
