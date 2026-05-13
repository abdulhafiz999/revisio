# Implementation Plan: Backend Integration

## Overview

This plan implements a production-ready full-stack system for REVISIO, migrating from mock data to a complete backend with Express.js/TypeScript, Supabase (database, auth), and AI integration (Gemini/OpenAI). The implementation follows a layered architecture with proper separation of concerns, comprehensive error handling, and security best practices.

**Note on PDF Handling:** PDFs are processed in-memory only. Text is extracted and stored in the database, but the PDF files themselves are NOT stored to minimize storage costs.

## Tasks

- [x] 1. Backend project setup and configuration
  - [x] 1.1 Initialize backend project structure
    - Create backend directory with TypeScript configuration
    - Set up package.json with dependencies: express, @supabase/supabase-js, @google/generative-ai, openai, pdf-parse, multer, express-rate-limit, helmet, cors, zod
    - Configure tsconfig.json for strict TypeScript compilation
    - Create folder structure: src/{config,middleware,routes,controllers,services,models,utils,db}
    - Note: Supabase Storage is NOT needed - PDFs are processed in-memory only
    - _Requirements: 17.1, 17.6_

  - [x] 1.2 Implement environment configuration
    - Create config/environment.ts to validate required environment variables
    - Implement validation for: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, GEMINI_API_KEY, OPENAI_API_KEY, PORT, NODE_ENV, FRONTEND_URL
    - Fail fast on missing required variables with descriptive error messages
    - _Requirements: 17.1, 17.2, 17.3_

  - [x] 1.3 Configure Supabase client
    - Create config/database.ts with Supabase client initialization
    - Set up separate clients for anon (user operations) and service role (admin operations)
    - _Requirements: 17.4_

  - [x] 1.4 Configure CORS and security middleware
    - Create config/cors.ts with origin whitelist from environment
    - Implement security headers using helmet middleware
    - Configure CORS to allow credentials and specific methods
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6_

- [-] 2. Database schema and migrations
  - [x] 2.1 Create database migration scripts
    - Create db/migrations/001_create_users_table.sql
    - Create db/migrations/002_create_courses_table.sql
    - Create db/migrations/003_create_topics_table.sql
    - Create db/migrations/004_create_questions_table.sql
    - Create db/migrations/005_create_user_progress_table.sql
    - Create db/migrations/006_create_attempt_history_table.sql
    - Create db/migrations/007_create_study_notes_table.sql
    - Create db/migrations/008_create_weak_topics_table.sql
    - Create db/migrations/009_create_strong_topics_table.sql
    - Create db/migrations/010_create_indexes.sql
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13, 2.14, 2.15, 16.1, 16.2, 16.7_

  - [x] 2.2 Create seed data scripts
    - Create db/seeds/001_seed_courses.sql with course data matching mock structure
    - Create db/seeds/002_seed_topics.sql with topic data matching mock structure
    - Create db/seeds/003_seed_questions.sql with at least 50 questions across courses
    - _Requirements: 16.3, 16.4, 16.5_

  - [x] 2.3 Create TypeScript type definitions
    - Create models/types.ts with all interfaces from design document
    - Define User, Course, Topic, Question, UserProgress, Attempt, StudyNote, WeakTopic, StrongTopic
    - Define request/response types: AttemptSubmission, AttemptResult, QuestionFilters, NoteInput, etc.
    - Define API response wrappers: ApiSuccessResponse, ApiErrorResponse, PaginatedResponse
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13, 2.14_

  - [x] 2.4 Create validation schemas
    - Create models/schemas.ts using Zod for request validation
    - Define schemas for: registration, login, attempt submission, note creation, question filters, AI requests
    - _Requirements: 14.2, 14.3_

