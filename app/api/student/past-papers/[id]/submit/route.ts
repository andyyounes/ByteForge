/**
 * POST /api/student/past-papers/[id]/submit
 *
 * Accepts the student's answers, scores each one against the mark
 * scheme using keyword matching + Groq AI, stores the submission,
 * and returns per-question feedback + total score.
 *
 * Body: { classId, answers: [{ num, answer }] }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 60

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// ── Keyword scorer (same logic as as-level.html checkAnswers) ──────────────
function keywordScore(answer: string, markScheme: string): number {
  if (!markScheme.trim()) return 0
  const stopWords = new Set(['the','and','for','that','this','with','have','from','they','will','been','which','when','what','into','than','more','also','its','not','are','was','has','can','but','all','one','out','use','how'])
  const extract = (text: string) =>
    text.toLowerCase().match(/\b[a-z]{4,}\b/g)?.filter(w => !stopWords.has(w)) ?? []

  const msWords   = new Set(extract(markScheme))
  const ansWords  = extract(answer)
  if (msWords.size === 0) return 0
  const hits = ansWords.filter(w => msWords.has(w)).length
  return Math.min(hits / msWords.size, 1)
}

async function groqScore(
  questionStem: string,
  markScheme: string,
  studentAnswer: string,
  maxMarks: number,
  attempt = 0
): Promise<{ score: number; comment: string }> {
  const key = process.env.GROQ_API_KEY
  if (!key) return { score: 0, comment: 'AI scoring unavailable' }

  const prompt = `You are a Cambridge Computer Science marker. Score this student answer.

Question: ${questionStem}
Max marks: ${maxMarks}
Mark scheme: ${markScheme}
Student answer: ${studentAnswer}

Award marks strictly per the mark scheme. Each mark requires a distinct point.
Return ONLY JSON (no markdown):
{ "score": <integer 0-${maxMarks}>, "comment": "<one concise sentence: what they got right and what was missing>" }`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.1,
    }),
  })

  if (res.status === 429) {
    if (attempt >= 2) return { score: 0, comment: 'Marking delayed — rate limit' }
    const body = await res.json().catch(() => ({}))
    const match = (body?.error?.message ?? '').match(/try again in (\d+(?:\.\d+)?)s/i)
    await sleep(match ? Math.ceil(parseFloat(match[1])) * 1000 + 300 : 8_000)
    return groqScore(questionStem, markScheme, studentAnswer, maxMarks, attempt + 1)
  }

  if (!res.ok) return { score: 0, comment: 'Marking error' }

  const data = await res.json()
  const raw  = (data.choices?.[0]?.message?.content ?? '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

  try {
    const parsed = JSON.parse(raw) as { score: number; comment: string }
    return {
      score:   Math.max(0, Math.min(maxMarks, Math.round(parsed.score))),
      comment: parsed.comment ?? '',
    }
  } catch {
    return { score: 0, comment: 'Could not parse AI response' }
  }
}

// ── Badge from score ratio ─────────────────────────────────────────────────
function badge(score: number, max: number) {
  if (max === 0) return 'skip'
  const r = score / max
  if (r >= 0.85) return 'full'
  if (r >= 0.5)  return 'partial'
  return 'low'
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as {
    classId?: string
    answers?: { num: number | string; answer: string }[]
  }
  const { classId, answers = [] } = body
  if (!classId) return NextResponse.json({ error: 'classId required' }, { status: 400 })

  // Verify student is in the class
  const admin = await createAdminClient()
  const { data: membership } = await admin
    .from('class_members')
    .select('student_id')
    .eq('class_id', classId)
    .eq('student_id', user.id)
    .single()
  if (!membership) return NextResponse.json({ error: 'Not in class' }, { status: 403 })

  // Fetch the paper
  const { data: paper } = await admin
    .from('past_papers')
    .select('id, class_id, questions, total_marks, assigned')
    .eq('id', id)
    .single()
  if (!paper) return NextResponse.json({ error: 'Paper not found' }, { status: 404 })
  if (!paper.assigned) return NextResponse.json({ error: 'Paper not yet assigned' }, { status: 403 })
  if (paper.class_id !== classId) return NextResponse.json({ error: 'Wrong class' }, { status: 403 })

  type Question = { num: number | string; stem: string; marks: number; ms: string }
  const questions: Question[] = paper.questions as Question[] ?? []
  const answerMap = Object.fromEntries(answers.map(a => [String(a.num), a.answer ?? '']))

  // Score each question
  const feedback: { num: number | string; score: number; maxScore: number; badge: string; comment: string }[] = []
  let totalScore = 0

  for (const q of questions) {
    const studentAnswer = answerMap[String(q.num)] ?? ''
    let score   = 0
    let comment = ''

    if (!studentAnswer.trim()) {
      comment = 'No answer given.'
      score   = 0
    } else if (q.ms) {
      const result = await groqScore(q.stem, q.ms, studentAnswer, q.marks)
      score   = result.score
      comment = result.comment

      // Fallback keyword credit
      if (score === 0) {
        const kw = keywordScore(studentAnswer, q.ms)
        if (kw >= 0.35) { score = Math.max(1, Math.floor(q.marks * 0.4)); comment += ' (partial keyword credit)' }
      }
    } else {
      const kw = keywordScore(studentAnswer, q.stem)
      score   = kw >= 0.5 ? q.marks : kw >= 0.25 ? Math.max(1, Math.floor(q.marks * 0.5)) : 0
      comment = 'Mark scheme not available — scored by keyword matching.'
    }

    totalScore += score
    feedback.push({ num: q.num, score, maxScore: q.marks, badge: badge(score, q.marks), comment })
  }

  // Upsert submission
  const { data: submission, error } = await admin
    .from('past_paper_submissions')
    .upsert({
      past_paper_id: id,
      student_id:    user.id,
      class_id:      classId,
      answers,
      feedback,
      score:         totalScore,
      total_marks:   paper.total_marks,
      submitted_at:  new Date().toISOString(),
    }, { onConflict: 'past_paper_id,student_id' })
    .select('id, score, total_marks, feedback, submitted_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const pct = paper.total_marks > 0 ? Math.round((totalScore / paper.total_marks) * 100) : 0

  return NextResponse.json({ submission, score: totalScore, totalMarks: paper.total_marks, pct, feedback })
}
