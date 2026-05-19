-- Migration: Widen answer columns for full multiple-choice option text
-- Run this in the Supabase SQL editor if generate-questions fails with varchar(10) errors

ALTER TABLE questions
  ALTER COLUMN correct_answer TYPE TEXT;

ALTER TABLE attempt_history
  ALTER COLUMN student_answer TYPE TEXT;
