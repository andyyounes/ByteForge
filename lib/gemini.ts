// ============================================================
//  ByteForge — AI exercise generation via Groq (Llama 3)
//  Drop-in replacement for Gemini — same exported functions.
// ============================================================

import Groq from 'groq-sdk'
import type {
  GenerateExerciseRequest,
  GenerateExamExerciseRequest,
  GeneratedExercise,
  ExerciseType,
  Concept,
} from '@/types'

// ── Client ────────────────────────────────────────────────────────────────────

function getGroq(): Groq {
  const key = process.env.GROQ_API_KEY
  if (!key || key === 'your_groq_key_here') {
    throw new Error('GROQ_API_KEY is not set in .env.local')
  }
  return new Groq({ apiKey: key })
}

// ── Model selection ───────────────────────────────────────────────────────────

function modelForType(type: ExerciseType): string {
  const heavy: ExerciseType[] = ['ide', 'pseudocode', 'algo-viz']
  // Use the larger model for code exercises, fast model for MC/short-answer
  return heavy.includes(type)
    ? 'llama-3.3-70b-versatile'
    : 'llama-3.1-8b-instant'
}

// ── Shared JSON completion helper ─────────────────────────────────────────────

async function jsonComplete(
  groq: Groq,
  model: string,
  prompt: string
): Promise<unknown> {
  const completion = await groq.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content:
          'You are an expert ICT teacher. Always respond with valid JSON only — no markdown, no explanation, no code fences.',
      },
      { role: 'user', content: prompt },
    ],
    temperature:      0.65,
    max_tokens:       4096,
    response_format:  { type: 'json_object' },
  })

  const text = completion.choices[0]?.message?.content ?? ''
  try {
    return JSON.parse(text)
  } catch {
    // Sometimes the model wraps in {"exercises": [...]} — try to unwrap
    const match = text.match(/\[[\s\S]*\]/)
    if (match) return JSON.parse(match[0])
    throw new Error(`Could not parse JSON: ${text.slice(0, 200)}`)
  }
}

// ── Type guides ───────────────────────────────────────────────────────────────

const TYPE_GUIDES: Partial<Record<ExerciseType, string>> = {
  'multiple-choice': 'a question with 4 answer choices and exactly one correct answer',
  'short-answer':    'a written question requiring a paragraph answer',
  'ide':             'a coding task solved in a code editor with test cases',
  'pseudocode':      'a pseudocode writing task in Cambridge IGCSE/AS pseudocode style',
  'binary-cards':    'a binary ↔ decimal conversion task',
  'blockly':         'a visual block-coding task',
  'flowchart':       'a flowchart drawing task',
  'algo-viz':        'an algorithm visualisation/trace task',
}

// ── Generate exercises (teacher AI engine) ────────────────────────────────────

export async function generateExercises(
  req: GenerateExerciseRequest
): Promise<GeneratedExercise[]> {
  const groq   = getGroq()
  const model  = modelForType(req.type)
  const guide  = TYPE_GUIDES[req.type] ?? 'a general exercise'
  const count  = req.count ?? 3
  const lang   = req.language ? ` Programming language: ${req.language}.` : ''

  const prompt = `
Generate exactly ${count} ICT exercises for secondary school students.
Topic: "${req.topic_name}"
Exercise type: "${req.type}" — ${guide}
Difficulty: ${req.difficulty}/4 (1=easy, 4=hard)${lang}

Return a JSON object with an "exercises" array. Each exercise must have:
- title: string
- description: string (the question/task)
- type: "${req.type}"
- difficulty: ${req.difficulty}
- xp_reward: number (difficulty 1=10, 2=20, 3=35, 4=50)
- config: object with options[] array (4 choices), answer (correct choice string), explanation (why correct)
- hints: array of 3 strings (progressive hints, don't give away answer)
- starter_code: string or null (for IDE exercises only)

Example config for multiple-choice:
{"options": ["A", "B", "C", "D"], "answer": "B", "explanation": "Because..."}
`.trim()

  const parsed = await jsonComplete(groq, model, prompt) as Record<string, unknown>
  const arr    = Array.isArray(parsed) ? parsed : (parsed.exercises as unknown[]) ?? []

  return (arr as Record<string, unknown>[]).map((item, i) =>
    coerceExercise(item, req, i)
  )
}

// ── Generate exam-paper style exercises for a class ───────────────────────────

export async function generateExamExercises(
  req: GenerateExamExerciseRequest
): Promise<GeneratedExercise[]> {
  const groq  = getGroq()
  const model = modelForType(req.type)
  const guide = TYPE_GUIDES[req.type] ?? 'an exam-paper style exercise'
  const count = req.count ?? 5

  const styleGuide: Record<string, string> = {
    practice: 'standard practice questions that build fluency before exam work',
    'exam-style': 'questions closely matching Cambridge exam-paper wording and mark expectations',
    challenging: 'harder extension questions that combine ideas and require careful reasoning',
  }

  const prompt = `
Generate exactly ${count} ICT exercises for a teacher-led class.
Class type: ${req.class_type}
Paper: ${req.paper}
Syllabus chapter/topic range: "${req.topic_name}"
Question style: ${styleGuide[req.paper_style] ?? req.paper_style}
Exercise type: "${req.type}" - ${guide}
Difficulty: ${req.difficulty}/4 (1=easy, 4=hard)

Rules:
- Match the class type and paper. Paper 2 / programming papers should use Cambridge-style pseudocode, tracing, testing, algorithms, or data-structure tasks.
- For "exam-style", make the question feel similar to a past-paper item without copying a real question.
- For "challenging", make it harder than the typical paper by combining subtopics or adding a realistic scenario.
- Include marks or success criteria in config.exam where useful.
- Keep wording precise and suitable for secondary Computer Science students.

Return a JSON object with an "exercises" array. Each exercise must have:
- title: string
- description: string (the full question/task)
- type: "${req.type}"
- difficulty: ${req.difficulty}
- xp_reward: number (difficulty 1=10, 2=20, 3=35, 4=50)
- config: object with options[] and answer for multiple choice, or exam/marks/mark_scheme fields for written and pseudocode tasks
- hints: array of 2-3 progressive hints
- starter_code: string or null
`.trim()

  const parsed = await jsonComplete(groq, model, prompt) as Record<string, unknown>
  const arr    = Array.isArray(parsed) ? parsed : (parsed.exercises as unknown[]) ?? []

  return (arr as Record<string, unknown>[]).map((item, i) => {
    const exercise = coerceExercise(item, req, i)
    return {
      ...exercise,
      config: {
        ...exercise.config,
        exam: {
          class_type:  req.class_type,
          paper:       req.paper,
          paper_style: req.paper_style,
        },
      },
    }
  })
}

