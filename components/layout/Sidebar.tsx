'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { HomeIcon, PathwayIcon, TrophyIcon, SettingsIcon } from '@/components/ui/Icons'
import { STAGE_MAP } from '@/lib/stage-config'
import type { Profile, StageId } from '@/types'

interface NavItem {
  href:  string
  icon:  React.ReactNode
  label: string
}

const STUDENT_NAV: NavItem[] = [
  { href: '/student/dashboard',    icon: <HomeIcon    size={16} />, label: 'Dashboard'    },
  { href: '/student/pathway',      icon: <PathwayIcon size={16} />, label: 'Skill Tree'   },
  { href: '/student/achievements', icon: <TrophyIcon  size={16} />, label: 'Achievements' },
]

const TEACHER_NAV: NavItem[] = [
  { href: '/teacher/dashboard', icon: <HomeIcon size={16} />, label: 'Dashboard' },
]

// Settings appears for all roles
const SETTINGS_NAV: NavItem = { href: '/settings', icon: <SettingsIcon size={16} />, label: 'Settings' }

interface SidebarProps {
  profile:  Profile | null
  open:     boolean
  onClose:  () => void
}

export function Sidebar({ profile, open, onClose }: SidebarProps) {
  const pathname  = usePathname()
  const navItems  = [...(profile?.role === 'teacher' ? TEACHER_NAV : STUDENT_NAV), SETTINGS_NAV]

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={clsx(
          'fixed top-14 left-0 bottom-0 z-30 w-56',
          'flex flex-col bg-s0 border-r border-b2',
          'transition-transform duration-200',
          'lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Navigation"
      >
        {/* Nav items */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  'relative flex items-center gap-3 px-3 py-2.5',
                  'rounded-md text-sm font-medium transition-colors',
                  active
                    ? 'text-fg bg-s2'
                    : 'text-fg-dim hover:text-fg hover:bg-s2/60',
                )}
                aria-current={active ? 'page' : undefined}
              >
                {/* Active indicator — left border line, not full bg box */}
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-accent"
                    aria-hidden="true"
                  />
                )}
                <span className={clsx(
                  'shrink-0 transition-colors',
                  active ? 'text-accent' : 'text-fg-faint',
                )}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Stage indicator — bottom of sidebar */}
        {profile?.role === 'student' && (
          <div className="px-3 pb-4">
            <div className="px-3 py-2.5 rounded-md bg-s1 border border-b2">
              <p className="label-caps mb-0.5">Current track</p>
              <p className="text-sm font-semibold text-accent">
                {STAGE_MAP.get(profile.stage as StageId)?.label ?? profile.stage}
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
