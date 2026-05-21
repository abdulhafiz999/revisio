import { Router } from 'express';
import { getQuestionsHandler, getQuestionHandler } from '../controllers/questions.controller';
import { verifyToken } from '../middleware/auth';
import { validateParams, validateQuery } from '../middleware/validation';
import { questionFiltersSchema, questionIdSchema } from '../models/schemas';

const router = Router();

router.get(
  '/',
  verifyToken,
  validateQuery(questionFiltersSchema),
  getQuestionsHandler
);
router.get(
  '/:questionId',
  verifyToken,
  validateParams(questionIdSchema),
  getQuestionHandler
);

export default router;
