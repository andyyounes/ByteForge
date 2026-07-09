-- ================================================================
--  ByteForge — curriculum_sources upgrade
--  Run once in Supabase SQL Editor.
--
--  Adds class_id and raw_text columns if they don't exist yet,
--  and creates the generated_lessons table for book-generated content.
-- ================================================================

-- 1. Add class_id to curriculum_sources (links source to a class)
ALTER TABLE curriculum_sources
  ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL;

-- 2. Add raw_text if missing (stores extracted PDF text)
ALTER TABLE curriculum_sources
  ADD COLUMN IF NOT EXISTS raw_text TEXT;

-- 3. Index for fast class-based lookup
CREATE INDEX IF NOT EXISTS curriculum_sources_class_idx
  ON curriculum_sources (class_id);

-- ----------------------------------------------------------------
-- 4. generated_lessons — stores AI-generated lesson JSON per topic
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS generated_lessons (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id      UUID        NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  source_id     UUID        REFERENCES curriculum_sources(id) ON DELETE SET NULL,
  topic_key     TEXT        NOT NULL,
  chapter_num   INTEGER,
  section_num   INTEGER,
  title         TEXT,
  subtitle      TEXT,
  chapter_label TEXT,
  content       JSONB       NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (class_id, topic_key)
);

CREATE INDEX IF NOT EXISTS generated_lessons_class_id_idx  ON generated_lessons (class_id);
CREATE INDEX IF NOT EXISTS generated_lessons_topic_key_idx ON generated_lessons (topic_key);

-- 5. RLS
ALTER TABLE generated_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teachers_manage_lessons" ON generated_lessons;
CREATE POLICY "teachers_manage_lessons" ON generated_lessons
  FOR ALL USING (
    class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
  );

DROP POLICY IF EXISTS "students_read_lessons" ON generated_lessons;
CREATE POLICY "students_read_lessons" ON generated_lessons
  FOR SELECT USING (
    class_id IN (
      SELECT class_id FROM class_members WHERE student_id = auth.uid()
    )
  );
