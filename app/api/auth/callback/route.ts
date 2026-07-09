import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { gradeToStageId } from '@/lib/stage-config'
import { initialMasteryMap } from '@/lib/mastery'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const code       = searchParams.get('code')
  const tokenHash  = searchParams.get('token_hash')
  const type       = searchParams.get('type') as 'signup' | 'recovery' | 'email' | null
  const redirectTo = searchParams.get('next') ?? searchParams.get('redirectTo') ?? null
  // Password recovery always goes to reset page
  const next       = type === 'recovery' ? '/reset-password' : (redirectTo ?? '/student/dashboard')

  const supabase = await createClient()

  // ── PKCE flow (code param) ────────────────────────────────────────────────
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[auth/callback] exchangeCodeForSession error:', error.message)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }
  }
  // ── Token hash flow (email confirmation link) ─────────────────────────────
  else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (error) {
      console.error('[auth/callback] verifyOtp error:', error.message)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }
  }
  // ── No recognised params ──────────────────────────────────────────────────
  else {
    console.error('[auth/callback] No code or token_hash in URL. Params:', Object.fromEntries(searchParams))
    return NextResponse.redirect(`${origin}/login?error=missing_auth_params`)
  }

  // ── Auth succeeded — determine where to send the user ────────────────────
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, grade, stage, placement_confirmed')
      .eq('id', user.id)
      .single<{ role: string; grade: string; stage: string; placement_confirmed: boolean }>()

    if (profileError) {
      console.error('[auth/callback] profile fetch error:', profileError.message)
      return NextResponse.redirect(`${origin}/student/dashboard`)
    }

    if (profile?.role === 'teacher') {
      return NextResponse.redirect(`${origin}/teacher/dashboard`)
    }

    // Auto-place new students: set stage from their grade and seed mastery rows.
    // Runs once (when placement_confirmed is still false) — safe to skip if already done.
    if (profile?.role === 'student' && !profile.placement_confirmed) {
      const stage = gradeToStageId(profile.grade ?? '7')

      await supabase
        .from('profiles')
        .update({ stage, placement_confirmed: true })
        .eq('id', user.id)

      const { data: existingMastery } = await supabase
        .from('concept_mastery')
        .select('concept_id')
        .eq('student_id', user.id)
        .limit(1)

      if (!existingMastery?.length) {
        const rows = initialMasteryMap(user.id)
        for (let i = 0; i < rows.length; i += 20) {
          await supabase.from('concept_mastery').insert(rows.slice(i, i + 20))
        }
      }
    }
  }

  return NextResponse.redirect(`${origin}/student/dashboard`)
}
