'use client'

// ── Auth layout ───────────────────────────────────────────────────────────────
// When a user navigates client-side from the app to /login (e.g. after sign-out),
// any --accent inline style previously written to document.documentElement by
// StageAccentProvider persists — causing the login form to appear in the wrong
// colour (purple for IGCSE, cyan for Grade 7, etc.).
//
// This layout removes those inline overrides on mount so the auth pages always
// fall back to the CSS-file default:  --accent: var(--brand)  (brand green).

import { useEffect, type ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement
    root.style.removeProperty('--accent')
    root.style.removeProperty('--accent-dim')
  }, [])

  return <>{children}</>
}
