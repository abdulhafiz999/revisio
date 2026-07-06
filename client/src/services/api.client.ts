import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

interface ApiErrorResponse {
  success: false;
  error: string;
  timestamp: string;
}

interface AuthResponse {
  user: User;
  session: Session | null;
  emailConfirmationRequired?: boolean;
}

interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface Course {
  id: string;
  name: string;
  code: string;
  icon: string;
  color: string;
  created_at: string;
  total_questions?: number;
  attempted_questions?: number;
  correct_questions?: number;
  accuracy_percentage?: number;
}

interface Topic {
  id: string;
  name: string;
  course_id: string;
  created_at: string;
}

interface Question {
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

interface QuestionFilters {
  courseId?: string;
  topicId?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  limit?: number;
}

interface AttemptSubmission {
  question_id: string;
  student_answer: string;
  time_spent_seconds: number;
}

interface AttemptResult {
  is_correct: boolean;
  correct_answer: string;
  explanation: string;
}

export interface WeeklyActivityDay {
  date: string;
  label: string;
  attempted: number;
  correct: number;
}

interface UserProgress {
  user_id: string;
  total_attempted: number;
  correct_answers: number;
  wrong_answers: number;
  streak_days: number;
  last_activity_date: string;
  created_at: string;
  updated_at: string;
  accuracy_percentage: number;
}

interface WeakTopic {
  user_id: string;
  topic_id: string;
  topic_name: string;
  accuracy_percentage: number;
  last_attempted: string;
}

interface StrongTopic {
  user_id: string;
  topic_id: string;
  topic_name: string;
  accuracy_percentage: number;
  last_attempted: string;
}

export interface TopicStat {
  user_id: string;
  topic_id: string;
  topic_name: string;
  accuracy_percentage: number;
  total_attempted: number;
  correct_answers: number;
  last_attempted: string;
}

export interface AIQuizHistory {
  note_id: string;
  note_title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  total_questions: number;
  attempted_questions: number;
  correct_answers: number;
  score_percentage: number;
  created_at: string;
}

interface Attempt {
  id: string;
  user_id: string;
  question_id: string;
  attempted_at: string;
  student_answer: string;
  is_correct: boolean;
  time_spent_seconds: number;
}

interface StudyNote {
  id: string;
  user_id: string;
  title: string;
  content: string;
  file_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SharedResource {
  id: string;
  course_id: string;
  topic_id: string | null;
  user_id: string;
  title: string;
  url: string;
  resource_type: string;
  created_at: string;
}

interface NoteInput {
  title: string;
  content: string;
}

interface GeneratedQuestion {
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

interface Explanation {
  definition: string;
  examples: string[];
  key_points: string[];
  related_concepts: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  program: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileInput {
  display_name?: string | null;
  program?: string | null;
}

interface Recommendation {
  topic_name: string;
  suggested_focus_areas: string[];
  study_tips: string[];
  estimated_time: string;
}

// ============================================================================
// Token Storage
// ============================================================================

const TOKEN_KEY = 'revisio_auth_token';

const tokenStorage = {
  get: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },
  set: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  remove: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },
};

// ============================================================================
// Cache Implementation
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > this.TTL;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }
}

const cache = new SimpleCache();

