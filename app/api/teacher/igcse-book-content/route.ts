// Teacher-only read endpoint for the IGCSE Y1 "book" lesson editor.
//
// GET ?classId=&file=<filename>  → { title, html, overridden }
//   Returns that one lesson's content (base file merged with the class's
//   override, if one exists) plus whether an override currently exists.
//
// GET ?classId=                  → { units: [...] } (no file param)
//   Returns the manifest grouped by unit, each lesson flagged with
//   `overridden` — used to render the sidebar list and its "edited" badges.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBookLessonContent, applyBookOverride, type BookOverrideRow } from '@/lib/igcse-book-content'
import { IGCSE_BOOK_UNITS, findBookLesson } from '@/lib/igcse-book-manifest'

export const runtime = 'nodejs'

async function ownsClass(supabase: Awaited<ReturnType<typeof createClient>>, classId: string, userId: string) {
  const { data } = await supabase.from('classes').select('id').eq('id', classId).eq('teacher_id', userId).maybeSingle()
  return !!data
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const classId = req.nextUrl.searchParams.get('classId')
  const file = req.nextUrl.searchParams.get('file')
  if (!classId) return NextResponse.json({ error: 'classId required' }, { status: 400 })

  if (!(await ownsClass(supabase, classId, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: overrideRows, error } = await supabase
    .from('class_lesson_overrides')
    .select('scope, target_id, override_data')
    .eq('class_id', classId)
    .eq('lesson_key', 'igcse-y1-book')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const overrides = (overrideRows ?? []) as BookOverrideRow[]
  const overriddenFiles = new Set(overrides.filter(o => o.scope === 'stage').map(o => o.target_id))

  if (file) {
    if (!findBookLesson(file)) return NextResponse.json({ error: 'Unknown lesson file' }, { status: 404 })
    try {
      const base = getBookLessonContent(file)
      const merged = applyBookOverride(base, overrides, file)
      return NextResponse.json({ title: merged.title, html: merged.html, overridden: overriddenFiles.has(file) })
    } catch (e: unknown) {
      return NextResponse.json({ error: (e as Error).message ?? 'Failed to read lesson' }, { status: 500 })
    }
  }

  const units = IGCSE_BOOK_UNITS.map(u => ({
    unit: u.unit,
    title: u.title,
    lessons: u.lessons.map(l => ({ ...l, overridden: overriddenFiles.has(l.file) })),
  }))
  return NextResponse.json({ units })
}
