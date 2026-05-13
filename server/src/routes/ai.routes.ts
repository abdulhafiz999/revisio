import { Router } from 'express';
import { generateQuestionsHandler } from '../controllers/ai.controller';
import { verifyToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { generateQuestionsSchema } from '../models/schemas';

const router = Router();

/**
 * POST /api/ai/generate-questions
 * Generate practice questions from a note
 */
router.post(
  '/generate-questions',
  verifyToken,
  validate(generateQuestionsSchema),
  generateQuestionsHandler
);

export default router;
