-- ============================================================
--  ByteForge - Class feature upgrade
--  Run this on an existing Supabase project before using
--  class-scoped resource uploads and generated exercise drafts.
-- ============================================================

ALTER TABLE curriculum_sources
  ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL;

ALTER TABLE topics
  ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS curriculum_sources_class_idx ON curriculum_sources (class_id);
CREATE INDEX IF NOT EXISTS topics_class_idx ON topics (class_id);
