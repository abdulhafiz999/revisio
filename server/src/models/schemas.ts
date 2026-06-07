import { z } from 'zod';

// ============================================================================
// Authentication Schemas
// ============================================================================

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const updatePasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters'),
});


// ============================================================================
// Question Schemas
// ============================================================================

export const questionFiltersSchema = z.object({
  courseId: z.string().uuid('Invalid course ID').optional(),
  topicId: z.string().uuid('Invalid topic ID').optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  limit: z.string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().int().positive().max(100))
    .optional()
    .default('20'),
});

export const questionIdSchema = z.object({
  questionId: z.string().uuid('Invalid question ID'),
});

// ============================================================================
// Attempt Schemas
// ============================================================================

export const attemptSubmissionSchema = z.object({
  question_id: z.string().uuid('Invalid question ID'),
  student_answer: z.string().min(1, 'Answer is required').max(2000, 'Answer too long'),
  time_spent_seconds: z.number()
    .int('Time must be an integer')
    .nonnegative('Time cannot be negative')
    .max(3600, 'Time cannot exceed 1 hour'),
});

// ============================================================================
// Note Schemas
// ============================================================================

export const noteInputSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(255, 'Title must not exceed 255 characters'),
  content: z.string()
    .max(100000, 'Content must not exceed 100,000 characters')
    .optional()
    .default(''),
});

export const noteIdSchema = z.object({
  noteId: z.string().uuid('Invalid note ID'),
});

export const updateNoteSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(255, 'Title must not exceed 255 characters')
    .optional(),
  content: z.string()
    .max(100000, 'Content must not exceed 100,000 characters')
    .optional(),
}).refine(data => data.title !== undefined || data.content !== undefined, {
  message: 'At least one field (title or content) must be provided',
});

// ============================================================================
// AI Request Schemas
// ============================================================================

export const generateQuestionsSchema = z.object({
  note_id: z.string().uuid('Invalid note ID'),
  count: z.number()
    .int('Count must be an integer')
    .positive('Count must be positive')
    .max(25, 'Cannot generate more than 25 questions at once'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

export const aiNoteIdSchema = z.object({
  note_id: z.string().uuid('Invalid note ID'),
});

export const explainConceptSchema = z.object({
  note_id: z.string().uuid('Invalid note ID'),
  concept: z.string()
    .min(1, 'Concept is required')
    .max(200, 'Concept must not exceed 200 characters'),
});

export const chatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().min(1).max(4000),
    })
  ).min(1, 'At least one message is required').max(50, 'Too many messages'),
});

// ============================================================================
// Course and Topic Schemas
// ============================================================================

export const courseIdSchema = z.object({
  courseId: z.string().uuid('Invalid course ID'),
});

export const topicIdSchema = z.object({
  topicId: z.string().uuid('Invalid topic ID'),
});

// ============================================================================
// Pagination Schema
// ============================================================================

export const paginationSchema = z.object({
  page: z.string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().int().positive())
    .optional()
    .default('1'),
  limit: z.string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().int().positive().max(100))
    .optional()
    .default('20'),
});

// ============================================================================
// Type exports for use in controllers
// ============================================================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type QuestionFilters = z.infer<typeof questionFiltersSchema>;
export type AttemptSubmissionInput = z.infer<typeof attemptSubmissionSchema>;
export type NoteInput = z.infer<typeof noteInputSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type GenerateQuestionsInput = z.infer<typeof generateQuestionsSchema>;
export type ExplainConceptInput = z.infer<typeof explainConceptSchema>;
export type ChatInput = z.infer<typeof chatSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
