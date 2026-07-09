import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── GET /api/profile ──────────────────────────────────────────────────────────
// Returns lightweight profile info including the student's primary class_id.
// Used by static lesson pages to discover which class they belong to.
export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, role, grade, stage')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // Fetch primary class (most recent membership)
  const { data: membership } = await supabase
    .from('class_members')
    .select('class_id')
    .eq('student_id', user.id)
    .order('joined_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({
    ...profile,
    classId: membership?.class_id ?? null,
  })
}

// ── PATCH /api/profile ────────────────────────────────────────────────────────
// Updates editable profile fields (name, avatar_url) for the authenticated user.

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const updates: Record<string, string> = {}

  if ('name' in body) {
    if (typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json({ error: 'Name must be a non-empty string' }, { status: 400 })
    }
    updates.name = body.name.trim().slice(0, 100)
  }

  if ('avatar_url' in body) {
    if (body.avatar_url !== null && typeof body.avatar_url !== 'string') {
      return NextResponse.json({ error: 'avatar_url must be a string or null' }, { status: 400 })
    }
    updates.avatar_url = body.avatar_url as string
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}
