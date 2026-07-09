/**
 * POST /api/teacher/past-papers/extract
 *
 * Takes a PDF file (multipart/form-data) and uses Groq to extract
 * questions and mark schemes as structured JSON.
 *
 * Form fields:
 *   file    — PDF binary
 *   classId — UUID
 *
 * Returns: { questions: [{ num, stem, marks, ms }], title, year, session, paperNum }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as pdfParse from 'pdf-parse'

export const runtime = 'nodejs'
export const maxDuration = 60

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function callGroq(prompt: string, attempt = 0): Promise<string> {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY not configured')

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert at parsing Cambridge Computer Science past paper PDFs. Extract questions and mark schemes into structured JSON. Return ONLY valid JSON — no markdown fences.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 4000,
      temperature: 0.1,
    }),
  })

  if (res.status === 429) {
    if (attempt >= 3) throw new Error('Rate limited')
    const body = await res.json().catch(() => ({}))
    const match = (body?.error?.message ?? '').match(/try again in (\d+(?:\.\d+)?)s/i)
    await sleep(match ? Math.ceil(parseFloat(match[1])) * 1000 + 500 : 15_000)
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

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  if (file.size > 15 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 15 MB)' }, { status: 413 })

  const buffer = Buffer.from(await file.arrayBuffer())
  let rawText = ''

  try {
    const parsed = await (pdfParse as unknown as (buf: Buffer) => Promise<{ text: string }>)(buffer)
    rawText = parsed.text
  } catch {
    return NextResponse.json({ error: 'Could not read PDF — ensure it is a text-based (not scanned) PDF' }, { status: 422 })
  }

  // Trim to ~12,000 chars to stay in Groq context
  const trimmed = rawText.slice(0, 12000)

  const prompt = `Below is the raw text extracted from a Cambridge Computer Science past paper PDF.
Extract ALL questions and their mark schemes into structured JSON.

Instructions:
- Each question gets its own object with: num (string like "1" or "1(a)" or "2(b)(i)"), stem (full question text), marks (integer), ms (mark scheme for that question — include all mark points)
- If the PDF has a separate mark scheme section, match each question to its marks
- If no mark scheme is present, set ms to "" (empty string)
- Infer the paper title, year, session (May/June / Oct/Nov / Feb/Mar), and paper number (e.g. "11", "21", "31") from the header text
- Ignore front matter, instructions, formulae pages — only extract actual questions

Return ONLY this JSON (no markdown):
{
  "title": "Paper title e.g. Cambridge AS Level Computer Science 9618 Paper 1",
  "year": "2023",
  "session": "May/June",
  "paperNum": "11",
  "questions": [
    {
      "num": "1",
      "stem": "Full question text here",
      "marks": 2,
      "ms": "Mark scheme answer here [1] each mark [1]"
    }
  ]
}

PDF TEXT:
${trimmed}`

  let raw = ''
  try {
    raw = await callGroq(prompt)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }

  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

  let parsed: {
    title?: string
    year?: string
    session?: string
    paperNum?: string
    questions?: { num: string | number; stem: string; marks: number; ms: string }[]
  }
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    return NextResponse.json({ error: `AI returned invalid JSON. Try entering questions manually.`, raw: raw.slice(0, 500) }, { status: 500 })
  }

  const questions = (parsed.questions ?? []).map((q, i) => ({
    num:   typeof q.num === 'number' ? q.num : parseInt(String(q.num)) || i + 1,
    stem:  q.stem ?? '',
    marks: q.marks ?? 1,
    ms:    q.ms ?? '',
  }))

  return NextResponse.json({
    title:    parsed.title    ?? file.name.replace('.pdf', ''),
    year:     parsed.year     ?? '',
    session:  parsed.session  ?? '',
    paperNum: parsed.paperNum ?? '',
    questions,
  })
}
