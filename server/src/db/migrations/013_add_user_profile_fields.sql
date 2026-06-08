-- Migration: Add profile fields to users table
-- Description: Stores display name and university program for personalized Revi responses

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS program VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_users_program ON users(program);
