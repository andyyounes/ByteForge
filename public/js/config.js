// js/config.js — client-side config for static lesson pages
// GROQ_API_KEY is intentionally NOT here — it lives in .env.local and is
// accessed server-side only via the /api/ai-check Next.js proxy route.
const ENV = {
  // llama-3.1-8b-instant was deprecated/removed from Groq's model list
  // (confirmed via GET /v1/models — no longer present at all), which was
  // silently breaking EVERY AI feature site-wide (this fallback, grade7's
  // checkWithAI, and every other page using this same config) with a 404
  // from Groq passed straight through the proxy. Replaced with a model
  // Groq actually serves today.
  GROQ_MODEL:    'openai/gpt-oss-20b',
  AI_CHECK_URL:  '/api/ai-check',   // proxy route — no key in browser
};
