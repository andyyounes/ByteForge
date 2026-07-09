/**
 * book-chunker.ts
 *
 * Splits raw PDF text into per-section chunks that map to topic keys
 * (ch1-1, ch1-2, … ch5-3, etc.).
 *
 * Works for Cambridge-style CS textbooks whose headings look like:
 *   "Chapter 1  Information Representation"
 *   "1.1  Number systems"
 *   "1.2  Two's complement"
 *   "Chapter 2  Communication"
 *   "2.1  Networks"  ...
 */

export interface BookChunk {
  topicKey:     string   // 'ch1-1', 'ch2-3', etc.
  chapterNum:   number
  sectionNum:   number
  chapterLabel: string   // "Chapter 1 — Information Representation"
  title:        string   // "1.1 Number Systems"
  text:         string   // raw extracted text for this section
}

// ── Regex patterns ────────────────────────────────────────────────────────────
// Match lines that look like "Chapter 3" or "CHAPTER 3" with optional title
const CH_HEADING = /^(?:chapter\s+(\d+)[^\n]*)/im

// Match section headings like "1.1 Some title" or "3.2 Something"
// Must be at start of line or after newline
const SEC_HEADING = /^(\d+)\.(\d+)\s+(.+)/m

function cleanText(t: string): string {
  return t
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\f/g, '\n')          // form feeds from PDF pages
    .replace(/\n{3,}/g, '\n\n')    // collapse excessive blank lines
    .trim()
}

/** Split raw PDF text into chapter + section chunks. */
export function chunkBookText(raw: string): BookChunk[] {
  const text  = cleanText(raw)
  const lines = text.split('\n')

  const chunks: BookChunk[] = []

  let curChapter      = 0
  let curChapterLabel = ''
  let curSection      = 0
  let curTitle        = ''
  let curBuffer: string[] = []

  function flush() {
    if (curChapter > 0 && curSection > 0 && curBuffer.length > 0) {
      const body = curBuffer.join('\n').trim()
      if (body.length > 80) {    // skip tiny stubs
        chunks.push({
          topicKey:     `ch${curChapter}-${curSection}`,
          chapterNum:   curChapter,
          sectionNum:   curSection,
          chapterLabel: curChapterLabel,
          title:        curTitle,
          text:         body.slice(0, 6000),  // cap per-section at ~6k chars
        })
      }
    }
    curBuffer = []
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) { curBuffer.push(line); continue }

    // Detect "Chapter N ..."
    const chMatch = trimmed.match(/^chapter\s+(\d+)(.*)?/i)
    if (chMatch) {
      flush()
      curChapter      = parseInt(chMatch[1])
      curChapterLabel = `Chapter ${curChapter}${chMatch[2] ? ' —' + chMatch[2].trim() : ''}`
      curSection      = 0
      curTitle        = ''
      continue
    }

    // Detect "N.M Title"
    const secMatch = trimmed.match(/^(\d+)\.(\d+)\s+(.+)/)
    if (secMatch && parseInt(secMatch[1]) === curChapter && curChapter > 0) {
      flush()
      curSection = parseInt(secMatch[2])
      curTitle   = `${secMatch[1]}.${secMatch[2]} ${secMatch[3].trim()}`
      continue
    }

    curBuffer.push(line)
  }
  flush()  // last section

  return chunks
}

/** If the book has no detectable chapter/section headings, fall back to
 *  splitting by page breaks / size and numbering sequentially. */
export function chunkBySize(raw: string, charsPerChunk = 3000): BookChunk[] {
  const text   = cleanText(raw)
  const chunks: BookChunk[] = []
  let   idx    = 0
  let   chNum  = 1
  let   secNum = 1

  while (idx < text.length) {
    const piece = text.slice(idx, idx + charsPerChunk)
    chunks.push({
      topicKey:     `ch${chNum}-${secNum}`,
      chapterNum:   chNum,
      sectionNum:   secNum,
      chapterLabel: `Chapter ${chNum}`,
      title:        `Section ${chNum}.${secNum}`,
      text:         piece.trim(),
    })
    idx    += charsPerChunk
    secNum += 1
    if (secNum > 6) { chNum += 1; secNum = 1 }   // ~6 sections per chapter
  }
  return chunks
}

export function splitBook(raw: string): BookChunk[] {
  const structured = chunkBookText(raw)
  if (structured.length >= 3) return structured
  return chunkBySize(raw)
}
