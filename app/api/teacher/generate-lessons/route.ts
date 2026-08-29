/**
 * POST /api/teacher/generate-lessons
 *
 * Takes an existing curriculum_source (already uploaded) and generates
 * structured lesson content for each chapter section using Groq.
 * Stores results in generated_lessons, keyed by class_id + topic_key.
 *
 * Body: { sourceId: string, classId: string }
 * Returns: { generated: number, skipped: number, lessons: { topicKey, title }[] }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { splitBook } from '@/lib/book-chunker'

export const runtime     = 'nodejs'
export const maxDuration = 300  // 5 min — rate limit retries need time

// ── Groq helper ───────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function generateLesson(chunk: {
  chapterLabel: string
  title: string
  text: string
}, attempt = 0): Promise<{ subtitle?: string; [key: string]: unknown }> {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY not configured')

  const systemPrompt = `You are an educational content generator for Cambridge AS/A Level Computer Science (syllabus 9618).
Produce structured JSON lesson content. Be concise. Use Cambridge exam terminology.`

  // Keep text short — free tier limit is 6000 TPM, ~2000 tokens per call
  const userPrompt = `Topic: ${chunk.title} (${chunk.chapterLabel})

Textbook excerpt:
${chunk.text.slice(0, 2000)}

Return ONLY a JSON object (no markdown):
{"subtitle":"one-line topic description","keyTerms":[{"name":"term","def":"definition"}],"theory":"<p>2-3 paragraphs HTML</p>","example":"<p><strong>Example:</strong> one worked example</p>","questions":[{"stem":"exam question","marks":2,"parts":[],"textarea":true,"ms":"mark scheme [1] for X"}]}

Rules: 4-6 keyTerms, 3 questions, Cambridge style, [1] notation in ms.`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model:       'llama-3.1-8b-instant',
      messages:    [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      max_tokens:  800,
      temperature: 0.3,
    }),
  })

  // ── Rate limit: wait the suggested time then retry ─────────────────────
  if (res.status === 429) {
    if (attempt >= 4) throw new Error('Rate limited after 4 retries')
    const errBody = await res.json().catch(() => ({}))
    const msg     = errBody?.error?.message ?? ''
    const waitMatch = msg.match(/try again in (\d+(?:\.\d+)?)s/i)
    const waitMs    = waitMatch ? Math.ceil(parseFloat(waitMatch[1])) * 1000 + 500 : 20_000
    console.log(`[generate-lessons] rate limited — waiting ${waitMs}ms then retrying ${chunk.title}`)
    await sleep(waitMs)
    return generateLesson(chunk, attempt + 1)
  }

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq error ${res.status}: ${err.slice(0, 200)}`)
  }

  const data    = await res.json()
  const raw     = data.choices?.[0]?.message?.content ?? ''
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    throw new Error(`JSON parse failed: ${raw.slice(0, 200)}`)
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const { sourceId, classId, startFrom = 0 } = body as { sourceId?: string; classId?: string; startFrom?: number }

  if (!sourceId || !classId) {
    return NextResponse.json({ error: 'sourceId and classId required' }, { status: 400 })
  }

  // Verify teacher owns this class
  const { data: cls } = await supabase
    .from('classes').select('id, level').eq('id', classId).eq('teacher_id', user.id).single()
  if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })

  // Determine chapter range from class level
  // A Level (level = 'a-level' or 'a_level') → chapters 16-25
  // AS Level (default)                        → chapters 1-15
  const isALevel = cls.level === 'a-level' || cls.level === 'a_level'
  const chMin = isALevel ? 16 : 1
  const chMax = isALevel ? 25 : 15

  // Load the curriculum source
  const { data: source } = await supabase
    .from('curriculum_sources')
    .select('id, raw_text, title')
    .eq('id', sourceId)
    .eq('teacher_id', user.id)
    .single()

  if (!source?.raw_text?.trim()) {
    return NextResponse.json({ error: 'Source has no text content' }, { status: 422 })
  }

  // Split book into chapter sections, filtering to the correct paper range
  const allChunks = splitBook(source.raw_text)
  const chunks    = allChunks.filter(c => c.chapterNum >= chMin && c.chapterNum <= chMax)
  console.log(`[generate-lessons] text length: ${source.raw_text.length}, total chunks: ${allChunks.length}, level: ${cls.level}, filtered (ch${chMin}-${chMax}): ${chunks.length}`)

  if (chunks.length === 0) {
    return NextResponse.json({
      error: isALevel
        ? `Could not extract A Level chapters (${chMin}–${chMax}) from this book. The book may not contain those chapters, or they may not be labelled "Chapter ${chMin}" etc. Found ${allChunks.length} total sections across chapters: ${[...new Set(allChunks.map(c => c.chapterNum))].sort((a,b)=>a-b).join(', ')}`
        : `Could not extract any AS Level sections (chapters 1–15) from the book. Found chapters: ${[...new Set(allChunks.map(c => c.chapterNum))].sort((a,b)=>a-b).join(', ')}`,
    }, { status: 422 })
  }

  const admin     = await createAdminClient()
  const generated: { topicKey: string; title: string }[] = []
  const errors:    { topicKey: string; error: string }[] = []
  let   skipped   = 0

  // On the first call (startFrom=0) purge any lessons outside the valid chapter range
  // for this class — cleans up stale lessons from a previous wrong-range generation.
  if (startFrom === 0) {
    await admin
      .from('generated_lessons')
      .delete()
      .eq('class_id', classId)
      .or(`chapter_num.lt.${chMin},chapter_num.gt.${chMax}`)
    console.log(`[generate-lessons] purged stale lessons outside ch${chMin}-${chMax} for class ${classId}`)
  }

  // Process up to 30 sections per call starting from offset.
  // Caller can pass startFrom to page through a large book across multiple calls.
  const toProcess = chunks.slice(startFrom, startFrom + 30)

  for (const chunk of toProcess) {
    // Skip if lesson already exists for this class+topic
    const { data: existing } = await admin
      .from('generated_lessons')
      .select('id')
      .eq('class_id', classId)
      .eq('topic_key', chunk.topicKey)
      .maybeSingle()

    if (existing) { skipped++; continue }

    try {
      const content = await generateLesson(chunk)

      await admin.from('generated_lessons').upsert({
        class_id:      classId,
        source_id:     sourceId,
        topic_key:     chunk.topicKey,
        chapter_num:   chunk.chapterNum,
        section_num:   chunk.sectionNum,
        title:         chunk.title,
        subtitle:      content.subtitle ?? '',
        chapter_label: chunk.chapterLabel,
        content,
      }, { onConflict: 'class_id,topic_key' })

      generated.push({ topicKey: chunk.topicKey, title: chunk.title })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`[generate-lessons] ${chunk.topicKey}:`, msg)
      errors.push({ topicKey: chunk.topicKey, error: msg.slice(0, 200) })
    }
  }

  const nextFrom = startFrom + toProcess.length
  return NextResponse.json({
    generated:  generated.length,
    skipped,
    errors:     errors.length,
    lessons:    generated,
    chunks:     chunks.length,
    hasMore:    nextFrom < chunks.length,
    nextFrom,
  })
}
