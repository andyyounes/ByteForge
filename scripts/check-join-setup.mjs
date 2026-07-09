import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read env from .env.local
const env = {}
for (const line of readFileSync('c:/Users/user/Downloads/ICT website/.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].trim()
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// 1. Does classes.auto_accept exist?
const { data: cls, error: e1 } = await admin.from('classes').select('id, name, auto_accept').limit(3)
console.log('classes.auto_accept:', e1 ? `MISSING — ${e1.message}` : 'OK')
if (cls) console.log('  classes:', cls.map(c => `${c.name} (auto_accept=${c.auto_accept})`).join(', '))

// 2. Does class_join_requests have teacher_id?
const { error: e2 } = await admin.from('class_join_requests').select('id, teacher_id, grade').limit(1)
console.log('class_join_requests (teacher_id, grade):', e2 ? `MISSING — ${e2.message}` : 'OK')

// 3. Recent students
const { data: profs } = await admin.from('profiles').select('name, email, role, stage, created_at').order('created_at', { ascending: false }).limit(5)
console.log('recent profiles:')
for (const p of profs ?? []) console.log(`  ${p.name} <${p.email}> role=${p.role} stage=${p.stage} created=${p.created_at}`)

// 4. Any join requests?
const { data: reqs, error: e4 } = await admin.from('class_join_requests').select('id, status, grade, created_at').order('created_at', { ascending: false }).limit(5)
console.log('join requests:', e4 ? e4.message : (reqs?.length ? JSON.stringify(reqs) : 'none'))
