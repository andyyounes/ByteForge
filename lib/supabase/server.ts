import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// ── Server (Server Component / Route Handler / Server Action) Supabase client ─

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options as any))
          } catch {
            // Read-only in Server Components — middleware handles session refresh.
          }
        },
      },
    }
  )
}

// ── Admin client (service-role, bypasses RLS — server-only) ──────────────────
// Uses @supabase/supabase-js directly (no cookie handling) so the service-role
// JWT is always sent and the caller's session cookie cannot override it.
// This guarantees RLS is fully bypassed regardless of who the current user is.

export async function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  )
}
