'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { Button } from '@/components/ui/Button'
import { ConceptGlyph } from '@/components/ui/ConceptGlyph'
import {
  CheckIcon, XIcon, ZapIcon, TrophyIcon,
  CheckCircleIcon, TargetIcon, Spinner,
} from '@/components/ui/Icons'
import { useToast } from '@/components/ui/Toast'
import { CONCEPT_MAP, dependents } from '@/lib/concepts'

interface QuizExercise {
  id:          string
  title:       string
  description: string
  difficulty:  1 | 2 | 3 | 4
  xp_reward:   number
  hints:       string[]
  config: {
    options:     string[]
    answer:      string
    explanation: string
  }
}

interface ExistingMastery {
  mastery_score: number
  status:        string
  attempts:      number
}

interface ConceptQuizProps {
  conceptId:        string
  conceptName:      string
  existingMastery?: ExistingMastery | null
}

type QuizState = 'idle' | 'loading' | 'ready' | 'done' | 'error' | 'already-done'

const DIFF_LABEL: Record<number, string> = { 1:'Recall', 2:'Apply', 3:'Analyse', 4:'Evaluate' }
const DIFF_COLOR: Record<number, string> = {
  1: 'text-emerald',
  2: 'text-sky',
  3: 'text-amber',
  4: 'text-rose',
}

