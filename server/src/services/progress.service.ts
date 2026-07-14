import { supabaseAdmin } from '../config/database';
import { logger } from '../utils/logger';
import { AI_PRACTICE_COURSE_ID } from '../constants/ai-practice';

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
 * Recompute all progress counters and streak from scratch by reading attempt_history.
 * Call this after any attempt deletion (quiz reset or quiz delete) so user_progress
 * never holds stale data.
 */
export async function recalculateUserProgress(userId: string): Promise<void> {
  try {
    const { data: attempts, error } = await supabaseAdmin
      .from('attempt_history')
      .select('is_correct, attempted_at')
      .eq('user_id', userId);

    if (error) throw error;

    const rows = attempts ?? [];

    // Recount totals
    const total_attempted = rows.length;
    const correct_answers = rows.filter((r) => r.is_correct).length;
    const wrong_answers = total_attempted - correct_answers;

    // Collect distinct activity dates (YYYY-MM-DD), sorted newest-first
    const distinctDates = Array.from(
      new Set(rows.map((r) => normalizeActivityDate(r.attempted_at)!).filter(Boolean))
    ).sort().reverse();

    let streak_days = 0;
    let last_activity_date: string | null = null;

    if (distinctDates.length > 0) {
      last_activity_date = distinctDates[0];
      const today = todayDateString();

      // Build yesterday's date string
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = yesterdayDate.toISOString().split('T')[0];

      // Only start counting streak if the most recent activity is today or yesterday
      if (last_activity_date === today || last_activity_date === yesterday) {
        streak_days = 1;
        for (let i = 1; i < distinctDates.length; i++) {
          if (daysBetween(distinctDates[i], distinctDates[i - 1]) === 1) {
            streak_days++;
          } else {
            break; // gap found, streak ends here
          }
        }
      }
    }

    await supabaseAdmin
      .from('user_progress')
      .upsert(
        {
          user_id: userId,
          total_attempted,
          correct_answers,
          wrong_answers,
          streak_days,
          last_activity_date,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    logger.info(`Recalculated progress for user ${userId}: streak=${streak_days}, total=${total_attempted}`);
  } catch (error) {
    logger.error('Error recalculating user progress:', error);
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

async function fetchUserTopicStats(userId: string): Promise<any[]> {
  try {
    const { data: attempts, error: attemptsErr } = await supabaseAdmin
      .from('attempt_history')
      .select('question_id, is_correct')
      .eq('user_id', userId);

    if (attemptsErr || !attempts || attempts.length === 0) return [];

    const questionIds = Array.from(new Set(attempts.map((a) => a.question_id).filter(Boolean)));
    if (questionIds.length === 0) return [];

    const { data: questions, error: qErr } = await supabaseAdmin
      .from('questions')
      .select('id, topic_id, course_id')
      .in('id', questionIds);

    if (qErr || !questions) return [];

    const questionMap = new Map(questions.map((q) => [q.id, q]));
    const topicIds = Array.from(new Set(questions.map((q) => q.topic_id).filter(Boolean)));

    const topicMap = new Map<string, string>();
    if (topicIds.length > 0) {
      const { data: topics } = await supabaseAdmin
        .from('topics')
        .select('id, name')
        .in('id', topicIds);

      if (topics) {
        topics.forEach((t) => topicMap.set(t.id, t.name));
      }
    }

    const topicStats: Record<string, { total: number; correct: number; name: string }> = {};

    for (const attempt of attempts) {
      const q = questionMap.get(attempt.question_id);
      if (!q) continue;
      const topicId = q.topic_id || 'general';
      let topicName = topicMap.get(topicId);
      if (!topicName) {
        if (topicId === 'ai-practice-topic' || topicId.includes('ai')) {
          topicName = 'Study Notes AI';
        } else {
          topicName = 'General Knowledge';
        }
      }

      if (!topicStats[topicId]) {
        topicStats[topicId] = { total: 0, correct: 0, name: topicName };
      }
      topicStats[topicId].total++;
      if (attempt.is_correct) {
        topicStats[topicId].correct++;
      }
    }

    return Object.entries(topicStats).map(([topicId, stats]) => {
      const accuracy = Math.round((stats.correct / stats.total) * 100);
      return {
        user_id: userId,
        topic_id: topicId,
        topic_name: stats.name,
        accuracy_percentage: accuracy,
        total_attempted: stats.total,
        correct_answers: stats.correct,
        last_attempted: new Date().toISOString(),
      };
    });
  } catch (err) {
    logger.error('Error in fetchUserTopicStats:', err);
    return [];
  }
}

export async function getWeakTopics(userId: string): Promise<any[]> {
  const all = await fetchUserTopicStats(userId);
  return all
    .filter((t) => t.accuracy_percentage < 70)
    .sort((a, b) => a.accuracy_percentage - b.accuracy_percentage);
}

export async function getStrongTopics(userId: string): Promise<any[]> {
  const all = await fetchUserTopicStats(userId);
  return all
    .filter((t) => t.accuracy_percentage >= 70)
    .sort((a, b) => b.accuracy_percentage - a.accuracy_percentage);
}

export async function getAllTopicStats(userId: string): Promise<any[]> {
  const all = await fetchUserTopicStats(userId);
  return all.sort((a, b) => b.total_attempted - a.total_attempted);
}

/**
 * Fetch all AI Quizzes history for a user
 */
export async function getAIQuizzes(userId: string) {
  try {
    const { data: notes, error: notesError } = await supabaseAdmin
      .from('study_notes')
      .select('id, title, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (notesError) throw notesError;
    if (!notes || notes.length === 0) return [];

    const noteIds = notes.map((n) => n.id);

    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('questions')
      .select('id, topic_id, difficulty')
      .eq('course_id', AI_PRACTICE_COURSE_ID)
      .in('topic_id', noteIds);

    if (questionsError) throw questionsError;
    if (!questions || questions.length === 0) return [];

    const questionIds = questions.map((q) => q.id);

    const { data: attempts, error: attemptsError } = await supabaseAdmin
      .from('attempt_history')
      .select('question_id, is_correct')
      .eq('user_id', userId)
      .in('question_id', questionIds);

    if (attemptsError) throw attemptsError;

    const attemptsMap = new Map<string, { is_correct: boolean }[]>();
    for (const a of attempts || []) {
      if (!attemptsMap.has(a.question_id)) {
        attemptsMap.set(a.question_id, []);
      }
      attemptsMap.get(a.question_id)!.push(a);
    }

    const quizzes = [];
    for (const note of notes) {
      const noteQuestions = questions.filter((q) => q.topic_id === note.id);
      if (noteQuestions.length === 0) continue;

      let attemptedCount = 0;
      let correctCount = 0;

      for (const q of noteQuestions) {
        const qAttempts = attemptsMap.get(q.id);
        if (qAttempts && qAttempts.length > 0) {
          attemptedCount++;
          const hasCorrect = qAttempts.some((a) => a.is_correct);
          if (hasCorrect) correctCount++;
        }
      }

      const scorePercentage = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

      quizzes.push({
        note_id: note.id,
        note_title: note.title,
        difficulty: noteQuestions[0]?.difficulty || 'medium',
        total_questions: noteQuestions.length,
        attempted_questions: attemptedCount,
        correct_answers: correctCount,
        score_percentage: scorePercentage,
        created_at: note.created_at,
      });
    }

    return quizzes;
  } catch (error) {
    logger.error('Error fetching AI quizzes history:', error);
    throw error;
  }
}

/**
 * Reset all attempts for a specific AI note quiz
 */
export async function resetQuizAttempts(userId: string, noteId: string): Promise<void> {
  try {
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('questions')
      .select('id')
      .eq('course_id', AI_PRACTICE_COURSE_ID)
      .eq('topic_id', noteId);

    if (questionsError) throw questionsError;
    if (!questions || questions.length === 0) return;

    const questionIds = questions.map((q) => q.id);

    const { error: deleteError } = await supabaseAdmin
      .from('attempt_history')
      .delete()
      .eq('user_id', userId)
      .in('question_id', questionIds);

    if (deleteError) throw deleteError;

    // Recompute streak + totals from the remaining history
    await recalculateUserProgress(userId);

    logger.info(`Reset attempts for user ${userId} and note/quiz ${noteId}`);
  } catch (error) {
    logger.error('Error resetting quiz attempts:', error);
    throw error;
  }
}

/**
 * Delete an AI quiz (questions + attempts) for a specific note.
 * Deleting the topic cascades to its questions and their attempt_history rows.
 */
export async function deleteQuiz(noteId: string, userId: string): Promise<void> {
  try {
    // Cascade: topic → questions → attempt_history
    const { error } = await supabaseAdmin
      .from('topics')
      .delete()
      .eq('id', noteId)
      .eq('course_id', AI_PRACTICE_COURSE_ID);

    if (error) throw error;

    // Recompute streak + totals now that those attempts are gone
    await recalculateUserProgress(userId);

    logger.info(`Deleted AI quiz (topic) for note ${noteId}`);
  } catch (error) {
    logger.error('Error deleting quiz:', error);
    throw error;
  }
}
