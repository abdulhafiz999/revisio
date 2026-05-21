import { supabaseAdmin } from '../config/database';
import { logger } from '../utils/logger';
import { GeneratedQuestion, Question } from '../models/types';
import { QuestionFilters } from '../models/schemas';
import { AI_PRACTICE_COURSE_ID, AI_PRACTICE_TOPIC_ID } from '../constants/ai-practice';

function normalizeQuestion(row: Record<string, unknown>): Question {
  const options = row.options;
  return {
    ...(row as unknown as Question),
    options: Array.isArray(options) ? options : JSON.parse(String(options)),
    common_mistakes: (row.common_mistakes as string[] | null) ?? [],
    hints: (row.hints as string[] | null) ?? [],
  };
}

export async function getQuestions(filters: QuestionFilters): Promise<Question[]> {
  let query = supabaseAdmin
    .from('questions')
    .select('*')
    .neq('course_id', AI_PRACTICE_COURSE_ID)
    .order('created_at', { ascending: false })
    .limit(filters.limit ?? 20);

  if (filters.courseId) {
    query = query.eq('course_id', filters.courseId);
  }
  if (filters.topicId) {
    query = query.eq('topic_id', filters.topicId);
  }
  if (filters.difficulty) {
    query = query.eq('difficulty', filters.difficulty);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching questions:', error);
    throw new Error(`Failed to fetch questions: ${error.message}`);
  }

  return (data ?? []).map((row) => normalizeQuestion(row));
}

export async function getQuestionById(questionId: string): Promise<Question | null> {
  const { data, error } = await supabaseAdmin
    .from('questions')
    .select('*')
    .eq('id', questionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    logger.error('Error fetching question:', error);
    throw new Error(`Failed to fetch question: ${error.message}`);
  }

  return normalizeQuestion(data);
}

function normalizeCorrectAnswer(question: GeneratedQuestion): string {
  const answer = question.correct_answer.trim();
  const letterMatch = answer.match(/^[A-D]$/i);
  if (letterMatch) {
    const index = answer.toUpperCase().charCodeAt(0) - 65;
    if (question.options[index]) {
      return question.options[index];
    }
  }
  const matched = question.options.find(
    (option) => option.trim().toLowerCase() === answer.toLowerCase()
  );
  return matched ?? answer;
}

async function ensureAiPracticeCourseExists(): Promise<void> {
  const { error: courseError } = await supabaseAdmin.from('courses').upsert(
    {
      id: AI_PRACTICE_COURSE_ID,
      name: 'Study Notes Practice',
      code: 'NOTES',
      icon: '📝',
      color: 'primary',
    },
    { onConflict: 'code' }
  );
  if (courseError) {
    throw new Error(`Failed to ensure AI practice course: ${courseError.message}`);
  }

  const { error: topicError } = await supabaseAdmin.from('topics').upsert(
    {
      id: AI_PRACTICE_TOPIC_ID,
      name: 'AI Generated',
      course_id: AI_PRACTICE_COURSE_ID,
    },
    { onConflict: 'id' }
  );
  if (topicError) {
    throw new Error(`Failed to ensure AI practice topic: ${topicError.message}`);
  }
}

/**
 * Persist AI-generated questions so attempts and progress can be tracked
 */
export async function saveGeneratedQuestions(
  difficulty: 'easy' | 'medium' | 'hard',
  generated: GeneratedQuestion[]
): Promise<Question[]> {
  await ensureAiPracticeCourseExists();

  const rows = generated.map((q) => ({
    course_id: AI_PRACTICE_COURSE_ID,
    topic_id: AI_PRACTICE_TOPIC_ID,
    difficulty,
    type: 'multiple-choice' as const,
    question_text: q.question_text,
    options: q.options,
    correct_answer: normalizeCorrectAnswer(q),
    explanation: q.explanation,
    common_mistakes: [],
    hints: [],
    year: new Date().getFullYear(),
  }));

  const { data, error } = await supabaseAdmin
    .from('questions')
    .insert(rows)
    .select('*');

  if (error) {
    logger.error('Error saving generated questions:', error);
    throw new Error(`Failed to save questions: ${error.message}`);
  }

  logger.info(`Saved ${data.length} generated questions`);
  return data as Question[];
}
