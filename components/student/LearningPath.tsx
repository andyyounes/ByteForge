// ============================================================
//  ByteForge — Learning Path / Roadmap
//  Vertical timeline showing the ordered concept path for a
//  student's grade. Locked nodes dim out until prerequisites
//  are completed; clicking available/started nodes opens the lesson.
// ============================================================

import Link from 'next/link'
import { clsx } from 'clsx'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { CheckIcon, LockIcon, ChevronRightIcon } from '@/components/ui/Icons'
import { conceptById } from '@/lib/concepts'
import type { MasteryMap } from '@/types'

// ── Grade-specific path sections ─────────────────────────────────────────────
// Each section is a labeled group of concept IDs in the intended study order.
// Adapt these when new tracks are added.

interface PathSection {
  label:      string
  color:      string      // accent colour for the section header dot
  conceptIds: string[]
}

// All section dots use the same amber accent — section titles already
// distinguish the tracks, so the dot is purely decorative.
const SECTION_DOT = '#eab308'

const GRADE_SECTIONS: Record<number, PathSection[]> = {
  // ── Grade 6 — "The Artist's Toolkit" ─────────────────────────────────────
  6: [
    {
      label: "The Artist's Toolkit",
      color: SECTION_DOT,
      conceptIds: [
        'g6-pixels', 'g6-turtle', 'g6-loops', 'g6-animation',
        'g6-patterns', 'g6-color-vars', 'g6-random', 'g6-debug',
        'g6-story', 'g6-capstone',
      ],
    },
  ],
  // ── Grade 7 — "The Game Maker" ────────────────────────────────────────────
  7: [
    {
      label: 'The Game Maker',
      color: SECTION_DOT,
      conceptIds: [
        'g7-variables', 'g7-conditionals', 'g7-functions', 'g7-keyboard',
        'g7-mouse', 'g7-collision', 'g7-gamestate', 'g7-design',
        'g7-strings', 'g7-capstone',
      ],
    },
  ],
  // ── Grade 8 — kept in sync with grade8.html's own G8_MODULE_CONCEPT map and
  // its real module order (web0-web5, py1-adv/cc1, m1-m10). The previous list
  // here (functions-params/lists-data, then pseudocode-*, then compression/
  // cpu-pipeline/hex-intro/ascii-unicode) was a leftover from before Grade 8's
  // 3-semester rebuild — those pseudocode/hardware concepts are gradeMin 9-10
  // and link to entirely different standalone pages, not grade8.html at all,
  // so this widget sent Grade 8 students somewhere unrelated to their actual
  // Builder City Map. ────────────────────────────────────────────────────────
  8: [
    {
      label: 'Building a Website',
      color: SECTION_DOT,
      conceptIds: ['g8-what-is-a-website', 'g8-web-story'],
    },
    {
      label: 'Python Fundamentals',
      color: SECTION_DOT,
      conceptIds: ['g8-text', 'g8-loops', 'functions-params', 'lists-data', 'g8-strings'],
    },
    {
      label: 'Real Projects',
      color: SECTION_DOT,
      conceptIds: ['g8-files', 'g8-hardware', 'g8-web', 'g8-cyber', 'g8-apps', 'g8-capstone'],
    },
  ],
  // ── Grade 9 — "The Deep Diver" ───────────────────────────────────────────
  // 3 Terms × 10 Weeks × 2 Hours = 60 hours
  9: [
    {
      label: 'Term 1 — Think & Plan',
      color: SECTION_DOT,
      conceptIds: [
        'g9-cpu-model',       // W1  — The Human Computer (unplugged FDE)
        'g9-binary',          // W2  — Binary: cards activity + bit-toggle
        'g9-hex',             // W3  — Hex & colour codes
        'g9-flowcharts',      // W4  — Flowcharts (Flowgorithm intro)
        'g9-flowcharts-loops',// W5  — Loops in flowcharts + project selection
        'g9-pseudocode',      // W6  — Cambridge pseudocode foundations
        'g9-declarations',    // W7  — Data types & DECLARE
        'g9-procedures',      // W8  — PROCEDUREs, FUNCTIONs, BYVAL/BYREF
        'g9-trace-tables',    // W9  — Trace tables
        'g9-term1-review',    // W10 — Term 1 project presentations
      ],
    },
    {
      label: 'Term 2 — Go Deeper',
      color: SECTION_DOT,
      conceptIds: [
        'g9-sort',            // W11 — Bubble sort + insertion sort
        'g9-search',          // W12 — Linear & binary search
        'g9-cybersecurity',   // W13–14 — Passwords, encryption, hashing
        'g9-hardware',        // W15 — CPU pipeline + memory hierarchy
        'g9-microbit',        // W16 — Micro:bit sensors & logic
        'g9-ai-concepts',     // W17 — AI: supervised learning, bias
        'g9-ai-algorithms',   // W18 — Decision trees, k-NN, spam filter
        'g9-python-intro',    // W19 — Python: pseudocode translation
        'g9-python-build',    // W20 — Python: bubble sort & binary search
        'g9-term2-review',    // W20 — Term 2 checklist & completion
      ],
    },
    {
      label: 'Term 3 — Build & Create',
      color: SECTION_DOT,
      conceptIds: [
        'g9-python-files',    // W21 — Python: CSV files & data
        'g9-python-lists',    // W22–23 — Lists, dicts, comprehensions
        'g9-error-handling',  // W23 — Functions depth, try/except
        'g9-data-viz',        // W24–25 — Charts, matplotlib/text charts
        'g9-ai-python',       // W26–27 — AI APIs in Python
        'g9-project-start',   // W28 — Project: plan, design, first build
        'g9-project-refine',  // W29 — Project: refine, test, debug
        'g9-capstone',        // W30 — Year showcase
      ],
    },
  ],
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** First unmet prerequisite name for a locked concept (shown as unlock hint). */
function unlockHint(conceptId: string, masteryMap: MasteryMap): string | null {
  const concept = conceptById(conceptId)
  if (!concept || concept.prerequisites.length === 0) return null
  const unmet = concept.prerequisites.find(
    p => masteryMap[p]?.status !== 'mastered' && masteryMap[p]?.status !== 'practicing'
  )
  if (!unmet) return null
  return conceptById(unmet)?.name ?? null
}

// ── Sub-component: single concept row ────────────────────────────────────────

interface ConceptRowProps {
  conceptId:   string
  masteryMap:  MasteryMap
  isLast:      boolean   // no bottom line on the last node in a section
}

function ConceptRow({ conceptId, masteryMap, isLast }: ConceptRowProps) {
  const concept = conceptById(conceptId)
  const mastery = masteryMap[conceptId]
  const status  = mastery?.status ?? 'locked'

  const isMastered   = status === 'mastered'
  const isStarted    = status === 'started' || status === 'practicing'
  const isAvailable  = status === 'available'
  const isLocked     = status === 'locked'

  const hint = isLocked ? unlockHint(conceptId, masteryMap) : null

  // ── Node colour ──────────────────────────────────────────────────────────
  const nodeClasses = clsx(
    'absolute left-0 top-3 z-10',
    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
    isMastered  && 'bg-emerald-500  border-emerald-500  text-white',
    isStarted   && 'bg-amber-400    border-amber-400    text-white',
    isAvailable && 'bg-s1           border-accent',
    isLocked    && 'bg-s2           border-b3           text-fg-faint',
  )

  // ── Row wrapper — link when accessible, div when locked ─────────────────
  const inner = (
    <div className={clsx(
      'flex items-start gap-3 pl-8 py-2.5 rounded-md pr-2 transition-colors duration-150',
      !isLocked && 'hover:bg-s2 group',
      isLocked  && 'opacity-45 cursor-not-allowed select-none',
    )}>
      {/* Status node */}
      <div className={nodeClasses} aria-hidden="true">
        {isMastered && <CheckIcon  size={10} strokeWidth={3} />}
        {isLocked   && <LockIcon   size={9}  strokeWidth={2} />}
        {isAvailable && (
          <span className="w-2 h-2 rounded-full bg-accent" />
        )}
        {isStarted && (
          <span className="w-2 h-2 rounded-full bg-white" />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={clsx(
            'text-sm font-medium',
            isMastered  && 'text-fg line-through decoration-fg-faint/60',
            isStarted   && 'text-fg',
            isAvailable && 'text-fg group-hover:text-accent transition-colors',
            isLocked    && 'text-fg-dim',
          )}>
            {concept?.name ?? conceptId}
          </span>

          {/* Mastery score badge */}
          {isStarted && mastery && mastery.mastery_score > 0 && (
            <span className="text-[10px] font-semibold text-amber-400 tabular-nums">
              {mastery.mastery_score}%
            </span>
          )}
          {isMastered && (
            <span className="text-[10px] font-semibold text-emerald-500">Done</span>
          )}
        </div>

        {/* Sub-line: time estimate or unlock hint */}
        {isLocked && hint ? (
          <p className="text-[11px] text-fg-faint mt-0.5">
            Complete &ldquo;{hint}&rdquo; to unlock
          </p>
        ) : !isLocked && concept?.estimatedMinutes ? (
          <p className="text-[11px] text-fg-faint mt-0.5">~{concept.estimatedMinutes} min</p>
        ) : null}
      </div>

      {/* Arrow — only on accessible nodes */}
      {!isLocked && (
        <ChevronRightIcon
          size={13} strokeWidth={2}
          className="shrink-0 mt-0.5 text-fg-faint group-hover:text-fg-dim transition-colors"
        />
      )}
    </div>
  )

  return (
    <div className="relative">
      {/* Vertical connector line */}
      {!isLast && (
        <span
          className={clsx(
            'absolute left-[9px] top-8 w-0.5 bottom-0 z-0',
            isMastered ? 'bg-emerald-500/40' : 'bg-b2',
          )}
          aria-hidden="true"
        />
      )}

      {isLocked
        ? inner
        : <Link href={concept?.lessonUrl ?? '#'}>{inner}</Link>
      }
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface LearningPathProps {
  masteryMap:   MasteryMap
  studentGrade: number
}

export function LearningPath({ masteryMap, studentGrade }: LearningPathProps) {
  const sections = GRADE_SECTIONS[studentGrade]

  // Grades with no defined path (IGCSE / AS / A-Level) skip this panel
  if (!sections || sections.length === 0) return null

  // Count total and mastered concepts across the path
  const allIds      = sections.flatMap(s => s.conceptIds)
  const totalCount  = allIds.length
  const doneCount   = allIds.filter(id => masteryMap[id]?.status === 'mastered').length
  const pct         = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  return (
    <Card className="p-0 overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <CardHeader className="mb-0">
          <CardTitle>Learning Path</CardTitle>
          <span className="text-[11px] text-fg-faint tabular-nums">
            {doneCount}/{totalCount} completed
          </span>
        </CardHeader>

        {/* Progress bar */}
        <div className="mt-3 h-1 bg-s2 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Sections */}
      <div className="divide-y divide-b2">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="px-5 py-4">
            {/* Section label */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: section.color }}
                aria-hidden="true"
              />
              <span className="text-[11px] font-semibold text-fg-dim uppercase tracking-widest">
                {section.label}
              </span>
            </div>

            {/* Concepts timeline */}
            <div className="relative">
              {section.conceptIds.map((id, idx) => (
                <ConceptRow
                  key={id}
                  conceptId={id}
                  masteryMap={masteryMap}
                  isLast={idx === section.conceptIds.length - 1}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}


