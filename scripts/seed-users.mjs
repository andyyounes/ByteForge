// ============================================================
//  ByteForge — Create demo users via Supabase Admin API
//  Run once:  node scripts/seed-users.mjs
// ============================================================

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ── Load .env.local manually ──────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath   = resolve(__dirname, '../.env.local')
const envFile   = readFileSync(envPath, 'utf8')

const env = {}
for (const line of envFile.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const [key, ...rest] = trimmed.split('=')
  env[key.trim()] = rest.join('=').trim()
}

const SUPABASE_URL          = env['NEXT_PUBLIC_SUPABASE_URL']
const SUPABASE_SERVICE_KEY  = env['SUPABASE_SERVICE_ROLE_KEY']

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

// ── Admin client (bypasses RLS, can create confirmed users) ──────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ── Demo users to create ─────────────────────────────────────────────────────
const USERS = [
  {
    email:    'teacher@demo.com',
    password: 'Demo1234!',
    meta:     { name: 'Ms Johnson', role: 'teacher', grade: '' },
  },
  {
    email:    'alex@demo.com',
    password: 'Demo1234!',
    meta:     { name: 'Alex Chen', role: 'student', grade: '9' },
  },
  {
    email:    'tom@demo.com',
    password: 'Demo1234!',
    meta:     { name: 'Tom Wright', role: 'student', grade: '12' },
  },
  {
    email:    'titi@demo.com',
    password: 'Demo1234!',
    meta:     { name: 'Titi', role: 'student', grade: '7' },
  },
]

// ── Create each user ──────────────────────────────────────────────────────────
console.log('Creating demo users...\n')

for (const user of USERS) {
  const { data, error } = await supabase.auth.admin.createUser({
    email:          user.email,
    password:       user.password,
    email_confirm:  true,          // ← no email confirmation needed
    user_metadata:  user.meta,
  })

  if (error) {
    if (error.message.includes('already been registered') || error.message.includes('already exists')) {
      console.log(`⚠️  ${user.email} — already exists, skipping`)
    } else {
      console.error(`❌  ${user.email} — ${error.message}`)
    }
    continue
  }

  console.log(`✅  ${user.email} created (id: ${data.user.id})`)
}

// ── Fix up profiles ───────────────────────────────────────────────────────────
console.log('\nUpdating profiles...')

const updates = [
  { email: 'teacher@demo.com', data: { role: 'teacher', stage: 'igcse',  placement_confirmed: true } },
  { email: 'alex@demo.com',    data: { role: 'student', stage: 'grade9', placement_confirmed: true, xp: 840,  streak: 5,  longest_streak: 12 } },
  { email: 'tom@demo.com',     data: { role: 'student', stage: 'as_a',   placement_confirmed: true, xp: 2650, streak: 14, longest_streak: 21 } },
  { email: 'titi@demo.com',    data: { role: 'student', stage: 'grade7', placement_confirmed: true, xp: 300,  streak: 1,  longest_streak: 12 } },

]

for (const u of updates) {
  const { error } = await supabase
    .from('profiles')
    .update(u.data)
    .eq('email', u.email)

  if (error) {
    console.error(`❌  profile update failed for ${u.email}: ${error.message}`)
  } else {
    console.log(`✅  profile updated: ${u.email}`)
  }
}

console.log('\n✨  Done! Log in at http://localhost:3000/login')
console.log('   teacher@demo.com / Demo1234!')
console.log('   alex@demo.com    / Demo1234!  (Grade 9)')
console.log('   tom@demo.com     / Demo1234!  (Grade 12 / AS Level)')
