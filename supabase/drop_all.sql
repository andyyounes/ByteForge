-- ============================================================
--  ByteForge — Drop all tables (run BEFORE schema.sql)
--  Safe to run multiple times (IF EXISTS)
-- ============================================================

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS unlocks             CASCADE;
DROP TABLE IF EXISTS placement_quizzes   CASCADE;
DROP TABLE IF EXISTS submissions         CASCADE;
DROP TABLE IF EXISTS progress            CASCADE;
DROP TABLE IF EXISTS daily_challenges    CASCADE;
DROP TABLE IF EXISTS user_achievements   CASCADE;
DROP TABLE IF EXISTS concept_mastery     CASCADE;
DROP TABLE IF EXISTS exercises           CASCADE;
DROP TABLE IF EXISTS lessons             CASCADE;
DROP TABLE IF EXISTS units               CASCADE;
DROP TABLE IF EXISTS curriculum_sources  CASCADE;
DROP TABLE IF EXISTS topics              CASCADE;
DROP TABLE IF EXISTS class_members       CASCADE;
DROP TABLE IF EXISTS classes             CASCADE;
DROP TABLE IF EXISTS profiles            CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS user_role        CASCADE;
DROP TYPE IF EXISTS mastery_status   CASCADE;
DROP TYPE IF EXISTS lesson_type      CASCADE;
DROP TYPE IF EXISTS exercise_type    CASCADE;
DROP TYPE IF EXISTS draft_status     CASCADE;
DROP TYPE IF EXISTS unlock_trigger   CASCADE;
DROP TYPE IF EXISTS placement_status CASCADE;
DROP TYPE IF EXISTS stage_id         CASCADE;

-- Drop trigger + function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_my_role();
