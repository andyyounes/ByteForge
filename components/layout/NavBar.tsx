'use client'

import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import { Avatar } from '@/components/ui/Avatar'
import { XPBar } from '@/components/ui/XPBar'
import { xpToLevel, levelTitle } from '@/lib/xp'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import {
  LogoMark,
  MenuIcon,
  FlameIcon,
  HomeIcon,
  TrophyIcon,
  SettingsIcon,
  SignOutIcon,
} from '@/components/ui/Icons'
import type { Profile } from '@/types'

interface NavBarProps {
  profile:        Profile | null
  onMenuToggle?:  () => void
}

export function NavBar({ profile, onMenuToggle }: NavBarProps) {
  const { supabase } = useSupabase()
  const router       = useRouter()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const level = profile ? xpToLevel(profile.xp) : 1
  const title = levelTitle(level)

  return (
    <header className="sticky top-0 z-40 h-14 flex items-center gap-3 px-4
                       bg-s0/90 backdrop-blur-md border-b border-b2">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-1.5 rounded-md text-fg-dim hover:text-fg hover:bg-s2 transition-colors"
        aria-label="Toggle navigation"
      >
        <MenuIcon size={18} />
      </button>

      {/* Logo */}
      <a
        href="/"
        className="flex items-center gap-2 shrink-0 group"
        aria-label="ByteForge home"
      >
        <LogoMark size={20} />
        <span className="hidden sm:block font-bold text-base logo-text tracking-tight">
          ByteForge
        </span>
      </a>

      <div className="flex-1" />

      {/* XP level + bar — student only */}
      {profile?.role === 'student' && (
        <div className="hidden md:flex items-center gap-3">
          {/* Level badge */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-fg-faint">LV</span>
            <span className="text-sm font-bold text-fg">{level}</span>
          </div>
          {/* XP bar */}
          <div className="w-28">
            <XPBar xp={profile.xp} height="sm" showLabel={false} />
          </div>
          {/* Title — subtle */}
          <span className="text-xs text-fg-faint hidden lg:block">{title}</span>
        </div>
      )}

      {/* Streak — icon + number, no emoji */}
      {profile?.role === 'student' && profile.streak > 0 && (
        <div
          className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md
                     text-[var(--amber)] text-xs font-semibold"
          title={`${profile.streak}-day streak · best: ${profile.longest_streak} days`}
        >
          <FlameIcon size={14} strokeWidth={2} />
          <span>{profile.streak}</span>
        </div>
      )}

      {/* Avatar + dropdown */}
      {profile && (
        <div className="relative group">
          <button
            className="flex items-center gap-2 rounded-full focus-visible:outline-accent"
            aria-label="Account menu"
          >
            <Avatar name={profile.name} avatarUrl={profile.avatar_url} size="sm" />
          </button>

          {/* Dropdown */}
          <div className={clsx(
            'absolute right-0 top-full mt-2 w-52 rounded-lg overflow-hidden',
            'bg-s2 border border-b2 shadow-overlay',
            'opacity-0 invisible pointer-events-none',
            'group-focus-within:opacity-100 group-focus-within:visible group-focus-within:pointer-events-auto',
            'group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto',
            'transition-all duration-150 z-50',
          )}>
            {/* Profile header */}
            <div className="px-4 py-3 border-b border-b2">
              <p className="text-sm font-semibold text-fg truncate">{profile.name}</p>
              <p className="text-xs text-fg-faint truncate mt-0.5">{profile.email}</p>
            </div>

            {/* Links */}
            <nav className="py-1">
              <DropdownLink
                href={profile.role === 'student' ? '/student/dashboard' : '/teacher/dashboard'}
                icon={<HomeIcon size={14} />}
              >
                Dashboard
              </DropdownLink>
              {profile.role === 'student' && (
                <DropdownLink href="/student/achievements" icon={<TrophyIcon  size={14} />}>Achievements</DropdownLink>
              )}
            </nav>

            {/* Settings — all roles */}
            <div className="py-1 border-t border-b2">
              <DropdownLink href="/settings" icon={<SettingsIcon size={14} />}>
                Settings
              </DropdownLink>
            </div>

            {/* Sign out */}
            <div className="py-1 border-t border-b2">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 px-4 py-2
                           text-sm text-rose hover:bg-rose/8 transition-colors"
              >
                <SignOutIcon size={14} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

// ── Dropdown item ─────────────────────────────────────────────────────────────
// Uses a plain <a> instead of next/link to avoid React 19 hydration mismatch
// inside CSS-hidden dropdowns. Next.js still intercepts <a> clicks for SPA nav.
function DropdownLink({
  href,
  icon,
  children,
}: {
  href:     string
  icon:     React.ReactNode
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-2.5 px-4 py-2
                 text-sm text-fg-dim hover:text-fg hover:bg-s1
                 transition-colors"
    >
      <span className="text-fg-faint">{icon}</span>
      {children}
    </a>
  )
}
