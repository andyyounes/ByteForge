// ── Email helpers (Resend) ────────────────────────────────────────────────────
// Uses the same raw Resend API pattern as /api/classes/invite.
// All senders are fire-safe: failures are logged, never thrown, so an email
// outage can't break the flow that triggered it.

export async function sendEmail({ to, subject, html }: {
  to:      string
  subject: string
  html:    string
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  if (!key || key === 're_your_key_here') return false

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from: 'ByteForge <onboarding@resend.dev>',
        to:   [to],
        subject,
        html,
      }),
    })
    if (!res.ok) {
      console.error('[email] send failed:', (await res.json().catch(() => ({})))?.message ?? res.status)
    }
    return res.ok
  } catch (e) {
    console.error('[email] send error:', (e as Error).message)
    return false
  }
}

// ── Join-request notification for teachers ────────────────────────────────────

export function joinRequestEmailHtml({ teacherName, studentName, studentEmail, grade, className, dashboardUrl }: {
  teacherName:  string
  studentName:  string
  studentEmail: string
  grade:        string | null
  className:    string | null
  dashboardUrl: string
}) {
  const gradeLine = grade ? ` · Grade ${grade}` : ''
  const target    = className
    ? `wants to join <strong style="color:#e6edf3">${className}</strong>`
    : `asked to join one of your classes — you pick which one when approving`

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
    .student-box { background:#0d1117; border:1px solid rgba(255,255,255,0.12); border-radius:12px; padding:16px 20px; margin:24px 0; }
    .student-name { font-size:16px; font-weight:700; color:#e6edf3; }
    .student-meta { font-size:13px; color:#8b949e; margin-top:4px; }
    .btn { display:block; background:#06b6d4; color:#0d1117; text-decoration:none; font-weight:700; font-size:15px; text-align:center; padding:14px 32px; border-radius:12px; margin:24px 0; }
    .footer { text-align:center; font-size:12px; color:#484f58; margin-top:24px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="logo">🔔</div>
      <div class="brand">ByteForge</div>

      <h1>New join request</h1>
      <p>Hi ${teacherName}, a student ${target}.</p>

      <div class="student-box">
        <div class="student-name">${studentName}</div>
        <div class="student-meta">${studentEmail}${gradeLine}</div>
      </div>

      <a href="${dashboardUrl}" class="btn">Review request →</a>

      <p style="font-size:12px;color:#484f58">Approve or decline from your teacher dashboard. If you don't recognise this student, just decline the request.</p>
    </div>
    <div class="footer">ByteForge · ICT Learning Platform</div>
  </div>
</body>
</html>
`.trim()
}

// ── Password reset request notification for teachers ──────────────────────────
// Same shape as joinRequestEmailHtml — this is the notify-only half of the
// flow; the teacher still sets the actual new password from their dashboard,
// never over email, so there's no reset link or token in this message at all.

export function passwordResetRequestEmailHtml({ teacherName, studentName, studentEmail, dashboardUrl }: {
  teacherName:  string
  studentName:  string
  studentEmail: string
  dashboardUrl: string
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
    .student-box { background:#0d1117; border:1px solid rgba(255,255,255,0.12); border-radius:12px; padding:16px 20px; margin:24px 0; }
    .student-name { font-size:16px; font-weight:700; color:#e6edf3; }
    .student-meta { font-size:13px; color:#8b949e; margin-top:4px; }
    .btn { display:block; background:#06b6d4; color:#0d1117; text-decoration:none; font-weight:700; font-size:15px; text-align:center; padding:14px 32px; border-radius:12px; margin:24px 0; }
    .footer { text-align:center; font-size:12px; color:#484f58; margin-top:24px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="logo">🔑</div>
      <div class="brand">ByteForge</div>

      <h1>Password reset requested</h1>
      <p>Hi ${teacherName}, a student is locked out and asked you to reset their password.</p>

      <div class="student-box">
        <div class="student-name">${studentName}</div>
        <div class="student-meta">${studentEmail}</div>
      </div>

      <a href="${dashboardUrl}" class="btn">Set a new password →</a>

      <p style="font-size:12px;color:#484f58">Approving from your dashboard lets you set a new password directly — hand it to the student in person, not over email. If you don't recognise this student, just decline the request.</p>
    </div>
    <div class="footer">ByteForge · ICT Learning Platform</div>
  </div>
</body>
</html>
`.trim()
}

// ── Exam result notification for teachers ──────────────────────────────────
// Same shape as the other teacher-notification emails above.

export function examResultEmailHtml({ teacherName, studentName, studentEmail, examLabel, passed, stars, dashboardUrl }: {
  teacherName:  string
  studentName:  string
  studentEmail: string
  examLabel:    string
  passed:       boolean
  stars:        number
  dashboardUrl: string
}) {
  const starLine = passed ? `${'⭐'.repeat(stars)}${'☆'.repeat(Math.max(0, 3 - stars))} &nbsp; (${stars} star${stars === 1 ? '' : 's'})` : 'Not passing yet'
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
    .student-box { background:#0d1117; border:1px solid rgba(255,255,255,0.12); border-radius:12px; padding:16px 20px; margin:24px 0; }
    .student-name { font-size:16px; font-weight:700; color:#e6edf3; }
    .student-meta { font-size:13px; color:#8b949e; margin-top:4px; }
    .stars { font-size:20px; margin-top:10px; }
    .btn { display:block; background:#06b6d4; color:#0d1117; text-decoration:none; font-weight:700; font-size:15px; text-align:center; padding:14px 32px; border-radius:12px; margin:24px 0; }
    .footer { text-align:center; font-size:12px; color:#484f58; margin-top:24px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="logo">${passed ? '🎯' : '📝'}</div>
      <div class="brand">ByteForge</div>

      <h1>${passed ? 'Exam submitted and passed' : 'Exam submitted'}</h1>
      <p>Hi ${teacherName}, here's the result for the ${examLabel}.</p>

      <div class="student-box">
        <div class="student-name">${studentName}</div>
        <div class="student-meta">${studentEmail}</div>
        <div class="stars">${starLine}</div>
      </div>

      <a href="${dashboardUrl}" class="btn">View in dashboard →</a>

      <p style="font-size:12px;color:#484f58">See the full grading breakdown, exam integrity info, and re-open the exam if needed from your class progress panel.</p>
    </div>
    <div class="footer">ByteForge · ICT Learning Platform</div>
  </div>
</body>
</html>
`.trim()
}
