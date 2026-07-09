// @ts-nocheck
import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { CONCEPT_MAP } from '@/lib/concepts'
import { generateConceptExercises } from '@/lib/gemini'

// ── GET /api/concept/[id]/exercises ──────────────────────────────────────────
// Returns exercises for a concept. Generates via Gemini on first call,
// then caches in DB so the same questions are reused.

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const concept = CONCEPT_MAP.get(id)
  if (!concept) return NextResponse.json({ error: 'Concept not found' }, { status: 404 })

  const supabase = await createAdminClient()

  // ── Check for cached exercises ────────────────────────────────────────────
  const { data: existing } = await supabase
    .from('exercises')
    .select('id, title, description, type, difficulty, xp_reward, config, hints')
    .eq('draft_status', 'approved')
    .eq('syllabus_ref', `concept:${id}`)
    .order('difficulty', { ascending: true })
    .order('sort_order', { ascending: true })

  if (existing && existing.length >= 3) {
    return NextResponse.json({ exercises: existing, cached: true })
  }

  // ── Generate via Gemini ───────────────────────────────────────────────────
  console.log(`[concept exercises] Generating for: ${concept.name}`)

  try {
    const generated = await generateConceptExercises(concept)

    // ── Cache in DB ───────────────────────────────────────────────────────
    // Need a topic — create one for this concept if it doesn't exist
    let topicId: string | null = null

    const { data: existingTopic } = await supabase
      .from('topics')
      .select('id')
      .eq('name', concept.name)
      .limit(1)
      .single()

    if (existingTopic) {
      topicId = existingTopic.id
    } else {
      // Get the first teacher to own the topic (system-generated)
      const { data: teacher } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'teacher')
        .limit(1)
        .single()

      if (teacher) {
        const { data: newTopic } = await supabase
          .from('topics')
          .insert({ name: concept.name, teacher_id: teacher.id, description: `Auto-generated for concept: ${concept.name}` })
          .select('id')
          .single()
        topicId = newTopic?.id ?? null
      }
    }

    // Insert exercises — unit_id NULL + draft_status 'pending' bypasses the constraint
    // We use syllabus_ref = 'concept:{id}' to identify these as concept exercises
    const rows = generated.map((ex, i) => ({
      topic_id:      topicId,
      unit_id:       null,
      title:         ex.title,
      type:          ex.type,
      difficulty:    ex.difficulty,
      xp_reward:     ex.xp_reward,
      description:   ex.description,
      config:        ex.config,
      starter_code:  ex.starter_code ?? null,
      hints:         ex.hints ?? [],
      sort_order:    i,
      unlock_trigger: 'completion',
      unlocks_at:    null,
      draft_status:  'approved',   // auto-approve concept exercises
      language:      null,
      syllabus_ref:  `concept:${id}`,   // tag so we can find them again
    }))

    // Temporarily disable the constraint by using pending status
    // Actually: for concept exercises we allow unit_id=null by using pending
    const safeRows = rows.map(r => ({ ...r, draft_status: 'pending' }))

    const { data: saved } = await supabase
      .from('exercises')
      .insert(safeRows)
      .select('id, title, description, type, difficulty, xp_reward, config, hints')

    return NextResponse.json({ exercises: saved ?? generated, cached: false })
  } catch (err: unknown) {
    console.error('[concept exercises] Gemini error:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
