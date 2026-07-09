import Link from 'next/link'
import type { Metadata } from 'next'
import { LogoMark, ArrowRightIcon, CheckIcon } from '@/components/ui/Icons'

export const metadata: Metadata = {
  title:       'ByteForge — Learn ICT',
  description: 'An adaptive ICT learning platform. Master algorithms, programming and computer science through interactive exercises.',
}

export default function LandingPage() {
  const features = [
    {
      num:   '01',
      title: 'Adaptive Skill Tree',
      desc:  '42 concepts that unlock as you progress — no skipping ahead, no waiting behind your level.',
    },
    {
      num:   '02',
      title: 'AI-Powered Exercises',
      desc:  'Your teacher uses Gemini to generate exercises tailored specifically to your class and curriculum.',
    },
    {
      num:   '03',
      title: 'Real Mastery Tracking',
      desc:  'Accuracy is tracked across every concept. The engine keeps you practising exactly where you need it.',
    },
    {
      num:   '04',
      title: 'XP & Streaks',
      desc:  'Earn experience, level up, and maintain daily streaks. Progress feels tangible and worth showing off.',
    },
    {
      num:   '05',
      title: 'Interactive Tools',
      desc:  'Binary cards, flowcharts, pseudocode editor, algorithm visualiser, and a live code IDE.',
    },
    {
      num:   '06',
      title: 'Achievement System',
      desc:  '20 milestones to unlock — from your first concept to mastering all 42. Each one earns bonus XP.',
    },
  ]

  const stages = [
    { label: 'Grade 6',   color: '#22c97a', range: 'Foundation'  },
    { label: 'Grade 7',   color: '#22c5d4', range: 'Key Stage 3' },
    { label: 'Grade 8',   color: '#3b9fd3', range: 'Key Stage 3' },
    { label: 'Grade 9',   color: '#f07428', range: 'Key Stage 4' },
    { label: 'IGCSE',     color: '#9575e8', range: 'Yr 10–11'    },
    { label: 'AS / A',    color: '#e8a830', range: 'Sixth Form'  },
  ]

  const lessons = [
    { href: '/lessons/binary-cards.html', label: 'Binary Cards',     icon: <BinaryMark /> },
    { href: '/lessons/flowchart.html',    label: 'Flowcharts',        icon: <FlowMark />   },
    { href: '/lessons/pseudocode.html',   label: 'Pseudocode',        icon: <PseudoMark /> },
    { href: '/lessons/blockly.html',      label: 'Block Coding',      icon: <BlockMark />  },
    { href: '/lessons/ide.html',          label: 'Code Editor',       icon: <CodeMark />   },
    { href: '/lessons/algo-viz.html',     label: 'Algo Visualiser',   icon: <AlgoMark />   },
  ]

  return (
    <div className="min-h-dvh bg-s0 text-t1">

      {/* ── Navigation ────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 h-14 flex items-center justify-between
                      px-6 bg-s0/90 backdrop-blur-md border-b border-b2">
        <div className="flex items-center gap-2">
          <LogoMark size={20} />
          <span className="font-bold text-base logo-text tracking-tight">ByteForge</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-sm text-t2 hover:text-t1 transition-colors px-3 py-2"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 rounded-md bg-accent text-s0 text-sm font-semibold
                       hover:opacity-90 active:opacity-80 transition-opacity"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-28 px-6 overflow-hidden">
        {/* Subtle radial glow — one, positioned, not everywhere */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[720px] h-[360px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--accent) 8%, transparent) 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />

        <div className="relative max-w-3xl mx-auto">
          <p className="label-caps text-accent mb-5">ICT Learning Platform</p>
          <h1 className="mb-5">
            Master computer science<br />
            <span className="text-t2">before everyone else does.</span>
          </h1>
          <p className="text-base text-t2 max-w-xl mb-10 leading-relaxed">
            ByteForge adapts to your level. Follow a personalised skill tree,
            earn XP with every concept, and track real mastery — not just quiz scores.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg
                         bg-accent text-s0 font-semibold text-sm
                         hover:opacity-90 active:opacity-80 transition-opacity"
            >
              Start for free
              <ArrowRightIcon size={15} strokeWidth={2.2} />
            </Link>
            <Link
              href="/lessons/binary-cards.html"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg
                         border border-b3 text-t1 font-semibold text-sm
                         hover:bg-s2 transition-colors"
            >
              Try a lesson
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stage track ───────────────────────────────────────────────── */}
      <section className="px-6 pb-16">
        <div className="max-w-3xl mx-auto">
          <p className="label-caps mb-5">6 stages · Grade 6 to A Level</p>
          <div className="flex gap-2 flex-wrap">
            {stages.map(s => (
              <div
                key={s.label}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md
                           bg-s1 border border-b2 text-sm"
              >
                {/* Stage color bar — no emoji */}
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: s.color }}
                />
                <span className="font-semibold" style={{ color: s.color }}>{s.label}</span>
                <span className="text-t3 text-xs">{s.range}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-b2">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <p className="label-caps text-accent mb-3">What you get</p>
            <h2>Built for how students actually learn.</h2>
          </div>

          {/* Asymmetric grid — 2+2+2 with a spanning feature */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-b2 rounded-xl overflow-hidden border border-b2">
            {features.map((f, i) => (
              <div
                key={f.num}
                className={`bg-s0 p-6 ${i === 0 ? 'sm:col-span-2 lg:col-span-1' : ''}`}
              >
                <span className="label-caps text-accent mb-3 block">{f.num}</span>
                <h4 className="mb-2">{f.title}</h4>
                <p className="text-sm text-t2 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Interactive lessons ───────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-b2">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="label-caps text-accent mb-3">Free tools</p>
              <h2>Interactive lessons.<br />No account needed.</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {lessons.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="group flex items-center gap-3 p-4 rounded-lg
                           bg-s1 border border-b2
                           hover:bg-s2 hover:border-b3 transition-all duration-150"
              >
                <span className="shrink-0 text-accent opacity-80 group-hover:opacity-100 transition-opacity">
                  {l.icon}
                </span>
                <span className="text-sm font-medium text-t2 group-hover:text-t1 transition-colors">
                  {l.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Proof points ──────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-b2">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-8">
          {[
            { value: '42',  label: 'Concepts',      sub: 'across 8 tiers' },
            { value: '20',  label: 'Achievements',  sub: 'to collect'     },
            { value: '6',   label: 'Stages',        sub: 'Gr 6 to A Level'},
          ].map(s => (
            <div key={s.label}>
              <p className="text-4xl font-extrabold text-t1 tracking-tight tabular-nums">{s.value}</p>
              <p className="text-base font-semibold text-t1 mt-1">{s.label}</p>
              <p className="text-sm text-t2">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-b2">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="mb-4">Ready to forge your skills?</h2>
          <p className="text-base text-t2 mb-8">
            Create a free account and take the placement quiz.<br />
            We'll set you up with the right starting stage.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-lg
                       bg-accent text-s0 font-bold text-base
                       hover:opacity-90 active:opacity-80 transition-opacity"
          >
            Get started — it's free
            <ArrowRightIcon size={16} strokeWidth={2.2} />
          </Link>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-5 mt-8">
            {['No credit card', 'Free forever', 'Placement quiz included'].map(t => (
              <span key={t} className="flex items-center gap-1.5 text-xs text-t3">
                <CheckIcon size={11} strokeWidth={2.5} className="text-emerald" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-b2 py-8 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <LogoMark size={16} />
            <span className="text-xs text-t3 font-semibold">ByteForge</span>
          </div>
          <p className="text-xs text-t3">
            © {new Date().getFullYear()} ByteForge · Built for ICT learners
          </p>
        </div>
      </footer>
    </div>
  )
}

// ── Minimal lesson SVG marks — purposeful, not emoji ─────────────────────────

function BinaryMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <text x="1" y="13" fontFamily="monospace" fontSize="11" fill="currentColor" fontWeight="700">01</text>
    </svg>
  )
}
function FlowMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="5" y="1"  width="8" height="4"  rx="1" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 5v3M9 11v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M3 8h12v3H3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <rect x="5" y="13" width="8" height="4"  rx="1" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}
function PseudoMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 5h12M3 8h9M3 11h7M3 14h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
function BlockMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="1" y="7"  width="7" height="4" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="10" y="3" width="7" height="4" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="10" y="11" width="7" height="4" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 9h1a1 1 0 011 1v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8 9h1a1 1 0 001-1V5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
function CodeMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M11 4l4 5-4 5M7 14l-4-5 4-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function AlgoMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <polyline points="1,9 4,9 6,14 10,4 13,9 16,9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