// ── Generate concept exercises (student concept page) ─────────────────────────

export async function generateConceptExercises(
  concept: Concept
): Promise<GeneratedExercise[]> {
  const groq  = getGroq()
  const model = 'llama-3.3-70b-versatile'

  const prompt = `
Generate exactly 5 multiple-choice exercises for the ICT concept: "${concept.name}".
Tags: ${concept.tags.join(', ')}. Students: secondary school, age 13–18.

IMPORTANT: Questions must be CHALLENGING and specific — not vague or obvious.
Use precise technical language. Wrong answers (distractors) must be plausible, not silly.

Progressive difficulty:
1. (difficulty 1) Specific recall — exact definition, specific number/fact, or precise term
2. (difficulty 1) Identify from a concrete example or scenario
3. (difficulty 2) Apply: given a real scenario, choose the correct action/outcome
4. (difficulty 2) Compare or distinguish between two similar concepts
5. (difficulty 3) Analyse: multi-step reasoning — why does X happen, what is the effect of Y

Rules:
- Each question must test something SPECIFIC about "${concept.name}" — no generic ICT questions
- Distractors must be common misconceptions or closely related wrong answers
- Never use "All of the above" or "None of the above"
- config.explanation must reference the concept specifically

Return a JSON object with an "exercises" array. Each item must have:
- title: short title (5 words max)
- description: the full question text (be specific and technical)
- type: "multiple-choice"
- difficulty: number (1, 1, 2, 2, 3)
- xp_reward: number (difficulty 1=10, 2=20, 3=35)
- config: { options: [exactly 4 strings], answer: "exact correct option string", explanation: "one sentence why correct" }
- hints: [2 strings — progressive clues, never give away answer directly]
`.trim()

  const parsed = await jsonComplete(groq, model, prompt) as Record<string, unknown>
  const arr    = Array.isArray(parsed) ? parsed : (parsed.exercises as unknown[]) ?? []

  return (arr as Record<string, unknown>[]).map((item, i) =>
    coerceExercise(
      item as Record<string, unknown>,
      {
        topic_id:   concept.id,
        topic_name: concept.name,
        difficulty: ([1, 1, 2, 2, 3][i] ?? 2) as 1 | 2 | 3 | 4,
        type:       'multiple-choice',
      },
      i
    )
  )
}

// ── Coerce raw output to GeneratedExercise ────────────────────────────────────

function coerceExercise(
  raw:   Record<string, unknown>,
  req:   Partial<GenerateExerciseRequest> & Pick<GenerateExerciseRequest, 'difficulty' | 'type'>,
  index: number
): GeneratedExercise {
  const difficulty = (raw.difficulty as number) ?? req.difficulty
  const xpDefaults: Record<number, number> = { 1: 10, 2: 20, 3: 35, 4: 50 }

  return {
    title:          String(raw.title          ?? `Exercise ${index + 1}`),
    description:    String(raw.description    ?? ''),
    type:           (raw.type as ExerciseType) ?? req.type,
    difficulty:     difficulty as 1 | 2 | 3 | 4,
    xp_reward:      (raw.xp_reward as number) ?? xpDefaults[difficulty] ?? 100,
    config:         (raw.config as Record<string, unknown>) ?? {},
    starter_code:   raw.starter_code   ? String(raw.starter_code)   : undefined,
    model_solution: raw.model_solution ? String(raw.model_solution) : undefined,
    hints:          Array.isArray(raw.hints) ? (raw.hints as string[]) : [],
    test_cases:     Array.isArray(raw.test_cases)
      ? (raw.test_cases as { input: string; expected_output: string }[])
      : undefined,
  }
}

// ── Extract topics from curriculum text ───────────────────────────────────────

export async function extractTopicsFromText(
  rawText:        string,
  teacherContext?: string
): Promise<Array<{ name: string; description: string }>> {
  const groq = getGroq()

  const contextLine = teacherContext ? `Teacher note: "${teacherContext}". ` : ''
  const prompt = `
${contextLine}Extract all distinct teachable ICT topics from this curriculum text.
For each topic provide:
- name: short title (3–6 words)
- description: one sentence

Curriculum text:
"""
${rawText.slice(0, 8000)}
"""

Return a JSON object with a "topics" array.
`.trim()

  try {
    const parsed = await jsonComplete(groq, 'llama-3.1-8b-instant', prompt) as Record<string, unknown>
    const arr = Array.isArray(parsed) ? parsed : (parsed.topics as unknown[]) ?? []
    return arr as Array<{ name: string; description: string }>
  } catch {
    return []
  }
}