// ============================================================================
// Axios Instance Configuration
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.get();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and retry logic
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _retryCount?: number };

    // Handle 401 Unauthorized - clear token but don't force redirect
    // The ProtectedRoute component handles redirecting to login
    if (error.response?.status === 401) {
      tokenStorage.remove();
      cache.clear();

      // Check if we are currently logging out to avoid redirect loop/interruption
      const isLoggingOut = sessionStorage.getItem('revisio_logging_out') === 'true';
      if (isLoggingOut) {
        return Promise.reject(error);
      }

      // Only redirect if not already on an auth page
      const authPages = ['/login', '/register', '/forgot-password'];
      if (!authPages.some(page => window.location.pathname.startsWith(page))) {
        window.location.href = '/';
      }
      return Promise.reject(error);
    }

    // Retry logic with exponential backoff for network errors or 5xx errors
    const shouldRetry =
      !originalRequest._retry &&
      (error.code === 'ECONNABORTED' ||
        error.code === 'ERR_NETWORK' ||
        (error.response && error.response.status >= 500));

    if (shouldRetry && originalRequest) {
      originalRequest._retry = true;
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

      // Max 3 retries
      if (originalRequest._retryCount <= 3) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, originalRequest._retryCount - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return axiosInstance(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// API Client Class
// ============================================================================

class ApiClient {
  // ==========================================================================
  // Authentication Methods
  // ==========================================================================

  async register(email: string, password: string): Promise<AuthResponse> {
    const response = await axiosInstance.post<ApiSuccessResponse<AuthResponse>>(
      '/api/auth/register',
      { email, password }
    );
    
    // Store token on successful registration
    if (response.data.data.session?.access_token) {
      tokenStorage.set(response.data.data.session.access_token);
    }
    
    return response.data.data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await axiosInstance.post<ApiSuccessResponse<AuthResponse>>(
      '/api/auth/login',
      { email, password }
    );
    
    // Store token on successful login
    if (response.data.data.session?.access_token) {
      tokenStorage.set(response.data.data.session.access_token);
    }
    
    return response.data.data;
  }

  async logout(): Promise<void> {
    try {
      await axiosInstance.post<ApiSuccessResponse<null>>('/api/auth/logout');
    } finally {
      // Always clear token and cache, even if request fails
      tokenStorage.remove();
      cache.clear();
    }
  }

  async resetPassword(email: string): Promise<{ message: string }> {
    const response = await axiosInstance.post<ApiSuccessResponse<{ message: string }>>(
      '/api/auth/reset-password',
      { email }
    );
    return response.data.data;
  }

  async updatePassword(password: string): Promise<{ message: string }> {
    const response = await axiosInstance.post<ApiSuccessResponse<{ message: string }>>(
      '/api/auth/update-password',
      { password }
    );
    return response.data.data;
  }

  // ==========================================================================
  // Course and Topic Methods
  // ==========================================================================

  async getCourses(): Promise<Course[]> {
    const cacheKey = 'courses';
    const cached = cache.get<Course[]>(cacheKey);
    if (cached) return cached;

    const response = await axiosInstance.get<ApiSuccessResponse<Course[]>>('/api/courses');
    cache.set(cacheKey, response.data.data);
    return response.data.data;
  }

  async getCourse(courseId: string): Promise<Course> {
    const cacheKey = `course_${courseId}`;
    const cached = cache.get<Course>(cacheKey);
    if (cached) return cached;

    const response = await axiosInstance.get<ApiSuccessResponse<Course>>(`/api/courses/${courseId}`);
    cache.set(cacheKey, response.data.data);
    return response.data.data;
  }

  async getTopics(courseId: string): Promise<Topic[]> {
    const cacheKey = `topics_${courseId}`;
    const cached = cache.get<Topic[]>(cacheKey);
    if (cached) return cached;

    const response = await axiosInstance.get<ApiSuccessResponse<Topic[]>>(
      `/api/courses/${courseId}/topics`
    );
    cache.set(cacheKey, response.data.data);
    return response.data.data;
  }

  async getTopic(topicId: string): Promise<Topic> {
    const cacheKey = `topic_${topicId}`;
    const cached = cache.get<Topic>(cacheKey);
    if (cached) return cached;

    const response = await axiosInstance.get<ApiSuccessResponse<Topic>>(`/api/topics/${topicId}`);
    cache.set(cacheKey, response.data.data);
    return response.data.data;
  }

  // ==========================================================================
  // Question Methods
  // ==========================================================================

  async getQuestions(filters?: QuestionFilters): Promise<Question[]> {
    const response = await axiosInstance.get<ApiSuccessResponse<Question[]>>('/api/questions', {
      params: filters,
    });
    return response.data.data;
  }

  async getQuestion(questionId: string): Promise<Question> {
    const response = await axiosInstance.get<ApiSuccessResponse<Question>>(
      `/api/questions/${questionId}`
    );
    return response.data.data;
  }

  // ==========================================================================
  // Attempt and Progress Methods
  // ==========================================================================

  async submitAnswer(attempt: AttemptSubmission): Promise<AttemptResult> {
    const response = await axiosInstance.post<ApiSuccessResponse<AttemptResult>>(
      '/api/attempts',
      attempt
    );
    return response.data.data;
  }

  async getProgress(): Promise<UserProgress> {
    const response = await axiosInstance.get<ApiSuccessResponse<UserProgress>>('/api/users/progress');
    return response.data.data;
  }

  async getWeakTopics(): Promise<WeakTopic[]> {
    const response = await axiosInstance.get<ApiSuccessResponse<WeakTopic[]>>('/api/users/weak-topics');
    return response.data.data;
  }

  async getStrongTopics(): Promise<StrongTopic[]> {
    const response = await axiosInstance.get<ApiSuccessResponse<StrongTopic[]>>('/api/users/strong-topics');
    return response.data.data;
  }

  async getAllTopicStats(): Promise<TopicStat[]> {
    const response = await axiosInstance.get<ApiSuccessResponse<TopicStat[]>>('/api/users/all-topics');
    return response.data.data;
  }

  async getRecentActivity(): Promise<Attempt[]> {
    const response = await axiosInstance.get<ApiSuccessResponse<Attempt[]>>('/api/users/recent-activity');
    return response.data.data;
  }

  async getWeeklyActivity(): Promise<WeeklyActivityDay[]> {
    const response = await axiosInstance.get<ApiSuccessResponse<WeeklyActivityDay[]>>(
      '/api/users/weekly-activity'
    );
    return response.data.data;
  }

  async getAIQuizzes(): Promise<AIQuizHistory[]> {
    const response = await axiosInstance.get<ApiSuccessResponse<AIQuizHistory[]>>('/api/users/ai-quizzes');
    return response.data.data;
  }

  async resetQuizAttempts(noteId: string): Promise<void> {
    await axiosInstance.post('/api/users/ai-quizzes/reset', { note_id: noteId });
  }

  async deleteQuiz(noteId: string): Promise<void> {
    await axiosInstance.delete(`/api/users/ai-quizzes/${noteId}`);
  }

  // ==========================================================================
  // Study Notes Methods
  // ==========================================================================

  async getNotes(): Promise<StudyNote[]> {
    const response = await axiosInstance.get<ApiSuccessResponse<StudyNote[]>>('/api/notes');
    return response.data.data;
  }

  async getNote(noteId: string): Promise<StudyNote> {
    const response = await axiosInstance.get<ApiSuccessResponse<StudyNote>>(`/api/notes/${noteId}`);
    return response.data.data;
  }

  async createNote(note: NoteInput): Promise<StudyNote> {
    const response = await axiosInstance.post<ApiSuccessResponse<StudyNote>>('/api/notes', note);
    return response.data.data;
  }

  async updateNote(noteId: string, note: NoteInput): Promise<StudyNote> {
    const response = await axiosInstance.put<ApiSuccessResponse<StudyNote>>(
      `/api/notes/${noteId}`,
      note
    );
    return response.data.data;
  }

  async deleteNote(noteId: string): Promise<void> {
    await axiosInstance.delete<ApiSuccessResponse<null>>(`/api/notes/${noteId}`);
  }

  async getSharedNote(noteId: string): Promise<StudyNote> {
    const response = await axiosInstance.get<ApiSuccessResponse<StudyNote>>(
      `/api/notes/shared/${noteId}`
    );
    return response.data.data;
  }

  // ==========================================================================
  // Shared Link / Resources Methods
  // ==========================================================================

  async getSharedResources(courseId: string): Promise<SharedResource[]> {
    const response = await axiosInstance.get<ApiSuccessResponse<SharedResource[]>>(
      `/api/resources/course/${courseId}`
    );
    return response.data.data;
  }

  async addSharedResource(
    courseId: string,
    title: string,
    url: string,
    topicId?: string
  ): Promise<SharedResource> {
    const response = await axiosInstance.post<ApiSuccessResponse<SharedResource>>(
      '/api/resources',
      { course_id: courseId, title, url, topic_id: topicId }
    );
    return response.data.data;
  }

  async deleteSharedResource(resourceId: string): Promise<void> {
    await axiosInstance.delete<ApiSuccessResponse<null>>(`/api/resources/${resourceId}`);
  }

  async uploadPDF(file: File): Promise<StudyNote> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosInstance.post<ApiSuccessResponse<StudyNote>>(
      '/api/notes/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  }

  // ==========================================================================
  // AI Methods
  // ==========================================================================

  async generateQuestions(
    noteId: string,
    count: number,
    difficulty: string
  ): Promise<Question[]> {
    const response = await axiosInstance.post<ApiSuccessResponse<Question[]>>(
      '/api/ai/generate-questions',
      { note_id: noteId, count, difficulty }
    );
    return response.data.data;
  }

  async summarizeNote(noteId: string): Promise<string> {
    const response = await axiosInstance.post<ApiSuccessResponse<{ summary: string }>>(
      '/api/ai/summarize',
      { note_id: noteId }
    );
    return response.data.data.summary;
  }

  async explainConcept(noteId: string, concept: string): Promise<string> {
    const response = await axiosInstance.post<ApiSuccessResponse<{ explanation: string }>>(
      '/api/ai/explain',
      { note_id: noteId, concept }
    );
    return response.data.data.explanation;
  }

  async generateStudyGuide(noteId: string): Promise<string> {
    const response = await axiosInstance.post<ApiSuccessResponse<{ guide: string }>>(
      '/api/ai/study-guide',
      { note_id: noteId }
    );
    return response.data.data.guide;
  }

  async explainConceptOld(concept: string): Promise<Explanation> {
    const response = await axiosInstance.post<ApiSuccessResponse<Explanation>>(
      '/api/ai/explain',
      { concept_text: concept }
    );
    return response.data.data;
  }

  async getRecommendations(): Promise<Recommendation[]> {
    const response = await axiosInstance.get<ApiSuccessResponse<Recommendation[]>>(
      '/api/ai/recommendations'
    );
    return response.data.data;
  }

  async sendChatMessage(messages: ChatMessage[]): Promise<string> {
    const response = await axiosInstance.post<ApiSuccessResponse<{ reply: string }>>(
      '/api/ai/chat',
      { messages }
    );
    return response.data.data.reply;
  }

  async getProfile(): Promise<UserProfile> {
    const response = await axiosInstance.get<ApiSuccessResponse<UserProfile>>(
      '/api/users/profile'
    );
    return response.data.data;
  }

  async updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
    const response = await axiosInstance.patch<ApiSuccessResponse<UserProfile>>(
      '/api/users/profile',
      input
    );
    return response.data.data;
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const apiClient = new ApiClient();

// Export types for use in other files
export type {
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
  TopicStat,
  Attempt,
  WeeklyActivityDay,
  StudyNote,
  SharedResource,
  UserProfile,
  UpdateProfileInput,
  NoteInput,
  GeneratedQuestion,
  Explanation,
  Recommendation,
  AuthResponse,
  Session,
  AIQuizHistory,
};
