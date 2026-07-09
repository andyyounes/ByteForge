/**
 * POST /api/teacher/create-exercises-from-book
 *
 * Reads all generated_lessons for a class and converts their questions
 * into short-answer exercises in the exercises table.
 *
 * Body: { classId: string }
 * Returns: { created: number, skipped: number }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'teacher')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { classId } = await req.json().catch(() => ({})) as { classId?: string }
  if (!classId) return NextResponse.json({ error: 'classId required' }, { status: 400 })

  // Verify teacher owns class
  const { data: cls } = await supabase
    .from('classes').select('id, name').eq('id', classId).eq('teacher_id', user.id).single()
  if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })

  // Load all generated lessons for this class
  const admin = await createAdminClient()
  const { data: lessons } = await admin
    .from('generated_lessons')
    .select('topic_key, title, chapter_num, section_num, content')
    .eq('class_id', classId)
    .order('chapter_num', { ascending: true })

  if (!lessons?.length)
    return NextResponse.json({ error: 'No generated lessons found for this class' }, { status: 422 })

  let created = 0
  let skipped = 0

  for (const lesson of lessons) {
    const questions = (lesson.content as Record<string, unknown>)?.questions as unknown[]
    if (!Array.isArray(questions) || questions.length === 0) { skipped++; continue }

    const syllabusRef = `class:${classId}:${lesson.topic_key}`

    // Skip if exercise already exists for this class+topic
    const { data: existing } = await admin
      .from('exercises')
      .select('id')
      .eq('syllabus_ref', syllabusRef)
      .maybeSingle()

    if (existing) { skipped++; continue }

    await admin.from('exercises').insert({
      title:        `${lesson.title || lesson.topic_key} — Practice`,
      type:         'short-answer',
      difficulty:   2,
      xp_reward:    50,
      description:  `Exam-style practice questions for ${lesson.title || lesson.topic_key}`,
      config:       { questions },
      draft_status: 'pending',   // teacher reviews before publishing
      syllabus_ref: syllabusRef,
      sort_order:   (lesson.chapter_num ?? 0) * 100 + (lesson.section_num ?? 0),
    })

    created++
  }

  return NextResponse.json({ created, skipped, total: lessons.length })
}
