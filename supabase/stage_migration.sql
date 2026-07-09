-- ── Stage ID migration ────────────────────────────────────────────────────────
-- Adds four new curriculum track values to the stage_id enum.
-- Old values (igcse, as_a) are KEPT to avoid breaking existing student rows.
--
-- Run once in Supabase SQL editor (Dashboard → SQL Editor → New query).
-- PostgreSQL requires each ADD VALUE in a separate statement and cannot be
-- wrapped in a transaction that also modifies tables using the enum.

ALTER TYPE stage_id ADD VALUE IF NOT EXISTS 'igcse_y1';   -- Grade 10  — IGCSE Year 1 (Paper 1 Theory)
ALTER TYPE stage_id ADD VALUE IF NOT EXISTS 'igcse_y2';   -- Grade 11  — IGCSE Year 2 (Paper 2 Programming)
ALTER TYPE stage_id ADD VALUE IF NOT EXISTS 'as_level';   -- Grade 12  — AS Level
ALTER TYPE stage_id ADD VALUE IF NOT EXISTS 'a_level';    -- Grade 13  — A Level (full 9618)
