# Design Document: Backend Integration

## Overview

This design document specifies the architecture and implementation details for migrating REVISIO from a mock data frontend application to a production-ready full-stack system. The system will implement a RESTful API backend using Express.js and TypeScript, integrate Supabase for database management, authentication, and file storage, and incorporate AI-powered features using Gemini API (primary) and OpenAI (fallback).

### System Goals

- Provide secure user authentication and authorization
- Store and manage all application data in a relational database
- Expose RESTful APIs for course management, question retrieval, progress tracking, and study notes
- Integrate AI services for question generation, concept explanations, and personalized recommendations
- Support PDF upload and text extraction for study materials
- Maintain data consistency and integrity across all operations
- Ensure scalability and maintainability through clean architecture

### Technology Stack

- **Backend Framework**: Express.js with TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **AI Services**: Gemini API (primary), OpenAI API (fallback)
- **Frontend**: React with TypeScript (existing)

## Architecture

### High-Level Architecture

The system follows a three-tier architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                          │
│              (React + TypeScript Client)                    │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS/REST
                         │
┌────────────────────────▼────────────────────────────────────┐
│                     Backend Layer                           │
│              (Express.js + TypeScript API)                  │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Auth       │  │   Business   │  │   AI Service    │  │
│  │  Middleware  │  │    Logic     │  │    Layer        │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼──────┐  ┌──────▼──────┐  ┌─────▼──────────┐
│   Supabase   │  │   Supabase  │  │  AI Services   │
│  PostgreSQL  │  │   Storage   │  │  (Gemini/GPT)  │
│   Database   │  │             │  │                │
└──────────────┘  └─────────────┘  └────────────────┘
```

### Backend Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts          # Supabase client configuration
│   │   ├── environment.ts       # Environment variable validation
│   │   └── cors.ts              # CORS configuration
│   ├── middleware/
│   │   ├── auth.ts              # JWT token validation
│   │   ├── errorHandler.ts     # Global error handling
│   │   ├── validation.ts        # Request validation
│   │   └── rateLimiter.ts       # Rate limiting
│   ├── routes/
│   │   ├── auth.routes.ts       # Authentication endpoints
│   │   ├── courses.routes.ts    # Course management endpoints
│   │   ├── questions.routes.ts  # Question retrieval endpoints
│   │   ├── attempts.routes.ts   # Answer submission endpoints
│   │   ├── progress.routes.ts   # Progress tracking endpoints
│   │   ├── notes.routes.ts      # Study notes endpoints
│   │   └── ai.routes.ts         # AI-powered features endpoints
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── courses.controller.ts
│   │   ├── questions.controller.ts
│   │   ├── attempts.controller.ts
│   │   ├── progress.controller.ts
│   │   ├── notes.controller.ts
│   │   └── ai.controller.ts
│   ├── services/
│   │   ├── auth.service.ts      # Authentication business logic
│   │   ├── courses.service.ts   # Course management logic
│   │   ├── questions.service.ts # Question retrieval logic
│   │   ├── attempts.service.ts  # Answer processing logic
│   │   ├── progress.service.ts  # Progress calculation logic
│   │   ├── notes.service.ts     # Notes management logic
│   │   ├── storage.service.ts   # File upload/download logic
│   │   ├── pdf.service.ts       # PDF text extraction
│   │   ├── gemini.service.ts    # Gemini API integration
│   │   └── openai.service.ts    # OpenAI API integration
│   ├── models/
│   │   ├── types.ts             # TypeScript interfaces
│   │   └── schemas.ts           # Validation schemas
│   ├── utils/
│   │   ├── logger.ts            # Logging utility
│   │   ├── sanitizer.ts         # Input sanitization
│   │   └── dateHelper.ts        # Date manipulation helpers
│   ├── db/
│   │   ├── migrations/          # Database migration scripts
│   │   └── seeds/               # Seed data scripts
│   ├── app.ts                   # Express app configuration
│   └── server.ts                # Server entry point
├── tests/
│   ├── unit/
│   └── integration/
├── .env.example
├── .env.development
├── .env.production
├── package.json
├── tsconfig.json
└── README.md
```

### Layer Responsibilities

**Routes Layer**: Defines HTTP endpoints, applies middleware, delegates to controllers
**Controllers Layer**: Handles HTTP request/response, validates input, calls services
**Services Layer**: Implements business logic, interacts with database and external services
**Middleware Layer**: Provides cross-cutting concerns (auth, validation, error handling)
**Config Layer**: Manages environment configuration and external service clients

## Components and Interfaces

### Authentication Middleware

**Purpose**: Validate JWT tokens and attach user context to requests

