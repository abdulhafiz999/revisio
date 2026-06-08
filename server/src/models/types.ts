// TypeScript type definitions for REVISIO Backend
// All interfaces from design document

// ============================================================================
// Core Domain Models
// ============================================================================

export interface User {
  id: string;
  email: string;
  display_name?: string | null;
  program?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  program: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileRequest {
  display_name?: string | null;
  program?: string | null;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  icon: string;
  color: string;
  created_at: string;
}

export interface Topic {
  id: string;
  name: string;
  course_id: string;
  created_at: string;
}

export interface Question {
  id: string;
  course_id: string;
  topic_id: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'multiple-choice' | 'true-false';
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  common_mistakes: string[];
  hints: string[];
  year: number;
  created_at: string;
}

export interface UserProgress {
  user_id: string;
  total_attempted: number;
  correct_answers: number;
  wrong_answers: number;
  streak_days: number;
  last_activity_date: string;
  created_at: string;
  updated_at: string;
  accuracy_percentage: number; // calculated field
}

export interface Attempt {
  id: string;
  user_id: string;
  question_id: string;
  attempted_at: string;
  student_answer: string;
  is_correct: boolean;
  time_spent_seconds: number;
}

export interface StudyNote {
  id: string;
  user_id: string;
  title: string;
  content: string;
  file_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeakTopic {
  user_id: string;
  topic_id: string;
  topic_name: string; // joined from topics table
  accuracy_percentage: number;
  last_attempted: string;
}

export interface StrongTopic {
  user_id: string;
  topic_id: string;
  topic_name: string; // joined from topics table
  accuracy_percentage: number;
  last_attempted: string;
}

// ============================================================================
// Request/Response Models
// ============================================================================

export interface AttemptSubmission {
  question_id: string;
  student_answer: string;
  time_spent_seconds: number;
}

export interface AttemptResult {
  is_correct: boolean;
  correct_answer: string;
  explanation: string;
}

export interface QuestionFilters {
  courseId?: string;
  topicId?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  limit?: number;
}

export interface NoteInput {
  title: string;
  content: string;
}

export interface GeneratedQuestion {
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export interface Explanation {
  definition: string;
  examples: string[];
  key_points: string[];
  related_concepts: string[];
}

export interface Recommendation {
  topic_name: string;
  suggested_focus_areas: string[];
  study_tips: string[];
  estimated_time: string;
}

// ============================================================================
// API Response Wrappers
// ============================================================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  timestamp: string;
}

// ============================================================================
// Authentication Types
// ============================================================================

export interface AuthResponse {
  user: User;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  } | null;
  emailConfirmationRequired?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ResetPasswordRequest {
  email: string;
}

// ============================================================================
// AI Service Types
// ============================================================================

export interface GenerateQuestionsRequest {
  note_id: string;
  count: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ExplainConceptRequest {
  concept_text: string;
}

export interface WeakTopicData {
  topic_id: string;
  topic_name: string;
  accuracy_percentage: number;
  attempt_count: number;
  recent_attempts: Attempt[];
}

// ============================================================================
// Utility Types
// ============================================================================

export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'multiple-choice' | 'true-false';
