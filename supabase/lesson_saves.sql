-- ── lesson_saves ──────────────────────────────────────────────────────────────
-- Stores per-student progress for static lesson pages (grade6-grade9, IGCSE
-- Y1/Y2, AS/A Level theory + Paper 2/4). Each row is either:
--   challenge_id  set   →  a completed challenge, identified by its own
--                          stable id (survives new challenges being added
--                          anywhere in a lesson's list — see the comment on
--                          challenge_idx below for why id-based, not index)
--   challenge_idx = -1  →  a workspace/code autosave (restored on next visit)
--
-- challenge_idx is kept only for that -1 autosave sentinel and legacy
-- compatibility; it's nullable because id-keyed rows don't use it (a flat
-- position in a challenge list shifts every time a challenge is inserted
-- anywhere but the very end, silently reassigning a student's earned
-- progress to the wrong challenge — challenge_id doesn't have that problem).
--
-- Run once in the Supabase SQL editor (dashboard → SQL editor → New query).

CREATE TABLE IF NOT EXISTS lesson_saves (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_key    TEXT        NOT NULL,        -- e.g. 'grade7', 'as-paper1-theory'
  challenge_idx INTEGER,                     -- -1 = workspace autosave; NULL for id-keyed rows
  challenge_id  TEXT,                        -- e.g. 'g1s1', 'ch1-2', 'REC1'
  passed        BOOLEAN     NOT NULL DEFAULT false,
  code          TEXT,                        -- student code or pseudocode text
  save_data     JSONB,                       -- blockly XML, pixel art grid, etc.
  xp_earned     INTEGER     NOT NULL DEFAULT 0,
  saved_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, lesson_key, challenge_idx)
);

CREATE UNIQUE INDEX IF NOT EXISTS lesson_saves_student_lesson_challenge_id
  ON lesson_saves (student_id, lesson_key, challenge_id)
  WHERE challenge_id IS NOT NULL;

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
