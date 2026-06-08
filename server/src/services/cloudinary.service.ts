import { cloudinary } from '../config/cloudinary';
import { logger } from '../utils/logger';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

/**
 * Cloudinary Service
 * Handles file uploads to Cloudinary
 */

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  format: string;
  bytes: number;
  createdAt: string;
}

/**
 * Upload a PDF file to Cloudinary
 */
export async function uploadPdf(
  fileBuffer: Buffer,
  fileName: string,
  folder: string = 'revisio/pdfs'
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image', // Use 'image' for PDFs so they can be delivered publicly
        folder: folder,
        // Remove extension for image resource type as Cloudinary appends it dynamically
        public_id: `${Date.now()}_${fileName.replace(/\.[^/.]+$/, '')}`,
        format: 'pdf',
        access_mode: 'public',
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          logger.error('Cloudinary upload error:', error);
          reject(new Error(`Failed to upload PDF: ${error.message}`));
          return;
        }

        if (!result) {
          reject(new Error('Upload failed: No result returned'));
          return;
        }

        logger.info(`PDF uploaded successfully: ${result.public_id}`);

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          bytes: result.bytes,
          createdAt: result.created_at,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
}

/**
 * Delete a file from Cloudinary
 */
export async function deleteFile(publicId: string): Promise<void> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    });

    if (result.result !== 'ok') {
      throw new Error(`Failed to delete file: ${result.result}`);
    }

    logger.info(`File deleted successfully: ${publicId}`);
  } catch (error) {
    logger.error('Error deleting file from Cloudinary:', error);
    throw error;
  }
}

/**
 * Get file details from Cloudinary
 */
export async function getFileDetails(publicId: string): Promise<any> {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: 'image',
    });

    return result;
  } catch (error) {
    logger.error('Error getting file details from Cloudinary:', error);
    throw error;
  }
}

/**
 * List files in a folder
 */
export async function listFiles(folder: string = 'revisio/pdfs'): Promise<any[]> {
  try {
    const result = await cloudinary.api.resources({
      resource_type: 'image',
      type: 'upload',
      prefix: folder,
      max_results: 500,
    });

    return result.resources;
  } catch (error) {
    logger.error('Error listing files from Cloudinary:', error);
    throw error;
  }
}
