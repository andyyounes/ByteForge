'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import { CONCEPTS, PATHWAYS, computeLayout } from '@/lib/concepts'
import { conceptCode } from '@/lib/concept-glyphs'
import { ConceptGlyph } from '@/components/ui/ConceptGlyph'
import type { MasteryMap, MasteryStatus, Concept } from '@/types'

// ── Status to colour map ─────────────────────────────────────────────────────
const STATUS_COLOR: Record<MasteryStatus, string> = {
  locked:     '#151823',
  available:  '#242936',
  started:    '#5b3a18',
  practicing: '#173651',
  mastered:   '#123727',
}
const STATUS_BORDER: Record<MasteryStatus, string> = {
  locked:     '#2c3141',
  available:  '#4a5267',
  started:    '#e8a830',
  practicing: '#3b9fd3',
  mastered:   '#1dc876',
}

const STATUS_TEXT: Record<MasteryStatus, string> = {
  locked:     '#5f6477',
  available:  '#b7bed2',
  started:    '#f1bd55',
  practicing: '#78c4e9',
  mastered:   '#74e4aa',
}

const TIER_LABELS = ['Foundation', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'Expert']

function drawChipPath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  const b = r * 0.38
  ctx.beginPath()
  ctx.moveTo(x - r + b, y - r)
  ctx.lineTo(x + r, y - r)
  ctx.lineTo(x + r, y + r - b)
  ctx.lineTo(x + r - b, y + r)
  ctx.lineTo(x - r, y + r)
  ctx.lineTo(x - r, y - r + b)
  ctx.closePath()
}

interface SkillTreeCanvasProps {
  masteryMap: MasteryMap
}

