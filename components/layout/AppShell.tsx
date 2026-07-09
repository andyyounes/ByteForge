'use client'

import { useState, type ReactNode, type CSSProperties } from 'react'
import { NavBar } from '@/components/layout/NavBar'
import { Sidebar } from '@/components/layout/Sidebar'
import { StageAccentProvider } from '@/components/providers/StageAccentProvider'
import type { Profile } from '@/types'

interface AppShellProps {
  profile:    Profile | null
  children:   ReactNode
  /** Server-computed accent colour — set as an inline CSS custom property on the
   *  root div so the correct colour is visible from the very first paint (before
   *  any JS / useEffect runs).  StageAccentProvider mirrors it to :root for any
   *  subsequent client-side navigation changes. */
  accent?:    string
  accentDim?: string
}

export function AppShell({ profile, children, accent, accentDim }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Inline style ensures --accent is correct in the SSR HTML.
  // CSS custom properties cascade: setting on this div overrides :root defaults
  // for all descendant elements (NavBar, Sidebar, main content, everything).
  const accentStyle: CSSProperties | undefined = accent
    ? ({ '--accent': accent, '--accent-dim': accentDim } as CSSProperties)
    : undefined

  return (
    <StageAccentProvider stage={profile?.stage} role={profile?.role}>
      <div className="min-h-dvh flex flex-col" style={accentStyle}>
        <NavBar
          profile={profile}
          onMenuToggle={() => setSidebarOpen(prev => !prev)}
        />

        <div className="flex flex-1 relative">
          <Sidebar
            profile={profile}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          {/* Main content area — offset on desktop to accommodate sidebar */}
          <main className="flex-1 lg:ml-56 min-w-0 p-4 md:p-6 lg:p-8 page-enter">
            {children}
          </main>
        </div>
      </div>
    </StageAccentProvider>
  )
}
