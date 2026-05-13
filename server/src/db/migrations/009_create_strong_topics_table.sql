-- Migration: Create strong_topics table
-- Description: Tracks topics where user has above 80% accuracy

CREATE TABLE IF NOT EXISTS strong_topics (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  accuracy_percentage DECIMAL(5,2) NOT NULL,
  last_attempted TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, topic_id)
);

-- Indexes for querying strong topics
CREATE INDEX IF NOT EXISTS idx_strong_topics_user_id ON strong_topics(user_id);
CREATE INDEX IF NOT EXISTS idx_strong_topics_accuracy ON strong_topics(accuracy_percentage DESC);
