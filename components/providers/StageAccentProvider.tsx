'use client'

// ── StageAccentProvider ───────────────────────────────────────────────────────
// Reads the student's stage from the profile and injects the accent colour pair
// into the document root as CSS custom properties (--accent, --accent-dim).
// All Tailwind `accent` / `accent-dim` classes update automatically.
//
// Teachers always receive orange accent (--orange) regardless of stage.

import { useEffect } from 'react'
import { STAGE_MAP, DEFAULT_STAGE } from '@/lib/stage-config'
import type { StageId } from '@/types'

// Teacher accent colours — consistent with --orange in globals.css
const TEACHER_ACCENT     = '#f07428'
const TEACHER_ACCENT_DIM = '#c95d1a'

interface Props {
  stage?: StageId | null
  role?:  string | null
  children: React.ReactNode
}

export function StageAccentProvider({ stage, role, children }: Props) {
  useEffect(() => {
    const root = document.documentElement

    if (role === 'teacher') {
      root.style.setProperty('--accent',     TEACHER_ACCENT)
      root.style.setProperty('--accent-dim', TEACHER_ACCENT_DIM)
      return
    }

    const id     = stage ?? DEFAULT_STAGE
    const config = STAGE_MAP.get(id)
    if (!config) return

    root.style.setProperty('--accent',     config.accent)
    root.style.setProperty('--accent-dim', config.accentDim)
  }, [stage, role])

  return <>{children}</>
}
