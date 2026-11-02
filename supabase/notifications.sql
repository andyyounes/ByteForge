-- ══════════════════════════════════════════════════════════════════════════════
--  ByteForge — Notifications (exam results, etc.)
--  Run this whole file in the Supabase SQL editor (safe to re-run).
--
--  Pattern copied from class_join_requests: a row can be written by anyone
--  for anyone, as long as they record themselves as the sender
--  (created_by = auth.uid()). This lets a student's own authenticated
--  session notify their teacher of a real event (e.g. an exam submission)
--  without needing service-role access — the recipient still only ever
--  reads/updates their OWN notifications.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS notifications (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,  -- recipient
  created_by  UUID        REFERENCES profiles(id) ON DELETE CASCADE,           -- sender (NULL = system)
  type        TEXT        NOT NULL,       -- e.g. 'exam_result'
  title       TEXT        NOT NULL,
  body        TEXT        NOT NULL,
  data        JSONB,
  read        BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_unread
  ON notifications (user_id, created_at DESC) WHERE read = false;

CREATE INDEX IF NOT EXISTS notifications_user_recent
  ON notifications (user_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Recipients can read and mark their own notifications read
DROP POLICY IF EXISTS "own_notifications_read" ON notifications;
CREATE POLICY "own_notifications_read" ON notifications
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "own_notifications_update" ON notifications;
CREATE POLICY "own_notifications_update" ON notifications
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Anyone can send a notification, as long as it's recorded as coming from them
DROP POLICY IF EXISTS "send_notifications" ON notifications;
CREATE POLICY "send_notifications" ON notifications
  FOR INSERT WITH CHECK (created_by = auth.uid());
