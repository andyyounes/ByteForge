/**
 * POST /api/teacher/generate-unit-exam
 *
 * Generates a chapter unit exam from the existing generated_lessons
 * for that chapter. Stores it in unit_exams with status = 'pending'
 * so the teacher can review before releasing to students.
 *
 * Body: { classId, chapterNum }
 * Returns: { examId, title, questions }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime     = 'nodejs'
export const maxDuration = 120

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function callGroq(prompt: string, attempt = 0): Promise<string> {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY not configured')

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method:  'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model:       'openai/gpt-oss-20b',
      messages: [
        {
          role:    'system',
          content: 'You are a Cambridge AS/A Level Computer Science examiner. Generate structured JSON exam content. Cambridge 9618 style. Return ONLY valid JSON — no markdown fences.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens:  1200,
      temperature: 0.3,
    }),
  })

  if (res.status === 429) {
    if (attempt >= 4) throw new Error('Rate limited after 4 retries')
    const body  = await res.json().catch(() => ({}))
    const match = (body?.error?.message ?? '').match(/try again in (\d+(?:\.\d+)?)s/i)
    await sleep(match ? Math.ceil(parseFloat(match[1])) * 1000 + 500 : 20_000)
    return callGroq(prompt, attempt + 1)
  }

  if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 200)}`)

  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'teacher')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { classId, chapterNum } = await req.json().catch(() => ({})) as {
    classId?: string
    chapterNum?: number
  }

  if (!classId || chapterNum === undefined)
    return NextResponse.json({ error: 'classId and chapterNum required' }, { status: 400 })

  // Verify teacher owns class
  const { data: cls } = await supabase
    .from('classes').select('id, name').eq('id', classId).eq('teacher_id', user.id).single()
  if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })

  const admin = await createAdminClient()

  // Load all generated lessons for this chapter
  const { data: lessons } = await admin
    .from('generated_lessons')
    .select('topic_key, title, chapter_label, content')
    .eq('class_id', classId)
    .eq('chapter_num', chapterNum)
    .order('section_num', { ascending: true })

  if (!lessons?.length)
    return NextResponse.json({ error: 'No lessons found for this chapter — generate lessons first' }, { status: 422 })

  const chapterLabel = lessons[0]?.chapter_label ?? `Chapter ${chapterNum}`

  // Build a summary of all topics in the chapter for context
  const topicSummaries = lessons.map(l => {
    const c = l.content as Record<string, unknown>
    const terms = (c?.keyTerms as { name: string }[] | undefined)
      ?.map(k => k.name).join(', ') ?? ''
    return `- ${l.title}: key terms: ${terms}`
  }).join('\n')

  const prompt = `Chapter: ${chapterLabel}
Topics covered:
${topicSummaries}

Generate a Cambridge AS Level unit exam for this chapter with EXACTLY 10 questions total:
- 3 questions worth 1 mark each (short recall)
- 3 questions worth 2 marks each (explain/state)
- 3 questions worth 4 marks each (describe/discuss)
- 1 question worth 6 marks (extended response)

Return ONLY this JSON (no markdown):
{
  "title": "Chapter ${chapterNum} Unit Exam — ${chapterLabel}",
  "duration": 40,
  "totalMarks": 25,
  "questions": [
    {
      "num": 1,
      "stem": "question text",
      "marks": 1,
      "ms": "mark scheme answer [1]"
    }
  ]
}`

  const raw = await callGroq(prompt)
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

  let content: Record<string, unknown>
  try {
    content = JSON.parse(cleaned)
  } catch {
    return NextResponse.json({ error: `AI returned invalid JSON: ${raw.slice(0, 200)}` }, { status: 500 })
  }

  // Upsert (replace if already exists for this chapter)
  const { data: exam, error } = await admin
    .from('unit_exams')
    .upsert({
      class_id:      classId,
      chapter_num:   chapterNum,
      chapter_label: chapterLabel,
      title:         (content.title as string) ?? `Chapter ${chapterNum} Unit Exam`,
      content,
      status:        'pending',
    }, { onConflict: 'class_id,chapter_num' })
    .select('id, title, status')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ exam })
}
