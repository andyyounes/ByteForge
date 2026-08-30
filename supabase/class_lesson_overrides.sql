-- ── class_lesson_overrides ────────────────────────────────────────────────────
-- Per-class edits to a static lesson's content (Grade 6-9 for now). A teacher
-- edits a world/module or one of its stages in the visual editor; publishing
-- writes one row here. The original content in public/lessons/*.html is never
-- touched — every lesson page reads its own base content, then shallow-merges
-- any override rows for the viewer's class on top, so:
--   - a teacher's edit only ever affects THEIR class, never the platform
--   - un-overridden fields, and un-overridden stages/worlds, are untouched
--   - deleting an override row instantly reverts that piece to the original
--
-- scope + target_id together name what's being overridden:
--   scope='world', target_id='w1'     → world-level fields (name, sub, ...)
--   scope='stage', target_id='w1s1'   → one stage's fields (title, xp, grid, ...)
-- override_data is a PARTIAL object — only the fields being changed need to be
-- present; everything else in the original stage/world object is left as-is.
--
-- Run once in the Supabase SQL editor (dashboard → SQL editor → New query).

CREATE TABLE IF NOT EXISTS class_lesson_overrides (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id       UUID        NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  lesson_key     TEXT        NOT NULL,   -- e.g. 'grade6-quest', 'grade7', 'grade8'
  scope          TEXT        NOT NULL CHECK (scope IN ('world', 'stage')),
  target_id      TEXT        NOT NULL,   -- world id ('w1') or stage id ('w1s1')
  override_data  JSONB       NOT NULL,
  updated_by     UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (class_id, lesson_key, scope, target_id)
);

ALTER TABLE class_lesson_overrides ENABLE ROW LEVEL SECURITY;

-- Teachers can fully manage overrides for their own classes
DROP POLICY IF EXISTS "teacher_manage_overrides" ON class_lesson_overrides;
CREATE POLICY "teacher_manage_overrides" ON class_lesson_overrides
  USING (
    EXISTS (SELECT 1 FROM classes c WHERE c.id = class_lesson_overrides.class_id AND c.teacher_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM classes c WHERE c.id = class_lesson_overrides.class_id AND c.teacher_id = auth.uid())
  );

-- Students can read (but not write) overrides for a class they belong to —
-- this is what makes the static lesson page actually show the teacher's edit.
DROP POLICY IF EXISTS "student_read_own_class_overrides" ON class_lesson_overrides;
CREATE POLICY "student_read_own_class_overrides" ON class_lesson_overrides
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM class_members cm
      WHERE cm.class_id = class_lesson_overrides.class_id
        AND cm.student_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS class_lesson_overrides_lookup
  ON class_lesson_overrides (class_id, lesson_key);
