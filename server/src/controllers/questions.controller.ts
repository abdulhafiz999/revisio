import { Request, Response, NextFunction } from 'express';
import { getQuestions, getQuestionById } from '../services/questions.service';
import { ApiSuccessResponse } from '../models/types';
import { NotFoundError } from '../middleware/errorHandler';
import { QuestionFilters } from '../models/schemas';

export async function getQuestionsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const filters = req.query as unknown as QuestionFilters;
    const questions = await getQuestions(filters);

    const response: ApiSuccessResponse<typeof questions> = {
      success: true,
      data: questions,
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function getQuestionHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { questionId } = req.params;
    const question = await getQuestionById(questionId);

    if (!question) {
      throw new NotFoundError('Question not found');
    }

    const response: ApiSuccessResponse<typeof question> = {
      success: true,
      data: question,
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}
