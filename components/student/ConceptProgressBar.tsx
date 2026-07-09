'use client'

// ── ConceptProgressBar ─────────────────────────────────────────────────────────
// Shows XP, level, streak live on the concept page.
// Polls for fresh data after each quiz answer via custom events.

import { useState, useEffect } from 'react'
import { xpBar, xpToLevel, levelTitle } from '@/lib/xp'
import { FlameIcon } from '@/components/ui/Icons'

interface ConceptProgressBarProps {
  initialXp:     number
  initialStreak: number
  initialLevel:  number
}

export function ConceptProgressBar({ initialXp, initialStreak }: ConceptProgressBarProps) {
  const [xp,     setXp]     = useState(initialXp)
  const [streak, setStreak] = useState(initialStreak)
  const [gained, setGained] = useState(0)      // XP earned this session
  const [flash,  setFlash]  = useState(false)  // brief highlight on XP gain

  useEffect(() => {
    function onXpGain(e: CustomEvent) {
      const amount = e.detail?.amount ?? 0
      if (!amount) return
      setXp(prev => prev + amount)
      setGained(prev => prev + amount)
      setFlash(true)
      setTimeout(() => setFlash(false), 800)
    }
    function onStreakUpdate(e: CustomEvent) {
      setStreak(e.detail?.streak ?? streak)
    }
    window.addEventListener('byteforge:xp',     onXpGain      as EventListener)
    window.addEventListener('byteforge:streak', onStreakUpdate as EventListener)
    return () => {
      window.removeEventListener('byteforge:xp',     onXpGain      as EventListener)
      window.removeEventListener('byteforge:streak', onStreakUpdate as EventListener)
    }
  }, [streak])

  const level   = xpToLevel(xp)
  const title   = levelTitle(level)
  const { pct, current, next } = xpBar(xp)

  return (
    <div className={`card p-4 transition-all duration-300 ${flash ? 'border-accent' : ''}`}>
      <div className="flex items-center gap-4 flex-wrap">

        {/* Level badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-md bg-accent/12 border border-accent/25 flex items-center justify-center font-bold text-accent text-sm tabular-nums">
            {level}
          </div>
          <div>
            <p className="text-xs font-semibold text-fg">{title}</p>
            <p className="text-[10px] text-fg-faint">Level {level}</p>
          </div>
        </div>

        {/* XP bar */}
        <div className="flex-1 min-w-[120px]">
          <div className="flex justify-between text-[11px] text-fg-faint mb-1.5">
            <span className={flash ? 'text-accent font-semibold' : ''}>
              {xp.toLocaleString()} XP
              {gained > 0 && (
                <span className="text-amber ml-1.5 font-bold tabular-nums">+{gained}</span>
              )}
            </span>
            <span className="tabular-nums">{next.toLocaleString()} XP</span>
          </div>
          <div className="xp-bar-track h-1.5">
            <div
              className="xp-bar-fill"
              style={{ width: `${pct}%`, transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)' }}
            />
          </div>
          <p className="text-[10px] text-fg-faint mt-1 tabular-nums">
            {(next - current).toLocaleString()} XP to level {level + 1}
          </p>
        </div>

        {/* Streak — SVG icon, no emoji */}
        {streak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-s2 border border-b2 shrink-0">
            <FlameIcon size={13} strokeWidth={2} className="text-orange" />
            <div>
              <p className="text-sm font-bold text-orange leading-none tabular-nums">{streak}</p>
              <p className="text-[10px] text-fg-faint leading-none">day streak</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
