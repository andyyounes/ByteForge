// @ts-nocheck
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const InviteSchema = z.object({
  classId: z.string().uuid(),
  emails:  z.array(z.string().email()).min(1).max(50),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Auth — teachers only
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role, name').eq('id', user.id).single()
  if (profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = InviteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { classId, emails } = parsed.data

  // Get class info
  const admin = await createAdminClient()
  const { data: cls } = await admin
    .from('classes')
    .select('name, join_code')
    .eq('id', classId)
    .eq('teacher_id', user.id)
    .single()

  if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })

  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const joinUrl  = `${appUrl}/join?code=${cls.join_code}`
  const resendKey = process.env.RESEND_API_KEY

  if (!resendKey || resendKey === 're_your_key_here') {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured in .env.local' }, { status: 500 })
  }

  const results: { email: string; ok: boolean; error?: string }[] = []

  for (const email of emails) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:    'ByteForge <onboarding@resend.dev>',
        to:      [email],
        subject: `You're invited to join ${cls.name} on ByteForge ⚡`,
        html:    buildEmailHtml({
          className:   cls.name,
          teacherName: profile.name,
          joinCode:    cls.join_code,
          joinUrl,
        }),
      }),
    })

    if (res.ok) {
      results.push({ email, ok: true })
    } else {
      const err = await res.json()
      results.push({ email, ok: false, error: err.message ?? 'Failed' })
    }
  }

  const sent   = results.filter(r => r.ok).length
  const failed = results.filter(r => !r.ok)

  return NextResponse.json({ sent, failed, total: emails.length })
}

// ── Email HTML template ───────────────────────────────────────────────────────

function buildEmailHtml({
  className,
  teacherName,
  joinCode,
  joinUrl,
}: {
  className:   string
  teacherName: string
  joinCode:    string
  joinUrl:     string
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <style>
    body { margin:0; padding:0; background:#0d1117; font-family:Inter,system-ui,sans-serif; color:#e6edf3; }
    .wrapper { max-width:520px; margin:40px auto; padding:0 16px; }
    .card { background:#161b22; border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:40px; }
    .logo { font-size:32px; text-align:center; margin-bottom:8px; }
    .brand { text-align:center; font-size:22px; font-weight:700; color:#e6edf3; margin-bottom:32px; }
    h1 { font-size:20px; font-weight:600; margin:0 0 12px; }
    p { color:#8b949e; font-size:14px; line-height:1.6; margin:0 0 20px; }
    .code-box { background:#0d1117; border:2px dashed rgba(255,255,255,0.16); border-radius:12px; padding:20px; text-align:center; margin:24px 0; }
    .code { font-family:'Courier New',monospace; font-size:32px; font-weight:700; letter-spacing:8px; color:#e6edf3; }
    .code-label { font-size:11px; color:#8b949e; margin-top:6px; text-transform:uppercase; letter-spacing:1px; }
    .btn { display:block; background:#06b6d4; color:#0d1117; text-decoration:none; font-weight:700; font-size:15px; text-align:center; padding:14px 32px; border-radius:12px; margin:24px 0; }
    .footer { text-align:center; font-size:12px; color:#484f58; margin-top:24px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="logo">⚡</div>
      <div class="brand">ByteForge</div>

      <h1>You're invited to join a class!</h1>
      <p><strong style="color:#e6edf3">${teacherName}</strong> has invited you to join <strong style="color:#e6edf3">${className}</strong> on ByteForge — an adaptive ICT learning platform.</p>

      <div class="code-box">
        <div class="code">${joinCode}</div>
        <div class="code-label">Your class join code</div>
      </div>

      <a href="${joinUrl}" class="btn">Join Class →</a>

      <p>Click the button above or enter the join code when you sign up at <a href="${joinUrl}" style="color:#06b6d4">byteforge.app</a>.</p>
      <p style="font-size:12px;color:#484f58">If you didn't expect this email, you can safely ignore it.</p>
    </div>
    <div class="footer">ByteForge · ICT Learning Platform</div>
  </div>
</body>
</html>
`.trim()
}
