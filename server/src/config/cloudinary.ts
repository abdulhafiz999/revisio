import { v2 as cloudinary } from 'cloudinary';
import { env } from './environment';
import { logger } from '../utils/logger';

/**
 * Cloudinary Configuration
 * Handles PDF and document uploads
 */

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Validate Cloudinary configuration
 */
export function validateCloudinaryConfig(): boolean {
  try {
    const config = cloudinary.config();
    
    if (!config.cloud_name || !config.api_key || !config.api_secret) {
      logger.error('Cloudinary configuration is incomplete');
      return false;
    }
    
    logger.info('Cloudinary configuration validated successfully');
    return true;
  } catch (error) {
    logger.error('Error validating Cloudinary configuration:', error);
    return false;
  }
}

export { cloudinary };
