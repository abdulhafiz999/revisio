-- Migration: Create additional indexes for performance optimization
-- Description: Composite indexes and additional performance indexes

-- Composite index for filtering questions by course and topic
CREATE INDEX IF NOT EXISTS idx_questions_course_topic ON questions(course_id, topic_id);

-- Composite index for filtering questions by topic and difficulty
CREATE INDEX IF NOT EXISTS idx_questions_topic_difficulty ON questions(topic_id, difficulty);

-- Composite index for attempt history by user and question
CREATE INDEX IF NOT EXISTS idx_attempt_history_user_question ON attempt_history(user_id, question_id);

-- Composite index for attempt history by user and timestamp
CREATE INDEX IF NOT EXISTS idx_attempt_history_user_time ON attempt_history(user_id, attempted_at DESC);

-- Index for weak topics by user and accuracy
CREATE INDEX IF NOT EXISTS idx_weak_topics_user_accuracy ON weak_topics(user_id, accuracy_percentage ASC);

-- Index for strong topics by user and accuracy
CREATE INDEX IF NOT EXISTS idx_strong_topics_user_accuracy ON strong_topics(user_id, accuracy_percentage DESC);
