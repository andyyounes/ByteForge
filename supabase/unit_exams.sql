-- ================================================================
--  ByteForge — unit_exams table
--  Run once in Supabase SQL Editor.
--
--  One exam per chapter per class.
--  status: 'pending' (needs teacher approval) | 'approved' | 'rejected'
-- ================================================================

CREATE TABLE IF NOT EXISTS unit_exams (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id      UUID        NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  source_id     UUID        REFERENCES curriculum_sources(id) ON DELETE SET NULL,
  chapter_num   INTEGER     NOT NULL,
  chapter_label TEXT        NOT NULL DEFAULT '',
  title         TEXT        NOT NULL,
  content       JSONB       NOT NULL,   -- { questions: [...], totalMarks: N, duration: N }
  status        TEXT        NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (class_id, chapter_num)
);

CREATE INDEX IF NOT EXISTS unit_exams_class_id_idx    ON unit_exams (class_id);
CREATE INDEX IF NOT EXISTS unit_exams_chapter_num_idx ON unit_exams (chapter_num);

-- RLS
ALTER TABLE unit_exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teachers_manage_exams" ON unit_exams;
CREATE POLICY "teachers_manage_exams" ON unit_exams
  FOR ALL USING (
    class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
  );

DROP POLICY IF EXISTS "students_read_approved_exams" ON unit_exams;
CREATE POLICY "students_read_approved_exams" ON unit_exams
  FOR SELECT USING (
    status = 'approved'
    AND class_id IN (
      SELECT class_id FROM class_members WHERE student_id = auth.uid()
    )
  );
