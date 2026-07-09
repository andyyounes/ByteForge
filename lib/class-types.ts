// ============================================================
//  ByteForge — Class type definitions
//  Grade 6–9 + IGCSE / AS Level / A Level
// ============================================================

export interface ClassType {
  id:                  string
  label:               string
  shortLabel:          string
  color:               string
  gradeRange:          string
  defaultGrade:        string
  difficultyLevel:     string
  resourceSuggestions: string[]
  papers:              Paper[]
  syllabus:            SyllabusUnit[]
}

export interface Paper {
  id:    string
  label: string
  desc:  string
  style: 'mcq' | 'structured' | 'practical' | 'essay'
}

export interface SyllabusUnit {
  unit:   string
  title:  string
  topics: string[]
}

// ── Class types ───────────────────────────────────────────────────────────────

export const CLASS_TYPES: ClassType[] = [
  // ── Lower secondary ──────────────────────────────────────────────────────
  {
    id:              'grade6',
    label:           'Grade 6 — Creative Computing',
    shortLabel:      'Grade 6',
    color:           '#eab308',
    gradeRange:      'Grade 6',
    defaultGrade:    '6',
    difficultyLevel: 'beginner',
    resourceSuggestions: [
      'Pixel art and colour mixing activities',
      'Turtle graphics block-coding exercises',
      'Drawing with loops and nested loops',
    ],
    papers: [],
    syllabus: [
      {
        unit: '1', title: "Artist's Toolkit",
        topics: ["Pixels & the Screen", "RGB & Colour Mixing", "Pixel Art",
                 "Turtle Graphics", "Drawing with Loops", "Nested Loops & Patterns"],
      },
    ],
  },
  {
    id:              'grade7',
    label:           'Grade 7 — Game Maker',
    shortLabel:      'Grade 7',
    color:           '#eab308',
    gradeRange:      'Grade 7',
    defaultGrade:    '7',
    difficultyLevel: 'beginner',
    resourceSuggestions: [
      'Block + Code hybrid editor exercises',
      'Variables & State mini-projects',
      'If/Else decision games',
      'Events & keyboard interaction projects',
    ],
    papers: [],
    syllabus: [
      {
        unit: '1', title: 'Computer Fundamentals',
        topics: ['What is a Computer?', 'Input, Output & Storage',
                 'The Decimal System', 'Introduction to Binary'],
      },
      {
        unit: '2', title: 'Game Maker Track',
        topics: ['Variables & State', 'If / Else Decisions', 'Events & Interaction'],
      },
    ],
  },
  {
    id:              'grade8',
    label:           'Grade 8 — Systems Builder',
    shortLabel:      'Grade 8',
    color:           '#eab308',
    gradeRange:      'Grade 8',
    defaultGrade:    '8',
    difficultyLevel: 'intermediate',
    resourceSuggestions: [
      'Python 3 real coding exercises',
      'Functions & parameters projects',
      'Lists and data-processing tasks',
      'CPU and compression theory',
    ],
    papers: [],
    syllabus: [
      {
        unit: '1', title: 'Systems Builder Track',
        topics: ['Functions & Parameters', 'Lists & Arrays', 'Data Compression', 'CPU Pipeline'],
      },
      {
        unit: '2', title: 'Hardware & Data',
        topics: ['Secondary Storage', 'CPU Components', 'Binary Arithmetic', 'ASCII & Unicode'],
      },
    ],
  },
  {
    id:              'grade9',
    label:           'Grade 9 — Computer Science',
    shortLabel:      'Grade 9',
    color:           '#eab308',
    gradeRange:      'Grade 9',
    defaultGrade:    '9',
    difficultyLevel: 'intermediate',
    resourceSuggestions: [
      'Cambridge pseudocode exercises',
      'Algorithm design and trace tables',
      'Networking fundamentals',
      'Logic gates and circuits',
    ],
    papers: [],
    syllabus: [
      {
        unit: '1', title: 'Cambridge Pseudocode',
        topics: ['Pseudocode Basics', 'Loops in Pseudocode', 'Arrays in Pseudocode',
                 'Linear Search', 'Bubble Sort'],
      },
      {
        unit: '2', title: 'Hardware & Networking',
        topics: ['RAM, ROM & Cache', 'Network Basics', 'Logic Gates', 'Logic Circuits'],
      },
    ],
  },

  // ── Cambridge qualifications ──────────────────────────────────────────────
  {
    id:              'igcse',
    label:           'IGCSE Computer Science (0478)',
    shortLabel:      'IGCSE',
    color:           '#eab308',
    gradeRange:      'Year 10–11',
    defaultGrade:    '10',
    difficultyLevel: 'intermediate',
    resourceSuggestions: [
      'Cambridge IGCSE 0478 syllabus PDF',
      'Textbook chapters for each syllabus unit',
      'Paper 1 theory and Paper 2 programming past papers',
      'Cambridge IGCSE CS (0478) Textbook',
      'Past Papers (0478)',
    ],
    papers: [
      { id: 'p1', label: 'Paper 1', desc: 'Theory (written)',                   style: 'structured' },
      { id: 'p2', label: 'Paper 2', desc: 'Problem Solving & Programming',      style: 'practical'  },
    ],
    syllabus: [
      { unit: '1', title: 'Data Representation',     topics: ['Binary', 'Hexadecimal', "Two's Complement", 'ASCII & Unicode', 'Images & Sound', 'Compression'] },
      { unit: '2', title: 'Communication & Internet', topics: ['Networks', 'Internet', 'Network Security', 'Protocols', 'Encryption'] },
      { unit: '3', title: 'Hardware',                 topics: ['Logic Gates', 'CPU', 'Memory', 'Input/Output Devices', 'Storage'] },
      { unit: '4', title: 'Software',                 topics: ['Operating Systems', 'High/Low Level Languages', 'Translators'] },
      { unit: '5', title: 'The Internet & Its Uses',  topics: ['HTML/CSS', 'Cybersecurity', 'Digital Currency', 'Malware'] },
      { unit: '6', title: 'Automated Systems',        topics: ['Robotics', 'Sensors', 'Feedback Systems'] },
      { unit: '7', title: 'Programming',              topics: ['Pseudocode', 'Flowcharts', 'Data Types', 'Conditions', 'Loops', 'Functions', 'File Handling', 'Arrays'] },
      { unit: '8', title: 'Databases',                topics: ['SQL', 'Data Validation', 'Relational Databases'] },
    ],
  },
  {
    id:              'as-level',
    label:           'AS Level Computer Science (9618)',
    shortLabel:      'AS Level',
    color:           '#eab308',
    gradeRange:      'Year 12',
    defaultGrade:    '12',
    difficultyLevel: 'advanced',
    resourceSuggestions: [
      'Cambridge 9618 AS syllabus PDF',
      'Paper 1 theory notes and Paper 2 programming chapters',
      'Paper 2 past-paper questions with mark schemes',
      'Cambridge AS Level CS (9618) Textbook',
      'Past Papers (9618 Paper 2)',
    ],
    papers: [
      { id: 'p1', label: 'Paper 1', desc: 'Theory Fundamentals',                        style: 'structured' },
      { id: 'p2', label: 'Paper 2', desc: 'Fundamental Problem Solving & Programming',  style: 'practical'  },
    ],
    syllabus: [
      { unit: '1', title: 'Information Representation',    topics: ['Number systems', 'BCD', 'Floating Point', 'Characters', 'Images', 'Sound', 'Compression'] },
      { unit: '2', title: 'Communication & Internet',      topics: ['Networks', 'Security', 'Protocols', 'TCP/IP', 'Client-Server', 'P2P'] },
      { unit: '3', title: 'Hardware',                      topics: ['Logic Gates & Circuits', 'Boolean Algebra', 'Karnaugh Maps', 'CPU Architecture', 'FDE Cycle', 'Cache', 'Interrupts'] },
      { unit: '4', title: 'Processor Fundamentals',        topics: ['Assembly Language', 'Addressing Modes', 'Instruction Sets'] },
      { unit: '5', title: 'System Software',               topics: ['OS Functions', 'Scheduling', 'Memory Management', 'File Systems', 'Translators'] },
      { unit: '6', title: 'Security & Ethics',             topics: ['Encryption', 'Digital Certificates', 'Malware Types', 'Computer Law'] },
      { unit: '7', title: 'Programming & Data Structures', topics: ['Pseudocode', 'Abstract Data Types', 'Stacks', 'Queues', 'Linked Lists', 'Binary Trees', 'Recursion', 'OOP'] },
      { unit: '8', title: 'Algorithm Design',              topics: ['Bubble Sort', 'Insertion Sort', 'Merge Sort', 'Linear Search', 'Binary Search', 'Big-O Notation'] },
      { unit: '9', title: 'Further Programming',           topics: ['File Handling', 'Exception Handling', 'OOP in Python', 'Testing & Debugging'] },
    ],
  },
  {
    id:              'a-level',
    label:           'A Level Computer Science (9618)',
    shortLabel:      'A Level',
    color:           '#eab308',
    gradeRange:      'Year 13',
    defaultGrade:    '13',
    difficultyLevel: 'advanced',
    resourceSuggestions: [
      'Cambridge 9618 A Level syllabus PDF',
      'Advanced theory chapters for Papers 3 and 4',
      'Practical programming tasks and past-paper extracts',
      'Cambridge A Level CS (9618) Textbook',
      'Past Papers (9618 Paper 3)',
    ],
    papers: [
      { id: 'p1', label: 'Paper 1', desc: 'Theory Fundamentals',                   style: 'structured' },
      { id: 'p2', label: 'Paper 2', desc: 'Advanced Problem Solving & Programming', style: 'practical'  },
      { id: 'p3', label: 'Paper 3', desc: 'Advanced Theory',                       style: 'essay'      },
      { id: 'p4', label: 'Paper 4', desc: 'Practical (Coursework)',                 style: 'practical'  },
    ],
    syllabus: [
      { unit: '1',  title: 'Information Representation',    topics: ['All AS topics +', 'Floating point precision', 'Error detection'] },
      { unit: '2',  title: 'Communication & Internet',      topics: ['Circuit switching', 'Packet switching', 'VoIP', 'Streaming'] },
      { unit: '3',  title: 'Hardware & Virtual Machines',   topics: ['RISC vs CISC', 'Pipelining', 'Virtual Machines', 'Emulation'] },
      { unit: '4',  title: 'Processor Fundamentals',        topics: ['Assembly Language', 'Stack operations', 'Interrupts'] },
      { unit: '5',  title: 'System Software',               topics: ['OS scheduling algorithms', 'Virtual memory', 'Paging'] },
      { unit: '6',  title: 'Security & Ethics',             topics: ['Ethical impacts', 'AI ethics', 'Data Protection Law'] },
      { unit: '7',  title: 'Data Structures & Algorithms',  topics: ['Hash tables', 'Heaps', 'Graphs', "Dijkstra's Algorithm", 'A*', 'Dynamic programming'] },
      { unit: '8',  title: 'Further Programming',           topics: ['Functional programming', 'Declarative programming', 'OOP advanced'] },
      { unit: '9',  title: 'Databases & Big Data',          topics: ['Entity-Relationship', 'Normalisation', 'DBMS', 'Big Data', 'MapReduce'] },
      { unit: '10', title: 'Artificial Intelligence',       topics: ['Machine Learning', 'Neural Networks', 'Graph Traversal', 'Game trees', 'Alpha-Beta pruning'] },
    ],
  },
]

