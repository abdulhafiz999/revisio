import { supabaseAdmin } from '../config/database';
import { logger } from '../utils/logger';
import { Course } from '../models/types';
import { AI_PRACTICE_COURSE_ID } from '../constants/ai-practice';

export async function getAllCourses(): Promise<Course[]> {
  const { data, error } = await supabaseAdmin
    .from('courses')
    .select('*')
    .neq('id', AI_PRACTICE_COURSE_ID)
    .order('name', { ascending: true });

  if (error) {
    logger.error('Error fetching courses:', error);
    throw new Error(`Failed to fetch courses: ${error.message}`);
  }

  return data ?? [];
}

export async function getCourseById(courseId: string): Promise<Course | null> {
  const { data, error } = await supabaseAdmin
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    logger.error('Error fetching course:', error);
    throw new Error(`Failed to fetch course: ${error.message}`);
  }

  return data;
}
