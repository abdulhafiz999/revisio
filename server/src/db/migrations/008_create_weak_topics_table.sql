-- Migration: Create weak_topics table
-- Description: Tracks topics where user has below 60% accuracy

CREATE TABLE IF NOT EXISTS weak_topics (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  accuracy_percentage DECIMAL(5,2) NOT NULL,
  last_attempted TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, topic_id)
);

-- Indexes for querying weak topics
CREATE INDEX IF NOT EXISTS idx_weak_topics_user_id ON weak_topics(user_id);
CREATE INDEX IF NOT EXISTS idx_weak_topics_accuracy ON weak_topics(accuracy_percentage);