export const CLASS_TYPE_MAP = new Map(CLASS_TYPES.map(t => [t.id, t]))

// ── Legacy / alias IDs ────────────────────────────────────────────────────────
// Old records stored 'beginner' / 'general' / underscore variants in the level
// column. Map them to neutral fallbacks so they display sensibly.
const GENERAL_TYPE: ClassType = {
  id:              'general',
  label:           'General',
  shortLabel:      'General',
  color:           '#6b7280',
  gradeRange:      'Any',
  defaultGrade:    '10',
  difficultyLevel: 'beginner',
  resourceSuggestions: [],
  papers:  [],
  syllabus: [],
}

const IGCSE_TYPE   = CLASS_TYPES.find(t => t.id === 'igcse')!
const AS_TYPE      = CLASS_TYPES.find(t => t.id === 'as-level')!
const A_TYPE       = CLASS_TYPES.find(t => t.id === 'a-level')!

const ALIASES: Record<string, ClassType> = {
  // Old DB defaults
  'beginner':     GENERAL_TYPE,
  'intermediate': GENERAL_TYPE,
  'advanced':     GENERAL_TYPE,
  'general':      GENERAL_TYPE,
  // Underscore variants from an earlier version of this file
  'as_level':     AS_TYPE,
  'a_level':      A_TYPE,
  'igcse':        IGCSE_TYPE, // already in map but belt-and-suspenders
}

export function getClassType(id: string): ClassType {
  return CLASS_TYPE_MAP.get(id) ?? ALIASES[id] ?? GENERAL_TYPE
}
