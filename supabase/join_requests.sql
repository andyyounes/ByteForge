-- ══════════════════════════════════════════════════════════════════════════════
--  ByteForge — Join requests + per-class auto-accept
--  Run this whole file in the Supabase SQL editor (safe to re-run).
--
--  Flow:
--   • classes.auto_accept = true  → join code/link adds the student instantly
--                                    (the old behaviour)
--   • classes.auto_accept = false → join code/link creates a PENDING request;
--                                    the teacher approves from the dashboard
--   • Students with no code can request via their teacher's email
--     (request row with class_id = NULL — the teacher picks the class
--      when approving)
-- ══════════════════════════════════════════════════════════════════════════════

-- Per-class toggle. Default FALSE = teacher approval required.
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS auto_accept BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS class_join_requests (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_id  UUID        REFERENCES profiles(id) ON DELETE CASCADE,
  class_id    UUID        REFERENCES classes(id)  ON DELETE CASCADE,  -- NULL = teacher decides which class
  grade       TEXT,                                                    -- what the student said, e.g. "7"
  status      TEXT        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'declined')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Upgrade an existing table from the earlier draft (no-ops on fresh installs)
ALTER TABLE class_join_requests ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE class_join_requests ADD COLUMN IF NOT EXISTS grade TEXT;
ALTER TABLE class_join_requests ALTER COLUMN class_id DROP NOT NULL;
ALTER TABLE class_join_requests DROP CONSTRAINT IF EXISTS class_join_requests_student_id_class_id_key;

-- Backfill teacher_id from the class for any old rows
UPDATE class_join_requests r
SET    teacher_id = c.teacher_id
FROM   classes c
WHERE  r.class_id = c.id AND r.teacher_id IS NULL;

-- One live PENDING request per student per teacher/class combination
DROP INDEX IF EXISTS class_join_requests_one_pending;
CREATE UNIQUE INDEX class_join_requests_one_pending
  ON class_join_requests (student_id, teacher_id, COALESCE(class_id, '00000000-0000-0000-0000-000000000000'::uuid))
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS class_join_requests_teacher_pending
  ON class_join_requests (teacher_id) WHERE status = 'pending';

ALTER TABLE class_join_requests ENABLE ROW LEVEL SECURITY;

-- Students can read/create their own requests
DROP POLICY IF EXISTS "student_own_requests" ON class_join_requests;
CREATE POLICY "student_own_requests" ON class_join_requests
  USING  (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Teachers can read and update requests addressed to them (directly or via class)
DROP POLICY IF EXISTS "teacher_class_requests" ON class_join_requests;
CREATE POLICY "teacher_class_requests" ON class_join_requests
  FOR ALL USING (
    teacher_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = class_id AND c.teacher_id = auth.uid()
    )
  );
