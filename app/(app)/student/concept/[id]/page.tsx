import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { CONCEPT_MAP, CONCEPTS, dependents } from '@/lib/concepts'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ConceptGlyph } from '@/components/ui/ConceptGlyph'
import { ConceptQuiz } from '@/components/student/ConceptQuiz'
import { ConceptProgressBar } from '@/components/student/ConceptProgressBar'
import {
  BookIcon, CodeIcon, FlowchartIcon, BinaryIcon,
  BlockIcon, AlgoIcon, PseudocodeIcon,
  ChevronRightIcon, ArrowRightIcon, TargetIcon,
  GridIcon, PenToolIcon, CpuIcon, CompressIcon, FunctionIcon,
} from '@/components/ui/Icons'
import type { ConceptMastery, MasteryStatus, Profile } from '@/types'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id }   = await params
  const concept  = CONCEPT_MAP.get(id)
  return { title: concept?.name ?? 'Concept' }
}

const STATUS_COLOR: Record<MasteryStatus, string> = {
  mastered:   'text-emerald',
  practicing: 'text-accent',
  started:    'text-amber',
  available:  'text-fg-dim',
  locked:     'text-fg-faint',
}

// ── Mode → URL ────────────────────────────────────────────────────────────────
const MODE_URLS: Record<string, string> = {
  'binary-cards': '/lessons/binary-cards.html',
  'blockly':      '/lessons/blockly.html',
  'pseudocode':   '/lessons/pseudocode.html',
  'flowchart':    '/lessons/flowchart.html',
  'ide':          '/lessons/ide.html',
  'algo-viz':     '/lessons/algo-viz.html',
  // Grade 6–8 interactive modes
  'pixel-grid':      '/lessons/pixel-grid.html',
  'turtle':          '/lessons/turtle.html',
  'blockly-turtle':  '/lessons/blockly-turtle.html',
  'canvas-code':     '/lessons/canvas-code.html',
  'grade7':          '/lessons/grade7.html',
  'grade8':          '/lessons/grade8.html',
  'grade9':          '/lessons/grade9.html',
  'compression':     '/lessons/compression.html',
  'cpu-pipeline':    '/lessons/cpu-pipeline.html',
}

// ── Mode → SVG icon + label — no emoji ────────────────────────────────────────
const MODE_META: Record<string, { icon: React.ReactNode; label: string }> = {
  'text':         { icon: <BookIcon       size={18} strokeWidth={1.6} />, label: 'Read & Learn'        },
  'binary-cards': { icon: <BinaryIcon     size={18} strokeWidth={1.6} />, label: 'Binary Cards'        },
  'blockly':      { icon: <BlockIcon      size={18} strokeWidth={1.6} />, label: 'Block Coding'        },
  'pseudocode':   { icon: <PseudocodeIcon size={18} strokeWidth={1.6} />, label: 'Pseudocode Editor'   },
  'flowchart':    { icon: <FlowchartIcon  size={18} strokeWidth={1.6} />, label: 'Flowchart Builder'   },
  'ide':          { icon: <CodeIcon       size={18} strokeWidth={1.6} />, label: 'Code Editor'         },
  'algo-viz':     { icon: <AlgoIcon       size={18} strokeWidth={1.6} />, label: 'Algorithm Visualiser'},
  // Grade 6–8 interactive modes
  'pixel-grid':     { icon: <GridIcon       size={18} strokeWidth={1.6} />, label: 'Pixel Grid Editor'        },
  'turtle':         { icon: <PenToolIcon    size={18} strokeWidth={1.6} />, label: 'Turtle Graphics'           },
  'blockly-turtle': { icon: <BlockIcon      size={18} strokeWidth={1.6} />, label: 'Block Coding — Turtle'     },
  'canvas-code':    { icon: <FunctionIcon   size={18} strokeWidth={1.6} />, label: 'Live Canvas Editor'        },
  'grade7':         { icon: <BlockIcon      size={18} strokeWidth={1.6} />, label: 'Block + Code (Grade 7)'    },
  'grade8':         { icon: <CodeIcon       size={18} strokeWidth={1.6} />, label: 'Python Editor (Grade 8)'        },
  'grade9':         { icon: <PseudocodeIcon size={18} strokeWidth={1.6} />, label: 'Cambridge Pseudocode (Grade 9)' },
  'compression':    { icon: <CompressIcon   size={18} strokeWidth={1.6} />, label: 'Compression Demo'               },
  'cpu-pipeline':   { icon: <CpuIcon        size={18} strokeWidth={1.6} />, label: 'CPU Pipeline'              },
}

