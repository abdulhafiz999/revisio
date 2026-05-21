import { Router } from 'express';
import {
  getUserProgressHandler,
  getRecentActivityHandler,
  getWeeklyActivityHandler,
} from '../controllers/progress.controller';
import { verifyToken } from '../middleware/auth';

const router = Router();

/**
 * GET /api/users/progress
 * Get user progress stats
 */
router.get('/progress', verifyToken, getUserProgressHandler);

/**
 * GET /api/users/weekly-activity
 * Get daily stats for the last 7 days
 */
router.get('/weekly-activity', verifyToken, getWeeklyActivityHandler);

/**
 * GET /api/users/recent-activity
 * Get recent activity
 */
router.get('/recent-activity', verifyToken, getRecentActivityHandler);

export default router;
