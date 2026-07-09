import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = {}
for (const line of readFileSync('c:/Users/user/Downloads/ICT website/.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].trim()
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: classes } = await admin.from('classes').select('id, name, grade, level, auto_accept')
console.log('── classes ──')
for (const c of classes ?? []) console.log(`  ${c.name} | grade="${c.grade}" level="${c.level}" auto_accept=${c.auto_accept} id=${c.id}`)

const { data: members } = await admin.from('class_members').select('class_id, student_id')
const { data: profiles } = await admin.from('profiles').select('id, name, email, role, grade, stage, placement_confirmed')

console.log('\n── students & memberships ──')
for (const p of (profiles ?? []).filter(p => p.role === 'student')) {
  const cls = (members ?? []).filter(m => m.student_id === p.id)
    .map(m => (classes ?? []).find(c => c.id === m.class_id)?.name ?? m.class_id)
  console.log(`  ${p.name} <${p.email}> grade="${p.grade}" stage=${p.stage} placement=${p.placement_confirmed} classes=[${cls.join(', ')}]`)
}
