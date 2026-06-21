import { Request, Response, NextFunction } from 'express';
import { 
  getUserProgress, 
  getRecentActivity, 
  getWeeklyActivity, 
  getWeakTopics, 
  getStrongTopics 
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

