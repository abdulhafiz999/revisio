-- Migration: Create attempt_history table
-- Description: Records all user question attempts

CREATE TABLE IF NOT EXISTS attempt_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  student_answer VARCHAR(10) NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER
);

-- Indexes for querying attempt history
CREATE INDEX IF NOT EXISTS idx_attempt_history_user_id ON attempt_history(user_id);
CREATE INDEX IF NOT EXISTS idx_attempt_history_question_id ON attempt_history(question_id);
CREATE INDEX IF NOT EXISTS idx_attempt_history_attempted_at ON attempt_history(attempted_at DESC);
