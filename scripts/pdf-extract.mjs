#!/usr/bin/env node
/**
 * Standalone PDF text extractor — runs as a child process so it is
 * never touched by Next.js / webpack.
 *
 * Usage: echo <base64-pdf> | node scripts/pdf-extract.mjs
 * Outputs: JSON  { text: "..." }  or  { error: "..." }
 */

// 1. Set up the pdfjs worker BEFORE importing PDFParse.
//    pdf-parse/worker embeds the worker as a data URL and sets GlobalWorkerOptions.
import 'pdf-parse/worker'

// 2. Import the parser class.
import { PDFParse } from 'pdf-parse'

// 3. Read base64-encoded PDF from stdin.
const chunks = []
process.stdin.on('data', chunk => chunks.push(chunk))
process.stdin.on('end', async () => {
  try {
    const base64  = Buffer.concat(chunks).toString('utf8').trim()
    const buffer  = Buffer.from(base64, 'base64')
    const parser  = new PDFParse({ data: buffer })
    const result  = await parser.getText()
    process.stdout.write(JSON.stringify({ text: result.text ?? '' }))
    process.exit(0)
  } catch (err) {
    process.stdout.write(JSON.stringify({ error: err?.message ?? String(err) }))
    process.exit(1)
  }
})
