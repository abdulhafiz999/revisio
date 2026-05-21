import { supabaseAdmin } from '../config/database';
import { logger } from '../utils/logger';
import { Topic } from '../models/types';

export async function getTopicsByCourseId(courseId: string): Promise<Topic[]> {
  const { data, error } = await supabaseAdmin
    .from('topics')
    .select('*')
    .eq('course_id', courseId)
    .order('name', { ascending: true });

  if (error) {
    logger.error('Error fetching topics:', error);
    throw new Error(`Failed to fetch topics: ${error.message}`);
  }

  return data ?? [];
}

export async function getTopicById(topicId: string): Promise<Topic | null> {
  const { data, error } = await supabaseAdmin
    .from('topics')
    .select('*')
    .eq('id', topicId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    logger.error('Error fetching topic:', error);
    throw new Error(`Failed to fetch topic: ${error.message}`);
  }

  return data;
}
