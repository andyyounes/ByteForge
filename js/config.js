// js/config.js — client-side config for static lesson pages
// GROQ_API_KEY is intentionally NOT here — it lives in .env.local and is
// accessed server-side only via the /api/ai-check Next.js proxy route.
const ENV = {
  // See public/js/config.js for why this changed — llama-3.1-8b-instant
  // was removed from Groq's model list entirely.
  GROQ_MODEL:    'openai/gpt-oss-20b',
  AI_CHECK_URL:  '/api/ai-check',   // proxy route — no key in browser
};