export function ConceptQuiz({ conceptId, existingMastery }: ConceptQuizProps) {
  const { toast } = useToast()

  const initialState: QuizState =
    existingMastery && existingMastery.mastery_score >= 60 ? 'already-done' : 'idle'

  const [state,      setState]     = useState<QuizState>(initialState)
  const [exercises,  setExercises] = useState<QuizExercise[]>([])
  const [current,    setCurrent]   = useState(0)
  const [selected,   setSelected]  = useState<string | null>(null)
  const [revealed,   setRevealed]  = useState(false)
  const [hintIdx,    setHintIdx]   = useState(-1)
  const [score,      setScore]     = useState(0)
  const [results,    setResults]   = useState<boolean[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [unlocked,   setUnlocked]  = useState<string[]>([])

  const load = useCallback(async () => {
    setState('loading')
    try {
      const res  = await fetch(`/api/concept/${conceptId}/exercises`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to load')
      setExercises(json.exercises)
      setState('ready')
      setCurrent(0); setResults([]); setScore(0)
      setUnlocked([]); setSelected(null); setRevealed(false); setHintIdx(-1)
    } catch (err: unknown) {
      console.error(err)
      setState('error')
    }
  }, [conceptId])

  const ex = exercises[current]

  function handleSelect(opt: string) {
    if (revealed) return
    setSelected(opt)
  }

  async function handleCheck() {
    if (!selected || !ex) return
    setRevealed(true)
    const correct = selected === ex.config.answer
    setResults(prev => [...prev, correct])
    if (correct) setScore(s => s + ex.xp_reward)

    setSubmitting(true)
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept_id: conceptId, exercise_id: ex.id,
          correct, time_spent_ms: 30000,
        }),
      })
      if (correct) {
        toast.xp(ex.xp_reward, `+${ex.xp_reward} XP`)
        window.dispatchEvent(new CustomEvent('byteforge:xp', { detail: { amount: ex.xp_reward } }))
      }
      const data = await res.json()
      if (data.newlyAvailable?.length) {
        setUnlocked(prev => [...new Set([...prev, ...data.newlyAvailable])])
      }
      if (data.streak) {
        window.dispatchEvent(new CustomEvent('byteforge:streak', { detail: { streak: data.streak } }))
      }
    } catch { /* non-critical */ }
    finally { setSubmitting(false) }
  }

  function handleNext() {
    if (current + 1 >= exercises.length) setState('done')
    else {
      setCurrent(c => c + 1)
      setSelected(null); setRevealed(false); setHintIdx(-1)
    }
  }

  const correctCount = results.filter(Boolean).length

  // ── Already passed ────────────────────────────────────────────────────────
  if (state === 'already-done') {
    const s        = existingMastery!.mastery_score
    const mastered = s >= 85
    const status   = existingMastery!.status
    const nextConcepts = dependents(conceptId).slice(0, 2)

    return (
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-s2 border border-b2 flex items-center justify-center">
            {mastered
              ? <TrophyIcon      size={20} strokeWidth={1.6} className="text-amber"   />
              : <CheckCircleIcon size={20} strokeWidth={1.6} className="text-emerald" />
            }
          </div>
          <div className="flex-1">
            <p className="font-semibold text-fg">
              {mastered ? 'Mastered' : 'Passed'}
              <span className="text-fg-dim font-normal text-sm ml-2">· {s}% mastery</span>
            </p>
            <p className="text-sm text-fg-dim capitalize">
              Status: <span className={clsx(
                'font-medium',
                status === 'mastered'   ? 'text-emerald' :
                status === 'practicing' ? 'text-accent'  : 'text-amber',
              )}>{status}</span>
              {' · '}{existingMastery!.attempts} attempt{existingMastery!.attempts !== 1 ? 's' : ''}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setState('idle')}>
            Practise again
          </Button>
        </div>

        {/* Mastery bar */}
        <div className="relative h-2 bg-s2 rounded-full overflow-hidden">
          <div
            className={clsx('h-full rounded-full transition-all', mastered ? 'bg-emerald' : 'bg-accent')}
            style={{ width: `${s}%` }}
          />
          <div className="absolute top-0 bottom-0 w-px bg-b3" style={{ left: '60%' }} />
          <div className="absolute top-0 bottom-0 w-px bg-b3" style={{ left: '85%' }} />
        </div>
        <div className="flex justify-between text-[10px] text-fg-faint">
          <span>0%</span><span>60% pass</span><span>85% mastered</span>
        </div>

        {/* Next concepts */}
        {nextConcepts.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-xs text-fg-faint self-center">Continue with:</span>
            {nextConcepts.map(c => (
              <Link key={c.id} href={c.lessonUrl}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-s2 border border-b2 text-sm text-fg hover:border-b3 hover:text-accent transition-colors">
                <ConceptGlyph concept={c} size="xs" />
                {c.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Idle ──────────────────────────────────────────────────────────────────
  if (state === 'idle') {
    const hasAttempted = existingMastery && existingMastery.attempts > 0
    return (
      <div className="card p-5 flex items-center gap-4">
        <span className="text-accent shrink-0">
          <TargetIcon size={20} strokeWidth={1.6} />
        </span>
        <div className="flex-1">
          <p className="font-semibold text-fg">Practice Questions</p>
          {hasAttempted ? (
            <p className="text-sm text-fg-dim">
              Last score: <span className="text-amber font-medium">{existingMastery!.mastery_score}%</span>
              {' · '}Score 60%+ to pass
            </p>
          ) : (
            <p className="text-sm text-fg-dim">5 progressive questions · earn XP for each correct answer</p>
          )}
        </div>
        <Button onClick={load}>{hasAttempted ? 'Try again' : 'Start practice'}</Button>
      </div>
    )
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="card p-8 text-center space-y-3">
        <div className="flex justify-center">
          <Spinner size={24} />
        </div>
        <p className="text-fg font-medium">Generating your exercises with AI…</p>
        <p className="text-xs text-fg-faint">Questions are cached after first generation</p>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <div className="card p-5 flex items-center gap-4">
        <span className="text-rose shrink-0"><XIcon size={18} strokeWidth={2} /></span>
        <div className="flex-1">
          <p className="font-medium text-rose">Failed to generate questions</p>
          <p className="text-xs text-fg-dim mt-0.5">Check your GEMINI_API_KEY in .env.local</p>
        </div>
        <Button variant="secondary" onClick={load}>Retry</Button>
      </div>
    )
  }

  // ── Done — results screen ─────────────────────────────────────────────────
  if (state === 'done') {
    const pct      = Math.round((correctCount / exercises.length) * 100)
    const passed   = pct >= 60
    const mastered = pct >= 85
    const unlockedConcepts = unlocked.map(id => CONCEPT_MAP.get(id)).filter(Boolean)
    const nextConcepts     = dependents(conceptId).filter(c => !unlocked.includes(c.id)).slice(0, 2)

    return (
      <div className="card p-6 space-y-5">
        {/* Score header */}
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <div className={clsx(
              'w-14 h-14 rounded-xl flex items-center justify-center',
              mastered ? 'bg-amber/12 border border-amber/25'   :
              passed   ? 'bg-emerald/12 border border-emerald/25' :
                         'bg-s2 border border-b2',
            )}>
              {mastered
                ? <TrophyIcon      size={24} strokeWidth={1.5} className="text-amber"   />
                : passed
                  ? <CheckCircleIcon size={24} strokeWidth={1.5} className="text-emerald" />
                  : <TargetIcon      size={24} strokeWidth={1.5} className="text-fg-dim"  />
              }
            </div>
          </div>
          <h3 className="text-lg font-bold text-fg">
            {mastered ? 'Mastered!' : passed ? 'Concept Unlocked!' : 'Keep Practising'}
          </h3>
          <p className="text-fg-dim text-sm mt-1 tabular-nums">
            {correctCount} / {exercises.length} correct · {pct}%
          </p>

          {/* Pass bar */}
          <div className="mt-3 relative h-2 bg-s2 rounded-full overflow-hidden">
            <div
              className={clsx('h-full rounded-full transition-all', passed ? 'bg-emerald' : 'bg-amber')}
              style={{ width: `${pct}%` }}
            />
            <div className="absolute top-0 bottom-0 w-px bg-b3" style={{ left: '60%' }} />
          </div>
          <div className="flex justify-between text-[10px] text-fg-faint mt-1">
            <span>0%</span>
            <span>60% to pass</span>
            <span className="text-emerald">85% mastered</span>
          </div>
        </div>

        {/* Per-question results */}
        <div className="space-y-1.5">
          {exercises.map((e, i) => (
            <div key={`result-${i}`} className="flex items-center gap-2.5 text-sm">
              {results[i]
                ? <CheckIcon size={13} strokeWidth={2.5} className="text-emerald shrink-0" />
                : <XIcon     size={13} strokeWidth={2.5} className="text-rose shrink-0"    />
              }
              <span className={clsx('flex-1 truncate', results[i] ? 'text-fg' : 'text-fg-dim')}>{e.title}</span>
              {results[i] && (
                <span className="text-amber text-xs shrink-0 tabular-nums">+{e.xp_reward} XP</span>
              )}
            </div>
          ))}
        </div>

        {/* Newly unlocked concepts */}
        {unlockedConcepts.length > 0 && (
          <div className="p-3 rounded-md bg-emerald/8 border border-emerald/20">
            <p className="text-emerald text-sm font-semibold mb-2">Newly unlocked</p>
            <div className="flex flex-wrap gap-2">
              {unlockedConcepts.map(c => (
                <Link key={c!.id} href={c!.lessonUrl}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-s2 border border-emerald/25 text-sm text-fg hover:border-emerald/50 transition-colors">
                  <ConceptGlyph concept={c!} size="xs" />
                  {c!.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Not yet passed */}
        {!passed && (
          <div className="p-3 rounded-md bg-amber/8 border border-amber/20 text-sm text-amber">
            Score <strong>60% or more</strong> to unlock the next concepts. Try again!
          </div>
        )}

        {/* XP + actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-b2">
          <div className="flex items-center gap-1.5 flex-1">
            <ZapIcon size={14} strokeWidth={1.8} className="text-amber" />
            <span className="text-xl font-bold text-amber tabular-nums">+{score}</span>
            <span className="text-xs text-fg-faint">XP earned</span>
          </div>
          <Button onClick={load} variant="secondary" size="sm">Try again</Button>
          {passed && nextConcepts.length > 0 && (
            <Link href={nextConcepts[0].lessonUrl}>
              <Button size="sm">Next: {nextConcepts[0].name}</Button>
            </Link>
          )}
        </div>
      </div>
    )
  }

  // ── Quiz question ─────────────────────────────────────────────────────────
  if (!ex) return null

  const isCorrect   = selected === ex.config.answer
  const hints       = ex.hints ?? []
  const currentHint = hintIdx >= 0 ? hints[hintIdx] : null

  return (
    <div className="space-y-4">
      {/* Progress dots */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-1">
          {exercises.map((_, i) => (
            <div
              key={i}
              className={clsx(
                'flex-1 h-1 rounded-full transition-all',
                i < current  ? (results[i] ? 'bg-emerald' : 'bg-rose') :
                i === current ? 'bg-accent'                              :
                                'bg-s2',
              )}
            />
          ))}
        </div>
        <span className="text-xs text-fg-faint shrink-0 tabular-nums">
          {current + 1}/{exercises.length}
        </span>
      </div>

      {/* Question card */}
      <div className="card p-5 space-y-4">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={clsx('text-xs font-semibold', DIFF_COLOR[ex.difficulty])}>
              {DIFF_LABEL[ex.difficulty]}
            </span>
            <span className="text-xs text-fg-faint">·</span>
            <span className="flex items-center gap-1 text-xs text-amber">
              <ZapIcon size={10} strokeWidth={2} />
              {ex.xp_reward} XP
            </span>
          </div>
          <h3 className="font-semibold text-fg leading-snug">{ex.description}</h3>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 gap-2">
          {ex.config.options.map((opt, i) => {
            const letter     = ['A','B','C','D'][i] ?? String(i)
            const isSelected = selected === opt
            const isAnswer   = opt === ex.config.answer

            const style =
              !revealed
                ? isSelected
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-b2 bg-s2 text-fg-dim hover:border-b3 hover:text-fg'
                : isAnswer
                  ? 'border-emerald bg-emerald/8 text-emerald'
                  : isSelected
                    ? 'border-rose bg-rose/8 text-rose'
                    : 'border-b2 bg-s2 text-fg-faint opacity-50'

            return (
              <button
                key={`${i}-${opt}`}
                onClick={() => handleSelect(opt)}
                disabled={revealed}
                className={clsx(
                  'flex items-center gap-3 p-3 rounded-md border text-left transition-all text-sm',
                  style,
                )}
              >
                <span className="font-bold font-mono shrink-0 w-5 text-xs">{letter}.</span>
                <span className="flex-1">{opt}</span>
                {revealed && isAnswer   && <CheckIcon size={13} strokeWidth={2.5} className="shrink-0" />}
                {revealed && isSelected && !isAnswer && <XIcon size={13} strokeWidth={2.5} className="shrink-0" />}
              </button>
            )
          })}
        </div>

        {/* Explanation */}
        {revealed && ex.config.explanation && (
          <div className={clsx(
            'px-4 py-3 rounded-md text-sm',
            isCorrect
              ? 'bg-emerald/8 border border-emerald/20 text-emerald'
              : 'bg-rose/8 border border-rose/20 text-rose',
          )}>
            <span className="font-semibold">{isCorrect ? 'Correct. ' : 'Incorrect. '}</span>
            {ex.config.explanation}
          </div>
        )}

        {/* Hint */}
        {currentHint && (
          <div className="px-4 py-3 rounded-md bg-amber/8 border border-amber/20 text-sm text-amber">
            <span className="font-semibold">Hint: </span>{currentHint}
          </div>
        )}

        {/* Action row */}
        <div className="flex items-center justify-between pt-1">
          <div>
            {!revealed && hints.length > 0 && hintIdx < hints.length - 1 && (
              <button
                onClick={() => setHintIdx(h => h + 1)}
                className="text-xs text-fg-faint hover:text-amber transition-colors"
              >
                Hint {hintIdx + 2}/{hints.length}
              </button>
            )}
          </div>

          {!revealed ? (
            <Button onClick={handleCheck} disabled={!selected} loading={submitting} size="md">
              Check answer
            </Button>
          ) : (
            <Button onClick={handleNext} size="md">
              {current + 1 >= exercises.length ? 'See results' : 'Next question'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
