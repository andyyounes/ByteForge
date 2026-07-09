-- ============================================================
--  ByteForge — Add curriculum column to classes table
--  Run this once in the Supabase SQL Editor.
--
--  Background: the 'level' column stores the ClassType id
--  (e.g. 'grade7', 'igcse') so getClassType() can resolve it.
--  The 'curriculum' column mirrors that value and is selected
--  by the student dashboard nested query.
-- ============================================================

-- 1. Add curriculum column if it doesn't already exist
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS curriculum TEXT NOT NULL DEFAULT '';

-- 2. Back-fill existing rows so curriculum matches level
--    (rows created before this migration will have level = 'beginner'
--     from the old default; we leave those as-is since they predate
--     the class-type system)
UPDATE classes
  SET curriculum = level
  WHERE curriculum = '';

-- 3. Change the level default to empty string so new rows must
--    always supply an explicit class-type id
ALTER TABLE classes
  ALTER COLUMN level SET DEFAULT '';
