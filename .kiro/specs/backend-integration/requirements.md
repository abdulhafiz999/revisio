# Requirements Document

## Introduction

This document specifies the requirements for migrating the REVISIO AI-Assisted Exam Preparation System from a mock data frontend application to a production-ready full-stack system. The migration involves implementing a complete backend infrastructure with Express.js and TypeScript, integrating Supabase for database and authentication, implementing AI-powered features using Gemini API and OpenAI, and connecting the existing React frontend to the new backend services.

## Glossary

- **REVISIO_System**: The complete AI-Assisted Exam Preparation System including frontend, backend, database, and AI services
- **Backend_API**: The Express.js REST API server that handles all business logic and data operations
- **Database**: The Supabase PostgreSQL database storing all application data
- **Auth_Service**: The Supabase Authentication service managing user sessions and access control
- **AI_Service**: The service layer integrating Gemini API (primary) and OpenAI (fallback) for AI features
- **Storage_Service**: The Supabase Storage service for managing uploaded PDF files
- **Frontend_Client**: The existing React/TypeScript application that consumes the Backend_API
- **User**: An authenticated student using the REVISIO system
- **Course**: An academic subject containing topics and questions
- **Topic**: A specific subject area within a course
- **Question**: An exam question with options, correct answer, and metadata
- **Progress_Tracker**: The system component tracking user performance and learning patterns
- **Study_Note**: User-uploaded or created study material in text or PDF format
- **Attempt_History**: Historical record of user answers to questions
- **Weak_Topic**: A topic where the user has below 60% accuracy
- **Strong_Topic**: A topic where the user has above 80% accuracy

## Requirements

### Requirement 1: User Authentication and Authorization

**User Story:** As a student, I want to create an account and securely log in, so that my progress and study materials are saved and protected.

#### Acceptance Criteria

1. THE Auth_Service SHALL provide user registration with email and password
2. WHEN a user registers with valid credentials, THE Auth_Service SHALL create a new user account and send a verification email
3. WHEN a user registers with an email that already exists, THE Auth_Service SHALL return an error message
4. THE Auth_Service SHALL provide user login with email and password
5. WHEN a user logs in with valid credentials, THE Auth_Service SHALL create a session token valid for 7 days
6. WHEN a user logs in with invalid credentials, THE Auth_Service SHALL return an authentication error
7. THE Backend_API SHALL validate session tokens on all protected endpoints
8. WHEN a request contains an invalid or expired token, THE Backend_API SHALL return a 401 unauthorized error
9. THE Auth_Service SHALL provide password reset functionality via email
10. THE Auth_Service SHALL provide session logout functionality

### Requirement 2: Database Schema Implementation

**User Story:** As a developer, I want a well-structured database schema, so that all application data is stored efficiently and relationships are maintained.

#### Acceptance Criteria

1. THE Database SHALL store user profiles with fields: id, email, created_at, updated_at
2. THE Database SHALL store courses with fields: id, name, code, icon, color, created_at
3. THE Database SHALL store topics with fields: id, name, course_id, created_at
4. THE Database SHALL enforce foreign key constraint between topics.course_id and courses.id
5. THE Database SHALL store questions with fields: id, course_id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, common_mistakes, hints, year, created_at
6. THE Database SHALL enforce foreign key constraints between questions.course_id and courses.id, and questions.topic_id and topics.id
7. THE Database SHALL store user_progress with fields: user_id, total_attempted, correct_answers, wrong_answers, streak_days, last_activity_date, created_at, updated_at
8. THE Database SHALL enforce foreign key constraint between user_progress.user_id and users.id
9. THE Database SHALL store attempt_history with fields: id, user_id, question_id, attempted_at, student_answer, is_correct, time_spent_seconds
10. THE Database SHALL enforce foreign key constraints between attempt_history.user_id and users.id, and attempt_history.question_id and questions.id
11. THE Database SHALL store study_notes with fields: id, user_id, title, content, file_url, created_at, updated_at
12. THE Database SHALL enforce foreign key constraint between study_notes.user_id and users.id
13. THE Database SHALL store weak_topics with fields: user_id, topic_id, accuracy_percentage, last_attempted
14. THE Database SHALL store strong_topics with fields: user_id, topic_id, accuracy_percentage, last_attempted
15. THE Database SHALL create indexes on frequently queried fields: user_id, course_id, topic_id, attempted_at

