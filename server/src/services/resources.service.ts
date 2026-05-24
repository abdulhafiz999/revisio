import { supabaseAdmin } from '../config/database';
import { logger } from '../utils/logger';

export interface SharedResource {
  id: string;
  course_id: string;
  topic_id: string | null;
  user_id: string;
  title: string;
  url: string;
  resource_type: string;
  created_at: string;
}

/**
 * Create a new shared resource (Google Drive or document link)
 */
export async function createSharedResource(
  courseId: string,
  topicId: string | null,
  userId: string,
  title: string,
  url: string
): Promise<SharedResource> {
  try {
    // Basic URL validation or normalization
    let normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    // Determine type (google drive vs link)
    let resourceType = 'link';
    if (/drive\.google\.com/i.test(normalizedUrl)) {
      resourceType = 'google_drive';
    } else if (/onedrive\.live\.com|sharepoint\.com/i.test(normalizedUrl)) {
      resourceType = 'onedrive';
    } else if (/\.pdf$/i.test(normalizedUrl)) {
      resourceType = 'pdf';
    }

    const { data, error } = await supabaseAdmin
      .from('shared_resources')
      .insert({
        course_id: courseId,
        topic_id: topicId || null,
        user_id: userId,
        title: title.trim(),
        url: normalizedUrl,
        resource_type: resourceType,
      })
      .select()
      .single();

    if (error) {
      logger.error('Supabase error creating resource:', error);
      throw new Error(`Failed to share resource: ${error.message}`);
    }

    logger.info(`Shared resource created for course ${courseId} by user ${userId}`);
    return data;
  } catch (error) {
    logger.error('Error in createSharedResource:', error);
    throw error;
  }
}

/**
 * Get all shared resources for a course
 */
export async function getSharedResourcesByCourse(courseId: string): Promise<SharedResource[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('shared_resources')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Supabase error getting course resources:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error('Error in getSharedResourcesByCourse:', error);
    throw error;
  }
}

/**
 * Delete a shared resource (only uploader can delete it)
 */
export async function deleteSharedResource(resourceId: string, userId: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('shared_resources')
      .delete()
      .eq('id', resourceId)
      .eq('user_id', userId);

    if (error) {
      logger.error('Supabase error deleting resource:', error);
      throw error;
    }

    logger.info(`Shared resource deleted: ${resourceId} by user ${userId}`);
  } catch (error) {
    logger.error('Error in deleteSharedResource:', error);
    throw error;
  }
}
