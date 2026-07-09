// node scripts/check-users.mjs
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

const { data: { users }, error } = await supabase.auth.admin.listUsers()
if (error) { console.error('❌', error.message); process.exit(1) }

console.log(`\nFound ${users.length} users:\n`)
for (const u of users) {
  const confirmed = u.email_confirmed_at ? '✅ confirmed' : '❌ NOT confirmed'
  console.log(`  ${u.email} — ${confirmed}`)
}

// Auto-fix: confirm any unconfirmed users
const unconfirmed = users.filter(u => !u.email_confirmed_at)
if (unconfirmed.length > 0) {
  console.log(`\nFixing ${unconfirmed.length} unconfirmed user(s)...`)
  for (const u of unconfirmed) {
    const { error } = await supabase.auth.admin.updateUserById(u.id, {
      email_confirm: true
    })
    console.log(error ? `❌  ${u.email}: ${error.message}` : `✅  ${u.email} confirmed`)
  }
}

console.log('\nDone. Try logging in now.\n')
