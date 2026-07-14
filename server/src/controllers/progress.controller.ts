import { Request, Response, NextFunction } from 'express';
import { 
  getUserProgress, 
  getRecentActivity, 
  getWeeklyActivity, 
  getWeakTopics, 
  getStrongTopics,
  getAllTopicStats,
  getAIQuizzes,
  resetQuizAttempts,
  deleteQuiz 
} from '../services/progress.service';
import { ApiSuccessResponse } from '../models/types';

/**
 * Progress Controller
 * Handles HTTP requests for user progress
 */

/**
 * Get user progress stats
 * GET /api/users/progress
 */
export async function getUserProgressHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const progress = await getUserProgress(userId);

    const response: ApiSuccessResponse<typeof progress> = {
      success: true,
      data: progress,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Get last 7 days of daily activity
 * GET /api/users/weekly-activity
 */
export async function getWeeklyActivityHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const activity = await getWeeklyActivity(userId);

    const response: ApiSuccessResponse<typeof activity> = {
      success: true,
      data: activity,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Get recent activity
 * GET /api/users/recent-activity
 */
export async function getRecentActivityHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const activity = await getRecentActivity(userId);

    const response: ApiSuccessResponse<typeof activity> = {
      success: true,
      data: activity,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Get weak topics for the user
 * GET /api/users/weak-topics
 */
export async function getWeakTopicsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const weakTopics = await getWeakTopics(userId);

    const response: ApiSuccessResponse<typeof weakTopics> = {
      success: true,
      data: weakTopics,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Get strong topics for the user
 * GET /api/users/strong-topics
 */
export async function getStrongTopicsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const strongTopics = await getStrongTopics(userId);

    const response: ApiSuccessResponse<typeof strongTopics> = {
      success: true,
      data: strongTopics,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Get all topic stats for the user
 * GET /api/users/all-topics
 */
export async function getAllTopicStatsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const topics = await getAllTopicStats(userId);

    const response: ApiSuccessResponse<typeof topics> = {
      success: true,
      data: topics,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Get user AI quizzes history
 * GET /api/users/ai-quizzes
 */
export async function getAIQuizzesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const quizzes = await getAIQuizzes(userId);

    const response: ApiSuccessResponse<typeof quizzes> = {
      success: true,
      data: quizzes,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Reset attempts for a specific AI quiz
 * POST /api/users/ai-quizzes/reset
 */
export async function resetQuizAttemptsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const { note_id } = req.body;

    await resetQuizAttempts(userId, note_id);

    const response: ApiSuccessResponse<null> = {
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete an AI quiz and all its questions/attempts
 * DELETE /api/users/ai-quizzes/:noteId
 */
export async function deleteQuizHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { noteId } = req.params;
    const userId = (req as any).user.id;

    await deleteQuiz(noteId, userId);

    const response: ApiSuccessResponse<null> = {
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}
