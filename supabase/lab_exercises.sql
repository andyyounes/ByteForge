-- ── Teacher-authored Code Lab exercises ──────────────────────────────────────
-- Custom exercises a teacher adds for their class; they appear in the
-- students' Code Lab (a-level.html) as a "⭐ From your teacher" category.
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS lab_exercises (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id    UUID        NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  descr       TEXT        NOT NULL,                 -- the task, shown to students
  expect      JSONB       NOT NULL DEFAULT '[]',    -- expected output lines; empty = AI-checked
  starter     TEXT,                                 -- optional pseudocode starter
  xp          INTEGER     NOT NULL DEFAULT 50,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  -- When set (e.g. 'rec/r1'), this row OVERRIDES a built-in exercise for this
  -- class instead of adding a new custom one.
  override_key TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE lab_exercises ADD COLUMN IF NOT EXISTS override_key TEXT;
-- Which Code Lab category a custom exercise belongs to ('rec', 'srt', 'adt',
-- 'str'); NULL = the "⭐ From your teacher" category.
ALTER TABLE lab_exercises ADD COLUMN IF NOT EXISTS category TEXT;

CREATE INDEX IF NOT EXISTS lab_exercises_class_idx ON lab_exercises (class_id, sort_order);
CREATE UNIQUE INDEX IF NOT EXISTS lab_exercises_override_unique
  ON lab_exercises (class_id, override_key) WHERE override_key IS NOT NULL;

ALTER TABLE lab_exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teacher_manage_lab_exercises" ON lab_exercises;
CREATE POLICY "teacher_manage_lab_exercises" ON lab_exercises
  FOR ALL USING (
    class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
  );

DROP POLICY IF EXISTS "student_read_lab_exercises" ON lab_exercises;
CREATE POLICY "student_read_lab_exercises" ON lab_exercises
  FOR SELECT USING (
    class_id IN (SELECT class_id FROM class_members WHERE student_id = auth.uid())
  );
