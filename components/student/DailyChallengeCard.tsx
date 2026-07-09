'use client'

import { useState } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ConceptGlyph } from '@/components/ui/ConceptGlyph'
import { CheckIcon, TargetIcon } from '@/components/ui/Icons'
import { useToast } from '@/components/ui/Toast'
import { conceptById } from '@/lib/concepts'
import type { DailyChallenge } from '@/types'

interface DailyChallengeCardProps {
  challenge: DailyChallenge | null
}

/** Returns a human-readable "resets in Xh Ym" label computed at render time. */
function resetLabel(): string {
  const now      = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  const ms   = midnight.getTime() - now.getTime()
  const h    = Math.floor(ms / 3_600_000)
  const m    = Math.floor((ms % 3_600_000) / 60_000)
  if (h > 0) return `Resets in ${h}h ${m}m`
  return `Resets in ${m}m`
}

export function DailyChallengeCard({ challenge }: DailyChallengeCardProps) {
  const { toast } = useToast()
  const [completed, setCompleted] = useState(challenge?.completed ?? false)
  const [loading,   setLoading]   = useState(false)

  if (!challenge) {
    return (
      <Card className="flex items-center gap-3 text-fg-dim text-sm">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-s2 text-accent border border-b2">
          <TargetIcon size={16} strokeWidth={1.8} />
        </span>
        <span>No daily challenge available yet. Come back tomorrow!</span>
      </Card>
    )
  }

  const concept = conceptById(challenge.concept_id)

  async function handleComplete() {
    if (completed || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/daily-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: challenge!.id }),
      })
      if (!res.ok) throw new Error('Failed')
      setCompleted(true)
      toast.xp(challenge!.xp_reward, 'Daily challenge complete!')
    } catch {
      toast.error('Could not record completion. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card accented className={clsx(completed && 'opacity-80')}>
      <div className="flex items-start gap-4">
        {concept ? (
          <ConceptGlyph concept={concept} size="lg" />
        ) : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-s2 text-accent border border-b2">
            <TargetIcon size={20} strokeWidth={1.8} />
          </span>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-accent uppercase tracking-wide">
              Daily Challenge
            </span>
            <span className="text-xs text-fg-faint">{new Date(challenge.date).toLocaleDateString()}</span>
          </div>

          <h3 className="font-semibold text-fg truncate">
            {concept?.name ?? challenge.concept_id}
          </h3>
          <p className="text-xs text-fg-dim mt-0.5">
            Complete today's challenge for{' '}
            <span className="text-yellow font-semibold">+{challenge.xp_reward} XP</span>
          </p>
          <p className="text-[10px] text-fg-faint mt-1">{resetLabel()}</p>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-2">
          {completed ? (
            <span className="flex items-center gap-1.5 text-emerald text-sm font-semibold">
              <CheckIcon size={14} strokeWidth={2} />
              Done
            </span>
          ) : (
            <>
              {concept && (
                <Link href={concept.lessonUrl}>
                  <Button variant="primary" size="sm" loading={loading} onClick={handleComplete}>
                    Start
                  </Button>
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  )
}
