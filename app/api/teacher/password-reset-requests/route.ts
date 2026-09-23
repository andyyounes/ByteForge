/**
 * GET   /api/teacher/password-reset-requests — pending requests addressed to this teacher
 * PATCH /api/teacher/password-reset-requests — approve (sets a new password) or decline
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()
  const { data: requests } = await admin
    .from('password_reset_requests')
    .select('id, created_at, student:profiles!student_id(id, name, email)')
    .eq('teacher_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  return NextResponse.json({ requests: requests ?? [] })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { requestId, action, newPassword } = await request.json() as {
    requestId:   string
    action:      'approve' | 'decline'
    newPassword?: string   // required for 'approve'
  }
  if (!requestId || !['approve', 'decline'].includes(action)) {
    return NextResponse.json({ error: 'requestId and action required' }, { status: 400 })
  }

  const admin = await createAdminClient()

  const { data: req } = await admin
    .from('password_reset_requests')
    .select('id, student_id, teacher_id, status')
    .eq('id', requestId)
    .maybeSingle()

  if (!req || req.teacher_id !== user.id) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }
  if (req.status !== 'pending') {
    return NextResponse.json({ error: 'Request already handled' }, { status: 409 })
  }

  if (action === 'decline') {
    await admin
      .from('password_reset_requests')
      .update({ status: 'declined', reviewed_at: new Date().toISOString() })
      .eq('id', requestId)
    return NextResponse.json({ ok: true, status: 'declined' })
  }

  // ── Approve — set the new password directly, no email involved ─────────────
  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: 'A new password of at least 6 characters is required' }, { status: 400 })
  }

  const { error: pwError } = await admin.auth.admin.updateUserById(req.student_id, { password: newPassword })
  if (pwError) return NextResponse.json({ error: pwError.message }, { status: 500 })

  await admin
    .from('password_reset_requests')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', requestId)

  return NextResponse.json({ ok: true, status: 'approved' })
}
