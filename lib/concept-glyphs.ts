import type { Concept } from '@/types'

const CONCEPT_CODES: Record<string, string> = {
  'computer-basics': 'PC',
  'input-output': 'I/O',
  'decimal-system': '10',
  'binary-intro': '01',
  'secondary-storage': 'SSD',
  'networking-basics': 'NET',
  'cpu-basics': 'CPU',
  'logic-gates': 'AND',
  'flowchart-basics': 'FL',
  'html-css-basics': 'WEB',
  'binary-to-decimal': 'B10',
  'decimal-to-binary': '10B',
  'ascii-unicode': 'TXT',
  'memory-types': 'RAM',
  'logic-circuits': 'LC',
  'binary-addition': 'B+',
  'hex-intro': 'HEX',
  'blockly-intro': 'BLK',
  'flowchart-decisions': 'IF',
  'pseudocode-intro': 'PS',
  'boolean-algebra': 'BOOL',
  'twos-complement': '2C',
  'hex-binary': 'H/B',
  'hex-colors': '#C',
  'blockly-loops': 'LOOP',
  'pseudocode-loops': 'FOR',
  'python-intro': 'PY',
  'pseudocode-arrays': 'ARR',
  'search-linear': 'LIN',
  'python-loops': 'PY+',
  'javascript-basics': 'JS',
  'search-binary': 'BIN',
  'sort-bubble': 'BUB',
  'data-structures-intro': 'DS',
  'python-functions': 'FN',
  'sort-insertion': 'INS',
  'python-lists': 'LIST',
  'sql-basics': 'SQL',
  'oop-concepts': 'OOP',
  'recursion': 'REC',
  'sort-merge': 'MER',
  'algorithms-complexity': 'O(n)',
}

export function conceptCode(concept: Pick<Concept, 'id' | 'name'>): string {
  const known = CONCEPT_CODES[concept.id]
  if (known) return known

  const words = concept.name
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

  return words
    .slice(0, 3)
    .map(word => word[0]?.toUpperCase())
    .join('') || 'BF'
}