- [ ] 3. Checkpoint - Verify database setup
  - Run migrations against Supabase instance
  - Run seed scripts to populate initial data
  - Verify all tables, indexes, and constraints are created
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Authentication middleware and utilities
  - [x] 4.1 Implement authentication middleware
    - Create middleware/auth.ts with verifyToken function
    - Extract Bearer token from Authorization header
    - Verify token using Supabase Auth getUser method
    - Attach user {id, email} to request object
    - Return 401 error for invalid/expired tokens
    - _Requirements: 1.7, 1.8_

  - [x] 4.2 Implement error handling middleware
    - Create middleware/errorHandler.ts with global error handler
    - Handle different error types: validation, authentication, not found, database, external service
    - Return standardized error responses with appropriate status codes
    - Log errors with stack traces in development mode
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 15.2_

  - [x] 4.3 Implement rate limiting middleware
    - Create middleware/rateLimiter.ts using express-rate-limit
    - Configure 100 requests per minute per user
    - Return 429 error when limit exceeded
    - _Requirements: 14.8, 14.9_

  - [x] 4.4 Implement input validation and sanitization
    - Create middleware/validation.ts for request validation using Zod schemas
    - Create utils/sanitizer.ts for SQL injection prevention
    - Sanitize all user inputs before database operations
    - _Requirements: 14.6, 14.7_

  - [x] 4.5 Implement logging utility
    - Create utils/logger.ts with different log levels
    - Configure detailed logging in development, error-only in production
    - _Requirements: 17.5_

- [x] 5. Authentication endpoints
  - [x] 5.1 Implement authentication service
    - Create services/auth.service.ts with Supabase Auth integration
    - Implement register method: create user, send verification email
    - Implement login method: authenticate user, create session
    - Implement logout method: invalidate session
    - Implement resetPassword method: send password reset email
    - Handle duplicate email errors, invalid credentials errors
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.9, 1.10_

  - [x] 5.2 Implement authentication controller
    - Create controllers/auth.controller.ts
    - Implement register, login, logout, resetPassword handlers
    - Validate request bodies using schemas
    - Return standardized responses
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.9, 1.10_

  - [x] 5.3 Create authentication routes
    - Create routes/auth.routes.ts
    - Define POST /api/auth/register, /api/auth/login, /api/auth/logout, /api/auth/reset-password
    - Apply validation middleware
    - _Requirements: 1.1, 1.4, 1.9, 1.10_

- [ ] 6. Course and topic management
  - [ ] 6.1 Implement courses service
    - Create services/courses.service.ts
    - Implement getAllCourses: query courses table, return all courses
    - Implement getCourseById: query by id, throw NotFoundError if missing
    - Implement getTopicsByCourse: query topics by course_id, order by name
    - Implement getTopicById: query topic with course join
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ] 6.2 Implement courses controller
    - Create controllers/courses.controller.ts
    - Implement handlers for getAllCourses, getCourseById, getTopicsByCourse, getTopicById
    - Return standardized success responses
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ] 6.3 Create course routes
    - Create routes/courses.routes.ts
    - Define GET /api/courses, /api/courses/:courseId, /api/courses/:courseId/topics, /api/topics/:topicId
    - _Requirements: 3.1, 3.3, 3.5, 3.7_

- [ ] 7. Question retrieval and filtering
  - [ ] 7.1 Implement questions service
    - Create services/questions.service.ts
    - Implement getQuestions with filters: courseId, topicId, difficulty, limit
    - Build dynamic query based on provided filters
    - Default to 20 random questions when no filters provided
    - Implement getQuestionById: query by id, throw NotFoundError if missing
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [ ] 7.2 Implement questions controller
    - Create controllers/questions.controller.ts
    - Implement handlers for getQuestions and getQuestionById
    - Validate query parameters using QuestionFilters schema
    - Return standardized success responses
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [ ] 7.3 Create question routes
    - Create routes/questions.routes.ts
    - Define GET /api/questions, /api/questions/:questionId
    - Apply validation middleware for query parameters
    - _Requirements: 4.1, 4.7_

