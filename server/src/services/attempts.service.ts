import { supabaseAdmin } from '../config/database';
import { logger } from '../utils/logger';
import { AttemptResult } from '../models/types';
import { updateProgress } from './progress.service';

/**
 * Simple Attempts Service
 * Handles answer submission and basic progress tracking
 */

/**
 * Submit an answer for a question
 */
export async function submitAnswer(
  userId: string,
  questionId: string,
  studentAnswer: string,
  timeSpentSeconds: number
): Promise<AttemptResult> {
  try {
    // Get the question
    const { data: question, error: questionError } = await supabaseAdmin
      .from('questions')
      .select('correct_answer, explanation')
      .eq('id', questionId)
      .single();

    if (questionError || !question) {
      throw new Error('Question not found');
    }

    // Check if correct
    const isCorrect = studentAnswer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase();

    // Record the attempt
    await supabaseAdmin
      .from('attempt_history')
      .insert({
        user_id: userId,
        question_id: questionId,
        student_answer: studentAnswer,
        is_correct: isCorrect,
        time_spent_seconds: timeSpentSeconds,
        attempted_at: new Date().toISOString(),
      });

    // Update progress
    await updateProgress(userId, isCorrect);

    logger.info(`Answer submitted for user ${userId}, question ${questionId}`);

    return {
      is_correct: isCorrect,
      correct_answer: question.correct_answer,
      explanation: question.explanation,
    };
  } catch (error) {
    logger.error('Error submitting answer:', error);
    throw error;
  }
}
