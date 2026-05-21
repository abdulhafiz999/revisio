import { Request, Response, NextFunction } from 'express';
import { getTopicById } from '../services/topics.service';
import { ApiSuccessResponse } from '../models/types';
import { NotFoundError } from '../middleware/errorHandler';

export async function getTopicHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { topicId } = req.params;
    const topic = await getTopicById(topicId);

    if (!topic) {
      throw new NotFoundError('Topic not found');
    }

    const response: ApiSuccessResponse<typeof topic> = {
      success: true,
      data: topic,
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}
