-- Seed data for courses table
-- Description: Populates courses matching the mock data structure

INSERT INTO courses (id, name, code, icon, color, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Introduction to Computer Science', 'CS101', '💻', 'primary', NOW()),
  ('22222222-2222-2222-2222-222222222222', 'Calculus II', 'MATH201', '📐', 'accent', NOW()),
  ('33333333-3333-3333-3333-333333333333', 'Physics I', 'PHYS101', '⚛️', 'success', NOW()),
  ('44444444-4444-4444-4444-444444444444', 'General Chemistry', 'CHEM101', '🧪', 'warning', NOW())
ON CONFLICT (code) DO NOTHING;
