import { Request, Response, NextFunction } from 'express';
import { submitAnswer } from '../services/attempts.service';
import { ApiSuccessResponse, AttemptResult } from '../models/types';
import { attemptSubmissionSchema } from '../models/schemas';

/**
 * Attempts Controller
 * Handles HTTP requests for answer submission
 */

/**
 * Submit an answer for a question
 * POST /api/attempts
 */
export async function submitAnswerHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate request body
    const validatedData = attemptSubmissionSchema.parse(req.body);

    // Get user ID from authenticated request
    const userId = (req as any).user.id;

    // Submit answer and get result
    const result = await submitAnswer(
      userId,
      validatedData.question_id,
      validatedData.student_answer,
      validatedData.time_spent_seconds
    );

    // Return standardized success response
    const response: ApiSuccessResponse<AttemptResult> = {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}
