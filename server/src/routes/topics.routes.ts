import { Router } from 'express';
import { getTopicHandler } from '../controllers/topics.controller';
import { verifyToken } from '../middleware/auth';
import { validateParams } from '../middleware/validation';
import { topicIdSchema } from '../models/schemas';

const router = Router();

router.get(
  '/:topicId',
  verifyToken,
  validateParams(topicIdSchema),
  getTopicHandler
);

export default router;
