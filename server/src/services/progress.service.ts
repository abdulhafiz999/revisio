import { supabaseAdmin } from '../config/database';
import { logger } from '../utils/logger';

/**
 * Simple Progress Tracker Service
 * Tracks attempts, correct/wrong answers, and daily study streak
 */

function todayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

function normalizeActivityDate(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.split('T')[0];
}

/** Days from earlierDate to laterDate (laterDate must be same or after earlierDate). */
function daysBetween(earlierDate: string, laterDate: string): number {
  const start = Date.parse(`${earlierDate}T00:00:00Z`);
  const end = Date.parse(`${laterDate}T00:00:00Z`);
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

/**
 * Streak rules (first answer of the day):
 * - No prior activity → day 1
 * - Last activity was yesterday → increment
 * - Last activity was today → unchanged
 * - Gap of 2+ days → reset to day 1
 */
export function calculateNextStreak(
  currentStreak: number,
  lastActivityDate: string | null | undefined
): { streak_days: number; last_activity_date: string } {
  const today = todayDateString();
  const lastActivity = normalizeActivityDate(lastActivityDate);

  if (!lastActivity) {
    return { streak_days: 1, last_activity_date: today };
  }

  if (lastActivity === today) {
    return {
      streak_days: Math.max(currentStreak, 1),
      last_activity_date: today,
    };
  }

  const gap = daysBetween(lastActivity, today);

  if (gap === 1) {
    return {
      streak_days: Math.max(currentStreak, 0) + 1,
      last_activity_date: today,
    };
  }

  return { streak_days: 1, last_activity_date: today };
}

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

    const today = todayDateString();

    if (!existing) {
      await supabaseAdmin
        .from('user_progress')
        .insert({
          user_id: userId,
          total_attempted: 1,
          correct_answers: isCorrect ? 1 : 0,
          wrong_answers: isCorrect ? 0 : 1,
          streak_days: 1,
          last_activity_date: today,
        });
    } else {
      const { streak_days, last_activity_date } = calculateNextStreak(
        existing.streak_days ?? 0,
        existing.last_activity_date
      );

      await supabaseAdmin
        .from('user_progress')
        .update({
          total_attempted: existing.total_attempted + 1,
          correct_answers: isCorrect ? existing.correct_answers + 1 : existing.correct_answers,
          wrong_answers: isCorrect ? existing.wrong_answers : existing.wrong_answers + 1,
          streak_days,
          last_activity_date,
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

