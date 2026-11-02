// ============================================================
//  ByteForge — Icon System
//  All icons use consistent 1.5px stroke, 24px viewBox.
//  Replace ALL emoji across the app. No platform rendering variance.
// ============================================================

interface IconProps {
  size?:        number
  className?:   string
  strokeWidth?: number
}

const defaults = { size: 18, strokeWidth: 1.6 }

// ── Brand ────────────────────────────────────────────────────────────────────

/** ByteForge logomark: diamond with forge-bolt cut through it */
export function LogoMark({ size = 20, className }: Omit<IconProps, 'strokeWidth'>) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 20 20" fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M10 1.5 L18.5 10 L10 18.5 L1.5 10 Z"
        fill="var(--accent)" fillOpacity="0.18"
        stroke="var(--accent)" strokeWidth="1.25" strokeLinejoin="round"
      />
      <path
        d="M11.5 6.5 L9 10.5 H11.5 L8.5 14"
        stroke="var(--accent)" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}

// ── Navigation ───────────────────────────────────────────────────────────────

export function HomeIcon({ size = defaults.size, strokeWidth = defaults.strokeWidth, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
        stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PathwayIcon({ size = defaults.size, strokeWidth = defaults.strokeWidth, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="5" cy="18" r="2" stroke="currentColor" strokeWidth={strokeWidth} />
      <circle cx="12" cy="6"  r="2" stroke="currentColor" strokeWidth={strokeWidth} />
      <circle cx="19" cy="14" r="2" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M5 16V12a3 3 0 013-3h4"
        stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M14 7.5l3.5 4"
        stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  )
}

export function TrophyIcon({ size = defaults.size, strokeWidth = defaults.strokeWidth, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M5 3H3v4a4 4 0 004 4m12 0a4 4 0 004-4V3h-2"
        stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M7 3h10v7a5 5 0 01-10 0V3z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
    </svg>
  )
}

export function DashboardIcon({ size = defaults.size, strokeWidth = defaults.strokeWidth, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="3" width="7" height="8" rx="1.5" stroke="currentColor" strokeWidth={strokeWidth} />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={strokeWidth} />
      <rect x="14" y="3" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth={strokeWidth} />
      <rect x="14" y="11" width="7" height="10" rx="1.5" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  )
}

// ── Gamification ─────────────────────────────────────────────────────────────

export function FlameIcon({ size = defaults.size, strokeWidth = defaults.strokeWidth, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 3C12 3 7 8.5 7 13.5a5 5 0 0010 0c0-3-1.5-5-1.5-5S14 11 12 11c0 0 2-3 0-8z"
        stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ZapIcon({ size = defaults.size, strokeWidth = defaults.strokeWidth, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M13 3L5 14h7l-1 7 8-11h-7l1-7z"
        stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function StarIcon({ size = defaults.size, strokeWidth = defaults.strokeWidth, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
    </svg>
  )
}

export function TargetIcon({ size = defaults.size, strokeWidth = defaults.strokeWidth, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={strokeWidth} />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth={strokeWidth} />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  )
}

// ── Status / State ────────────────────────────────────────────────────────────

export function LockIcon({ size = defaults.size, strokeWidth = defaults.strokeWidth, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  )
}

export function CheckCircleIcon({ size = defaults.size, strokeWidth = defaults.strokeWidth, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CheckIcon({ size = defaults.size, strokeWidth = defaults.strokeWidth, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 12l5 5L19 7" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── UI Actions ────────────────────────────────────────────────────────────────

export function ArrowRightIcon({ size = defaults.size, strokeWidth = defaults.strokeWidth, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ChevronRightIcon({ size = defaults.size, strokeWidth = defaults.strokeWidth, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function MenuIcon({ size = defaults.size, strokeWidth = defaults.strokeWidth, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <line x1="3" y1="6"  x2="21" y2="6"  stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <line x1="3" y1="18" x2="16" y2="18" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  )
}

export function XIcon({ size = defaults.size, strokeWidth = defaults.strokeWidth, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  )
}

export function SignOutIcon({ size = defaults.size, strokeWidth = defaults.strokeWidth, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M9 21H4a1 1 0 01-1-1V4a1 1 0 011-1h5"
        stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 17l5-5-5-5M21 12H9"
        stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function UserIcon({ size = defaults.size, strokeWidth = defaults.strokeWidth, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
        stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  )
}

// ── Content / Learning ────────────────────────────────────────────────────────

export function BookIcon({ size = defaults.size, strokeWidth = defaults.strokeWidth, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"
        stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
    </svg>
  )
}

export function CodeIcon({ size = defaults.size, strokeWidth = defaults.strokeWidth, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ChartBarIcon({ size = defaults.size, strokeWidth = defaults.strokeWidth, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  )
}

export function BinaryIcon({ size = defaults.size, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <text x="3" y="16" fontFamily="monospace" fontSize="13" fill="currentColor" fontWeight="700">01</text>
      <text x="3" y="22" fontFamily="monospace" fontSize="8" fill="currentColor" opacity="0.45">10110</text>
    </svg>
  )
}

export function FlowchartIcon({ size = defaults.size, strokeWidth = defaults.strokeWidth, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="8" y="2"  width="8" height="5"  rx="1" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M12 7v3M12 14v3" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M5 10h14v4H5z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
      <rect x="8" y="17" width="8" height="5"  rx="1" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  )
}

export function BlockIcon({ size = defaults.size, strokeWidth = defaults.strokeWidth, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="2" y="7"  width="9" height="5" rx="1.5" stroke="currentColor" strokeWidth={strokeWidth} />
      <rect x="13" y="3" width="9" height="5" rx="1.5" stroke="currentColor" strokeWidth={strokeWidth} />
      <rect x="13" y="12" width="9" height="5" rx="1.5" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M11 9.5h1a1 1 0 011 1V14" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M11 9.5h1a1 1 0 001-1V5.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  )
}

export function AlgoIcon({ size = defaults.size, strokeWidth = defaults.strokeWidth, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"
        stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PseudocodeIcon({ size = defaults.size, strokeWidth = defaults.strokeWidth, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 6h16M4 10h12M4 14h8M4 18h10" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  )
}

// ── New Curriculum Modes ─────────────────────────────────────────────────────

export function PaletteIcon({ size = defaults.size, strokeWidth = defaults.strokeWidth, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.1 0 2-.9 2-2v-.5c0-.55-.22-1.05-.59-1.41-.36-.36-.59-.86-.59-1.41 0-1.1.9-2 2-2h2c3.31 0 6-2.69 6-6C23 6.48 18.52 2 12 2z"
        stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
      <circle cx="7"  cy="13" r="1.2" fill="currentColor" />
      <circle cx="9"  cy="9"  r="1.2" fill="currentColor" />
      <circle cx="13" cy="8"  r="1.2" fill="currentColor" />
      <circle cx="17" cy="11" r="1.2" fill="currentColor" />
    </svg>
  )
}

export function GridIcon({ size = defaults.size, strokeWidth = defaults.strokeWidth, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth={strokeWidth} />
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth={strokeWidth} />
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth={strokeWidth} />
      <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  )
}

export function PenToolIcon({ size = defaults.size, strokeWidth = defaults.strokeWidth, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 19l7-7 3 3-7 7-3-3z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="M2 2l7.586 7.586" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <circle cx="11" cy="11" r="2" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  )
}

export function CpuIcon({ size = defaults.size, strokeWidth = defaults.strokeWidth, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="7" y="7" width="10" height="10" rx="1" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M9 7V4M12 7V4M15 7V4M9 20v-3M12 20v-3M15 20v-3M7 9H4M7 12H4M7 15H4M20 9h-3M20 12h-3M20 15h-3"
        stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="0.5" fill="currentColor" opacity="0.35" />
    </svg>
  )
}

export function PackageIcon({ size = defaults.size, strokeWidth = defaults.strokeWidth, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
        stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"
        stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  )
}

export function FunctionIcon({ size = defaults.size, strokeWidth = defaults.strokeWidth, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M9 18c-4.51.5-4.5-3.5-6-4 4.5-.5 4.5 3.5 6 4z"
        stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 6c4.51-.5 4.5 3.5 6 4-4.5.5-4.5-3.5-6-4z"
        stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  )
}

export function CompressIcon({ size = defaults.size, strokeWidth = defaults.strokeWidth, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3m8 0h3a2 2 0 002-2v-3"
        stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12h6M12 9v6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  )
}

export function BellIcon({ size = defaults.size, strokeWidth = defaults.strokeWidth, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 9a6 6 0 0112 0c0 3.5 1 5.5 2 7H4c1-1.5 2-3.5 2-7z"
        stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 19a2 2 0 004 0" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  )
}

export function SettingsIcon({ size = defaults.size, strokeWidth = defaults.strokeWidth, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      {/* Sliders metaphor — universally understood as "settings/adjust" */}
      <line x1="4"  y1="6"  x2="20" y2="6"  stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <line x1="4"  y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <line x1="4"  y1="18" x2="20" y2="18" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <circle cx="8"  cy="6"  r="2.2" fill="var(--s0)" stroke="currentColor" strokeWidth={strokeWidth} />
      <circle cx="16" cy="12" r="2.2" fill="var(--s0)" stroke="currentColor" strokeWidth={strokeWidth} />
      <circle cx="10" cy="18" r="2.2" fill="var(--s0)" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  )
}

// ── Spinner (inline, no extra file needed) ────────────────────────────────────
export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24" fill="none"
      className={`animate-spin ${className ?? ''}`}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
