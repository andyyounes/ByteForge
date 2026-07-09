// @ts-nocheck
import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { extractTopicsFromText } from '@/lib/gemini'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData = await request.formData()
  const file      = formData.get('file') as File | null
  const classId   = formData.get('classId') as string
  const title     = formData.get('title') as string
  const rawText   = formData.get('rawText') as string | null  // optional manual text

  if (!classId) {
    return NextResponse.json({ error: 'Class is required' }, { status: 400 })
  }

  const { data: cls } = await supabase
    .from('classes')
    .select('id, name, level')
    .eq('id', classId)
    .eq('teacher_id', user.id)
    .single()

  if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })

  let extractedText = rawText ?? ''

  // ── Extract text from PDF ─────────────────────────────────────────────────
  const isPDF = file && (
    file.type === 'application/pdf' ||
    file.type === 'application/octet-stream' ||
    (file.name ?? '').toLowerCase().endsWith('.pdf')
  )

  if (isPDF) {
    try {
      const buffer = Buffer.from(await file!.arrayBuffer())

      // Spawn scripts/pdf-extract.mjs as a child process — it runs outside
      // webpack so pdfjs-dist / pdf-parse load correctly in plain Node.js.
      const { spawn }   = await import('child_process')
      const { resolve } = await import('path')
      const scriptPath  = resolve(process.cwd(), 'scripts/pdf-extract.mjs')

      extractedText = await new Promise<string>((res, rej) => {
        const child = spawn(process.execPath, [scriptPath], {
          stdio: ['pipe', 'pipe', 'pipe'],
        })

        let out = ''
        let errOut = ''
        child.stdout.on('data', (d: Buffer) => { out += d.toString() })
        child.stderr.on('data', (d: Buffer) => { errOut += d.toString() })

        child.on('close', (code: number) => {
          try {
            const result = JSON.parse(out)
            if (result.error) rej(new Error(result.error))
            else res(result.text ?? '')
          } catch {
            rej(new Error(errOut || `PDF extractor exited with code ${code}`))
          }
        })

        // Send PDF as base64 over stdin
        child.stdin.write(buffer.toString('base64'))
        child.stdin.end()
      })

      if (!extractedText.trim()) {
        return NextResponse.json({
          error: 'This PDF appears to be scanned (image-only) or copy-protected. ' +
                 'Try copying text from the book and using "Paste Text" instead.',
        }, { status: 422 })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[upload] PDF parse error:', msg)

      if (msg.includes('encrypt') || msg.includes('password') || msg.includes('protected')) {
        return NextResponse.json({
          error: 'This PDF is password-protected or DRM-encrypted. ' +
                 'Copy the text from the book manually and use "Paste Text" instead.',
        }, { status: 422 })
      }

      return NextResponse.json({
        error: `Could not read PDF: ${msg.slice(0, 120)}. Try pasting the text directly.`,
      }, { status: 422 })
    }
  }

  if (!extractedText.trim()) {
    return NextResponse.json({ error: 'No content to extract from' }, { status: 422 })
  }

  // ── Save curriculum source ────────────────────────────────────────────────
  const admin = await createAdminClient()
  const { data: source, error: srcErr } = await admin
    .from('curriculum_sources')
    .insert({
      teacher_id: user.id,
      class_id:   classId,
      title:      title || (file?.name ?? 'Uploaded resource'),
      raw_text:   extractedText,  // no cap — Supabase TEXT holds unlimited content
    })
    .select('id')
    .single()

  if (srcErr) {
    return NextResponse.json({ error: srcErr.message }, { status: 500 })
  }

  // ── AI topic extraction ───────────────────────────────────────────────────
  console.log('[upload] Extracting topics from', title)
  const topics = await extractTopicsFromText(
    extractedText,
    `Class: ${cls.name}. Level: ${cls.level}. Resource: ${title}`
  )

  // ── Save topics ───────────────────────────────────────────────────────────
  if (topics.length > 0) {
    const topicRows = topics.map(t => ({
      source_id:  source.id,
      teacher_id: user.id,
      class_id:   classId,
      name:       t.name,
      description: t.description,
    }))

    await admin.from('topics').insert(topicRows)
  }

  return NextResponse.json({
    sourceId:   source.id,
    topicCount: topics.length,
    topics,
  })
}
