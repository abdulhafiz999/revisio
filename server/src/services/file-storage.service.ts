import { supabaseAdmin } from '../config/database';
import { deletePdfFromUrl } from './cloudinary.service';
import { logger } from '../utils/logger';

function parseSupabaseStorageUrl(
  fileUrl: string
): { bucket: string; path: string } | null {
  const pathWithoutQuery = fileUrl.split('?')[0];
  const match = pathWithoutQuery.match(
    /\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/
  );
  if (!match) return null;

  return {
    bucket: match[1],
    path: decodeURIComponent(match[2]),
  };
}

/**
 * Delete a stored PDF from Cloudinary or legacy Supabase Storage.
 */
export async function deleteStoredFile(fileUrl: string): Promise<void> {
  if (fileUrl.includes('res.cloudinary.com')) {
    await deletePdfFromUrl(fileUrl);
    return;
  }

  const supabaseFile = parseSupabaseStorageUrl(fileUrl);
  if (!supabaseFile) return;

  const { error } = await supabaseAdmin.storage
    .from(supabaseFile.bucket)
    .remove([supabaseFile.path]);

  if (error) {
    throw new Error(`Failed to delete Supabase file: ${error.message}`);
  }

  logger.info(
    `File deleted from Supabase Storage: ${supabaseFile.bucket}/${supabaseFile.path}`
  );
}
