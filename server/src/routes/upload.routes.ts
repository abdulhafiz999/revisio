import { Router } from 'express';
import { upload } from '../config/multer';
import {
  uploadPdfHandler,
  deletePdfHandler,
  uploadAndProcessPdfHandler,
} from '../controllers/upload.controller';
import { verifyToken } from '../middleware/auth';

const router = Router();

/**
 * POST /api/upload/pdf
 * Upload a PDF file to Cloudinary
 */
router.post('/pdf', verifyToken, upload.single('file'), uploadPdfHandler);

/**
 * POST /api/upload/pdf/process
 * Upload and process a PDF for a specific course/topic
 */
router.post('/pdf/process', verifyToken, upload.single('file'), uploadAndProcessPdfHandler);

/**
 * DELETE /api/upload/pdf/:publicId
 * Delete a PDF file from Cloudinary
 * Note: publicId should be URL encoded if it contains slashes
 */
router.delete('/pdf/:publicId(*)', verifyToken, deletePdfHandler);

export default router;
