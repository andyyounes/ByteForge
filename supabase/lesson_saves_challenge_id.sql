-- ── lesson_saves: migrate from index-based to id-based challenge identity ────
-- Why: every lesson page (grade7, grade9, grade8, igcse-y1/y2, ...) saved
-- progress keyed by a flat numeric position in its CHALLENGES array
-- (challenge_idx). That meant inserting a new challenge anywhere except the
-- very end of the very last world would silently shift every later
-- challenge's index — an existing student's already-earned completions and
-- saved code would suddenly point at the wrong challenge. This adds a
-- string `challenge_id` column (e.g. 'g1s1', 'w6-temp-converter') so
-- progress is keyed by the challenge's own stable id instead of its
-- position, and new challenges can be inserted anywhere safely from now on.
--
-- Backward compatible: challenge_idx stays as-is for every existing row and
-- for the workspace-autosave row (challenge_idx = -1), which was never
-- position-sensitive. Run once in the Supabase SQL editor.

ALTER TABLE lesson_saves ALTER COLUMN challenge_idx DROP NOT NULL;
ALTER TABLE lesson_saves ALTER COLUMN challenge_idx DROP DEFAULT;
ALTER TABLE lesson_saves ADD COLUMN IF NOT EXISTS challenge_id TEXT;

-- Uniqueness for new id-keyed rows only (legacy numeric rows are untouched
-- and keep using the original UNIQUE(student_id, lesson_key, challenge_idx)
-- constraint from lesson_saves.sql — NULLs in challenge_idx don't conflict
-- with each other there, so id-keyed rows (challenge_idx = NULL) never
-- collide with it).
CREATE UNIQUE INDEX IF NOT EXISTS lesson_saves_student_lesson_challenge_id
  ON lesson_saves (student_id, lesson_key, challenge_id)
  WHERE challenge_id IS NOT NULL;