- [x] 8. Answer submission and progress tracking
  - [x] 8.1 Implement progress tracker service
    - Create services/progress.service.ts
    - Implement updateProgress: increment total_attempted, correct_answers or wrong_answers
    - Implement updateStreak: check last_activity_date, calculate streak based on consecutive days
    - Implement recalculateTopicAccuracy: query attempt_history for topic, calculate accuracy percentage
    - Implement updateWeakTopics: insert/update weak_topics when accuracy < 60%
    - Implement updateStrongTopics: insert/update strong_topics when accuracy > 80%
    - _Requirements: 5.5, 5.6, 5.7, 5.9, 5.10, 5.11, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 8.2 Implement attempts service
    - Create services/attempts.service.ts
    - Implement submitAnswer: validate question exists, record attempt, determine correctness
    - Call progress tracker to update all progress metrics
    - Return AttemptResult with correctness, correct_answer, explanation
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11_

  - [x] 8.3 Implement attempts controller
    - Create controllers/attempts.controller.ts
    - Implement submitAnswer handler
    - Validate request body using AttemptSubmission schema
    - Return standardized success response with attempt result
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.8_

  - [x] 8.4 Create attempt routes
    - Create routes/attempts.routes.ts
    - Define POST /api/attempts
    - Apply authentication and validation middleware
    - _Requirements: 5.1_

- [x] 9. User progress and statistics
  - [x] 9.1 Implement progress retrieval service methods
    - Add to services/progress.service.ts
    - Implement getUserProgress: query user_progress, calculate accuracy_percentage
    - Implement getRecentActivity: query attempt_history, order by attempted_at descending, limit 10
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_

  - [x] 9.2 Implement progress controller
    - Create controllers/progress.controller.ts
    - Implement handlers for getUserProgress, getRecentActivity
    - Return standardized success responses
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_

  - [x] 9.3 Create progress routes
    - Create routes/progress.routes.ts
    - Define GET /api/users/progress, /api/users/recent-activity
    - Apply authentication middleware
    - _Requirements: 6.1, 6.4, 6.6, 6.8_

- [ ] 10. Checkpoint - Verify core functionality
  - Test authentication flow: register, login, logout
  - Test course and topic retrieval
  - Test question filtering
  - Test answer submission and progress tracking
  - Verify weak/strong topics calculation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Study notes management
  - [x] 11.1 Implement notes service
    - Create services/notes.service.ts
    - Implement createNote: insert study_note with user_id, title, content
    - Implement getNotes: query study_notes by user_id, order by updated_at descending
    - Implement getNoteById: query by id, verify ownership
    - Implement updateNote: update title and content, set updated_at to current timestamp
    - Implement deleteNote: delete by id, verify ownership
    - Throw ForbiddenError when user doesn't own note
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10_

  - [x] 11.2 Implement notes controller
    - Create controllers/notes.controller.ts
    - Implement handlers for createNote, getNotes, getNoteById, updateNote, deleteNote
    - Validate request bodies using NoteInput schema
    - Return standardized success responses
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10_

  - [x] 11.3 Create notes routes
    - Create routes/notes.routes.ts
    - Define POST /api/notes, GET /api/notes, GET /api/notes/:noteId, PUT /api/notes/:noteId, DELETE /api/notes/:noteId
    - Apply authentication and validation middleware
    - _Requirements: 8.1, 8.3, 8.5, 8.7, 8.9_

