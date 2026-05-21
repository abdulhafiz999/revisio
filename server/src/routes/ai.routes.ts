import { Router } from 'express';
import { 
  generateQuestionsHandler,
  summarizeHandler,
  explainHandler,
  studyGuideHandler
} from '../controllers/ai.controller';
import { verifyToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { generateQuestionsSchema, aiNoteIdSchema, explainConceptSchema } from '../models/schemas';

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

/**
 * POST /api/ai/summarize
 * Summarize a note
 */
router.post(
  '/summarize',
  verifyToken,
  validate(aiNoteIdSchema),
  summarizeHandler
);

/**
 * POST /api/ai/explain
 * Explain a concept from a note
 */
router.post(
  '/explain',
  verifyToken,
  validate(explainConceptSchema),
  explainHandler
);

/**
 * POST /api/ai/study-guide
 * Generate a comprehensive study guide
 */
router.post(
  '/study-guide',
  verifyToken,
  validate(aiNoteIdSchema),
  studyGuideHandler
);

export default router;
