-- Migration: Create shared_resources table
-- Description: Stores shared Google Drive links and class resources for courses

CREATE TABLE IF NOT EXISTS shared_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  resource_type VARCHAR(50) NOT NULL DEFAULT 'link',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying course resources
CREATE INDEX IF NOT EXISTS idx_shared_resources_course_id ON shared_resources(course_id);
CREATE INDEX IF NOT EXISTS idx_shared_resources_created_at ON shared_resources(created_at DESC);
