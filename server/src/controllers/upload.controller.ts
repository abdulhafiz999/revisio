import { Request, Response, NextFunction } from 'express';
import { uploadPdf, deleteFile } from '../services/cloudinary.service';
import { extractText } from '../services/pdf.service';
import { ApiSuccessResponse } from '../models/types';
import { logger } from '../utils/logger';

/**
 * Upload a PDF file
 * POST /api/upload/pdf
 */
export async function uploadPdfHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    const file = req.file;

    if (!file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Upload to Cloudinary
    logger.info(`Uploading PDF: ${file.originalname}`);
    const uploadResult = await uploadPdf(
      file.buffer,
      file.originalname,
      `revisio/pdfs/${userId || 'anonymous'}`
    );

    // Extract text from PDF
    logger.info('Extracting text from PDF');
    const extractedText = await extractText(file.buffer);

    const response: ApiSuccessResponse<{
      file: typeof uploadResult;
      textPreview: string;
      textLength: number;
    }> = {
      success: true,
      data: {
        file: uploadResult,
        textPreview: extractedText.substring(0, 500), // First 500 chars as preview
        textLength: extractedText.length,
      },
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Error uploading PDF:', error);
    next(error);
  }
}

/**
 * Delete a PDF file
 * DELETE /api/upload/pdf/:publicId
 */
export async function deletePdfHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      res.status(400).json({
        success: false,
        error: 'publicId is required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Decode the publicId (it might be URL encoded)
    const decodedPublicId = decodeURIComponent(publicId);

    await deleteFile(decodedPublicId);

    const response: ApiSuccessResponse<{ message: string }> = {
      success: true,
      data: { message: 'File deleted successfully' },
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Error deleting PDF:', error);
    next(error);
  }
}

/**
 * Upload and process PDF for a specific course/topic
 * POST /api/upload/pdf/process
 */
export async function uploadAndProcessPdfHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    const file = req.file;
    const { course_id, topic_id, title } = req.body;

    if (!file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!course_id) {
      res.status(400).json({
        success: false,
        error: 'course_id is required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Upload to Cloudinary
    logger.info(`Uploading and processing PDF: ${file.originalname}`);
    const uploadResult = await uploadPdf(
      file.buffer,
      file.originalname,
      `revisio/pdfs/${userId}/course_${course_id}`
    );

    // Extract full text from PDF
    logger.info('Extracting text from PDF');
    const extractedText = await extractText(file.buffer);

    const response: ApiSuccessResponse<{
      file: typeof uploadResult;
      content: string;
      metadata: {
        course_id: string;
        topic_id?: string;
        title?: string;
        uploaded_by: string;
      };
    }> = {
      success: true,
      data: {
        file: uploadResult,
        content: extractedText,
        metadata: {
          course_id,
          topic_id: topic_id || null,
          title: title || file.originalname,
          uploaded_by: userId,
        },
      },
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Error uploading and processing PDF:', error);
    next(error);
  }
}
