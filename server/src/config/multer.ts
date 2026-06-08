import multer from 'multer';
import { Request } from 'express';

/**
 * Multer Configuration for File Uploads
 * Uses memory storage to process files before uploading to Cloudinary
 */

// Configure storage - use memory storage for Cloudinary uploads
const storage = multer.memoryStorage();

// File filter - only allow PDF files
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'));
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size (increased for larger PDFs)
  },
});
