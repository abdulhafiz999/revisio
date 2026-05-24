import { Request, Response, NextFunction } from 'express';
import { createNote, getNotes, getNoteById, updateNote, deleteNote, getPublicNoteById } from '../services/notes.service';
import { extractText } from '../services/pdf.service';
import { ApiSuccessResponse } from '../models/types';
import { noteInputSchema, updateNoteSchema } from '../models/schemas';
import { supabaseAdmin } from '../config/database';
import { logger } from '../utils/logger';

/**
 * Notes Controller
 * Handles HTTP requests for study notes
 */

/**
 * Create a new note
 * POST /api/notes
 */
export async function createNoteHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validatedData = noteInputSchema.parse(req.body);
    const userId = (req as any).user.id;

    const note = await createNote(userId, validatedData.title, validatedData.content);

    const response: ApiSuccessResponse<typeof note> = {
      success: true,
      data: note,
      timestamp: new Date().toISOString(),
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Upload PDF and create note
 * POST /api/notes/upload
 */
export async function uploadPDFHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const file = req.file;

    if (!file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Validate file type
    if (file.mimetype !== 'application/pdf') {
      res.status(400).json({
        success: false,
        error: 'Only PDF files are allowed',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Extract text from PDF
    const text = await extractText(file.buffer);

    if (!text) {
      res.status(400).json({
        success: false,
        error: 'Could not extract text from PDF',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Ensure the Supabase Storage bucket 'notes' exists and is public
    try {
      await supabaseAdmin.storage.createBucket('notes', {
        public: true,
      });
    } catch (bucketError) {
      // Ignore error if bucket already exists
    }

    // Upload PDF to Supabase Storage
    let fileUrl: string | undefined = undefined;
    const fileExtension = file.originalname.split('.').pop() || 'pdf';
    const filePath = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('notes')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (uploadError) {
      logger.error('Error uploading PDF to Supabase Storage:', uploadError);
    } else if (uploadData) {
      const { data: publicUrlData } = supabaseAdmin.storage
        .from('notes')
        .getPublicUrl(filePath);
      
      fileUrl = publicUrlData.publicUrl;
    }

    // Create note with extracted text and file URL
    const note = await createNote(userId, file.originalname, text, fileUrl);

    const response: ApiSuccessResponse<typeof note> = {
      success: true,
      data: note,
      timestamp: new Date().toISOString(),
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Get all notes for user
 * GET /api/notes
 */
export async function getNotesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const notes = await getNotes(userId);

    const response: ApiSuccessResponse<typeof notes> = {
      success: true,
      data: notes,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single note
 * GET /api/notes/:noteId
 */
export async function getNoteByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const { noteId } = req.params;

    const note = await getNoteById(userId, noteId);

    const response: ApiSuccessResponse<typeof note> = {
      success: true,
      data: note,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Update a note
 * PUT /api/notes/:noteId
 */
export async function updateNoteHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validatedData = updateNoteSchema.parse(req.body);
    const userId = (req as any).user.id;
    const { noteId } = req.params;

    const note = await updateNote(userId, noteId, validatedData.title, validatedData.content);

    const response: ApiSuccessResponse<typeof note> = {
      success: true,
      data: note,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a note
 * DELETE /api/notes/:noteId
 */
export async function deleteNoteHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const { noteId } = req.params;

    await deleteNote(userId, noteId);

    const response: ApiSuccessResponse<{ message: string }> = {
      success: true,
      data: { message: 'Note deleted successfully' },
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Get a public shared note by ID
 * GET /api/notes/shared/:noteId
 */
export async function getSharedNoteHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { noteId } = req.params;

    const note = await getPublicNoteById(noteId);

    const response: ApiSuccessResponse<typeof note> = {
      success: true,
      data: note,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