**Interface**:
```typescript
interface AuthMiddleware {
  verifyToken(req: Request, res: Response, next: NextFunction): Promise<void>
}

interface AuthenticatedRequest extends Request {
  user: {
    id: string
    email: string
  }
}
```

**Behavior**:
- Extract token from Authorization header (Bearer scheme)
- Verify token with Supabase Auth
- Attach user information to request object
- Return 401 if token is invalid or expired

### API Client Service (Frontend)

**Purpose**: Centralize all backend API calls from the frontend

**Interface**:
```typescript
interface ApiClient {
  // Auth
  register(email: string, password: string): Promise<AuthResponse>
  login(email: string, password: string): Promise<AuthResponse>
  logout(): Promise<void>
  
  // Courses
  getCourses(): Promise<Course[]>
  getCourse(courseId: string): Promise<Course>
  getTopics(courseId: string): Promise<Topic[]>
  
  // Questions
  getQuestions(filters: QuestionFilters): Promise<Question[]>
  getQuestion(questionId: string): Promise<Question>
  
  // Attempts
  submitAnswer(attempt: AttemptSubmission): Promise<AttemptResult>
  
  // Progress
  getProgress(): Promise<UserProgress>
  getWeakTopics(): Promise<WeakTopic[]>
  getStrongTopics(): Promise<StrongTopic[]>
  getRecentActivity(): Promise<Attempt[]>
  
  // Notes
  getNotes(): Promise<StudyNote[]>
  getNote(noteId: string): Promise<StudyNote>
  createNote(note: NoteInput): Promise<StudyNote>
  updateNote(noteId: string, note: NoteInput): Promise<StudyNote>
  deleteNote(noteId: string): Promise<void>
  uploadPDF(file: File): Promise<StudyNote>
  
  // AI
  generateQuestions(noteId: string, count: number, difficulty: string): Promise<Question[]>
  explainConcept(concept: string): Promise<Explanation>
  getRecommendations(): Promise<Recommendation[]>
}
```

### Progress Tracker Service

**Purpose**: Calculate and update user progress metrics

**Interface**:
```typescript
interface ProgressTrackerService {
  updateProgress(userId: string, isCorrect: boolean): Promise<void>
  updateStreak(userId: string): Promise<void>
  recalculateTopicAccuracy(userId: string, topicId: string): Promise<void>
  updateWeakTopics(userId: string, topicId: string, accuracy: number): Promise<void>
  updateStrongTopics(userId: string, topicId: string, accuracy: number): Promise<void>
}
```

**Behavior**:
- Increment total_attempted on every answer submission
- Increment correct_answers or wrong_answers based on correctness
- Update last_activity_date to current date
- Calculate streak based on consecutive days of activity
- Calculate topic accuracy from attempt history
- Update weak_topics table when accuracy < 60%
- Update strong_topics table when accuracy > 80%

### AI Service Layer

**Purpose**: Abstract AI provider interactions with fallback logic

**Interface**:
```typescript
interface AIService {
  generateQuestions(content: string, count: number, difficulty: string): Promise<GeneratedQuestion[]>
  explainConcept(concept: string): Promise<string>
  generateRecommendations(weakTopics: WeakTopicData[]): Promise<Recommendation[]>
}

interface AIProvider {
  name: string
  generateQuestions(prompt: string): Promise<GeneratedQuestion[]>
  generateExplanation(prompt: string): Promise<string>
  generateRecommendations(prompt: string): Promise<Recommendation[]>
}
```

**Behavior**:
- Try Gemini API first for all operations
- On Gemini failure (timeout, error, unavailable), fallback to OpenAI
- On both failures, throw ServiceUnavailableError
- Log all AI service calls and failures
- Implement retry logic with exponential backoff (max 3 retries)

### Storage Service

**Purpose**: Manage file uploads and downloads via Supabase Storage

**Interface**:
```typescript
interface StorageService {
  uploadPDF(file: Buffer, userId: string): Promise<string>
  getFileUrl(filePath: string): Promise<string>
  deleteFile(filePath: string): Promise<void>
}
```

**Behavior**:
- Generate unique filename: `${userId}/${timestamp}_${originalName}`
- Upload to Supabase Storage bucket: `study-materials`
- Return storage path for database storage
- Generate signed URLs valid for 1 hour for file access
- Validate file size (max 10MB) and type (application/pdf)

### PDF Service

**Purpose**: Extract text content from PDF files

**Interface**:
```typescript
interface PDFService {
  extractText(fileBuffer: Buffer): Promise<string>
}
```

**Behavior**:
- Use pdf-parse library for text extraction
- Preserve paragraph structure with newlines
- Handle multi-page PDFs
- Return empty string on extraction failure (log error)
- Strip excessive whitespace while preserving structure

## Data Models

### Database Schema

#### users table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

