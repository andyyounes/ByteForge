/*!
 * Registers public/sw.js — the offline asset cache (see that file for the
 * actual caching strategy). Included on every main curriculum lesson page.
 * No-ops silently if the browser doesn't support service workers, or if
 * this is a non-HTTPS/non-localhost origin (the API requires it, so a dev
 * server over plain http on a LAN IP just won't get offline caching —
 * acceptable, since production is always HTTPS).
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(e => {
      console.warn('[sw-register] offline caching unavailable:', e.message)
    })
  })
}
