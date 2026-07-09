// ByteForge — lightweight AI proxy for static HTML pages
// Keeps the GROQ_API_KEY on the server; static pages just POST here.
import { NextResponse, type NextRequest } from 'next/server'
import Groq from 'groq-sdk'

export async function POST(request: NextRequest) {
  const key = process.env.GROQ_API_KEY
  if (!key || key === 'your_groq_key_here') {
    return NextResponse.json(
      { error: 'GROQ_API_KEY is not configured in .env.local' },
      { status: 500 }
    )
  }

  let body: { prompt?: string; maxTokens?: number } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { prompt, maxTokens = 3000 } = body
  if (!prompt || typeof prompt !== 'string') {
    return NextResponse.json({ error: 'prompt is required' }, { status: 422 })
  }

  try {
    const groq = new Groq({ apiKey: key })
    const completion = await groq.chat.completions.create({
      model:            'llama-3.3-70b-versatile',
      temperature:      0.4,
      max_tokens:       Math.min(maxTokens, 4096),
      response_format:  { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are an expert Cambridge Computer Science teacher. ' +
            'Always respond with valid JSON only — no markdown fences, no explanation.',
        },
        { role: 'user', content: prompt },
      ],
    })

    const text = completion.choices[0]?.message?.content ?? '{}'
    return NextResponse.json({ text })

  } catch (err: unknown) {
    console.error('[/api/ai/generate]', err)
    return NextResponse.json(
      { error: (err as Error)?.message ?? 'AI generation failed' },
      { status: 500 }
    )
  }
}