#### courses table
```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  icon VARCHAR(100),
  color VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_courses_code ON courses(code);
```

#### topics table
```sql
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_topics_course_id ON topics(course_id);
```

#### questions table
```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  type VARCHAR(20) NOT NULL CHECK (type IN ('multiple-choice', 'true-false')),
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer VARCHAR(10) NOT NULL,
  explanation TEXT,
  common_mistakes TEXT[],
  hints TEXT[],
  year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_questions_course_id ON questions(course_id);
CREATE INDEX idx_questions_topic_id ON questions(topic_id);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
```

#### user_progress table
```sql
CREATE TABLE user_progress (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_attempted INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  wrong_answers INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
```

#### attempt_history table
```sql
CREATE TABLE attempt_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  student_answer VARCHAR(10) NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER
);

CREATE INDEX idx_attempt_history_user_id ON attempt_history(user_id);
CREATE INDEX idx_attempt_history_question_id ON attempt_history(question_id);
CREATE INDEX idx_attempt_history_attempted_at ON attempt_history(attempted_at DESC);
```

#### study_notes table
```sql
CREATE TABLE study_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  file_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_study_notes_user_id ON study_notes(user_id);
CREATE INDEX idx_study_notes_updated_at ON study_notes(updated_at DESC);
```

#### weak_topics table
```sql
CREATE TABLE weak_topics (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  accuracy_percentage DECIMAL(5,2) NOT NULL,
  last_attempted TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, topic_id)
);

CREATE INDEX idx_weak_topics_user_id ON weak_topics(user_id);
CREATE INDEX idx_weak_topics_accuracy ON weak_topics(accuracy_percentage);
```

#### strong_topics table
```sql
CREATE TABLE strong_topics (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  accuracy_percentage DECIMAL(5,2) NOT NULL,
  last_attempted TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, topic_id)
);

CREATE INDEX idx_strong_topics_user_id ON strong_topics(user_id);
CREATE INDEX idx_strong_topics_accuracy ON strong_topics(accuracy_percentage DESC);
```

### TypeScript Interfaces

```typescript
// Core Domain Models
interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

interface Course {
  id: string
  name: string
  code: string
  icon: string
  color: string
  created_at: string
}

interface Topic {
  id: string
  name: string
  course_id: string
  created_at: string
}

interface Question {
  id: string
  course_id: string
  topic_id: string
  difficulty: 'easy' | 'medium' | 'hard'
  type: 'multiple-choice' | 'true-false'
  question_text: string
  options: string[]
  correct_answer: string
  explanation: string
  common_mistakes: string[]
  hints: string[]
  year: number
  created_at: string
}

interface UserProgress {
  user_id: string
  total_attempted: number
  correct_answers: number
  wrong_answers: number
  streak_days: number
  last_activity_date: string
  created_at: string
  updated_at: string
  accuracy_percentage: number // calculated field
}

interface Attempt {
  id: string
  user_id: string
  question_id: string
  attempted_at: string
  student_answer: string
  is_correct: boolean
  time_spent_seconds: number
}

interface StudyNote {
  id: string
  user_id: string
  title: string
  content: string
  file_url: string | null
  created_at: string
  updated_at: string
}

interface WeakTopic {
  user_id: string
  topic_id: string
  topic_name: string // joined from topics table
  accuracy_percentage: number
  last_attempted: string
}

interface StrongTopic {
  user_id: string
  topic_id: string
  topic_name: string // joined from topics table
  accuracy_percentage: number
  last_attempted: string
}

// Request/Response Models
interface AttemptSubmission {
  question_id: string
  student_answer: string
  time_spent_seconds: number
}

interface AttemptResult {
  is_correct: boolean
  correct_answer: string
  explanation: string
}

interface QuestionFilters {
  courseId?: string
  topicId?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  limit?: number
}

interface NoteInput {
  title: string
  content: string
}

interface GeneratedQuestion {
  question_text: string
  options: string[]
  correct_answer: string
  explanation: string
}

interface Explanation {
  definition: string
  examples: string[]
  key_points: string[]
  related_concepts: string[]
}

interface Recommendation {
  topic_name: string
  suggested_focus_areas: string[]
  study_tips: string[]
  estimated_time: string
}

// API Response Wrappers
interface ApiSuccessResponse<T> {
  success: true
  data: T
  timestamp: string
}

interface ApiErrorResponse {
  success: false
  error: string
  timestamp: string
}

interface PaginatedResponse<T> {
  success: true
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
  timestamp: string
}
```

### API Endpoints Specification

#### Authentication Endpoints

**POST /api/auth/register**
- Request: `{ email: string, password: string }`
- Response: `{ success: true, data: { user: User, session: Session } }`
- Errors: 400 (invalid email/password), 409 (email exists)

