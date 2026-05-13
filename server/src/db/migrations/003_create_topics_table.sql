-- Migration: Create topics table
-- Description: Stores topics within courses

CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for course_id lookups
CREATE INDEX IF NOT EXISTS idx_topics_course_id ON topics(course_id);