### Requirement 3: Course and Topic Management API

**User Story:** As a student, I want to browse available courses and topics, so that I can select what to study.

#### Acceptance Criteria

1. THE Backend_API SHALL provide an endpoint GET /api/courses that returns all courses
2. WHEN a user requests all courses, THE Backend_API SHALL return courses with fields: id, name, code, icon, color
3. THE Backend_API SHALL provide an endpoint GET /api/courses/:courseId that returns a specific course
4. WHEN a user requests a course that does not exist, THE Backend_API SHALL return a 404 error
5. THE Backend_API SHALL provide an endpoint GET /api/courses/:courseId/topics that returns all topics for a course
6. WHEN a user requests topics for a course, THE Backend_API SHALL return topics ordered alphabetically by name
7. THE Backend_API SHALL provide an endpoint GET /api/topics/:topicId that returns a specific topic with its course information

### Requirement 4: Question Retrieval and Filtering API

**User Story:** As a student, I want to retrieve questions filtered by course, topic, and difficulty, so that I can practice targeted areas.

#### Acceptance Criteria

1. THE Backend_API SHALL provide an endpoint GET /api/questions with query parameters: courseId, topicId, difficulty, limit
2. WHEN a user requests questions without filters, THE Backend_API SHALL return up to 20 random questions
3. WHEN a user requests questions with courseId filter, THE Backend_API SHALL return only questions matching that course
4. WHEN a user requests questions with topicId filter, THE Backend_API SHALL return only questions matching that topic
5. WHEN a user requests questions with difficulty filter, THE Backend_API SHALL return only questions matching that difficulty level
6. WHEN a user requests questions with limit parameter, THE Backend_API SHALL return at most that number of questions
7. THE Backend_API SHALL provide an endpoint GET /api/questions/:questionId that returns a specific question with all details
8. WHEN a user requests a question that does not exist, THE Backend_API SHALL return a 404 error

### Requirement 5: Answer Submission and Progress Tracking

**User Story:** As a student, I want my answers to be recorded and my progress tracked, so that I can monitor my improvement over time.

#### Acceptance Criteria

1. THE Backend_API SHALL provide an endpoint POST /api/attempts that accepts: question_id, student_answer, time_spent_seconds
2. WHEN a user submits an answer, THE Backend_API SHALL validate the question_id exists
3. WHEN a user submits an answer, THE Backend_API SHALL record the attempt in attempt_history with attempted_at timestamp
4. WHEN a user submits an answer, THE Backend_API SHALL determine if the answer is correct by comparing with the question's correct_answer
5. WHEN a user submits an answer, THE Backend_API SHALL update user_progress total_attempted count
6. WHEN a user submits a correct answer, THE Backend_API SHALL increment user_progress correct_answers count
7. WHEN a user submits an incorrect answer, THE Backend_API SHALL increment user_progress wrong_answers count
8. WHEN a user submits an answer, THE Backend_API SHALL return the correctness result and the question explanation
9. WHEN a user submits an answer, THE Progress_Tracker SHALL recalculate topic accuracy for the question's topic
10. WHEN a topic accuracy falls below 60%, THE Progress_Tracker SHALL add or update the topic in weak_topics
11. WHEN a topic accuracy exceeds 80%, THE Progress_Tracker SHALL add or update the topic in strong_topics

### Requirement 6: User Progress and Statistics Retrieval

**User Story:** As a student, I want to view my overall progress and statistics, so that I can understand my strengths and weaknesses.

#### Acceptance Criteria

