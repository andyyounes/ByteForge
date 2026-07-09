-- ============================================================
--  ByteForge — Create demo users (no email confirmation)
--  Run in: Supabase Dashboard → SQL Editor
--
--  Creates 3 accounts, all with password:  Demo1234!
--    teacher@demo.com  → teacher
--    alex@demo.com     → Grade 9 student
--    tom@demo.com      → Grade 12 / AS Level student
-- ============================================================

-- Required for crypt() / gen_salt()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── 1. Insert into auth.users (bypasses email confirmation) ──────────────

INSERT INTO auth.users (
  instance_id, id, aud, role, email,
  encrypted_password,
  email_confirmed_at,       -- set now = already confirmed
  raw_app_meta_data,
  raw_user_meta_data,
  created_at, updated_at,
  is_super_admin,
  confirmation_token, recovery_token,
  email_change_token_new, email_change
)
VALUES
  -- Teacher
  (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(), 'authenticated', 'authenticated',
    'teacher@demo.com',
    crypt('Demo1234!', gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Ms Johnson","role":"teacher","grade":""}',
    now(), now(), false, '', '', '', ''
  ),
  -- Grade 9 student
  (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(), 'authenticated', 'authenticated',
    'alex@demo.com',
    crypt('Demo1234!', gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Alex Chen","role":"student","grade":"9"}',
    now(), now(), false, '', '', '', ''
  ),
  -- Grade 12 / AS Level student
  (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(), 'authenticated', 'authenticated',
    'tom@demo.com',
    crypt('Demo1234!', gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Tom Wright","role":"student","grade":"12"}',
    now(), now(), false, '', '', '', ''
  )
ON CONFLICT (email) DO NOTHING;

-- ── 2. Create auth identities (required for sign-in to work) ─────────────

INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
SELECT
  gen_random_uuid(),
  u.id,
  format('{"sub":"%s","email":"%s"}', u.id::text, u.email)::jsonb,
  'email',
  now(), now(), now()
FROM auth.users u
WHERE u.email IN ('teacher@demo.com', 'alex@demo.com', 'tom@demo.com')
ON CONFLICT DO NOTHING;

-- ── 3. Fix up profiles (trigger should have auto-created them, but ensure correct data) ──

UPDATE profiles SET
  role  = 'teacher',
  name  = 'Ms Johnson',
  stage = 'igcse',
  placement_confirmed = true
WHERE email = 'teacher@demo.com';

UPDATE profiles SET
  role  = 'student',
  name  = 'Alex Chen',
  grade = '9',
  stage = 'grade9',
  placement_confirmed = true,
  xp    = 840,
  streak = 5,
  longest_streak = 12
WHERE email = 'alex@demo.com';

UPDATE profiles SET
  role  = 'student',
  name  = 'Tom Wright',
  grade = '12',
  stage = 'as_a',
  placement_confirmed = true,
  xp    = 2650,
  streak = 14,
  longest_streak = 21
WHERE email = 'tom@demo.com';

-- ── 4. Seed concept mastery for the students ──────────────────────────────

-- Alex (Grade 9) — good at number systems, learning algorithms
INSERT INTO concept_mastery (student_id, concept_id, mastery_score, status, attempts, correct_attempts)
SELECT p.id, concept_id, score, status::mastery_status, attempts, correct_attempts
FROM profiles p,
(VALUES
  ('computer-basics',   88, 'mastered',   6, 5),
  ('input-output',      85, 'mastered',   5, 5),
  ('decimal-system',    90, 'mastered',   4, 4),
  ('binary-intro',      88, 'mastered',   6, 5),
  ('binary-to-decimal', 85, 'mastered',   5, 4),
  ('decimal-to-binary', 82, 'mastered',   6, 5),
  ('binary-addition',   78, 'mastered',   5, 4),
  ('hex-intro',         55, 'practicing', 3, 2),
  ('ascii-unicode',     60, 'practicing', 4, 3),
  ('flowchart-basics',  88, 'mastered',   5, 5),
  ('flowchart-decisions',45,'practicing', 3, 2),
  ('pseudocode-intro',  30, 'started',    2, 1),
  ('secondary-storage', 0,  'available',  0, 0),
  ('cpu-basics',        0,  'available',  0, 0),
  ('logic-gates',       0,  'available',  0, 0),
  ('html-css-basics',   0,  'available',  0, 0)
) AS data(concept_id, score, status, attempts, correct_attempts)
WHERE p.email = 'alex@demo.com'
ON CONFLICT (student_id, concept_id) DO UPDATE
  SET mastery_score = EXCLUDED.mastery_score,
      status        = EXCLUDED.status,
      attempts      = EXCLUDED.attempts,
      correct_attempts = EXCLUDED.correct_attempts;

-- Tom (Grade 12 / AS Level) — advanced, working on algorithms
INSERT INTO concept_mastery (student_id, concept_id, mastery_score, status, attempts, correct_attempts)
SELECT p.id, concept_id, score, status::mastery_status, attempts, correct_attempts
FROM profiles p,
(VALUES
  ('computer-basics',      90, 'mastered',   5, 5),
  ('input-output',         88, 'mastered',   5, 5),
  ('decimal-system',       95, 'mastered',   4, 4),
  ('binary-intro',         92, 'mastered',   6, 6),
  ('binary-to-decimal',    90, 'mastered',   5, 5),
  ('decimal-to-binary',    88, 'mastered',   6, 5),
  ('binary-addition',      86, 'mastered',   5, 5),
  ('twos-complement',      85, 'mastered',   5, 4),
  ('hex-intro',            90, 'mastered',   4, 4),
  ('hex-binary',           88, 'mastered',   4, 4),
  ('hex-colors',           85, 'mastered',   3, 3),
  ('ascii-unicode',        90, 'mastered',   4, 4),
  ('logic-gates',          88, 'mastered',   5, 5),
  ('logic-circuits',       85, 'mastered',   5, 4),
  ('boolean-algebra',      82, 'mastered',   6, 5),
  ('flowchart-basics',     95, 'mastered',   4, 4),
  ('flowchart-decisions',  90, 'mastered',   5, 5),
  ('pseudocode-intro',     92, 'mastered',   5, 5),
  ('pseudocode-loops',     88, 'mastered',   5, 4),
  ('pseudocode-arrays',    85, 'mastered',   5, 4),
  ('search-linear',        88, 'mastered',   4, 4),
  ('python-intro',         90, 'mastered',   6, 6),
  ('python-loops',         88, 'mastered',   5, 5),
  ('html-css-basics',      85, 'mastered',   4, 4),
  ('blockly-intro',        90, 'mastered',   3, 3),
  ('blockly-loops',        85, 'mastered',   3, 3),
  ('search-binary',        65, 'practicing', 4, 3),
  ('sort-bubble',          60, 'practicing', 4, 3),
  ('data-structures-intro',55, 'practicing', 3, 2),
  ('python-functions',     70, 'practicing', 5, 4),
  ('javascript-basics',    45, 'started',    3, 1),
  ('sort-insertion',       0,  'available',  0, 0),
  ('python-lists',         0,  'available',  0, 0),
  ('recursion',            0,  'available',  0, 0)
) AS data(concept_id, score, status, attempts, correct_attempts)
WHERE p.email = 'tom@demo.com'
ON CONFLICT (student_id, concept_id) DO UPDATE
  SET mastery_score = EXCLUDED.mastery_score,
      status        = EXCLUDED.status,
      attempts      = EXCLUDED.attempts,
      correct_attempts = EXCLUDED.correct_attempts;

-- ── 5. Verify ────────────────────────────────────────────────────────────

SELECT name, email, role, stage, xp, streak, placement_confirmed
FROM profiles
WHERE email IN ('teacher@demo.com', 'alex@demo.com', 'tom@demo.com')
ORDER BY role, name;
