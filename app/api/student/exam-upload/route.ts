/**
 * POST /api/student/exam-upload — a student uploads a real image to use in
 * a hands-on exam (e.g. Grade 8's recipe page). Multipart form: file.
 * Stores in the public `lesson-media` bucket (same bucket the teacher
 * upload route uses) under a student-scoped path, and returns { url }.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const BUCKET    = 'lesson-media'
const MAX_BYTES = 4 * 1024 * 1024   // 4 MB — a recipe photo, not a video
const ALLOWED   = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'file required' }, { status: 400 })
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: 'Only PNG, JPEG, GIF or WebP images are allowed' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image too large (max 4 MB)' }, { status: 400 })
  }

  const admin = await createAdminClient()

  // Ensure the bucket exists (no-op if it already does — same pattern as
  // app/api/teacher/upload-image/route.ts).
  await admin.storage.createBucket(BUCKET, { public: true }).catch(() => {})

  const ext  = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '')
  const path = `student-exam/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const bytes = Buffer.from(await file.arrayBuffer())
  const { error } = await admin.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type,
    upsert:      false,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ url: pub.publicUrl })
}
