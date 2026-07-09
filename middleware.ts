import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ── ByteForge Middleware ──────────────────────────────────────────────────────
// Responsibilities:
//  1. Refresh Supabase auth session on every request
//  2. Redirect unauthenticated users to /login
//  3. Role-aware redirects (student vs teacher dashboards)
//  4. Force new students through /onboarding until placement_confirmed = true
//  5. Redirect already-authed users away from /login

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            supabaseResponse.cookies.set(name, value, options as any)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not add logic between createServerClient and supabase.auth.getUser().
  // A subtle bug can make it hard to debug if auth session is not refreshed correctly.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── Public paths (no auth needed) ────────────────────────────────────────
  const isPublic =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/join') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/classes/join')

  // ── Already authenticated → redirect away from login ─────────────────────
  if (user && pathname.startsWith('/login')) {
    const profile = await getProfile(supabase, user.id)
    return NextResponse.redirect(
      new URL(getDashboardPath(profile?.role, profile?.placement_confirmed), request.url)
    )
  }

  // ── Not authenticated → redirect to login ────────────────────────────────
  if (!user && !isPublic) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Authenticated — enforce onboarding for unconfirmed students ──────────
  if (user && !isPublic && pathname !== '/onboarding') {
    const profile = await getProfile(supabase, user.id)

    if (
      profile?.role === 'student' &&
      !profile.placement_confirmed &&
      !pathname.startsWith('/onboarding')
    ) {
      // School students are confirmed automatically when they join a class
      // (POST /api/classes/join sets placement_confirmed = true from class grade),
      // so they never reach this branch.
      // Center students (no class code) land on /onboarding to pick their grade.
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    // Role guard: students can't access /teacher routes and vice-versa
    if (profile?.role === 'student' && pathname.startsWith('/teacher')) {
      return NextResponse.redirect(new URL('/student/dashboard', request.url))
    }
    if (profile?.role === 'teacher' && pathname.startsWith('/student')) {
      return NextResponse.redirect(new URL('/teacher/dashboard', request.url))
    }
  }

  return supabaseResponse
}

// ── Helper: fetch profile (role + placement status + grade) ──────────────────
async function getProfile(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string
): Promise<{ role: string; placement_confirmed: boolean } | null> {
  const { data } = await supabase
    .from('profiles')
    .select('role, placement_confirmed')
    .eq('id', userId)
    .single()
  return data
}

function getDashboardPath(role?: string, placementConfirmed?: boolean): string {
  if (!role) return '/login'
  if (role === 'student') {
    return placementConfirmed ? '/student/dashboard' : '/onboarding'
  }
  return '/teacher/dashboard'
}

// ── Matcher: run middleware on all routes EXCEPT static assets ────────────────
// /lessons is excluded so that static HTML lesson pages bypass auth.
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|lessons|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)',
  ],
}
