import { Router } from 'express';
import { submitAnswerHandler } from '../controllers/attempts.controller';
import { verifyToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { attemptSubmissionSchema } from '../models/schemas';

const router = Router();

/**
 * POST /api/attempts
 * Submit an answer for a question
 * Requires authentication
 */
router.post(
  '/',
  verifyToken,
  validate(attemptSubmissionSchema),
  submitAnswerHandler
);

export default router;
