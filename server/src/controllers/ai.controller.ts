import { Request, Response, NextFunction } from 'express';
import { 
  generateQuestions, 
  summarizeNotes, 
  explainConcept, 
  generateStudyGuide 
} from '../services/ai.service';
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

/**
 * Summarize a note
 * POST /api/ai/summarize
 */
export async function summarizeHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const { note_id } = req.body;

    const note = await getNoteById(userId, note_id);

    if (!note.content || note.content.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Note has no content',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const summary = await summarizeNotes(note.content);

    const response: ApiSuccessResponse<{ summary: string }> = {
      success: true,
      data: { summary },
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Explain a concept from a note
 * POST /api/ai/explain
 */
export async function explainHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const { note_id, concept } = req.body;

    const note = await getNoteById(userId, note_id);

    if (!note.content || note.content.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Note has no content',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const explanation = await explainConcept(note.content, concept);

    const response: ApiSuccessResponse<{ explanation: string }> = {
      success: true,
      data: { explanation },
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Generate study guide from a note
 * POST /api/ai/study-guide
 */
export async function studyGuideHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const { note_id } = req.body;

    const note = await getNoteById(userId, note_id);

    if (!note.content || note.content.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Note has no content',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const guide = await generateStudyGuide(note.content);

    const response: ApiSuccessResponse<{ guide: string }> = {
      success: true,
      data: { guide },
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}
