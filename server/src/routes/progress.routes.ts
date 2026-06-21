import { Router } from 'express';
import {
  getUserProgressHandler,
  getRecentActivityHandler,
  getWeeklyActivityHandler,
  getWeakTopicsHandler,
  getStrongTopicsHandler,
} from '../controllers/progress.controller';
import { getProfileHandler, updateProfileHandler } from '../controllers/users.controller';
import { verifyToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { updateProfileSchema } from '../models/schemas';

const router = Router();

/**
 * GET /api/users/profile
 * Get the authenticated user's profile
 */
router.get('/profile', verifyToken, getProfileHandler);

/**
 * PATCH /api/users/profile
 * Update display name and/or university program
 */
router.patch('/profile', verifyToken, validate(updateProfileSchema), updateProfileHandler);

/**
 * GET /api/users/progress
 * Get user progress stats
 */
router.get('/progress', verifyToken, getUserProgressHandler);

/**
 * GET /api/users/weak-topics
 * Get weak topics for the user
 */
router.get('/weak-topics', verifyToken, getWeakTopicsHandler);

/**
 * GET /api/users/strong-topics
 * Get strong topics for the user
 */
router.get('/strong-topics', verifyToken, getStrongTopicsHandler);

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

