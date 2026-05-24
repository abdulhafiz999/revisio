import { Router } from 'express';
import { 
  createResourceHandler, 
  getResourcesHandler, 
  deleteResourceHandler 
} from '../controllers/resources.controller';
import { verifyToken } from '../middleware/auth';

const router = Router();

/**
 * POST /api/resources
 * Share a new link
 */
router.post('/', verifyToken, createResourceHandler);

/**
 * GET /api/resources/course/:courseId
 * Get shared resources for a course
 */
router.get('/course/:courseId', verifyToken, getResourcesHandler);

/**
 * DELETE /api/resources/:resourceId
 * Delete a shared link
 */
router.delete('/:resourceId', verifyToken, deleteResourceHandler);

export default router;