// Static concept theory content
const CONCEPT_CONTENT: Record<string, { summary: string; points: string[] }> = {
  'computer-basics': {
    summary: 'A computer is an electronic device that processes data according to a set of instructions (a program). It takes input, processes it, and produces output.',
    points: [
      'Computers follow the IPO cycle: Input → Process → Output',
      'Hardware refers to physical components (CPU, RAM, keyboard, screen)',
      'Software refers to programs and operating systems',
      'The CPU (Central Processing Unit) is the "brain" — it executes instructions',
      'RAM (Random Access Memory) holds data the CPU is currently using',
      'Storage devices (HDD, SSD) keep data permanently even when powered off',
    ],
  },
  'input-output': {
    summary: 'Input devices send data into the computer. Output devices receive processed data from the computer. Storage devices hold data for later use.',
    points: [
      'Input devices: keyboard, mouse, microphone, camera, scanner, touchscreen',
      'Output devices: monitor, printer, speakers, projector',
      'Storage devices: hard disk drive (HDD), solid-state drive (SSD), USB drive, CD/DVD',
      'Some devices are both input AND output — e.g. a touchscreen, a network card',
      'Primary storage (RAM) is fast but volatile — data lost on power off',
      'Secondary storage is slower but persistent — data kept after power off',
    ],
  },
  'secondary-storage': {
    summary: 'Secondary storage permanently saves data even when the computer is turned off. Different technologies offer different speeds, capacities and costs.',
    points: [
      'HDD (Hard Disk Drive): uses spinning magnetic platters — cheap, slow, large capacity',
      'SSD (Solid State Drive): uses flash memory chips — fast, no moving parts, more expensive',
      'USB Flash Drive: portable, smaller capacity, convenient for transferring files',
      'Optical Discs (CD/DVD/Blu-ray): read by laser, used for distribution and backup',
      'Cloud storage: data stored on remote servers, accessed via the internet',
      'Key factors to compare: capacity (GB/TB), speed (MB/s), cost per GB, durability',
    ],
  },
  'networking-basics': {
    summary: "A network connects computers so they can share data and resources. The internet is the world's largest network.",
    points: [
      'LAN (Local Area Network): covers a small area like a school or office',
      'WAN (Wide Area Network): covers large areas, e.g. the internet',
      'Devices: router (connects networks), switch (connects devices in a LAN), modem',
      'IP addresses uniquely identify devices on a network (e.g. 192.168.1.1)',
      'Protocols: rules for communication — HTTP for web, SMTP for email, TCP/IP for data transfer',
      'Wired (Ethernet) vs wireless (Wi-Fi) — wired is faster and more reliable',
    ],
  },
  'cpu-basics': {
    summary: 'The CPU executes program instructions using its key components: ALU, CU, and registers.',
    points: [
      'ALU (Arithmetic Logic Unit): performs calculations and logical comparisons',
      'CU (Control Unit): fetches, decodes and coordinates execution of instructions',
      'Registers: tiny, ultra-fast storage inside the CPU (e.g. PC, ACC, MAR, MDR)',
      'The Fetch-Decode-Execute cycle: CPU continuously fetches instructions, decodes them, executes them',
      'Clock speed (GHz): higher = more instructions per second',
      'Cores: modern CPUs have multiple cores to run tasks in parallel',
      'Cache: small, very fast memory between RAM and CPU to speed up access',
    ],
  },
  'memory-types': {
    summary: 'Computers use different types of memory with different speeds and purposes.',
    points: [
      'RAM (Random Access Memory): temporary, fast, holds current programs and data',
      'ROM (Read-Only Memory): permanent, holds boot/startup instructions (BIOS)',
      'Cache memory: L1/L2/L3 — very fast, sits between CPU and RAM',
      'Virtual memory: uses hard disk space as extra "slow" RAM when RAM is full',
      'RAM is volatile (cleared on shutdown); ROM is non-volatile (persists)',
      'More RAM = more programs can run simultaneously without slowing down',
    ],
  },
  'html-css-basics': {
    summary: 'HTML defines the structure of web pages. CSS controls their appearance.',
    points: [
      'HTML (HyperText Markup Language): uses tags like <h1>, <p>, <img>, <a>',
      'CSS (Cascading Style Sheets): styles elements with properties like color, font-size, margin',
      'HTML elements have opening and closing tags: <p>text</p>',
      'Attributes provide extra info: <img src="photo.jpg" alt="A photo">',
      'CSS can be inline, in a <style> tag, or in a separate .css file',
      'The box model: content → padding → border → margin',
      'Selectors target elements: .class, #id, element type',
    ],
  },
  'ascii-unicode': {
    summary: 'Computers store text as numbers. ASCII and Unicode are standards that map characters to numbers.',
    points: [
      'ASCII uses 7 bits — represents 128 characters (letters, digits, symbols)',
      'A = 65, a = 97, 0 = 48 in ASCII',
      'ASCII only covers English — not enough for global languages',
      'Unicode supports 100,000+ characters including all world scripts and emoji',
      'UTF-8 is the most common Unicode encoding — variable length (1–4 bytes per character)',
      'To find ASCII value: character → decimal number using the ASCII table',
    ],
  },
  'boolean-algebra': {
    summary: 'Boolean algebra is the mathematics of logic, using only two values: TRUE (1) and FALSE (0).',
    points: [
      'Three basic operations: AND, OR, NOT',
      'AND: true only if BOTH inputs are true (A · B)',
      'OR: true if AT LEAST ONE input is true (A + B)',
      'NOT: inverts the input (Ā)',
      'XOR: true if inputs are DIFFERENT (A ⊕ B)',
      "De Morgan's Laws: NOT(A AND B) = (NOT A) OR (NOT B)",
      'Truth tables list all possible input combinations and their outputs',
    ],
  },

  // ── Grade 6: Artist's Toolkit ─────────────────────────────────────────────
  'pixels-intro': {
    summary: 'Every image you see on a screen is made of tiny coloured squares called pixels. Zoom into any photo and you will see the grid.',
    points: [
      'Pixel = "picture element" — the smallest unit a screen can display',
      'A 1920×1080 screen has over 2 million individual pixels',
      'Each pixel is addressed by its column (x) and row (y) position',
      'Resolution describes how many pixels fit in a given space — more pixels = sharper image',
      'Images are stored as a grid of colour values — one value per pixel',
      'The pixel grid is the foundation of all digital graphics, photos, and games',
    ],
  },
  'rgb-colors': {
    summary: 'Computers create every colour by mixing three light channels: Red, Green, and Blue. Unlike paint, adding light channels together makes colours brighter.',
    points: [
      'RGB stands for Red, Green, Blue — the three primary colours of light',
      'Each channel ranges from 0 (off) to 255 (full brightness)',
      'RGB(255, 0, 0) = pure red · RGB(0, 255, 0) = pure green · RGB(0, 0, 255) = pure blue',
      'RGB(255, 255, 255) = white (all channels full) · RGB(0, 0, 0) = black (all off)',
      'RGB(255, 165, 0) = orange — mixing red and a little green',
      'Hex colour codes are just RGB written in base 16: #FF6600 = R:255 G:102 B:0',
      'Screens mix light (additive colour) — unlike paint which mixes pigment (subtractive)',
    ],
  },
  'pixel-art': {
    summary: 'Pixel art is a digital art form where images are created one pixel at a time on a grid. It requires planning every dot intentionally.',
    points: [
      'Work on a small canvas first — 16×16 or 32×32 grids are common sizes',
      'Choose a limited palette (4–8 colours) for a cohesive look',
      'Symmetry helps — many sprites are drawn on one half and mirrored',
      'Shading is done by using a slightly darker version of the same colour',
      'Avoid "jaggies" (staircase edges) by using 1-pixel diagonal steps',
      'Game sprites, icons, and retro game graphics are all pixel art',
      'Tools: pixel grid editor, Piskel, Aseprite — all work on a coloured cell grid',
    ],
  },
  'turtle-basics': {
    summary: 'Turtle graphics turns drawing into programming. You control a virtual pen (the turtle) by giving it commands like "move forward" and "turn right".',
    points: [
      'The turtle starts at the centre of the canvas, facing up',
      'forward(n) moves the turtle n pixels in the direction it faces',
      'turn_right(90) rotates the turtle 90 degrees clockwise',
      'pencolor("red") changes the drawing colour',
      'penup() lifts the pen (moves without drawing) · pendown() resumes drawing',
      'To draw a square: forward 100, right 90 — repeat 4 times',
      'You are writing a sequence of instructions — this is the heart of programming',
    ],
  },
  'loops-drawing': {
    summary: 'Instead of repeating the same drawing commands four times, a loop lets you say "repeat this block N times". One loop can draw entire shapes.',
    points: [
      'A loop runs its inner block of code a set number of times',
      'repeat(4) { forward(100); right(90) } draws a square — same as writing it 4 times',
      'Change the repeat count and the shape changes: repeat(3) = triangle, repeat(6) = hexagon',
      'Loops make code shorter, easier to read, and easier to change',
      'The loop counter (i) tells you which iteration you are on: 0, 1, 2 … N-1',
      'Combining a loop with different colours each step creates gradient effects',
      'Any regular polygon can be drawn with: repeat(sides) { forward(len); right(360/sides) }',
    ],
  },
  'nested-loops': {
    summary: 'A nested loop is a loop inside another loop. The outer loop runs once per row, the inner loop runs once per column — perfect for creating 2D patterns.',
    points: [
      'Outer loop controls rows (e.g. i from 0 to 4) — inner loop controls columns (j from 0 to 4)',
      'Total iterations = outer count × inner count: a 5×5 grid runs 25 times',
      'Each cell position is (j × cell_size, i × cell_size) — simple x, y coordinates',
      'Using i or j to control colour creates gradients across the grid',
      'Using (i + j) to pick a colour creates diagonal stripe patterns',
      'Nested loops also appear in image processing, game boards, and sorting algorithms',
      'Once you understand nested loops, grid-based thinking becomes natural',
    ],
  },

  // ── Grade 7: Game Maker ───────────────────────────────────────────────────
  'variables-visual': {
    summary: 'A variable is a named storage box in memory. You give it a name, put a value in, and the program can read or change that value at any time.',
    points: [
      'Think of a variable as a labelled box: score = 0 puts the number 0 in the "score" box',
      'You can change the value at any time: score = score + 10 adds 10 to whatever is already there',
      'Variable names should be descriptive: playerX, speed, health are better than x, s, h',
      'Variables can hold numbers (42), text ("hello"), or true/false values',
      'Every time the variable changes, the program uses the new value going forward',
      'Variables are the reason programs can respond to input and track state',
      'Without variables, every output would always be the same — no interactivity',
    ],
  },
  'conditionals': {
    summary: 'An if/else statement makes a decision. The program checks a condition — if it\'s true, one block runs; if it\'s false, the other block runs.',
    points: [
      'if (score > 100) { showMessage("Amazing!") } else { showMessage("Keep going!") }',
      'The condition is always a true/false question: is score > 100? is color == "red"?',
      'Comparison operators: == (equals), != (not equal), > (greater), < (less), >= , <=',
      'elif / else if lets you chain multiple conditions: if red → stop; elif orange → wait; else → go',
      'Conditions can be combined: if (x > 0 AND x < 100) means x must be between 0 and 100',
      'A traffic light is a classic example: one variable controls which colour is shown',
      'If statements let programs react differently depending on state — this is what makes games work',
    ],
  },
  'events-interaction': {
    summary: 'Programs can listen for things that happen — a key press, a mouse click, a timer tick. These are events. Code that runs when an event fires is called an event handler.',
    points: [
      'An event is something that happens: keydown, mouseclick, timer, collision',
      'An event listener "watches" for a specific event and triggers a function when it fires',
      'onKeyDown("ArrowLeft", movePlayerLeft) — calls movePlayerLeft whenever ← is pressed',
      'Event-driven programming is how all games, apps, and websites work',
      'Without events, a program runs once from top to bottom and stops',
      'With events, a program keeps running and responds as things happen',
      'Multiple events can fire at once — e.g. left key AND up key pressed simultaneously',
    ],
  },

  // ── Grade 8: Systems Builder ──────────────────────────────────────────────
  'functions-params': {
    summary: 'A function is a named block of reusable code. Instead of writing the same logic five times, you write it once as a function and call it five times.',
    points: [
      'function drawHouse(x, y, color) { ... } — defines the function once',
      'drawHouse(100, 200, "red") — calls it and passes in different values each time',
      'Parameters (x, y, color) are the settings you can pass in to customise behaviour',
      'Arguments are the actual values passed when calling: 100, 200, "red"',
      'Functions can return a value: function area(w, h) { return w * h } → area(4, 5) = 20',
      'Good functions do one thing only and have a clear, descriptive name',
      'Functions are how you avoid copy-pasting code — DRY: Don\'t Repeat Yourself',
    ],
  },
  'lists-data': {
    summary: 'A list (array) stores multiple values in a single variable, each accessible by its position number (index). Lists grow and shrink dynamically.',
    points: [
      'scores = [95, 82, 71, 88, 64] — a list of 5 numbers',
      'Access by index: scores[0] = 95 (indexing starts at 0, not 1)',
      'scores.append(77) adds a value to the end',
      'len(scores) returns how many items are in the list',
      'Loop through a list: for score in scores: print(score)',
      'A 2D list is a list of lists — used for grids, game boards, images',
      'Images ARE 2D arrays: each cell holds an RGB colour value',
    ],
  },
  'compression': {
    summary: 'Data compression reduces the size of files by finding and removing redundancy. Run-length encoding (RLE) is one of the simplest methods.',
    points: [
      'Uncompressed: AAAAAABBBCC — 11 characters',
      'RLE compressed: 6A 3B 2C — just 6 characters that mean the same thing',
      'RLE works best when data has long runs of the same value (e.g. solid-colour images)',
      'Lossless compression: original data can be perfectly reconstructed (ZIP, PNG)',
      'Lossy compression: some data is discarded for smaller size (JPEG, MP3)',
      'A 1920×1080 uncompressed RGB image is ~6 MB; JPEG can compress it to ~200 KB',
      'Compression is used in every file transfer, image, video, and web request',
    ],
  },
  'cpu-pipeline': {
    summary: 'The CPU processes instructions through a four-stage pipeline: Fetch → Decode → Execute → Write Back. Each stage handles one instruction at a time.',
    points: [
      'Fetch: the Control Unit reads the next instruction from RAM into the processor',
      'Decode: the instruction is interpreted — "add these two registers" vs "jump to address X"',
      'Execute: the ALU (Arithmetic Logic Unit) performs the actual operation',
      'Write Back: the result is stored back in a register or memory location',
      'Pipelining: while instruction 1 is executing, instruction 2 is already being decoded',
      'A 3 GHz processor runs this cycle 3 billion times per second',
      'Modern CPUs have multiple cores — each core has its own pipeline running simultaneously',
    ],
  },
}

