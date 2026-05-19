import { supabaseAdmin } from '../config/database';
import { logger } from '../utils/logger';
import { GeneratedQuestion, Question } from '../models/types';
import { AI_PRACTICE_COURSE_ID, AI_PRACTICE_TOPIC_ID } from '../constants/ai-practice';

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
