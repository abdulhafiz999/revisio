-- Migration: Create study_notes table
-- Description: Stores user study notes and uploaded PDFs

CREATE TABLE IF NOT EXISTS study_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  file_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for querying study notes
CREATE INDEX IF NOT EXISTS idx_study_notes_user_id ON study_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_study_notes_updated_at ON study_notes(updated_at DESC);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_study_notes_updated_at
  BEFORE UPDATE ON study_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
