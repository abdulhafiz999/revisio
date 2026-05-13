import { Request, Response, NextFunction } from 'express';
import { getUserProgress, getRecentActivity } from '../services/progress.service';
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
