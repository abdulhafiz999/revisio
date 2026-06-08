import { Router } from 'express';
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
import { upload } from '../config/multer';

const router = Router();

router.get('/shared/:noteId', getSharedNoteHandler);
router.post('/upload', verifyToken, upload.single('file'), uploadPDFHandler);
router.post('/', verifyToken, validate(noteInputSchema), createNoteHandler);
router.get('/', verifyToken, getNotesHandler);
router.get('/:noteId', verifyToken, getNoteByIdHandler);
router.put('/:noteId', verifyToken, validate(updateNoteSchema), updateNoteHandler);
router.delete('/:noteId', verifyToken, deleteNoteHandler);

export default router;
