import { NextRequest, NextResponse } from 'next/server'

// POST /api/ai-check
// Proxies a Groq chat-completion request server-side so the API key
// never appears in browser code. Called by static lesson pages.
export async function POST(req: NextRequest) {
  const key = process.env.GROQ_API_KEY
  if (!key) {
    return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await groqRes.json()
    return NextResponse.json(data, { status: groqRes.status })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
