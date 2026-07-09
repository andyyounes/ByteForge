-- ── Fix: store grade from signup metadata + add new stage_id values ──────────
--
-- Run this entire script in Supabase Dashboard → SQL Editor → New query.
-- It is safe to run multiple times (idempotent).

-- Step 1: Add new stage_id enum values (if not already present)
ALTER TYPE stage_id ADD VALUE IF NOT EXISTS 'igcse_y1';
ALTER TYPE stage_id ADD VALUE IF NOT EXISTS 'igcse_y2';
ALTER TYPE stage_id ADD VALUE IF NOT EXISTS 'as_level';
ALTER TYPE stage_id ADD VALUE IF NOT EXISTS 'a_level';

-- Step 2: Replace the signup trigger so it also stores the grade from metadata.
--
-- Previously the trigger only stored: id, name, email, role, stage
-- It ignored the 'grade' key in raw_user_meta_data, so profiles.grade stayed ''.
-- /api/placement/auto then fell back to grade 7 when it read an empty grade.
--
-- The new trigger:
--   • Reads grade from metadata (the register form sends grade: "12" etc.)
--   • Maps grade → stage inline so the row is correct from the start
--   • Falls back to 'grade7' / grade '' if metadata is missing

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role  user_role;
  v_grade TEXT;
  v_stage stage_id;
BEGIN
  v_role  := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student');
  v_grade := COALESCE(NEW.raw_user_meta_data->>'grade', '');

  -- Map grade number → stage_id (mirrors gradeToStageId() in TypeScript)
  v_stage := CASE
    WHEN v_grade = '6'  THEN 'grade6'::stage_id
    WHEN v_grade = '7'  THEN 'grade7'::stage_id
    WHEN v_grade = '8'  THEN 'grade8'::stage_id
    WHEN v_grade = '9'  THEN 'grade9'::stage_id
    WHEN v_grade = '10' THEN 'igcse_y1'::stage_id
    WHEN v_grade = '11' THEN 'igcse_y2'::stage_id
    WHEN v_grade = '12' THEN 'as_level'::stage_id
    WHEN v_grade = '13' THEN 'a_level'::stage_id
    ELSE 'grade7'::stage_id
  END;

  INSERT INTO public.profiles (id, name, email, role, grade, stage)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    v_role,
    v_grade,
    v_stage
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger is already attached; REPLACE FUNCTION above is sufficient.
-- But recreate it to be safe:
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
