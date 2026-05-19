import { Request, Response, NextFunction } from 'express';
import { generateQuestions } from '../services/ai.service';
import { getNoteById } from '../services/notes.service';
import { saveGeneratedQuestions } from '../services/questions.service';
import { ApiSuccessResponse } from '../models/types';

/**
 * AI Controller
 * Handles AI-powered features
 */

/**
 * Generate questions from a note
 * POST /api/ai/generate-questions
 */
export async function generateQuestionsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const { note_id, count, difficulty } = req.body;

    // Get the note
    const note = await getNoteById(userId, note_id);

    if (!note.content || note.content.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Note has no content',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const generated = await generateQuestions(note.content, count, difficulty);
    const questions = await saveGeneratedQuestions(difficulty, generated);

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
