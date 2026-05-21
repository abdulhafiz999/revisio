import { Router } from 'express';
import {
  getCoursesHandler,
  getCourseHandler,
  getCourseTopicsHandler,
} from '../controllers/courses.controller';
import { verifyToken } from '../middleware/auth';
import { validateParams } from '../middleware/validation';
import { courseIdSchema } from '../models/schemas';

const router = Router();

router.get('/', verifyToken, getCoursesHandler);
router.get(
  '/:courseId/topics',
  verifyToken,
  validateParams(courseIdSchema),
  getCourseTopicsHandler
);
router.get(
  '/:courseId',
  verifyToken,
  validateParams(courseIdSchema),
  getCourseHandler
);

export default router;
