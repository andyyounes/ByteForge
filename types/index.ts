// ============================================================
//  ByteForge — Shared TypeScript types
// ============================================================

// ── Enums / Literals ──────────────────────────────────────────────────────
export type UserRole       = 'student' | 'teacher'
export type MasteryStatus  = 'locked' | 'available' | 'started' | 'practicing' | 'mastered'
export type LessonType     = 'text' | 'interactive' | 'video'
export type ExerciseType   = 'binary-cards' | 'pseudocode' | 'ide' | 'blockly' | 'flowchart' | 'algo-viz' | 'multiple-choice' | 'short-answer'
export type DraftStatus    = 'pending' | 'approved' | 'rejected'
export type UnlockTrigger  = 'completion' | 'teacher' | 'scheduled'
export type PlacementStatus = 'pending' | 'confirmed' | 'overridden'
export type StageId        = 'grade6' | 'grade7' | 'grade8' | 'grade9'
                           | 'igcse'  | 'as_a'                          // legacy — kept for existing students
                           | 'igcse_y1' | 'igcse_y2'                    // Grade 10 / Grade 11
                           | 'as_level' | 'a_level'                     // Grade 12 / Grade 13

// ── Database row types ─────────────────────────────────────────────────────

export interface Profile {
  id:                  string
  name:                string
  email:               string
  role:                UserRole
  grade:               string
  stage:               StageId
  xp:                  number
  level:               number   // generated column: GREATEST(1, floor(sqrt(xp/80))+1)
  streak:              number
  longest_streak:      number
  last_active_date:    string | null
  placement_confirmed: boolean
  avatar_url:          string | null
  created_at:          string
}

export interface Class {
  id:          string
  name:        string
  teacher_id:  string
  level:       string
  grade:       string
  description: string
  join_code:   string
  created_at:  string
}

export interface ClassMember {
  class_id:   string
  student_id: string
  joined_at:  string
}

export interface Unit {
  id:          string
  class_id:    string
  title:       string
  description: string
  deadline:    string | null
  sort_order:  number
  created_at:  string
}

export interface Lesson {
  id:             string
  unit_id:        string
  title:          string
  type:           LessonType
  content:        Record<string, unknown>
  sort_order:     number
  unlock_trigger: UnlockTrigger
  unlocks_at:     string | null
  created_at:     string
}

export interface Exercise {
  id:             string
  unit_id:        string | null
  topic_id:       string | null
  title:          string
  type:           ExerciseType
  difficulty:     1 | 2 | 3 | 4
  xp_reward:      number
  description:    string
  config:         Record<string, unknown>
  starter_code:   string | null
  // test_cases intentionally omitted from client — fetched server-side only
  hints:          string[]
  sort_order:     number
  unlock_trigger: UnlockTrigger
  unlocks_at:     string | null
  draft_status:   DraftStatus
  language:       string | null
  syllabus_ref:   string | null
  created_at:     string
}

export interface ConceptMastery {
  id:               string
  student_id:       string
  concept_id:       string
  mastery_score:    number
  status:           MasteryStatus
  attempts:         number
  correct_attempts: number
  accuracy_history: number[]
  weaknesses:       string[]
  time_spent_ms:    number
  last_practiced:   string | null
}

export interface UserAchievement {
  student_id:     string
  achievement_id: string
  unlocked_at:    string
  xp_earned:      number
}

export interface DailyChallenge {
  id:           string
  student_id:   string
  date:         string
  concept_id:   string
  xp_reward:    number
  completed:    boolean
  completed_at: string | null
}

export interface CurriculumSource {
  id:         string
  teacher_id: string
  class_id:   string | null
  title:      string
  file_url:   string | null
  raw_text:   string | null
  created_at: string
}

export interface Topic {
  id:          string
  source_id:   string | null
  teacher_id:  string
  class_id:    string | null
  name:        string
  description: string | null
  created_at:  string
}

