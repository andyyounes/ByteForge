/**
 * GET  /api/lessons/[topicKey]?classId=xxx  — read lesson (student or teacher)
 * PUT  /api/lessons/[topicKey]              — update lesson (teacher only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// ── PUT — teacher saves edits ─────────────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ topicKey: string }> }
) {
  const { topicKey } = await params
  const supabase     = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    classId:      string
    title?:       string
    subtitle?:    string
    chapterLabel?: string
    content?: {
      keyTerms?:  { name: string; def: string }[]
      theory?:    string
      example?:   string
      questions?: { stem: string; marks: number; ms: string; img?: string; parts?: unknown[] }[]
      videos?:    { id: string; title: string; channel?: string }[]
      extras?:    { type: string; title?: string; html?: string; url?: string; caption?: string }[]
    }
  }

  const { classId, title, subtitle, chapterLabel, content } = body
  if (!classId) return NextResponse.json({ error: 'classId required' }, { status: 400 })

  // Only the teacher who owns the class may edit
  const { data: cls } = await supabase
    .from('classes')
    .select('id')
    .eq('id', classId)
    .eq('teacher_id', user.id)
    .maybeSingle()
  if (!cls) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Fetch existing lesson so we can merge content (don't wipe fields we didn't touch)
  const { data: existing } = await supabase
    .from('generated_lessons')
    .select('content, title, subtitle, chapter_label')
    .eq('class_id', classId)
    .eq('topic_key', topicKey)
    .maybeSingle()

  const mergedContent = { ...(existing?.content ?? {}), ...(content ?? {}) }

  // Upsert: classes without an uploaded book have no row yet — editing a
  // built-in lesson creates a class-specific copy on first save.
  const chapterNum = parseInt(topicKey.match(/^ch(\d+)-/)?.[1] ?? '') || null
  const { error } = await supabase
    .from('generated_lessons')
    .upsert({
      class_id:      classId,
      topic_key:     topicKey,
      chapter_num:   chapterNum,
      title:         title         ?? existing?.title,
      subtitle:      subtitle      ?? existing?.subtitle,
      chapter_label: chapterLabel  ?? existing?.chapter_label,
      content:       mergedContent,
    }, { onConflict: 'class_id,topic_key' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// ── GET — read lesson ─────────────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ topicKey: string }> }
) {
  const { topicKey } = await params
  const classId      = req.nextUrl.searchParams.get('classId')

  if (!classId) {
    return NextResponse.json({ error: 'classId required' }, { status: 400 })
  }

  const supabase = await createClient()

  // Verify requester is a member of this class (student or teacher)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Allow teacher who owns the class OR student who is a member
  const [teacherCheck, memberCheck] = await Promise.all([
    supabase.from('classes').select('id').eq('id', classId).eq('teacher_id', user.id).maybeSingle(),
    supabase.from('class_members').select('class_id').eq('class_id', classId).eq('student_id', user.id).maybeSingle(),
  ])

  if (!teacherCheck.data && !memberCheck.data) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: lesson, error } = await supabase
    .from('generated_lessons')
    .select('topic_key, title, subtitle, chapter_label, content')
    .eq('class_id', classId)
    .eq('topic_key', topicKey)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!lesson) {
    return NextResponse.json({ lesson: null })
  }

  // Return in the shape expected by loadTopic() in as-level.html
  return NextResponse.json({
    lesson: {
      title:    lesson.title,
      subtitle: lesson.subtitle,
      chapter:  lesson.chapter_label,
      ...lesson.content,   // keyTerms, theory, example, questions
    }
  })
}
