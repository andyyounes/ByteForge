-- ============================================================
--  ByteForge — Supabase Schema
--  Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- Required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── ENUMS ──────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role        AS ENUM ('student', 'teacher');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE mastery_status   AS ENUM ('locked', 'available', 'started', 'practicing', 'mastered');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE lesson_type      AS ENUM ('text', 'interactive', 'video');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE exercise_type    AS ENUM ('binary-cards','pseudocode','ide','blockly','flowchart','algo-viz','multiple-choice','short-answer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE draft_status     AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE unlock_trigger   AS ENUM ('completion', 'teacher', 'scheduled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE placement_status AS ENUM ('pending', 'confirmed', 'overridden');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE stage_id         AS ENUM ('grade6','grade7','grade8','grade9','igcse','as_a');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── PROFILES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT        NOT NULL DEFAULT '',
  email               TEXT        NOT NULL DEFAULT '',
  role                user_role   NOT NULL DEFAULT 'student',
  grade               TEXT        NOT NULL DEFAULT '',
  stage               stage_id    NOT NULL DEFAULT 'grade9',
  xp                  INTEGER     NOT NULL DEFAULT 0 CHECK (xp >= 0),
  -- level is computed from xp: GREATEST(1, floor(sqrt(xp/80))+1)
  level               INTEGER     GENERATED ALWAYS AS (GREATEST(1, floor(sqrt(xp::float / 80))::int + 1)) STORED,
  streak              INTEGER     NOT NULL DEFAULT 0,
  longest_streak      INTEGER     NOT NULL DEFAULT 0,
  last_active_date    DATE,
  placement_confirmed BOOLEAN     NOT NULL DEFAULT FALSE,
  avatar_url          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile row when auth.users row is inserted
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, stage)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'),
    COALESCE((NEW.raw_user_meta_data->>'stage')::stage_id, 'grade9')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── CLASSES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS classes (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT        NOT NULL,
  teacher_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  level       TEXT        NOT NULL DEFAULT 'beginner',
  grade       TEXT        NOT NULL DEFAULT '',
  description TEXT        NOT NULL DEFAULT '',
  join_code   TEXT        NOT NULL UNIQUE DEFAULT upper(substring(md5(random()::text), 1, 6)),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CLASS MEMBERS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS class_members (
  class_id   UUID        NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (class_id, student_id)
);

-- ── UNITS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS units (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id    UUID        NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  deadline    TIMESTAMPTZ,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── LESSONS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lessons (
  id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id        UUID         NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  title          TEXT         NOT NULL,
  type           lesson_type  NOT NULL DEFAULT 'text',
  content        JSONB        NOT NULL DEFAULT '{}',
  sort_order     INTEGER      NOT NULL DEFAULT 0,
  unlock_trigger unlock_trigger NOT NULL DEFAULT 'completion',
  unlocks_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── CURRICULUM SOURCES ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS curriculum_sources (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id    UUID        REFERENCES classes(id) ON DELETE SET NULL,
  title       TEXT        NOT NULL,
  file_url    TEXT,
  raw_text    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── TOPICS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS topics (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id   UUID        REFERENCES curriculum_sources(id) ON DELETE SET NULL,
  teacher_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id    UUID        REFERENCES classes(id) ON DELETE SET NULL,
  name        TEXT        NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS curriculum_sources_class_idx ON curriculum_sources (class_id);
CREATE INDEX IF NOT EXISTS topics_class_idx ON topics (class_id);

-- ── EXERCISES ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exercises (
  id             UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id        UUID          REFERENCES units(id) ON DELETE CASCADE,
  topic_id       UUID          REFERENCES topics(id) ON DELETE SET NULL,
  title          TEXT          NOT NULL,
  type           exercise_type NOT NULL DEFAULT 'multiple-choice',
  difficulty     SMALLINT      NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 4),
  xp_reward      INTEGER       NOT NULL DEFAULT 50,
  description    TEXT          NOT NULL DEFAULT '',
  config         JSONB         NOT NULL DEFAULT '{}',
  starter_code   TEXT,
  test_cases     JSONB         NOT NULL DEFAULT '[]',
  hints          JSONB         NOT NULL DEFAULT '[]',
  sort_order     INTEGER       NOT NULL DEFAULT 0,
  unlock_trigger unlock_trigger NOT NULL DEFAULT 'completion',
  unlocks_at     TIMESTAMPTZ,
  draft_status   draft_status  NOT NULL DEFAULT 'approved',
  language       TEXT,
  syllabus_ref   TEXT,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  -- unit_id required once exercise is approved
  CONSTRAINT approved_needs_unit CHECK (draft_status <> 'approved' OR unit_id IS NOT NULL)
);

-- ── CONCEPT MASTERY ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS concept_mastery (
  id               UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id       UUID           NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  concept_id       TEXT           NOT NULL,
  mastery_score    SMALLINT       NOT NULL DEFAULT 0 CHECK (mastery_score BETWEEN 0 AND 100),
  status           mastery_status NOT NULL DEFAULT 'locked',
  attempts         INTEGER        NOT NULL DEFAULT 0,
  correct_attempts INTEGER        NOT NULL DEFAULT 0,
  accuracy_history INTEGER[]      NOT NULL DEFAULT '{}',
  weaknesses       TEXT[]         NOT NULL DEFAULT '{}',
  time_spent_ms    BIGINT         NOT NULL DEFAULT 0,
  last_practiced   TIMESTAMPTZ,
  UNIQUE (student_id, concept_id)
);

CREATE INDEX IF NOT EXISTS concept_mastery_student_idx ON concept_mastery (student_id);

-- ── USER ACHIEVEMENTS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_achievements (
  student_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT        NOT NULL,
  unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  xp_earned      INTEGER     NOT NULL DEFAULT 0,
  PRIMARY KEY (student_id, achievement_id)
);

-- ── DAILY CHALLENGES ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_challenges (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date         DATE        NOT NULL,
  concept_id   TEXT        NOT NULL,
  xp_reward    INTEGER     NOT NULL DEFAULT 75,
  completed    BOOLEAN     NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE (student_id, date)
);

-- ── PROGRESS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS progress (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id      UUID        REFERENCES lessons(id) ON DELETE CASCADE,
  exercise_id    UUID        REFERENCES exercises(id) ON DELETE CASCADE,
  completed      BOOLEAN     NOT NULL DEFAULT FALSE,
  score          SMALLINT,
  code           TEXT,
  output         TEXT,
  passed         BOOLEAN     NOT NULL DEFAULT FALSE,
  attempt_number INTEGER     NOT NULL DEFAULT 1,
  submitted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (lesson_id IS NOT NULL OR exercise_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS progress_student_idx  ON progress (student_id);
CREATE INDEX IF NOT EXISTS progress_exercise_idx ON progress (exercise_id);

-- ── SUBMISSIONS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS submissions (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_id  UUID        NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  code         TEXT        NOT NULL DEFAULT '',
  output       TEXT        NOT NULL DEFAULT '',
  passed       BOOLEAN     NOT NULL DEFAULT FALSE,
  score        SMALLINT    NOT NULL DEFAULT 0,
  feedback     TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PLACEMENT QUIZZES ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS placement_quizzes (
  id                UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id        UUID             NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answers           JSONB            NOT NULL DEFAULT '{}',
  section_scores    JSONB            NOT NULL DEFAULT '{}',
  recommended_stage stage_id         NOT NULL DEFAULT 'grade9',
  status            placement_status NOT NULL DEFAULT 'pending',
  confirmed_by      UUID             REFERENCES profiles(id),
  confirmed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- ── UNLOCKS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS unlocks (
  id            UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_type TEXT           NOT NULL CHECK (resource_type IN ('lesson','exercise','unit')),
  resource_id   UUID           NOT NULL,
  class_id      UUID           NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  trigger       unlock_trigger NOT NULL DEFAULT 'teacher',
  unlocks_at    TIMESTAMPTZ,
  unlocked_by   UUID           REFERENCES profiles(id),
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════
--  ROW-LEVEL SECURITY
-- ════════════════════════════════════════════════════════════

ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE units              ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons            ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises          ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics             ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_mastery    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenges   ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress           ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_quizzes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE unlocks            ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's role (cached in session)
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

-- ── profiles ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "own_profile" ON profiles;
CREATE POLICY "own_profile" ON profiles
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "teacher_read_students" ON profiles;
CREATE POLICY "teacher_read_students" ON profiles
  FOR SELECT USING (
    get_my_role() = 'teacher'
  );

-- ── classes ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "teacher_own_classes" ON classes;
CREATE POLICY "teacher_own_classes" ON classes
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS "student_enrolled_classes" ON classes;
CREATE POLICY "student_enrolled_classes" ON classes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM class_members WHERE class_id = classes.id AND student_id = auth.uid())
  );

-- ── class_members ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "own_membership" ON class_members;
CREATE POLICY "own_membership" ON class_members
  FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "teacher_class_members" ON class_members;
CREATE POLICY "teacher_class_members" ON class_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM classes WHERE id = class_id AND teacher_id = auth.uid())
  );

DROP POLICY IF EXISTS "student_join" ON class_members;
CREATE POLICY "student_join" ON class_members
  FOR INSERT WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "student_leave" ON class_members;
CREATE POLICY "student_leave" ON class_members
  FOR DELETE USING (student_id = auth.uid());

-- ── units ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "units_read" ON units;
CREATE POLICY "units_read" ON units
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM class_members cm WHERE cm.class_id = units.class_id AND cm.student_id = auth.uid())
    OR EXISTS (SELECT 1 FROM classes c WHERE c.id = units.class_id AND c.teacher_id = auth.uid())
  );

DROP POLICY IF EXISTS "teacher_manage_units" ON units;
CREATE POLICY "teacher_manage_units" ON units
  FOR ALL USING (
    EXISTS (SELECT 1 FROM classes c WHERE c.id = class_id AND c.teacher_id = auth.uid())
  );

-- ── lessons ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "lessons_read" ON lessons;
CREATE POLICY "lessons_read" ON lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM units u
      JOIN class_members cm ON cm.class_id = u.class_id
      WHERE u.id = lessons.unit_id AND cm.student_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM units u JOIN classes c ON c.id = u.class_id
      WHERE u.id = lessons.unit_id AND c.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "teacher_manage_lessons" ON lessons;
CREATE POLICY "teacher_manage_lessons" ON lessons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM units u JOIN classes c ON c.id = u.class_id
      WHERE u.id = unit_id AND c.teacher_id = auth.uid()
    )
  );

-- ── exercises ─────────────────────────────────────────────────────────────
-- Students see approved exercises in their enrolled classes (test_cases excluded via column select in app code)
DROP POLICY IF EXISTS "exercises_read" ON exercises;
CREATE POLICY "exercises_read" ON exercises
  FOR SELECT USING (
    draft_status = 'approved'
    AND (
      EXISTS (
        SELECT 1 FROM units u
        JOIN class_members cm ON cm.class_id = u.class_id
        WHERE u.id = exercises.unit_id AND cm.student_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM units u JOIN classes c ON c.id = u.class_id
        WHERE u.id = exercises.unit_id AND c.teacher_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "teacher_manage_exercises" ON exercises;
CREATE POLICY "teacher_manage_exercises" ON exercises
  FOR ALL USING (
    unit_id IS NULL -- draft exercises without a unit
    OR EXISTS (
      SELECT 1 FROM units u JOIN classes c ON c.id = u.class_id
      WHERE u.id = unit_id AND c.teacher_id = auth.uid()
    )
    OR (topic_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM topics t WHERE t.id = topic_id AND t.teacher_id = auth.uid()
    ))
  );

-- ── concept_mastery ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "own_mastery" ON concept_mastery;
CREATE POLICY "own_mastery" ON concept_mastery
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "teacher_read_mastery" ON concept_mastery;
CREATE POLICY "teacher_read_mastery" ON concept_mastery
  FOR SELECT USING (
    get_my_role() = 'teacher'
    AND EXISTS (
      SELECT 1 FROM class_members cm
      JOIN classes c ON c.id = cm.class_id
      WHERE cm.student_id = concept_mastery.student_id AND c.teacher_id = auth.uid()
    )
  );

-- ── user_achievements ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "own_achievements" ON user_achievements;
CREATE POLICY "own_achievements" ON user_achievements
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- ── daily_challenges ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "own_daily" ON daily_challenges;
CREATE POLICY "own_daily" ON daily_challenges
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- ── progress ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "own_progress" ON progress;
CREATE POLICY "own_progress" ON progress
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "teacher_read_progress" ON progress;
CREATE POLICY "teacher_read_progress" ON progress
  FOR SELECT USING (
    get_my_role() = 'teacher'
    AND EXISTS (
      SELECT 1 FROM class_members cm
      JOIN classes c ON c.id = cm.class_id
      WHERE cm.student_id = progress.student_id AND c.teacher_id = auth.uid()
    )
  );

-- ── submissions ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "own_submissions" ON submissions;
CREATE POLICY "own_submissions" ON submissions
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "teacher_read_submissions" ON submissions;
CREATE POLICY "teacher_read_submissions" ON submissions
  FOR SELECT USING (
    get_my_role() = 'teacher'
    AND EXISTS (
      SELECT 1 FROM exercises e
      JOIN units u ON u.id = e.unit_id
      JOIN classes c ON c.id = u.class_id
      WHERE e.id = submissions.exercise_id AND c.teacher_id = auth.uid()
    )
  );

-- ── placement_quizzes ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "own_placement" ON placement_quizzes;
CREATE POLICY "own_placement" ON placement_quizzes
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "teacher_placement" ON placement_quizzes;
CREATE POLICY "teacher_placement" ON placement_quizzes
  FOR SELECT USING (get_my_role() = 'teacher');

DROP POLICY IF EXISTS "teacher_confirm_placement" ON placement_quizzes;
CREATE POLICY "teacher_confirm_placement" ON placement_quizzes
  FOR UPDATE USING (get_my_role() = 'teacher');

-- ── curriculum_sources & topics ───────────────────────────────────────────
DROP POLICY IF EXISTS "teacher_own_sources" ON curriculum_sources;
CREATE POLICY "teacher_own_sources" ON curriculum_sources
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS "teacher_own_topics" ON topics;
CREATE POLICY "teacher_own_topics" ON topics
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- ── unlocks ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "teacher_manage_unlocks" ON unlocks;
CREATE POLICY "teacher_manage_unlocks" ON unlocks
  USING (
    EXISTS (SELECT 1 FROM classes c WHERE c.id = class_id AND c.teacher_id = auth.uid())
  );

DROP POLICY IF EXISTS "student_read_unlocks" ON unlocks;
CREATE POLICY "student_read_unlocks" ON unlocks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM class_members cm WHERE cm.class_id = unlocks.class_id AND cm.student_id = auth.uid())
  );

-- ════════════════════════════════════════════════════════════
--  REALTIME (enable for live heatmap + progress updates)
-- ════════════════════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE concept_mastery;
ALTER PUBLICATION supabase_realtime ADD TABLE progress;
ALTER PUBLICATION supabase_realtime ADD TABLE submissions;