1. THE Backend_API SHALL provide an endpoint GET /api/users/progress that returns the authenticated user's progress
2. WHEN a user requests their progress, THE Backend_API SHALL return: total_attempted, correct_answers, wrong_answers, streak_days, accuracy_percentage
3. THE Backend_API SHALL calculate accuracy_percentage as (correct_answers / total_attempted) * 100
4. THE Backend_API SHALL provide an endpoint GET /api/users/weak-topics that returns topics with accuracy below 60%
5. WHEN a user requests weak topics, THE Backend_API SHALL return topics ordered by lowest accuracy first
6. THE Backend_API SHALL provide an endpoint GET /api/users/strong-topics that returns topics with accuracy above 80%
7. WHEN a user requests strong topics, THE Backend_API SHALL return topics ordered by highest accuracy first
8. THE Backend_API SHALL provide an endpoint GET /api/users/recent-activity that returns the last 10 attempts
9. WHEN a user requests recent activity, THE Backend_API SHALL return attempts ordered by attempted_at descending

### Requirement 7: Study Streak Calculation

**User Story:** As a student, I want my study streak to be tracked, so that I can stay motivated to study daily.

#### Acceptance Criteria

1. WHEN a user submits their first answer of the day, THE Progress_Tracker SHALL check the last_activity_date
2. WHEN the last_activity_date is yesterday, THE Progress_Tracker SHALL increment streak_days by 1
3. WHEN the last_activity_date is today, THE Progress_Tracker SHALL not modify streak_days
4. WHEN the last_activity_date is more than 1 day ago, THE Progress_Tracker SHALL reset streak_days to 1
5. WHEN a user submits an answer, THE Progress_Tracker SHALL update last_activity_date to the current date

### Requirement 8: Study Notes Management

**User Story:** As a student, I want to create and manage study notes, so that I can organize my learning materials.

#### Acceptance Criteria

1. THE Backend_API SHALL provide an endpoint POST /api/notes that accepts: title, content
2. WHEN a user creates a note, THE Backend_API SHALL store it with the authenticated user_id and current timestamp
3. THE Backend_API SHALL provide an endpoint GET /api/notes that returns all notes for the authenticated user
4. WHEN a user requests their notes, THE Backend_API SHALL return notes ordered by updated_at descending
5. THE Backend_API SHALL provide an endpoint GET /api/notes/:noteId that returns a specific note
6. WHEN a user requests a note they do not own, THE Backend_API SHALL return a 403 forbidden error
7. THE Backend_API SHALL provide an endpoint PUT /api/notes/:noteId that accepts: title, content
8. WHEN a user updates a note, THE Backend_API SHALL update the updated_at timestamp
9. THE Backend_API SHALL provide an endpoint DELETE /api/notes/:noteId
10. WHEN a user deletes a note, THE Backend_API SHALL remove it from the database

### Requirement 9: PDF Upload and Storage

**User Story:** As a student, I want to upload PDF study materials, so that I can access them within the application.

#### Acceptance Criteria

1. THE Backend_API SHALL provide an endpoint POST /api/notes/upload that accepts PDF files up to 10MB
2. WHEN a user uploads a PDF, THE Backend_API SHALL validate the file type is application/pdf
3. WHEN a user uploads a file larger than 10MB, THE Backend_API SHALL return a 413 payload too large error
4. WHEN a user uploads a valid PDF, THE Storage_Service SHALL store the file with a unique filename
5. WHEN a user uploads a valid PDF, THE Backend_API SHALL create a study note record with the file_url
6. THE Storage_Service SHALL generate a secure URL for accessing uploaded PDFs
7. THE Backend_API SHALL provide an endpoint GET /api/notes/:noteId/file that returns the PDF file URL
8. WHEN a user requests a PDF they do not own, THE Backend_API SHALL return a 403 forbidden error

### Requirement 10: PDF Text Extraction

**User Story:** As a student, I want text extracted from my uploaded PDFs, so that I can use it for AI-powered features.

#### Acceptance Criteria

1. WHEN a user uploads a PDF, THE AI_Service SHALL extract text content from the PDF
2. WHEN text extraction succeeds, THE Backend_API SHALL store the extracted text in the study note content field
3. WHEN text extraction fails, THE Backend_API SHALL store an empty string in the content field and log the error
4. THE AI_Service SHALL preserve paragraph structure and formatting during text extraction
5. THE AI_Service SHALL handle multi-page PDFs and concatenate text from all pages

