// js/config.js — client-side config for static lesson pages
// GROQ_API_KEY is intentionally NOT here — it lives in .env.local and is
// accessed server-side only via the /api/ai-check Next.js proxy route.
const ENV = {
  GROQ_MODEL:    'llama-3.1-8b-instant',
  AI_CHECK_URL:  '/api/ai-check',   // proxy route — no key in browser
};
