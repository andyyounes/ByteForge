-- ── Generated Lessons ────────────────────────────────────────────────────────
-- Run in Supabase Dashboard → SQL Editor.
-- Stores AI-generated lesson content derived from teacher-uploaded books.
-- Scoped per class so different classes can have different source books.

CREATE TABLE IF NOT EXISTS generated_lessons (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id    UUID        NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  source_id   UUID        REFERENCES curriculum_sources(id) ON DELETE SET NULL,
  topic_key   TEXT        NOT NULL,   -- e.g. 'ch1-1', 'ch2-3'
  chapter_num INTEGER,
  section_num INTEGER,
  title       TEXT,
  subtitle    TEXT,
  chapter_label TEXT,
  content     JSONB       NOT NULL,   -- { keyTerms, theory, example, questions }
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (class_id, topic_key)
);

CREATE INDEX IF NOT EXISTS generated_lessons_class_idx ON generated_lessons (class_id);
CREATE INDEX IF NOT EXISTS generated_lessons_key_idx   ON generated_lessons (class_id, topic_key);

ALTER TABLE generated_lessons ENABLE ROW LEVEL SECURITY;

-- Teachers can manage lessons for their classes
CREATE POLICY "teacher_manage_generated_lessons"
  ON generated_lessons FOR ALL
  USING (
    class_id IN (
      SELECT id FROM classes WHERE teacher_id = auth.uid()
    )
  );

-- Students can read lessons for classes they belong to
CREATE POLICY "student_read_generated_lessons"
  ON generated_lessons FOR SELECT
  USING (
    class_id IN (
      SELECT class_id FROM class_members WHERE student_id = auth.uid()
    )
  );
