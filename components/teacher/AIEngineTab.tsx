'use client'

import { useState } from 'react'
import { clsx } from 'clsx'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ZapIcon } from '@/components/ui/Icons'
import { useToast } from '@/components/ui/Toast'
import type { ExerciseType, GeneratedExercise, Topic } from '@/types'

interface AIEngineTabProps {
  topics: Topic[]
  classId: string
}

const EXERCISE_TYPES: { value: ExerciseType; label: string }[] = [
  { value: 'multiple-choice', label: 'Multiple Choice' },
  { value: 'short-answer',    label: 'Short Answer'    },
  { value: 'pseudocode',      label: 'Pseudocode'      },
  { value: 'ide',             label: 'Coding (IDE)'    },
  { value: 'binary-cards',    label: 'Binary Cards'    },
  { value: 'algo-viz',        label: 'Algo Visualiser' },
]

export function AIEngineTab({ topics, classId }: AIEngineTabProps) {
  const { toast } = useToast()

  const [topicId,    setTopicId]    = useState(topics[0]?.id ?? '')
  const [difficulty, setDifficulty] = useState<1|2|3|4>(2)
  const [exType,     setExType]     = useState<ExerciseType>('multiple-choice')
  const [language,   setLanguage]   = useState('')
  const [count,      setCount]      = useState(3)
  const [loading,    setLoading]    = useState(false)
  const [generated,  setGenerated]  = useState<GeneratedExercise[]>([])
  const [selected,   setSelected]   = useState<Set<number>>(new Set())
  const [saving,     setSaving]     = useState(false)

  const selectedTopic = topics.find(t => t.id === topicId)

  async function handleGenerate() {
    if (!topicId) { toast.error('Select a topic first'); return }
    setLoading(true)
    setGenerated([])
    setSelected(new Set())
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic_id:   topicId,
          topic_name: selectedTopic?.name ?? topicId,
          difficulty,
          type:       exType,
          language:   language || undefined,
          count,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Generation failed')
      setGenerated(json.exercises)
      toast.success(`Generated ${json.exercises.length} exercises!`)
    } catch (err: unknown) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (selected.size === 0) { toast.error('Select at least one exercise'); return }
    setSaving(true)
    try {
      const toSave = generated.filter((_, i) => selected.has(i))
      const res = await fetch('/api/generate/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercises: toSave,
          topic_id: topicId,
          class_id: classId || undefined,
          syllabus_ref: classId ? `class:${classId}:topic:${topicId}` : undefined,
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      const json = await res.json()
      toast.success(`Saved ${json.count} exercises as drafts`)
      setGenerated([])
      setSelected(new Set())
    } catch (err: unknown) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  function toggleSelect(i: number) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* ── Config form ──────────────────────────────────────────────── */}
      <Card>
        <h3 className="font-semibold text-fg mb-4">Generate Exercises with AI</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Topic */}
          <div>
            <label className="block text-xs text-fg-dim mb-1.5">Topic</label>
            <select
              value={topicId}
              onChange={e => setTopicId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-s2 border border-b2 text-fg text-sm focus:border-accent focus:outline-none"
            >
              {topics.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-xs text-fg-dim mb-1.5">Difficulty</label>
            <div className="flex gap-1">
              {([1,2,3,4] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={clsx(
                    'flex-1 h-10 rounded-lg text-sm font-medium border transition-colors',
                    difficulty === d
                      ? 'bg-accent text-bg border-accent'
                      : 'bg-s2 border-b2 text-fg-dim hover:text-fg'
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs text-fg-dim mb-1.5">Exercise Type</label>
            <select
              value={exType}
              onChange={e => setExType(e.target.value as ExerciseType)}
              className="w-full h-10 px-3 rounded-lg bg-s2 border border-b2 text-fg text-sm focus:border-accent focus:outline-none"
            >
              {EXERCISE_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Count */}
          <div>
            <label className="block text-xs text-fg-dim mb-1.5">Count</label>
            <select
              value={count}
              onChange={e => setCount(Number(e.target.value))}
              className="w-full h-10 px-3 rounded-lg bg-s2 border border-b2 text-fg text-sm focus:border-accent focus:outline-none"
            >
              {[1,2,3,5].map(n => (
                <option key={n} value={n}>{n} exercise{n>1?'s':''}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Language (optional, for IDE exercises) */}
        {(exType === 'ide' || exType === 'pseudocode') && (
          <div className="mt-4">
            <label className="block text-xs text-fg-dim mb-1.5">Language (optional)</label>
            <input
              type="text"
              value={language}
              onChange={e => setLanguage(e.target.value)}
              placeholder="Python, JavaScript, …"
              className="w-48 h-10 px-3 rounded-lg bg-s2 border border-b2 text-fg text-sm placeholder:text-fg-faint focus:border-accent focus:outline-none"
            />
          </div>
        )}

        <div className="mt-5 flex items-center gap-3">
          <Button onClick={handleGenerate} loading={loading} icon={<ZapIcon size={14} strokeWidth={1.8} />}>
            Generate with AI
          </Button>
          {generated.length > 0 && (
            <Button
              variant="secondary"
              onClick={handleSave}
              loading={saving}
              disabled={selected.size === 0}
            >
              Save {selected.size > 0 ? selected.size : ''} as Draft
            </Button>
          )}
        </div>
      </Card>

      {/* ── Generated exercises list ──────────────────────────────────── */}
      {generated.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-fg">Generated Exercises</h3>
            <button
              onClick={() => setSelected(new Set(generated.map((_, i) => i)))}
              className="text-xs text-accent hover:underline"
            >
              Select all
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-fg-dim hover:text-fg"
            >
              Deselect all
            </button>
          </div>

          {generated.map((ex, i) => (
            <div
              key={i}
              onClick={() => toggleSelect(i)}
              className={clsx(
                'card p-4 cursor-pointer transition-all',
                selected.has(i)
                  ? 'border-accent bg-accent/5'
                  : 'hover:border-b3'
              )}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => toggleSelect(i)}
                  className="mt-1 accent-[var(--accent)]"
                  onClick={e => e.stopPropagation()}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="font-semibold text-fg text-sm">{ex.title}</h4>
                    <Badge variant="accent" size="sm">{ex.type}</Badge>
                    <Badge variant="default" size="sm">Diff {ex.difficulty}</Badge>
                    <Badge variant="yellow" size="sm">+{ex.xp_reward} XP</Badge>
                  </div>
                  <p className="text-xs text-fg-dim line-clamp-2">{ex.description}</p>
                  {ex.hints && ex.hints.length > 0 && (
                    <p className="text-xs text-fg-faint mt-1">
                      💡 {ex.hints.length} hint{ex.hints.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
