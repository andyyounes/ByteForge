// ============================================================
//  ByteForge — Create a demo class and enroll students
//  Run:  node scripts/seed-class.mjs
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

// ── Get teacher from profiles table (by role) ─────────────────────────────────
const { data: teacherProfile } = await supabase
  .from('profiles')
  .select('id, email, name')
  .eq('role', 'teacher')
  .limit(1)
  .single()

if (!teacherProfile) {
  console.error('❌  No teacher profile found. Make sure your account has role = "teacher" in the profiles table.')
  process.exit(1)
}
console.log(`✅  Found teacher: ${teacherProfile.email}`)

// ── Get student profiles ──────────────────────────────────────────────────────
const { data: studentProfiles } = await supabase
  .from('profiles')
  .select('id, email')
  .eq('role', 'student')

const teacher = { id: teacherProfile.id }
const students_list = studentProfiles ?? []
console.log(`✅  Found ${students_list.length} student(s): ${students_list.map(s => s.email).join(', ')}`)

console.log('Creating demo class...')

// ── Create class ──────────────────────────────────────────────────────────────
const { data: cls, error: classError } = await supabase
  .from('classes')
  .insert({
    name:        'ICT Year 10 — Period 3',
    teacher_id:  teacher.id,
    level:       'intermediate',
    grade:       '10',
    description: 'Core ICT concepts including algorithms, data representation and programming.',
    join_code:   'BYTE01',
  })
  .select()
  .single()

if (classError) {
  if (classError.message.includes('duplicate') || classError.message.includes('unique')) {
    console.log('⚠️  Class already exists, skipping')
  } else {
    console.error('❌  Class error:', classError.message)
    process.exit(1)
  }
} else {
  console.log(`✅  Class created: "${cls.name}" (join code: ${cls.join_code})`)
}

// ── Get class id ──────────────────────────────────────────────────────────────
const { data: existingClass } = await supabase
  .from('classes')
  .select('id, join_code')
  .eq('teacher_id', teacher.id)
  .limit(1)
  .single()

const classId = existingClass?.id
if (!classId) { console.error('❌  Could not find class'); process.exit(1) }

// ── Enroll students ───────────────────────────────────────────────────────────
for (const student of students_list) {
  const { error } = await supabase
    .from('class_members')
    .insert({ class_id: classId, student_id: student.id })

  if (error) {
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      console.log(`⚠️  ${student.email} already enrolled`)
    } else {
      console.error(`❌  Enroll error for ${student.email}:`, error.message)
    }
  } else {
    console.log(`✅  Enrolled: ${student.email}`)
  }
}

console.log('\n✨  Done! Refresh the teacher dashboard — students should appear now.')
console.log(`   Join code for students: ${existingClass?.join_code}`)