### Requirement 11: AI-Powered Question Generation

**User Story:** As a student, I want questions generated from my study notes, so that I can practice with personalized content.

#### Acceptance Criteria

1. THE Backend_API SHALL provide an endpoint POST /api/ai/generate-questions that accepts: note_id, count, difficulty
2. WHEN a user requests question generation, THE Backend_API SHALL retrieve the study note content
3. WHEN the study note content is empty, THE Backend_API SHALL return a 400 bad request error
4. WHEN a user requests question generation, THE AI_Service SHALL send the note content to Gemini API
5. WHEN Gemini API is unavailable, THE AI_Service SHALL fallback to OpenAI API
6. WHEN both AI services are unavailable, THE Backend_API SHALL return a 503 service unavailable error
7. THE AI_Service SHALL generate questions in the format: question_text, options array, correct_answer, explanation
8. WHEN question generation succeeds, THE Backend_API SHALL return the generated questions without storing them
9. THE AI_Service SHALL generate questions matching the requested difficulty level
10. THE AI_Service SHALL generate the requested count of questions, up to a maximum of 10 per request

### Requirement 12: AI-Powered Concept Explanations

**User Story:** As a student, I want detailed explanations of concepts, so that I can better understand difficult topics.

#### Acceptance Criteria

1. THE Backend_API SHALL provide an endpoint POST /api/ai/explain that accepts: concept_text
2. WHEN a user requests an explanation, THE AI_Service SHALL send the concept to Gemini API
3. WHEN Gemini API is unavailable, THE AI_Service SHALL fallback to OpenAI API
4. WHEN both AI services are unavailable, THE Backend_API SHALL return a 503 service unavailable error
5. THE AI_Service SHALL generate explanations with: definition, examples, key points, related concepts
6. WHEN explanation generation succeeds, THE Backend_API SHALL return the explanation text
7. THE AI_Service SHALL generate explanations suitable for undergraduate students

### Requirement 13: AI-Powered Personalized Recommendations

**User Story:** As a student, I want personalized study recommendations based on my weak topics, so that I can improve efficiently.

#### Acceptance Criteria

1. THE Backend_API SHALL provide an endpoint GET /api/ai/recommendations
2. WHEN a user requests recommendations, THE Backend_API SHALL retrieve the user's weak topics
3. WHEN the user has no weak topics, THE Backend_API SHALL return an empty recommendations array
4. WHEN the user has weak topics, THE AI_Service SHALL analyze the user's attempt history for those topics
5. WHEN the user has weak topics, THE AI_Service SHALL send weak topic data to Gemini API
6. WHEN Gemini API is unavailable, THE AI_Service SHALL fallback to OpenAI API
7. THE AI_Service SHALL generate recommendations with: topic_name, suggested_focus_areas, study_tips, estimated_time
8. WHEN recommendation generation succeeds, THE Backend_API SHALL return up to 5 prioritized recommendations
9. THE AI_Service SHALL prioritize recommendations for topics with the lowest accuracy

### Requirement 14: API Error Handling and Validation

**User Story:** As a developer, I want consistent error handling and input validation, so that the API is reliable and secure.

#### Acceptance Criteria

1. WHEN a request contains invalid JSON, THE Backend_API SHALL return a 400 bad request error with a descriptive message
2. WHEN a request is missing required fields, THE Backend_API SHALL return a 400 bad request error listing the missing fields
3. WHEN a request contains invalid data types, THE Backend_API SHALL return a 400 bad request error with field-specific messages
4. WHEN a database operation fails, THE Backend_API SHALL return a 500 internal server error and log the error details
5. WHEN an external service fails, THE Backend_API SHALL return a 503 service unavailable error
6. THE Backend_API SHALL validate all user inputs against SQL injection patterns
7. THE Backend_API SHALL sanitize all user inputs before database operations
8. THE Backend_API SHALL implement rate limiting of 100 requests per minute per user
9. WHEN a user exceeds rate limits, THE Backend_API SHALL return a 429 too many requests error

### Requirement 15: API Response Format Standardization

**User Story:** As a frontend developer, I want consistent API response formats, so that I can handle responses predictably.

