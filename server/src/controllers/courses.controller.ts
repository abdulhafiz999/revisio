import { Request, Response, NextFunction } from 'express';
import { getAllCourses, getCourseById } from '../services/courses.service';
import { getTopicsByCourseId } from '../services/topics.service';
import { ApiSuccessResponse } from '../models/types';
import { NotFoundError } from '../middleware/errorHandler';
import { AI_PRACTICE_COURSE_ID } from '../constants/ai-practice';

export async function getCoursesHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const courses = await getAllCourses();
    const response: ApiSuccessResponse<typeof courses> = {
      success: true,
      data: courses,
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function getCourseHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { courseId } = req.params;
    const course = await getCourseById(courseId);

    if (!course || course.id === AI_PRACTICE_COURSE_ID) {
      throw new NotFoundError('Course not found');
    }

    const response: ApiSuccessResponse<typeof course> = {
      success: true,
      data: course,
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function getCourseTopicsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { courseId } = req.params;
    const course = await getCourseById(courseId);

    if (!course) {
      throw new NotFoundError('Course not found');
    }

    const topics = await getTopicsByCourseId(courseId);
    const response: ApiSuccessResponse<typeof topics> = {
      success: true,
      data: topics,
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}