export interface Progress {
  id:             string
  student_id:     string
  lesson_id:      string | null
  exercise_id:    string | null
  completed:      boolean
  score:          number | null
  code:           string | null
  output:         string | null
  passed:         boolean
  attempt_number: number
  submitted_at:   string
}

export interface Submission {
  id:           string
  student_id:   string
  exercise_id:  string
  code:         string
  output:       string
  passed:       boolean
  score:        number
  feedback:     string | null
  submitted_at: string
}

export interface PlacementQuiz {
  id:                string
  student_id:        string
  answers:           Record<string, string>
  section_scores:    Record<string, number>
  recommended_stage: StageId
  status:            PlacementStatus
  confirmed_by:      string | null
  confirmed_at:      string | null
  created_at:        string
}

export interface Unlock {
  id:            string
  resource_type: 'lesson' | 'exercise' | 'unit'
  resource_id:   string
  class_id:      string
  trigger:       UnlockTrigger
  unlocks_at:    string | null
  unlocked_by:   string | null
  created_at:    string
}

// ── Joined / computed types ────────────────────────────────────────────────

export interface UnitWithContent extends Unit {
  lessons:   Lesson[]
  exercises: Exercise[]
}

export interface ClassWithContent extends Class {
  units:        UnitWithContent[]
  member_count: number
}

export interface ClassWithMembers extends Class {
  units:   UnitWithContent[]
  members: Profile[]
}

export interface MasteryMap {
  [conceptId: string]: ConceptMastery
}

export interface StudentMasterySummary {
  profile:       Profile
  masteryMap:    MasteryMap
  counts:        Record<MasteryStatus, number>
  weakConcepts:  ConceptMastery[]
}

// ── Concept system types (from lib/concepts.ts) ───────────────────────────

export interface Concept {
  id:                string
  name:              string
  icon:              string
  color:             string
  tier:              number
  xGroup:            number
  prerequisites:     string[]
  difficulty:        number
  gradeMin:          number
  estimatedMinutes:  number
  learningModes:     string[]
  tags:              string[]
  lessonUrl:         string
}

export interface Pathway {
  id:         string
  name:       string
  icon:       string
  color:      string
  conceptIds: string[]
  tier:       string
}

export interface Achievement {
  id:          string
  name:        string
  icon:        string
  description: string
  xp:          number
  check:       (masteryMap: MasteryMap, profile: Profile) => boolean
}

// ── AI Exercise generation ─────────────────────────────────────────────────

export interface GenerateExerciseRequest {
  topic_id:   string
  topic_name: string
  difficulty: 1 | 2 | 3 | 4
  type:       ExerciseType
  language?:  string
  count?:     number
}

export type PaperStyle = 'practice' | 'exam-style' | 'challenging'

export interface GenerateExamExerciseRequest {
  topic_name:  string
  class_type:  string
  paper:       string
  paper_style: PaperStyle
  difficulty:  1 | 2 | 3 | 4
  type:        ExerciseType
  count?:      number
}

export interface GeneratedExercise {
  title:          string
  description:    string
  type:           ExerciseType
  difficulty:     1 | 2 | 3 | 4
  xp_reward:      number
  config:         Record<string, unknown>
  starter_code?:  string
  model_solution?: string
  hints?:         string[]
  test_cases?:    { input: string; expected_output: string }[]
}

// ── Adaptive engine types ─────────────────────────────────────────────────

export interface Suggestion {
  concept: Concept
  mastery: ConceptMastery | null
  reason:  string
}

export interface PathwayProgress {
  pathway:  Pathway
  total:    number
  mastered: number
  started:  number
  pct:      number
}

// ── Stage config ─────────────────────────────────────────────────────────

export interface StageConfig {
  id:         StageId
  label:      string
  shortLabel: string
  accent:     string
  accentDim:  string
  gradeMin:   number
  gradeMax:   number
}

// ── XP helpers ───────────────────────────────────────────────────────────

export interface XpBarInfo {
  pct:       number
  current:   number
  next:      number
  remaining: number
}