export default async function ConceptPage({ params }: Props) {
  const { id }   = await params
  const concept  = CONCEPT_MAP.get(id)
  if (!concept) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let mastery: ConceptMastery | null = null
  let profile: Profile        | null = null

  if (user) {
    const [masteryRes, profileRes] = await Promise.all([
      supabase.from('concept_mastery').select('*').eq('student_id', user.id).eq('concept_id', id).single<ConceptMastery>(),
      supabase.from('profiles').select('xp, streak, level').eq('id', user.id).single<Profile>(),
    ])
    mastery = masteryRes.data
    profile = profileRes.data
  }

  const content  = CONCEPT_CONTENT[id]
  const prereqs  = concept.prerequisites.map(p => CONCEPT_MAP.get(p)).filter(Boolean)
  const unlocks  = dependents(id).slice(0, 4)
  const status   = mastery?.status ?? 'available'
  const score    = mastery?.mastery_score ?? 0

  const interactiveModes = concept.learningModes.filter(m => m !== 'text')

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* XP / streak bar */}
      {profile && (
        <ConceptProgressBar
          initialXp={profile.xp}
          initialStreak={profile.streak}
          initialLevel={profile.level}
        />
      )}

      {/* Header — ConceptGlyph replaces raw emoji */}
      <div className="flex items-start gap-4">
        <ConceptGlyph concept={concept} size="xl" muted={status === 'locked'} />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h1 className="text-2xl font-bold text-fg">{concept.name}</h1>
            <Badge variant={status as 'mastered' | 'practicing' | 'started' | 'available' | 'locked'} size="md" dot>
              {status}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-fg-faint flex-wrap">
            <span>Tier {concept.tier}</span>
            <span>·</span>
            <span>Difficulty {concept.difficulty}/4</span>
            <span>·</span>
            <span>~{concept.estimatedMinutes} min</span>
            {score > 0 && (
              <>
                <span>·</span>
                <span className={STATUS_COLOR[status]}>{score}% mastery</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mastery bar */}
      {score > 0 && (
        <div className="h-1.5 bg-s2 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${score}%` }}
          />
        </div>
      )}

      {/* Concept summary */}
      {content ? (
        <Card className="space-y-4">
          <p className="text-sm text-fg leading-relaxed">{content.summary}</p>
          <ul className="space-y-2">
            {content.points.map((point, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-fg-dim">
                <span className="text-accent mt-1 shrink-0 text-[10px] font-bold">▸</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-fg-dim">Use the interactive tools below to explore this concept.</p>
        </Card>
      )}

      {/* Interactive practice tools — SVG icons, no emoji */}
      {interactiveModes.length > 0 && (
        <div>
          <p className="label-caps mb-3">Practice tools</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {interactiveModes.map(mode => {
              const url  = MODE_URLS[mode]
              const meta = MODE_META[mode] ?? { icon: <ArrowRightIcon size={18} />, label: mode }
              if (!url) return null
              return (
                <Link
                  key={mode}
                  href={url}
                  className="flex items-center gap-3 p-4 rounded-md
                             bg-s1 border border-b2
                             hover:bg-s2 hover:border-b3
                             transition-all group"
                >
                  <span className="text-accent/80 group-hover:text-accent transition-colors shrink-0">
                    {meta.icon}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-fg group-hover:text-fg transition-colors">
                      {meta.label}
                    </p>
                    <p className="text-xs text-fg-faint">Open interactive lesson</p>
                  </div>
                  <ChevronRightIcon
                    size={14} strokeWidth={2}
                    className="shrink-0 text-fg-faint group-hover:text-fg-dim transition-colors"
                  />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Practice quiz */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TargetIcon size={14} strokeWidth={1.8} className="text-accent" />
          <p className="text-sm font-semibold text-fg">Practice Questions</p>
        </div>
        <ConceptQuiz
          conceptId={id}
          conceptName={concept.name}
          existingMastery={mastery ? {
            mastery_score: mastery.mastery_score,
            status:        mastery.status,
            attempts:      mastery.attempts,
          } : null}
        />
      </div>

      {/* Prerequisites — ConceptGlyph replaces emoji */}
      {prereqs.length > 0 && (
        <div>
          <p className="label-caps mb-3">Prerequisites</p>
          <div className="flex flex-wrap gap-2">
            {prereqs.map(p => (
              <Link
                key={p!.id}
                href={`/student/concept/${p!.id}`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md
                           bg-s2 border border-b2 text-sm text-fg-dim
                           hover:text-fg hover:border-b3 transition-colors"
              >
                <ConceptGlyph concept={p!} size="xs" />
                {p!.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Unlocks */}
      {unlocks.length > 0 && (
        <div>
          <p className="label-caps mb-3">Unlocks next</p>
          <div className="flex flex-wrap gap-2">
            {unlocks.map(u => (
              <Link
                key={u.id}
                href={`/student/concept/${u.id}`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md
                           bg-s2 border border-b2 text-sm text-fg-dim
                           hover:text-fg hover:border-b3 transition-colors"
              >
                <ConceptGlyph concept={u} size="xs" />
                {u.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Back */}
      <Link
        href="/student/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-fg-dim hover:text-fg transition-colors"
      >
        <ChevronRightIcon size={13} strokeWidth={2.2} className="rotate-180" />
        Back to dashboard
      </Link>
    </div>
  )
}