#### Acceptance Criteria

1. THE Backend_API SHALL return successful responses with status code 200 and JSON body containing: success: true, data: object
2. THE Backend_API SHALL return error responses with appropriate status code and JSON body containing: success: false, error: string
3. THE Backend_API SHALL return paginated responses with: data: array, pagination: {page, limit, total, hasMore}
4. THE Backend_API SHALL include response timestamps in ISO 8601 format
5. THE Backend_API SHALL set Content-Type header to application/json for all responses

### Requirement 16: Database Migration and Seed Data

**User Story:** As a developer, I want database migrations and seed data, so that the database can be set up consistently across environments.

#### Acceptance Criteria

1. THE REVISIO_System SHALL provide migration scripts to create all database tables
2. THE REVISIO_System SHALL provide migration scripts to create all indexes and constraints
3. THE REVISIO_System SHALL provide seed data for courses matching the existing mock data structure
4. THE REVISIO_System SHALL provide seed data for topics matching the existing mock data structure
5. THE REVISIO_System SHALL provide seed data for at least 50 questions across all courses
6. THE REVISIO_System SHALL provide a rollback mechanism for all migrations
7. THE REVISIO_System SHALL version all migration scripts with timestamps

### Requirement 17: Environment Configuration

**User Story:** As a developer, I want environment-based configuration, so that the application can run in development, staging, and production environments.

#### Acceptance Criteria

1. THE Backend_API SHALL load configuration from environment variables
2. THE Backend_API SHALL require environment variables: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, GEMINI_API_KEY, OPENAI_API_KEY, PORT, NODE_ENV
3. WHEN required environment variables are missing, THE Backend_API SHALL fail to start and log the missing variables
4. THE Backend_API SHALL use different database connections for development and production based on NODE_ENV
5. THE Backend_API SHALL enable detailed logging in development and error-only logging in production
6. THE REVISIO_System SHALL provide example environment files for all environments

### Requirement 18: Frontend API Integration

**User Story:** As a frontend developer, I want to replace mock data with real API calls, so that the application uses live data.

#### Acceptance Criteria

1. THE Frontend_Client SHALL create an API client service for all backend endpoints
2. THE Frontend_Client SHALL store authentication tokens in secure HTTP-only cookies
3. THE Frontend_Client SHALL include authentication tokens in all API requests
4. WHEN an API request returns 401 unauthorized, THE Frontend_Client SHALL redirect to the login page
5. THE Frontend_Client SHALL display loading states during API requests
6. WHEN an API request fails, THE Frontend_Client SHALL display user-friendly error messages
7. THE Frontend_Client SHALL implement request retry logic with exponential backoff for failed requests
8. THE Frontend_Client SHALL cache course and topic data for 5 minutes to reduce API calls

### Requirement 19: CORS and Security Configuration

**User Story:** As a developer, I want proper CORS and security headers, so that the API is secure and accessible only to authorized origins.

#### Acceptance Criteria

1. THE Backend_API SHALL configure CORS to allow requests only from the frontend origin
2. THE Backend_API SHALL set CORS headers: Access-Control-Allow-Origin, Access-Control-Allow-Methods, Access-Control-Allow-Headers
3. THE Backend_API SHALL reject requests from unauthorized origins with 403 forbidden error
4. THE Backend_API SHALL set security headers: X-Content-Type-Options: nosniff, X-Frame-Options: DENY, X-XSS-Protection: 1; mode=block
5. THE Backend_API SHALL use HTTPS in production environment
6. THE Backend_API SHALL set Strict-Transport-Security header in production

### Requirement 20: API Documentation

**User Story:** As a developer, I want comprehensive API documentation, so that I can understand and use all endpoints correctly.

#### Acceptance Criteria

1. THE REVISIO_System SHALL provide API documentation for all endpoints
2. THE API documentation SHALL include for each endpoint: HTTP method, path, authentication requirements, request parameters, request body schema, response schema, example requests, example responses, possible error codes
3. THE API documentation SHALL be available in Markdown format
4. THE API documentation SHALL include authentication flow diagrams
5. THE API documentation SHALL include database schema diagrams
