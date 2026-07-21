// Drives the app with the system-installed Edge browser (avoids the
// Chromium download, which appears network-blocked in this sandbox).
import { chromium } from 'playwright'
import fs from 'fs'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const BASE = 'http://localhost:3001'
const SHOTS = 'C:\\Users\\user\\AppData\\Local\\Temp\\claude\\c--Users-user-Downloads-ICT-website\\378d2d25-24b1-4cf9-88ad-90a331a92538\\scratchpad\\shots'

const pages = process.argv.slice(2)
if (!pages.length) { console.log('usage: node crawl.mjs <path1> <path2> ...'); process.exit(1) }

const browser = await chromium.launch({ executablePath: EDGE, headless: true })
const context = await browser.newContext({ viewport: { width: 1400, height: 900 } })

for (const p of pages) {
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', e => errors.push('pageerror: ' + e.message))
  page.on('console', m => { if (m.type() === 'error') errors.push('console.error: ' + m.text()) })
  const url = BASE + p
  console.log('=== ' + url + ' ===')
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 })
  } catch (e) {
    console.log('  goto failed/timed out:', e.message)
  }
  await page.waitForTimeout(1500)
  const name = p.replace(/[\/?=&]/g, '_').replace(/^_+/, '') || 'root'
  const shotPath = SHOTS + '\\' + name + '.png'
  try { await page.screenshot({ path: shotPath, fullPage: false }) } catch (e) { console.log('  screenshot failed:', e.message) }
  console.log('  screenshot:', shotPath)
  if (errors.length) {
    console.log('  ERRORS:')
    errors.slice(0, 15).forEach(e => console.log('    ' + e))
  } else {
    console.log('  no console/page errors')
  }
  await page.close()
}

await browser.close()
