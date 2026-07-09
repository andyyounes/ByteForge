-- ============================================================
--  ByteForge — Fix infinite RLS recursion on "classes"
--
--  ROOT CAUSE
--  ----------
--  Two policies form a cycle:
--    1. classes.student_enrolled_classes  → queries class_members
--    2. class_members.teacher_class_members → queries classes
--  Postgres detects the cycle and throws
--  "infinite recursion detected in policy for relation classes".
--
--  FIX
--  ---
--  Create two SECURITY DEFINER helper functions that query the
--  tables directly (bypassing RLS). Replace all cross-table
--  policy checks with calls to these helpers.
--
--  HOW TO RUN
--  ----------
--  Supabase Dashboard → SQL Editor → paste and run this file.
--  Safe to run multiple times (DROP IF EXISTS on everything).
-- ============================================================


-- ── Step 1: Helper functions (SECURITY DEFINER bypasses RLS) ─────────────

-- Is the current user enrolled in a given class?
CREATE OR REPLACE FUNCTION is_class_member(p_class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM class_members
    WHERE class_id = p_class_id
      AND student_id = auth.uid()
  );
$$;

-- Is the current user the teacher of a given class?
CREATE OR REPLACE FUNCTION is_class_teacher(p_class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM classes
    WHERE id = p_class_id
      AND teacher_id = auth.uid()
  );
$$;


-- ── Step 2: classes ───────────────────────────────────────────────────────
-- teacher_own_classes is fine (no subquery) — leave it alone.
-- Only recreate student_enrolled_classes to use is_class_member().

DROP POLICY IF EXISTS "student_enrolled_classes" ON classes;
CREATE POLICY "student_enrolled_classes" ON classes
  FOR SELECT USING (is_class_member(id));


-- ── Step 3: class_members ─────────────────────────────────────────────────
-- teacher_class_members used to query classes → now uses is_class_teacher().

DROP POLICY IF EXISTS "teacher_class_members" ON class_members;
CREATE POLICY "teacher_class_members" ON class_members
  FOR SELECT USING (is_class_teacher(class_id));


-- ── Step 4: units ─────────────────────────────────────────────────────────
-- Both policies join classes + class_members → rewrite with helpers.

DROP POLICY IF EXISTS "units_read"            ON units;
DROP POLICY IF EXISTS "teacher_manage_units"  ON units;

CREATE POLICY "units_read" ON units
  FOR SELECT USING (
    is_class_member(class_id) OR is_class_teacher(class_id)
  );

CREATE POLICY "teacher_manage_units" ON units
  FOR ALL USING (is_class_teacher(class_id));


-- ── Step 5: lessons ───────────────────────────────────────────────────────

DROP POLICY IF EXISTS "lessons_read"           ON lessons;
DROP POLICY IF EXISTS "teacher_manage_lessons" ON lessons;

CREATE POLICY "lessons_read" ON lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM units u
      WHERE u.id = lessons.unit_id
        AND (is_class_member(u.class_id) OR is_class_teacher(u.class_id))
    )
  );

CREATE POLICY "teacher_manage_lessons" ON lessons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM units u
      WHERE u.id = unit_id
        AND is_class_teacher(u.class_id)
    )
  );


-- ── Step 6: exercises ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS "exercises_read"            ON exercises;
DROP POLICY IF EXISTS "teacher_manage_exercises"  ON exercises;

CREATE POLICY "exercises_read" ON exercises
  FOR SELECT USING (
    draft_status = 'approved'
    AND EXISTS (
      SELECT 1 FROM units u
      WHERE u.id = exercises.unit_id
        AND (is_class_member(u.class_id) OR is_class_teacher(u.class_id))
    )
  );

CREATE POLICY "teacher_manage_exercises" ON exercises
  FOR ALL USING (
    unit_id IS NULL   -- draft exercise not yet assigned to a unit
    OR EXISTS (
      SELECT 1 FROM units u
      WHERE u.id = unit_id
        AND is_class_teacher(u.class_id)
    )
    OR (topic_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM topics t
      WHERE t.id = topic_id AND t.teacher_id = auth.uid()
    ))
  );


-- ── Step 7: concept_mastery (teacher view) ────────────────────────────────
-- Joins class_members + classes → use is_class_teacher().

DROP POLICY IF EXISTS "teacher_read_mastery" ON concept_mastery;
CREATE POLICY "teacher_read_mastery" ON concept_mastery
  FOR SELECT USING (
    get_my_role() = 'teacher'
    AND EXISTS (
      SELECT 1 FROM class_members cm
      WHERE cm.student_id = concept_mastery.student_id
        AND is_class_teacher(cm.class_id)
    )
  );


-- ── Step 8: progress (teacher view) ──────────────────────────────────────

DROP POLICY IF EXISTS "teacher_read_progress" ON progress;
CREATE POLICY "teacher_read_progress" ON progress
  FOR SELECT USING (
    get_my_role() = 'teacher'
    AND EXISTS (
      SELECT 1 FROM class_members cm
      WHERE cm.student_id = progress.student_id
        AND is_class_teacher(cm.class_id)
    )
  );


-- ── Step 9: submissions (teacher view) ───────────────────────────────────

DROP POLICY IF EXISTS "teacher_read_submissions" ON submissions;
CREATE POLICY "teacher_read_submissions" ON submissions
  FOR SELECT USING (
    get_my_role() = 'teacher'
    AND EXISTS (
      SELECT 1 FROM exercises e
      JOIN units u ON u.id = e.unit_id
      WHERE e.id = submissions.exercise_id
        AND is_class_teacher(u.class_id)
    )
  );


-- ── Step 10: unlocks ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS "teacher_manage_unlocks" ON unlocks;
DROP POLICY IF EXISTS "student_read_unlocks"   ON unlocks;

CREATE POLICY "teacher_manage_unlocks" ON unlocks
  USING (is_class_teacher(class_id));

CREATE POLICY "student_read_unlocks" ON unlocks
  FOR SELECT USING (is_class_member(class_id));


-- ── Done ─────────────────────────────────────────────────────────────────
-- All cross-table checks now go through SECURITY DEFINER functions
-- which bypass RLS, breaking every potential cycle.
