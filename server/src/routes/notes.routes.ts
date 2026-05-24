import { Router } from 'express';
import multer from 'multer';
import {
  createNoteHandler,
  uploadPDFHandler,
  getNotesHandler,
  getNoteByIdHandler,
  updateNoteHandler,
  deleteNoteHandler,
  getSharedNoteHandler,
} from '../controllers/notes.controller';
import { verifyToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { noteInputSchema, updateNoteSchema } from '../models/schemas';

const router = Router();

// Configure multer for memory storage (no disk storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

/**
 * GET /api/notes/shared/:noteId
 * Get a public shared note (no authentication needed)
 */
router.get('/shared/:noteId', getSharedNoteHandler);

/**
 * POST /api/notes/upload
 * Upload PDF and create note
 */
router.post('/upload', verifyToken, upload.single('file'), uploadPDFHandler);

/**
 * POST /api/notes
 * Create a new note
 */
router.post('/', verifyToken, validate(noteInputSchema), createNoteHandler);

/**
 * GET /api/notes
 * Get all notes for user
 */
router.get('/', verifyToken, getNotesHandler);

/**
 * GET /api/notes/:noteId
 * Get a single note
 */
router.get('/:noteId', verifyToken, getNoteByIdHandler);

/**
 * PUT /api/notes/:noteId
 * Update a note
 */
router.put('/:noteId', verifyToken, validate(updateNoteSchema), updateNoteHandler);

/**
 * DELETE /api/notes/:noteId
 * Delete a note
 */
router.delete('/:noteId', verifyToken, deleteNoteHandler);

export default router;
