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

export interface WeeklyActivityDay {
  date: string;
  label: string;
  attempted: number;
  correct: number;
}

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getLast7DayKeys(): string[] {
  const keys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    keys.push(toLocalDateKey(d));
  }
  return keys;
}

/**
 * Daily activity for the last 7 days (always 7 entries, zeros for quiet days)
 */
export async function getWeeklyActivity(userId: string): Promise<WeeklyActivityDay[]> {
  const dayKeys = getLast7DayKeys();
  const rangeStart = new Date();
  rangeStart.setDate(rangeStart.getDate() - 6);
  rangeStart.setHours(0, 0, 0, 0);

  const { data, error } = await supabaseAdmin
    .from('attempt_history')
    .select('attempted_at, is_correct')
    .eq('user_id', userId)
    .gte('attempted_at', rangeStart.toISOString());

  if (error) {
    logger.error('Error fetching weekly activity:', error);
    throw error;
  }

  const buckets = new Map(
    dayKeys.map((date) => [date, { attempted: 0, correct: 0 }])
  );

  for (const row of data ?? []) {
    const key = toLocalDateKey(new Date(row.attempted_at));
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.attempted++;
    if (row.is_correct) bucket.correct++;
  }

  return dayKeys.map((date) => {
    const bucket = buckets.get(date)!;
    const labelDate = new Date(`${date}T12:00:00`);
    return {
      date,
      label: labelDate.toLocaleDateString('en-US', { weekday: 'short' }),
      attempted: bucket.attempted,
      correct: bucket.correct,
    };
  });
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

export async function getWeakTopics(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('attempt_history')
      .select(`
        is_correct,
        question:questions (
          topic_id,
          topic:topics (
            name
          )
        )
      `)
      .eq('user_id', userId);

    if (error) {
      logger.error('Error fetching weak topics attempt history:', error);
      throw error;
    }
    if (!data || data.length === 0) return [];

    const topicStats: Record<string, { total: number; correct: number; name: string }> = {};

    for (const attempt of data) {
      const question = attempt.question as any;
      if (!question || !question.topic_id) continue;
      const topicId = question.topic_id;
      const topicName = question.topic?.name || 'Unknown Topic';

      if (!topicStats[topicId]) {
        topicStats[topicId] = { total: 0, correct: 0, name: topicName };
      }

      topicStats[topicId].total++;
      if (attempt.is_correct) {
        topicStats[topicId].correct++;
      }
    }

    return Object.entries(topicStats)
      .map(([topicId, stats]) => {
        const accuracy = Math.round((stats.correct / stats.total) * 100);
        return {
          user_id: userId,
          topic_id: topicId,
          topic_name: stats.name,
          accuracy_percentage: accuracy,
          last_attempted: new Date().toISOString(),
        };
      })
      .filter((t) => t.accuracy_percentage < 60)
      .sort((a, b) => a.accuracy_percentage - b.accuracy_percentage);
  } catch (error) {
    logger.error('Error in getWeakTopics service:', error);
    throw error;
  }
}

export async function getStrongTopics(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('attempt_history')
      .select(`
        is_correct,
        question:questions (
          topic_id,
          topic:topics (
            name
          )
        )
      `)
      .eq('user_id', userId);

    if (error) {
      logger.error('Error fetching strong topics attempt history:', error);
      throw error;
    }
    if (!data || data.length === 0) return [];

    const topicStats: Record<string, { total: number; correct: number; name: string }> = {};

    for (const attempt of data) {
      const question = attempt.question as any;
      if (!question || !question.topic_id) continue;
      const topicId = question.topic_id;
      const topicName = question.topic?.name || 'Unknown Topic';

      if (!topicStats[topicId]) {
        topicStats[topicId] = { total: 0, correct: 0, name: topicName };
      }

      topicStats[topicId].total++;
      if (attempt.is_correct) {
        topicStats[topicId].correct++;
      }
    }

    return Object.entries(topicStats)
      .map(([topicId, stats]) => {
        const accuracy = Math.round((stats.correct / stats.total) * 100);
        return {
          user_id: userId,
          topic_id: topicId,
          topic_name: stats.name,
          accuracy_percentage: accuracy,
          last_attempted: new Date().toISOString(),
        };
      })
      .filter((t) => t.accuracy_percentage >= 80)
      .sort((a, b) => b.accuracy_percentage - a.accuracy_percentage);
  } catch (error) {
    logger.error('Error in getStrongTopics service:', error);
    throw error;
  }
}


