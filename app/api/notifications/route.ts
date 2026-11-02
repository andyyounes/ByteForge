import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── GET /api/notifications ───────────────────────────────────────────────────
// Returns the signed-in user's most recent notifications, newest first.

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, title, body, data, read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) {
    console.error('[notifications GET]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ notifications: data ?? [] })
}

// ── PATCH /api/notifications ──────────────────────────────────────────────────
// Body: { id: string } marks one notification read, { all: true } marks every
// unread notification for this user read.

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))

  const query = supabase.from('notifications').update({ read: true }).eq('user_id', user.id)
  const { error } = body.all
    ? await query.eq('read', false)
    : body.id
      ? await query.eq('id', body.id)
      : { error: { message: 'id or all required' } }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
