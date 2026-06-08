import { cloudinary } from '../config/cloudinary';
import { logger } from '../utils/logger';

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  bytes: number;
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/\.pdf$/i, '')
    .replace(/[^\w.-]/g, '_');
}

/**
 * Upload a PDF to Cloudinary as a raw file (direct download/view).
 * Requires "Allow delivery of PDF and ZIP files" in Cloudinary Security settings.
 */
export async function uploadPdf(
  fileBuffer: Buffer,
  fileName: string,
  folder = 'revisio/notes'
): Promise<CloudinaryUploadResult> {
  const publicId = `${Date.now()}_${sanitizeFileName(fileName)}`;

  try {
    const result = await cloudinary.uploader.upload(
      `data:application/pdf;base64,${fileBuffer.toString('base64')}`,
      {
        resource_type: 'raw',
        folder,
        public_id: publicId,
        access_mode: 'public',
      }
    );

    logger.info(`PDF uploaded: ${result.public_id}`);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      bytes: result.bytes,
    };
  } catch (error) {
    logger.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload PDF to Cloudinary');
  }
}

export function parseCloudinaryUrl(
  fileUrl: string
): { publicId: string; resourceType: 'raw' | 'image' } | null {
  if (!fileUrl.includes('res.cloudinary.com')) return null;

  const match = fileUrl.match(/\/(raw|image)\/upload\/(?:v\d+\/)?(.+)$/i);
  if (!match) return null;

  let publicId = decodeURIComponent(match[2]);
  if (publicId.endsWith('.pdf')) {
    publicId = publicId.slice(0, -4);
  }

  return {
    publicId,
    resourceType: match[1].toLowerCase() as 'raw' | 'image',
  };
}

/**
 * Delete a PDF from Cloudinary by public ID.
 */
export async function deletePdf(
  publicId: string,
  resourceType: 'raw' | 'image' = 'raw'
): Promise<void> {
  const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });

  if (result.result !== 'ok' && result.result !== 'not found') {
    throw new Error(`Failed to delete file: ${result.result}`);
  }

  logger.info(`PDF deleted from Cloudinary: ${publicId}`);
}

/**
 * Delete a PDF from Cloudinary using its delivery URL.
 */
export async function deletePdfFromUrl(fileUrl: string): Promise<void> {
  const parsed = parseCloudinaryUrl(fileUrl);
  if (!parsed) return;

  await deletePdf(parsed.publicId, parsed.resourceType);
}
