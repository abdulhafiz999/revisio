import { Request, Response, NextFunction } from 'express';
import { 
  createSharedResource, 
  getSharedResourcesByCourse, 
  deleteSharedResource 
} from '../services/resources.service';
import { ApiSuccessResponse } from '../models/types';

/**
 * Share a new resource (Google Drive or link)
 * POST /api/resources
 */
export async function createResourceHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const { course_id, topic_id, title, url } = req.body;

    if (!course_id || !title || !url) {
      res.status(400).json({
        success: false,
        error: 'course_id, title, and url are required fields',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const resource = await createSharedResource(
      course_id,
      topic_id || null,
      userId,
      title,
      url
    );

    const response: ApiSuccessResponse<typeof resource> = {
      success: true,
      data: resource,
      timestamp: new Date().toISOString(),
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Get shared resources for a course
 * GET /api/resources/course/:courseId
 */
export async function getResourcesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      res.status(400).json({
        success: false,
        error: 'courseId is required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const resources = await getSharedResourcesByCourse(courseId);

    const response: ApiSuccessResponse<typeof resources> = {
      success: true,
      data: resources,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a shared resource
 * DELETE /api/resources/:resourceId
 */
export async function deleteResourceHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const { resourceId } = req.params;

    if (!resourceId) {
      res.status(400).json({
        success: false,
        error: 'resourceId is required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    await deleteSharedResource(resourceId, userId);

    const response: ApiSuccessResponse<{ message: string }> = {
      success: true,
      data: { message: 'Shared resource deleted successfully' },
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}
