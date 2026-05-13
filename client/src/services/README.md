# API Client Documentation

This directory contains the frontend API client for the REVISIO application. The API client provides a centralized interface for all backend API calls with built-in features like authentication, caching, retry logic, and error handling.

## Files

- **`api.client.ts`** - Main API client implementation with all endpoint methods
- **`api.client.test.ts`** - Unit tests for the API client

## Features

### 🔐 Authentication
- Automatic token storage in localStorage
- Automatic token inclusion in request headers (Bearer scheme)
- 401 error interceptor that redirects to login
- Token cleanup on logout

### 🔄 Retry Logic
- Automatic retry with exponential backoff for network errors and 5xx errors
- Maximum 3 retries with delays: 1s, 2s, 4s
- Configurable timeout (30 seconds default)

### 💾 Client-Side Caching
- 5-minute cache for courses and topics
- Reduces unnecessary API calls
- Automatic cache invalidation on logout

### ⚠️ Error Handling
- User-friendly error messages for all error types
- Network error detection
- HTTP status code mapping to readable messages
- Axios error parsing

## Usage

### Basic Import

```typescript
import { apiClient } from '@/services/api.client';
```

### With useApi Hook

```typescript
import { useApi } from '@/hooks/useApi';
import { apiClient } from '@/services/api.client';

function MyComponent() {
  const { data, loading, error, execute } = useApi(apiClient.getCourses);

  useEffect(() => {
    execute();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <div>{/* Render data */}</div>;
}
```

### With useApiQuery Hook (Auto-execute)

```typescript
import { useApiQuery } from '@/hooks/useApi';
import { apiClient } from '@/services/api.client';

function MyComponent() {
  const { data, loading, error, refetch } = useApiQuery(apiClient.getCourses);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {/* Render data */}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

## API Methods

### Authentication

#### `register(email: string, password: string): Promise<AuthResponse>`
Register a new user account.

```typescript
const response = await apiClient.register('user@example.com', 'password123');
// Token is automatically stored
```

#### `login(email: string, password: string): Promise<AuthResponse>`
Login with existing credentials.

```typescript
const response = await apiClient.login('user@example.com', 'password123');
// Token is automatically stored
```

#### `logout(): Promise<void>`
Logout and clear session.

```typescript
await apiClient.logout();
// Token and cache are automatically cleared
```

#### `resetPassword(email: string): Promise<{ message: string }>`
Request password reset email.

```typescript
const response = await apiClient.resetPassword('user@example.com');
console.log(response.message);
```

### Courses and Topics

#### `getCourses(): Promise<Course[]>`
Get all available courses (cached for 5 minutes).

```typescript
const courses = await apiClient.getCourses();
```

#### `getCourse(courseId: string): Promise<Course>`
Get a specific course by ID (cached for 5 minutes).

```typescript
const course = await apiClient.getCourse('course-id');
```

#### `getTopics(courseId: string): Promise<Topic[]>`
Get all topics for a course (cached for 5 minutes).

```typescript
const topics = await apiClient.getTopics('course-id');
```

#### `getTopic(topicId: string): Promise<Topic>`
Get a specific topic by ID (cached for 5 minutes).

```typescript
const topic = await apiClient.getTopic('topic-id');
```

### Questions

#### `getQuestions(filters?: QuestionFilters): Promise<Question[]>`
Get questions with optional filters.

```typescript
// Get random questions
const questions = await apiClient.getQuestions();

// Get filtered questions
const filteredQuestions = await apiClient.getQuestions({
  courseId: 'course-id',
  topicId: 'topic-id',
  difficulty: 'medium',
  limit: 10
});
```

#### `getQuestion(questionId: string): Promise<Question>`
Get a specific question by ID.

```typescript
const question = await apiClient.getQuestion('question-id');
```

### Progress and Attempts

#### `submitAnswer(attempt: AttemptSubmission): Promise<AttemptResult>`
Submit an answer to a question.

```typescript
const result = await apiClient.submitAnswer({
  question_id: 'question-id',
  student_answer: 'B',
  time_spent_seconds: 45
});