- [x] 12. PDF text extraction (no storage)
  - [x] 12.1 Implement PDF text extraction service
    - Create services/pdf.service.ts using pdf-parse library
    - Implement extractText: parse PDF buffer, extract text content
    - Preserve paragraph structure with newlines
    - Handle multi-page PDFs
    - Return empty string on extraction failure with error logging
    - Strip excessive whitespace while preserving structure
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 12.2 Implement PDF upload and extract endpoint
    - Add uploadPDF method to notes controller
    - Use multer middleware for multipart form data handling (memory storage only)
    - Validate file type (application/pdf) and size (max 10MB)
    - Extract text using PDF service
    - Create study note with extracted text content only (no file storage)
    - Discard PDF file after text extraction
    - Return 413 error for files exceeding 10MB
    - Return 400 error for non-PDF files
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 10.1, 10.2, 10.3_

  - [x] 12.3 Add PDF upload route
    - Add to routes/notes.routes.ts
    - Define POST /api/notes/upload with multer middleware (memoryStorage)
    - Apply authentication and validation middleware
    - _Requirements: 9.1_

- [x] 13. AI service integration (Gemini only)
  - [x] 13.1 Implement Gemini service
    - Create services/ai.service.ts using @google/generative-ai
    - Implement generateQuestions: create prompt from note content, call Gemini API, parse JSON response
    - Use gemini-1.5-flash model
    - Handle API errors
    - _Requirements: 11.4, 12.2, 13.5_

- [x] 14. AI-powered features endpoints
  - [x] 14.1 Implement question generation endpoint
    - Create controllers/ai.controller.ts
    - Implement generateQuestions handler
    - Validate note_id exists and has content
    - Validate count parameter (max 10)
    - Call AI service to generate questions
    - Return generated questions without storing
    - Return 400 error for empty content
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10_

  - [x] 14.2 Create AI routes
    - Create routes/ai.routes.ts
    - Define POST /api/ai/generate-questions
    - Apply authentication and validation middleware
    - _Requirements: 11.1, 12.1, 13.1_

- [x] 15. Express application setup and server
  - [x] 15.1 Configure Express application
    - Create app.ts
    - Initialize Express app with JSON body parser
    - Apply helmet middleware for security headers
    - Apply CORS middleware with configuration
    - Apply rate limiting middleware
    - Register all route modules
    - Apply error handling middleware (must be last)
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.8, 14.9, 15.1, 15.2, 15.4, 15.5, 19.1, 19.2, 19.3, 19.4, 19.5, 19.6_

  - [x] 15.2 Create server entry point
    - Create server.ts
    - Import app from app.ts
    - Load and validate environment configuration
    - Start server on configured PORT
    - Log server startup with environment and port
    - Handle uncaught exceptions and unhandled rejections
    - _Requirements: 17.1, 17.2, 17.3, 17.5_

  - [x] 15.3 Create environment example files
    - Create .env.example with all required variables and descriptions
    - Create .env.development with development defaults
    - Create .env.production template
    - _Requirements: 17.6_

- [ ] 16. Checkpoint - Verify backend integration
  - Test all API endpoints with Postman or similar tool
  - Verify authentication flow end-to-end
  - Test file upload and PDF text extraction
  - Test AI features with real API keys
  - Verify error handling and validation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Frontend API client implementation
  - [x] 17.1 Create API client service
    - Create frontend/src/services/api.client.ts
    - Implement base HTTP client with axios or fetch
    - Configure base URL from environment variable
    - Implement token storage in HTTP-only cookies or localStorage
    - Implement automatic token inclusion in request headers
    - Implement 401 error interceptor to redirect to login
    - Implement retry logic with exponential backoff
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.7_

  - [x] 17.2 Implement authentication API methods
    - Add to api.client.ts
    - Implement register, login, logout, resetPassword methods
    - Store session token on successful login
    - Clear token on logout
    - _Requirements: 18.1, 18.2, 18.3_

  - [x] 17.3 Implement course and question API methods
    - Add to api.client.ts
    - Implement getCourses, getCourse, getTopics, getTopic methods
    - Implement getQuestions, getQuestion methods with filter parameters
    - Implement client-side caching for courses and topics (5 minutes)
    - _Requirements: 18.1, 18.8_

  - [x] 17.4 Implement progress and attempt API methods
    - Add to api.client.ts
    - Implement submitAnswer method
    - Implement getProgress, getWeakTopics, getStrongTopics, getRecentActivity methods
    - _Requirements: 18.1_

  - [x] 17.5 Implement notes API methods
    - Add to api.client.ts
    - Implement getNotes, getNote, createNote, updateNote, deleteNote methods
    - Implement uploadPDF method with multipart form data
    - _Requirements: 18.1_

  - [x] 17.6 Implement AI API methods
    - Add to api.client.ts
    - Implement generateQuestions, explainConcept, getRecommendations methods
    - _Requirements: 18.1_

  - [x] 17.7 Implement loading and error states
    - Create frontend/src/hooks/useApi.ts custom hook
    - Manage loading state during API requests
    - Display user-friendly error messages on failures
    - Handle network errors gracefully
    - _Requirements: 18.5, 18.6_

