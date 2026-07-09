-- ── lesson_saves ──────────────────────────────────────────────────────────────
-- Stores per-student progress for static lesson pages (grade6-patterns, grade7,
-- grade8, grade9, blockly-turtle). Each row represents either:
--   challenge_idx >= 0  →  a completed challenge
--   challenge_idx = -1  →  a workspace/code autosave (restored on next visit)
--
-- Run once in the Supabase SQL editor (dashboard → SQL editor → New query).

CREATE TABLE IF NOT EXISTS lesson_saves (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_key    TEXT        NOT NULL,        -- e.g. 'grade7', 'grade9', 'grade6-patterns'
  challenge_idx INTEGER     NOT NULL DEFAULT -1,
  passed        BOOLEAN     NOT NULL DEFAULT false,
  code          TEXT,                        -- student code or pseudocode text
  save_data     JSONB,                       -- blockly XML, pixel art grid, etc.
  xp_earned     INTEGER     NOT NULL DEFAULT 0,
  saved_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, lesson_key, challenge_idx)
);

ALTER TABLE lesson_saves ENABLE ROW LEVEL SECURITY;

-- Students can read and write their own saves
DROP POLICY IF EXISTS "student_own_saves" ON lesson_saves;
CREATE POLICY "student_own_saves" ON lesson_saves
  USING  (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Teachers can view saves for students in their classes
DROP POLICY IF EXISTS "teacher_view_saves" ON lesson_saves;
CREATE POLICY "teacher_view_saves" ON lesson_saves
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM class_members cm
      JOIN classes c ON c.id = cm.class_id
      WHERE cm.student_id = lesson_saves.student_id
        AND c.teacher_id = auth.uid()
    )
  );

-- Fast lookup: all saves for a student in a lesson
CREATE INDEX IF NOT EXISTS lesson_saves_student_lesson
  ON lesson_saves (student_id, lesson_key);