**POST /api/auth/login**
- Request: `{ email: string, password: string }`
- Response: `{ success: true, data: { user: User, session: Session } }`
- Errors: 401 (invalid credentials)

**POST /api/auth/logout**
- Request: None (uses session token)
- Response: `{ success: true, data: null }`
- Errors: 401 (not authenticated)

**POST /api/auth/reset-password**
- Request: `{ email: string }`
- Response: `{ success: true, data: { message: string } }`
- Errors: 404 (email not found)

#### Course Endpoints

**GET /api/courses**
- Request: None
- Response: `{ success: true, data: Course[] }`
- Errors: 500 (database error)

**GET /api/courses/:courseId**
- Request: None
- Response: `{ success: true, data: Course }`
- Errors: 404 (course not found)

**GET /api/courses/:courseId/topics**
- Request: None
- Response: `{ success: true, data: Topic[] }`
- Errors: 404 (course not found)

**GET /api/topics/:topicId**
- Request: None
- Response: `{ success: true, data: Topic & { course: Course } }`
- Errors: 404 (topic not found)

#### Question Endpoints

**GET /api/questions**
- Request: Query params `{ courseId?, topicId?, difficulty?, limit? }`
- Response: `{ success: true, data: Question[] }`
- Errors: 400 (invalid filters)

**GET /api/questions/:questionId**
- Request: None
- Response: `{ success: true, data: Question }`
- Errors: 404 (question not found)

#### Attempt Endpoints

**POST /api/attempts**
- Auth: Required
- Request: `{ question_id: string, student_answer: string, time_spent_seconds: number }`
- Response: `{ success: true, data: AttemptResult }`
- Errors: 400 (invalid question_id), 401 (not authenticated)

#### Progress Endpoints

**GET /api/users/progress**
- Auth: Required
- Request: None
- Response: `{ success: true, data: UserProgress }`
- Errors: 401 (not authenticated)

**GET /api/users/weak-topics**
- Auth: Required
- Request: None
- Response: `{ success: true, data: WeakTopic[] }`
- Errors: 401 (not authenticated)

**GET /api/users/strong-topics**
- Auth: Required
- Request: None
- Response: `{ success: true, data: StrongTopic[] }`
- Errors: 401 (not authenticated)

**GET /api/users/recent-activity**
- Auth: Required
- Request: None
- Response: `{ success: true, data: Attempt[] }`
- Errors: 401 (not authenticated)

#### Notes Endpoints

**GET /api/notes**
- Auth: Required
- Request: None
- Response: `{ success: true, data: StudyNote[] }`
- Errors: 401 (not authenticated)

**GET /api/notes/:noteId**
- Auth: Required
- Request: None
- Response: `{ success: true, data: StudyNote }`
- Errors: 401 (not authenticated), 403 (not owner), 404 (not found)

**POST /api/notes**
- Auth: Required
- Request: `{ title: string, content: string }`
- Response: `{ success: true, data: StudyNote }`
- Errors: 400 (missing fields), 401 (not authenticated)

**PUT /api/notes/:noteId**
- Auth: Required
- Request: `{ title: string, content: string }`
- Response: `{ success: true, data: StudyNote }`
- Errors: 400 (missing fields), 401 (not authenticated), 403 (not owner), 404 (not found)

**DELETE /api/notes/:noteId**
- Auth: Required
- Request: None
- Response: `{ success: true, data: null }`
- Errors: 401 (not authenticated), 403 (not owner), 404 (not found)

**POST /api/notes/upload**
- Auth: Required
- Request: Multipart form data with PDF file
- Response: `{ success: true, data: StudyNote }`
- Errors: 400 (invalid file type), 401 (not authenticated), 413 (file too large)

**GET /api/notes/:noteId/file**
- Auth: Required
- Request: None
- Response: `{ success: true, data: { url: string } }`
- Errors: 401 (not authenticated), 403 (not owner), 404 (not found)

#### AI Endpoints

**POST /api/ai/generate-questions**
- Auth: Required
- Request: `{ note_id: string, count: number, difficulty: string }`
- Response: `{ success: true, data: GeneratedQuestion[] }`
- Errors: 400 (empty content, invalid count), 401 (not authenticated), 503 (AI unavailable)

**POST /api/ai/explain**
- Auth: Required
- Request: `{ concept_text: string }`
- Response: `{ success: true, data: Explanation }`
- Errors: 400 (empty concept), 401 (not authenticated), 503 (AI unavailable)

**GET /api/ai/recommendations**
- Auth: Required
- Request: None
- Response: `{ success: true, data: Recommendation[] }`
- Errors: 401 (not authenticated), 503 (AI unavailable)