- [x] 18. Replace mock data with API calls
  - [x] 18.1 Update authentication components
    - Replace mock auth in Login component with api.client.login
    - Replace mock auth in Register component with api.client.register
    - Update auth context to use real API
    - _Requirements: 18.1, 18.2, 18.3, 18.4_

  - [x] 18.2 Update course and question components
    - Replace mock data in CourseList with api.client.getCourses
    - Replace mock data in QuestionView with api.client.getQuestions
    - Update filtering logic to use API parameters
    - _Requirements: 18.1, 18.8_

  - [x] 18.3 Update progress tracking components
    - Replace mock data in ProgressDashboard with api.client.getProgress
    - Replace mock data in WeakTopics with api.client.getWeakTopics
    - Update answer submission to use api.client.submitAnswer
    - _Requirements: 18.1_

  - [x] 18.4 Update study notes components
    - Replace mock data in NotesList with api.client.getNotes
    - Replace mock data in NoteEditor with api.client.createNote/updateNote
    - Implement PDF upload using api.client.uploadPDF
    - _Requirements: 18.1_

  - [x] 18.5 Update AI features components
    - Replace mock AI in QuestionGenerator with api.client.generateQuestions
    - Replace mock AI in ConceptExplainer with api.client.explainConcept
    - Replace mock AI in Recommendations with api.client.getRecommendations
    - _Requirements: 18.1_

- [ ] 19. Testing and deployment preparation
  - [ ]* 19.1 Write unit tests for services
    - Test authentication service methods
    - Test progress tracker calculations
    - Test AI service fallback logic
    - Test PDF text extraction
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [ ]* 19.2 Write integration tests for API endpoints
    - Test authentication flow end-to-end
    - Test answer submission and progress updates
    - Test file upload and retrieval
    - Test AI endpoints with mocked services
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [ ] 19.3 Create API documentation
    - Create docs/API.md with all endpoint specifications
    - Document authentication flow with diagrams
    - Document request/response schemas for each endpoint
    - Include example requests and responses
    - Document error codes and meanings
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

  - [ ] 19.4 Create database schema documentation
    - Create docs/DATABASE.md with schema diagrams
    - Document all tables, columns, and relationships
    - Document indexes and constraints
    - _Requirements: 20.5_

  - [ ] 19.5 Create deployment guide
    - Create docs/DEPLOYMENT.md
    - Document environment setup for production
    - Document database migration process
    - Document Supabase configuration steps
    - Document AI API key setup
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_

- [ ] 20. Final checkpoint - Production readiness
  - Run all migrations on production database
  - Run all seed scripts
  - Verify all environment variables are set
  - Test all API endpoints in production environment
  - Verify CORS and security headers
  - Test frontend integration with production backend
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at major milestones
- The implementation follows a bottom-up approach: infrastructure → core features → AI features → frontend integration
- All database operations use parameterized queries to prevent SQL injection
- All user inputs are validated and sanitized before processing
- Error handling is consistent across all endpoints with standardized response formats
- AI service integration includes fallback logic and retry mechanisms for reliability
