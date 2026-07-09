// ============================================================
//  ByteForge — Reset a user's password (no email needed)
//  Usage:  node scripts/reset-password.mjs email newpassword
//  Example: node scripts/reset-password.mjs alex@demo.com NewPass123!
// ============================================================

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envFile   = readFileSync(resolve(__dirname, '../.env.local'), 'utf8')
const env = {}
for (const line of envFile.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const [key, ...rest] = trimmed.split('=')
  env[key.trim()] = rest.join('=').trim()
}

const supabase = createClient(
  env['NEXT_PUBLIC_SUPABASE_URL'],
  env['SUPABASE_SERVICE_ROLE_KEY'],
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const [,, email, newPassword] = process.argv

if (!email || !newPassword) {
  console.log('Usage: node scripts/reset-password.mjs <email> <newpassword>')
  console.log('Example: node scripts/reset-password.mjs alex@demo.com NewPass123!')
  process.exit(1)
}

// Find user by email
const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
if (listError) { console.error('❌', listError.message); process.exit(1) }

const user = users.find(u => u.email === email)
if (!user) { console.error(`❌  No user found with email: ${email}`); process.exit(1) }

// Update password
const { error } = await supabase.auth.admin.updateUserById(user.id, { password: newPassword })
if (error) {
  console.error('❌  Failed:', error.message)
} else {
  console.log(`✅  Password updated for ${email}`)
  console.log(`    New password: ${newPassword}`)
}
