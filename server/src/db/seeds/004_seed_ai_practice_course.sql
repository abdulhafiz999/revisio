-- Course and topic for AI-generated study note practice questions

INSERT INTO courses (id, name, code, icon, color, created_at) VALUES
  ('99999999-9999-9999-9999-999999999999', 'Study Notes Practice', 'NOTES', '📝', 'primary', NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO topics (id, name, course_id, created_at) VALUES
  ('99999999-9999-9999-9999-999999999998', 'AI Generated', '99999999-9999-9999-9999-999999999999', NOW())
ON CONFLICT (id) DO NOTHING;
