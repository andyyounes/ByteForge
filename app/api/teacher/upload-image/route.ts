/**
 * POST /api/teacher/upload-image — teacher uploads an image/GIF for a lesson.
 * Multipart form: file, classId. Stores in the public `lesson-media` bucket
 * and returns { url } — a public URL usable in lesson content.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const BUCKET    = 'lesson-media'
const MAX_BYTES = 8 * 1024 * 1024   // 8 MB
const ALLOWED   = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form    = await req.formData()
  const file    = form.get('file') as File | null
  const classId = form.get('classId') as string | null

  if (!file || !classId) {
    return NextResponse.json({ error: 'file and classId required' }, { status: 400 })
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: 'Only PNG, JPEG, GIF, WebP or SVG images are allowed' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image too large (max 8 MB)' }, { status: 400 })
  }

  // Only the teacher who owns the class may upload
  const { data: cls } = await supabase
    .from('classes')
    .select('id')
    .eq('id', classId)
    .eq('teacher_id', user.id)
    .maybeSingle()
  if (!cls) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = await createAdminClient()

  // Ensure the bucket exists (no-op if it already does)
  await admin.storage.createBucket(BUCKET, { public: true }).catch(() => {})

  const ext  = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '')
  const path = `${classId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const bytes = Buffer.from(await file.arrayBuffer())
  const { error } = await admin.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type,
    upsert:      false,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ url: pub.publicUrl })
}
