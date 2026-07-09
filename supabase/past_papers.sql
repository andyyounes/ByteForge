-- ================================================================
--  ByteForge — Past Papers feature
--  Run once in Supabase SQL Editor.
--
--  past_papers           — teacher uploads a past paper + questions+MS
--  past_paper_submissions — student answers + AI feedback per question
-- ================================================================

-- ── past_papers ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS past_papers (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id     UUID        NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL DEFAULT '',
  year         TEXT        NOT NULL DEFAULT '',   -- e.g. '2023'
  session      TEXT        NOT NULL DEFAULT '',   -- e.g. 'May/June', 'Oct/Nov'
  paper_num    TEXT        NOT NULL DEFAULT '',   -- e.g. '11', '21', '31'
  questions    JSONB       NOT NULL DEFAULT '[]', -- [{ num, stem, marks, ms }]
  total_marks  INTEGER     NOT NULL DEFAULT 0,
  due_date     TIMESTAMPTZ,
  assigned     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS past_papers_class_id_idx ON past_papers (class_id);
CREATE INDEX IF NOT EXISTS past_papers_assigned_idx ON past_papers (assigned);

ALTER TABLE past_papers ENABLE ROW LEVEL SECURITY;

-- Teachers: full access to their own class's papers
DROP POLICY IF EXISTS "teachers_manage_past_papers" ON past_papers;
CREATE POLICY "teachers_manage_past_papers" ON past_papers
  FOR ALL USING (
    class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
  );

-- Students: read only assigned papers in their class
DROP POLICY IF EXISTS "students_read_assigned_papers" ON past_papers;
CREATE POLICY "students_read_assigned_papers" ON past_papers
  FOR SELECT USING (
    assigned = TRUE
    AND class_id IN (
      SELECT class_id FROM class_members WHERE student_id = auth.uid()
    )
  );


-- ── past_paper_submissions ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS past_paper_submissions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  past_paper_id   UUID        NOT NULL REFERENCES past_papers(id) ON DELETE CASCADE,
  student_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id        UUID        NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  answers         JSONB       NOT NULL DEFAULT '[]',  -- [{ num, answer }]
  feedback        JSONB       NOT NULL DEFAULT '[]',  -- [{ num, score, maxScore, badge, comment }]
  score           INTEGER     NOT NULL DEFAULT 0,
  total_marks     INTEGER     NOT NULL DEFAULT 0,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (past_paper_id, student_id)
);

CREATE INDEX IF NOT EXISTS pp_submissions_paper_idx   ON past_paper_submissions (past_paper_id);
CREATE INDEX IF NOT EXISTS pp_submissions_student_idx ON past_paper_submissions (student_id);
CREATE INDEX IF NOT EXISTS pp_submissions_class_idx   ON past_paper_submissions (class_id);

ALTER TABLE past_paper_submissions ENABLE ROW LEVEL SECURITY;

-- Students: manage their own submissions
DROP POLICY IF EXISTS "students_own_submissions" ON past_paper_submissions;
CREATE POLICY "students_own_submissions" ON past_paper_submissions
  FOR ALL USING (student_id = auth.uid());

-- Teachers: read all submissions for their classes
DROP POLICY IF EXISTS "teachers_read_submissions" ON past_paper_submissions;
CREATE POLICY "teachers_read_submissions" ON past_paper_submissions
  FOR SELECT USING (
    class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
  );
