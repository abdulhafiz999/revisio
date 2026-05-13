import pdfParse from 'pdf-parse';
import { logger } from '../utils/logger';

/**
 * Simple PDF Service
 * Extracts text from PDF files
 */

/**
 * Extract text from PDF buffer
 */
export async function extractText(pdfBuffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(pdfBuffer);
    
    // Get text and clean up excessive whitespace
    let text = data.text;
    text = text.replace(/\s+/g, ' ').trim();
    
    logger.info('PDF text extracted successfully');
    return text;
  } catch (error) {
    logger.error('Error extracting PDF text:', error);
    return '';
  }
}
