/*!
 * ByteForge offline cache — Service Worker.
 *
 * Strategy: cache-first with network-fallback-and-fill, for same-origin
 * lesson assets AND the CDN scripts a lesson's editor actually loads
 * (CodeMirror, Blockly, Pyodide, sql.js). No fixed file manifest to
 * maintain — the first time a student opens a lesson while online, every
 * request it makes gets cached automatically as a side effect, so a later
 * fully-offline open is served entirely from cache. This matters
 * especially for Pyodide, which lazily fetches dozens of files (its wasm
 * runtime, the Python stdlib) depending on what a script actually imports —
 * hand-listing them would be guesswork and would silently go stale.
 *
 * Deliberately NOT caching:
 *  - /api/* (always needs a real server round-trip; lesson-saves.js's own
 *    offline queue — see public/js/lesson-saves.js — handles THAT offline
 *    story, a cached API response would be actively wrong here)
 *  - the Next.js app shell itself (/, /student/*, /teacher/*, /login) —
 *    that's Phase 2 of TODO-OFFLINE.md, a separate, bigger decision
 *    (the auth middleware's own network dependency), not this file's job
 */

const CACHE_NAME = 'bf-offline-v1'

// Same-origin paths this service worker is allowed to cache. Everything
// else same-origin (notably /api/*) is left completely alone — fetch
// events for paths outside this list and outside ALLOWED_CDN_ORIGINS just
// fall through to the network with no caching at all.
const ALLOWED_SAME_ORIGIN_PREFIXES = ['/lessons/', '/js/', '/images/', '/resources/']

const ALLOWED_CDN_ORIGINS = [
  'https://cdnjs.cloudflare.com',
  'https://cdn.jsdelivr.net',
  'https://unpkg.com',
]

function isCacheable(url) {
  if (url.origin === self.location.origin) {
    return ALLOWED_SAME_ORIGIN_PREFIXES.some(p => url.pathname.startsWith(p))
  }
  return ALLOWED_CDN_ORIGINS.includes(url.origin)
}

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return // never cache a POST (saves go through lesson-saves.js's own queue)

  let url
  try { url = new URL(req.url) } catch { return }
  if (!isCacheable(url)) return

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(req)
      if (cached) return cached
      try {
        // mode:'no-cors' lets this succeed for cross-origin CDN requests
        // that don't send CORS headers — the response is "opaque" (can't
        // read its status/body from JS), but the Cache API can still store
        // and later REPLAY it byte-for-byte, which is all offline loading
        // actually needs.
        const isCrossOrigin = url.origin !== self.location.origin
        const response = await fetch(isCrossOrigin ? new Request(req, { mode: 'no-cors' }) : req)
        // An opaque response always reports status 0 — never treat that as
        // a failure. A same-origin response we CAN inspect, so only cache
        // genuine successes.
        if (response.type === 'opaque' || response.ok) {
          cache.put(req, response.clone())
        }
        return response
      } catch (e) {
        // Genuinely offline and not cached yet — nothing more this file can
        // do; the request fails exactly as it would with no service worker
        // at all.
        throw e
      }
    })
  )
})
