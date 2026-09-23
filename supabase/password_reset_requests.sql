-- ══════════════════════════════════════════════════════════════════════════════
--  ByteForge — Student-requested, teacher-approved password resets
--  Run this whole file in the Supabase SQL editor (safe to re-run).
--
--  Why this exists: Supabase's own "forgot password" email flow depends on a
--  verified custom SMTP sender (Resend/Gmail/etc). Until that's set up, a
--  locked-out student has no self-serve path at all. This gives them one that
--  doesn't depend on email delivery: the student names their teacher, the
--  teacher (who already has legitimate authority over their own students)
--  sets a new password directly from their dashboard and hands it to the
--  student in person. Same trust boundary as class_join_requests.sql — no
--  new capability, just a UI for something a teacher could already do via the
--  Supabase dashboard's user list.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS password_reset_requests (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status      TEXT        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'declined')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- One live PENDING request per student/teacher pair — resubmitting while
-- already pending is a no-op, not a growing pile of duplicate rows.
DROP INDEX IF EXISTS password_reset_requests_one_pending;
CREATE UNIQUE INDEX password_reset_requests_one_pending
  ON password_reset_requests (student_id, teacher_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS password_reset_requests_teacher_pending
  ON password_reset_requests (teacher_id) WHERE status = 'pending';

ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;

-- The submitting student is never authenticated (that's the whole point —
-- they're locked out), so rows are only ever written via the service-role
-- admin client from the public API route, never directly by a student. Only
-- policy needed is teacher access from the dashboard.
DROP POLICY IF EXISTS "teacher_own_reset_requests" ON password_reset_requests;
CREATE POLICY "teacher_own_reset_requests" ON password_reset_requests
  FOR ALL USING (teacher_id = auth.uid());
