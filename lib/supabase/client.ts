import { createBrowserClient } from '@supabase/ssr'

// ── Browser (Client Component) Supabase client ────────────────────────────────
// Call inside Client Components or custom hooks.
// The instance is memoised automatically by @supabase/ssr.

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