console.log(result.is_correct); // true/false
console.log(result.explanation); // Explanation text
```

#### `getProgress(): Promise<UserProgress>`
Get current user's progress statistics.

```typescript
const progress = await apiClient.getProgress();
console.log(progress.accuracy_percentage);
console.log(progress.streak_days);
```

#### `getWeakTopics(): Promise<WeakTopic[]>`
Get topics where user has < 60% accuracy.

```typescript
const weakTopics = await apiClient.getWeakTopics();
```

#### `getStrongTopics(): Promise<StrongTopic[]>`
Get topics where user has > 80% accuracy.

```typescript
const strongTopics = await apiClient.getStrongTopics();
```

#### `getRecentActivity(): Promise<Attempt[]>`
Get last 10 attempts.

```typescript
const recentAttempts = await apiClient.getRecentActivity();
```

### Study Notes

#### `getNotes(): Promise<StudyNote[]>`
Get all notes for current user.

```typescript
const notes = await apiClient.getNotes();
```

#### `getNote(noteId: string): Promise<StudyNote>`
Get a specific note by ID.

```typescript
const note = await apiClient.getNote('note-id');
```

#### `createNote(note: NoteInput): Promise<StudyNote>`
Create a new note.

```typescript
const newNote = await apiClient.createNote({
  title: 'My Study Note',
  content: 'Note content here...'
});
```

#### `updateNote(noteId: string, note: NoteInput): Promise<StudyNote>`
Update an existing note.

```typescript
const updatedNote = await apiClient.updateNote('note-id', {
  title: 'Updated Title',
  content: 'Updated content...'
});
```

#### `deleteNote(noteId: string): Promise<void>`
Delete a note.

```typescript
await apiClient.deleteNote('note-id');
```

#### `uploadPDF(file: File): Promise<StudyNote>`
Upload a PDF file and create a note with extracted text.

```typescript
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];
const note = await apiClient.uploadPDF(file);
```

### AI Features

#### `generateQuestions(noteId: string, count: number, difficulty: string): Promise<GeneratedQuestion[]>`
Generate questions from a study note using AI.

```typescript
const questions = await apiClient.generateQuestions('note-id', 5, 'medium');
```

#### `explainConcept(concept: string): Promise<Explanation>`
Get AI explanation of a concept.

```typescript
const explanation = await apiClient.explainConcept('Photosynthesis');
console.log(explanation.definition);
console.log(explanation.examples);
```

#### `getRecommendations(): Promise<Recommendation[]>`
Get personalized study recommendations based on weak topics.

```typescript
const recommendations = await apiClient.getRecommendations();
```

## Error Handling

The API client provides user-friendly error messages for all error types:

| Error Type | Message |
|------------|---------|
| Network Error | "Network error. Please check your internet connection and try again." |
| Timeout | "Request timeout. The server took too long to respond." |
| 400 Bad Request | "Invalid request. Please check your input and try again." |
| 401 Unauthorized | "Authentication required. Please log in." (auto-redirects to login) |
| 403 Forbidden | "Access denied. You do not have permission to perform this action." |
| 404 Not Found | "Resource not found." |
| 409 Conflict | "Conflict. This resource already exists." |
| 413 Payload Too Large | "File too large. Please upload a smaller file." |
| 429 Too Many Requests | "Too many requests. Please wait a moment and try again." |
| 500 Server Error | "Server error. Please try again later." |
| 503 Service Unavailable | "Service temporarily unavailable. Please try again later." |

## Environment Configuration

The API client reads the backend URL from environment variables:

```env
VITE_API_BASE_URL=http://localhost:3000
```

For production, update this to your production backend URL.

## TypeScript Types

All types are exported from `api.client.ts`:

```typescript
import type {
  User,
  Course,
  Topic,
  Question,
  QuestionFilters,
  AttemptSubmission,
  AttemptResult,
  UserProgress,
  WeakTopic,
  StrongTopic,
  Attempt,
  StudyNote,
  NoteInput,
  GeneratedQuestion,
  Explanation,
  Recommendation,
  AuthResponse,
  Session,
} from '@/services/api.client';
```

## Testing

Run tests with:

```bash
npm test -- api.client.test.ts
```

All API methods have corresponding unit tests that verify:
- Correct request structure
- Response parsing
- Error handling
- Token management
- Cache behavior

## Best Practices

1. **Always use the useApi hook** for component-level API calls
2. **Handle loading and error states** in your UI
3. **Don't store sensitive data** in component state
4. **Use TypeScript types** for type safety
5. **Leverage caching** for frequently accessed data (courses, topics)
6. **Test error scenarios** in your components

## Security Notes

- Tokens are stored in localStorage (not HTTP-only cookies due to frontend-only setup)
- All requests include CSRF protection via Bearer token
- 401 errors automatically redirect to login
- Tokens are cleared on logout
- Cache is cleared on logout to prevent data leakage

## Future Improvements

- [ ] Implement refresh token logic
- [ ] Add request cancellation for unmounted components
- [ ] Implement optimistic updates for better UX
- [ ] Add request deduplication
- [ ] Implement offline support with service workers