export function SkillTreeCanvas({ masteryMap }: SkillTreeCanvasProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const router     = useRouter()
  const [hovered,  setHovered]  = useState<string | null>(null)
  const [selected, setSelected] = useState<Concept | null>(null)

  const NODE_R = 24
  const W      = 1200
  const H      = 900

  const layout = computeLayout(W, H)

  // ── Draw ──────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#080a10'
    ctx.fillRect(0, 0, W, H)

    ctx.font = '600 11px JetBrains Mono, monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    for (let tier = 0; tier <= 8; tier++) {
      const y = 60 + tier * (H / 9.5)
      ctx.strokeStyle = '#ffffff0a'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(32, y)
      ctx.lineTo(W - 32, y)
      ctx.stroke()
      ctx.fillStyle = '#6f7488'
      ctx.fillText(TIER_LABELS[tier] ?? `T${tier}`, 40, y - 18)
    }

    // Draw edges
    for (const concept of CONCEPTS) {
      const toPos = layout.get(concept.id)
      if (!toPos) continue
      for (const prereqId of concept.prerequisites) {
        const fromPos = layout.get(prereqId)
        if (!fromPos) continue
        const status = masteryMap[prereqId]?.status ?? 'locked'
        ctx.beginPath()
        ctx.moveTo(fromPos.x, fromPos.y)
        ctx.lineTo(toPos.x, toPos.y)
        ctx.strokeStyle = status === 'mastered' ? '#1dc87655' : '#ffffff12'
        ctx.lineWidth   = status === 'mastered' ? 2 : 1
        ctx.stroke()
      }
    }

    // Draw nodes
    for (const concept of CONCEPTS) {
      const pos    = layout.get(concept.id)
      if (!pos) continue
      const status = masteryMap[concept.id]?.status ?? 'locked'
      const isHov  = hovered === concept.id
      const isSel  = selected?.id === concept.id
      const r      = isHov || isSel ? NODE_R + 4 : NODE_R

      if (status !== 'locked') {
        drawChipPath(ctx, pos.x + 3, pos.y + 4, r)
        ctx.fillStyle = '#00000045'
        ctx.fill()
      }

      drawChipPath(ctx, pos.x, pos.y, r)
      ctx.fillStyle = STATUS_COLOR[status]
      ctx.fill()

      drawChipPath(ctx, pos.x, pos.y, r)
      ctx.strokeStyle = isSel
        ? '#ffffff'
        : STATUS_BORDER[status]
      ctx.lineWidth   = isSel ? 3 : 2
      ctx.stroke()

      const code = conceptCode(concept)
      ctx.font = `800 ${code.length > 3 ? 10 : 12}px JetBrains Mono, monospace`
      ctx.textAlign    = 'center'
      ctx.textBaseline = 'middle'
      ctx.globalAlpha  = status === 'locked' ? 0.3 : 1
      ctx.fillStyle    = STATUS_TEXT[status]
      ctx.fillText(code, pos.x, pos.y + 1)
      ctx.globalAlpha  = 1

      // Mastery % for practicing/started
      const score = masteryMap[concept.id]?.mastery_score
      if (score && score > 0 && status !== 'mastered' && status !== 'locked') {
        ctx.font         = '10px Inter, sans-serif'
        ctx.fillStyle    = '#e6edf3'
        ctx.textAlign    = 'center'
        ctx.textBaseline = 'top'
        ctx.fillText(`${score}%`, pos.x, pos.y + r + 3)
      }
    }
  }, [hovered, selected, masteryMap, layout])

  useEffect(() => { draw() }, [draw])

  // ── Mouse events ──────────────────────────────────────────────────────────
  function hitTest(cx: number, cy: number): string | null {
    for (const concept of CONCEPTS) {
      const pos = layout.get(concept.id)
      if (!pos) continue
      const dx = pos.x - cx
      const dy = pos.y - cy
      if (Math.sqrt(dx * dx + dy * dy) <= NODE_R + 6) return concept.id
    }
    return null
  }

  function canvasCoords(e: React.MouseEvent<HTMLCanvasElement>): [number, number] {
    const rect = canvasRef.current!.getBoundingClientRect()
    const scaleX = W / rect.width
    const scaleY = H / rect.height
    return [(e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY]
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const [cx, cy] = canvasCoords(e)
    const hit = hitTest(cx, cy)
    setHovered(hit)
    if (canvasRef.current) {
      canvasRef.current.style.cursor = hit ? 'pointer' : 'default'
    }
  }

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const [cx, cy] = canvasCoords(e)
    const hit = hitTest(cx, cy)
    if (!hit) { setSelected(null); return }
    const concept = CONCEPTS.find(c => c.id === hit) ?? null
    setSelected(prev => prev?.id === hit ? null : concept)
  }

  const masteredCount  = Object.values(masteryMap).filter(m => m.status === 'mastered').length
  const practicingCount= Object.values(masteryMap).filter(m => m.status === 'practicing').length

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-fg-dim">
        {[
          { color: '#1dc876', label: `Mastered (${masteredCount})` },
          { color: '#3b9fd3', label: `Practicing (${practicingCount})` },
          { color: '#e8a830', label: 'Started' },
          { color: '#4a5267', label: 'Available' },
          { color: '#2c3141', label: 'Locked' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>

      <div className="relative">
        {/* Canvas */}
        <div className="overflow-auto rounded-lg border border-b2 bg-s1 shadow-card">
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="w-full"
            style={{ maxWidth: W, display: 'block' }}
            onMouseMove={handleMouseMove}
            onClick={handleClick}
          />
        </div>

        {/* Detail panel */}
        {selected && (() => {
          const m = masteryMap[selected.id]
          const status = m?.status ?? 'locked'
          return (
            <div className="absolute top-4 right-4 w-72 card p-4 shadow-overlay animate-fade-in-up">
              <div className="flex items-center gap-3 mb-3">
                <ConceptGlyph concept={selected} size="md" muted={status === 'locked'} />
                <div>
                  <h3 className="font-semibold text-fg text-sm">{selected.name}</h3>
                  <span className={clsx('text-xs capitalize', {
                    'text-green':   status === 'mastered',
                    'text-accent':  status === 'practicing',
                    'text-yellow':  status === 'started',
                    'text-fg-dim':  status === 'available',
                    'text-fg-faint': status === 'locked',
                  })}>
                    {status}
                  </span>
                </div>
              </div>

              {m && m.mastery_score > 0 && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-fg-faint mb-1">
                    <span>Mastery</span><span>{m.mastery_score}%</span>
                  </div>
                  <div className="h-1.5 bg-s2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${m.mastery_score}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="text-xs text-fg-faint space-y-0.5 mb-4">
                <div>~{selected.estimatedMinutes} min</div>
                <div>Difficulty {selected.difficulty}/4</div>
                {m && <div>{m.attempts} attempt{m.attempts !== 1 ? 's' : ''}</div>}
              </div>

              {status !== 'locked' && (
                <button
                  onClick={() => router.push(selected.lessonUrl)}
                  className="w-full py-2 rounded-lg bg-accent text-bg text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  {status === 'mastered' ? 'Review' : 'Study →'}
                </button>
              )}
              {status === 'locked' && (
                <p className="text-xs text-fg-faint text-center">
                  Complete prerequisites first
                </p>
              )}
            </div>
          )
        })()}
      </div>
    </div>
  )
}
