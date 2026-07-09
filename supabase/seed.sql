-- ============================================================
--  ByteForge — Seed data
--
--  IMPORTANT: Auth users must be created first via the
--  Supabase Dashboard (Authentication → Users → Add user)
--  or by registering through the app.
--
--  Step 1: Register these accounts through the app or dashboard:
--    teacher@byteforge.demo  / password: Demo1234!
--    alex@byteforge.demo     / password: Demo1234!
--    maya@byteforge.demo     / password: Demo1234!
--    tom@byteforge.demo      / password: Demo1234!
--
--  Step 2: Run this SQL (it uses the profile IDs created by
--  the handle_new_user() trigger after each registration).
-- ============================================================

-- ── Update demo profiles ───────────────────────────────────────────────────

-- Set teacher role (replace with the actual user id from auth.users)
-- UPDATE profiles SET role = 'teacher', name = 'Ms Johnson' WHERE email = 'teacher@byteforge.demo';

-- Set student stages and confirm placement
-- UPDATE profiles SET stage = 'grade9',  placement_confirmed = TRUE, streak = 5,  longest_streak = 12, xp = 840  WHERE email = 'alex@byteforge.demo';
-- UPDATE profiles SET stage = 'grade8',  placement_confirmed = TRUE, streak = 2,  longest_streak = 4,  xp = 310  WHERE email = 'maya@byteforge.demo';
-- UPDATE profiles SET stage = 'igcse',   placement_confirmed = TRUE, streak = 14, longest_streak = 21, xp = 2650 WHERE email = 'tom@byteforge.demo';

-- ── Sample topics (for the teacher's AI Engine) ───────────────────────────
-- Uncomment and replace <teacher-uuid> with the teacher's actual profile id

/*
INSERT INTO topics (teacher_id, name, description) VALUES
  ('<teacher-uuid>', 'Binary Number Systems',    'Converting between binary, decimal and hexadecimal'),
  ('<teacher-uuid>', 'Sorting Algorithms',        'Bubble sort, insertion sort and merge sort'),
  ('<teacher-uuid>', 'Searching Algorithms',      'Linear search and binary search with pseudocode'),
  ('<teacher-uuid>', 'Python Fundamentals',       'Variables, data types, input/output, and control flow'),
  ('<teacher-uuid>', 'Flowcharts & Pseudocode',   'Drawing flowcharts and writing Cambridge-style pseudocode'),
  ('<teacher-uuid>', 'Logic Gates & Circuits',    'AND, OR, NOT, NAND, NOR gates and truth tables'),
  ('<teacher-uuid>', 'Data Structures',           'Arrays, stacks and queues in pseudocode'),
  ('<teacher-uuid>', 'OOP Concepts',              'Classes, objects, inheritance and encapsulation in Python'),
  ('<teacher-uuid>', 'Networks & Protocols',      'LAN, WAN, TCP/IP, HTTP and network security'),
  ('<teacher-uuid>', 'Cybersecurity',             'Threats, encryption, and protection methods')
ON CONFLICT DO NOTHING;
*/

-- ── Quick verification query ──────────────────────────────────────────────
SELECT
  p.name,
  p.email,
  p.role,
  p.stage,
  p.xp,
  p.streak,
  p.placement_confirmed
FROM profiles p
ORDER BY p.role, p.name;
