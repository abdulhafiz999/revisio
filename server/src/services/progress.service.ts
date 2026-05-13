import { supabaseAdmin } from '../config/database';
import { logger } from '../utils/logger';

/**
 * Simple Progress Tracker Service
 * Just tracks basic stats: attempts, correct/wrong answers
 */

/**
 * Update user progress after an answer submission
 */
export async function updateProgress(userId: string, isCorrect: boolean): Promise<void> {
  try {
    const { data: existing } = await supabaseAdmin
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!existing) {
      // Create new progress record
      await supabaseAdmin
        .from('user_progress')
        .insert({
          user_id: userId,
          total_attempted: 1,
          correct_answers: isCorrect ? 1 : 0,
          wrong_answers: isCorrect ? 0 : 1,
          streak_days: 1,
          last_activity_date: new Date().toISOString().split('T')[0],
        });
    } else {
      // Update existing progress
      await supabaseAdmin
        .from('user_progress')
        .update({
          total_attempted: existing.total_attempted + 1,
          correct_answers: isCorrect ? existing.correct_answers + 1 : existing.correct_answers,
          wrong_answers: isCorrect ? existing.wrong_answers : existing.wrong_answers + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    }

    logger.info(`Progress updated for user ${userId}`);
  } catch (error) {
    logger.error('Error updating progress:', error);
    throw error;
  }
}

/**
 * Get user progress stats
 */
export async function getUserProgress(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      // Return default progress for new users
      return {
        user_id: userId,
        total_attempted: 0,
        correct_answers: 0,
        wrong_answers: 0,
        streak_days: 0,
        last_activity_date: null,
        accuracy_percentage: 0,
      };
    }

    // Calculate accuracy percentage
    const accuracy = data.total_attempted > 0
      ? Math.round((data.correct_answers / data.total_attempted) * 100)
      : 0;

    return {
      ...data,
      accuracy_percentage: accuracy,
    };
  } catch (error) {
    logger.error('Error getting user progress:', error);
    throw error;
  }
}

/**
 * Get recent activity
 */
export async function getRecentActivity(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('attempt_history')
      .select('*')
      .eq('user_id', userId)
      .order('attempted_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return data || [];
  } catch (error) {
    logger.error('Error getting recent activity:', error);
    throw error;
  }
}

