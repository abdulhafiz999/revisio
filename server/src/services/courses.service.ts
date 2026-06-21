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

export async function getAllCoursesWithProgress(userId: string): Promise<any[]> {
  try {
    // 1. Fetch all courses
    const { data: courses, error: coursesError } = await supabaseAdmin
      .from('courses')
      .select('*')
      .neq('id', AI_PRACTICE_COURSE_ID)
      .order('name', { ascending: true });

    if (coursesError) throw coursesError;
    if (!courses) return [];

    // 2. Fetch all questions in these courses
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('questions')
      .select('id, course_id');

    if (questionsError) throw questionsError;

    // 3. Fetch user's attempt history
    const { data: attempts, error: attemptsError } = await supabaseAdmin
      .from('attempt_history')
      .select('question_id, is_correct')
      .eq('user_id', userId);

    if (attemptsError) throw attemptsError;

    // Map questions by course_id
    const courseQuestionsMap = new Map<string, string[]>();
    for (const q of questions || []) {
      if (!courseQuestionsMap.has(q.course_id)) {
        courseQuestionsMap.set(q.course_id, []);
      }
      courseQuestionsMap.get(q.course_id)!.push(q.id);
    }

    // Set of unique attempted and correct questions
    const attemptedQuestionIds = new Set<string>();
    const correctQuestionIds = new Set<string>();
    for (const a of attempts || []) {
      attemptedQuestionIds.add(a.question_id);
      if (a.is_correct) {
        correctQuestionIds.add(a.question_id);
      }
    }

    // Combine courses with calculated statistics
    return courses.map(course => {
      const questionIds = courseQuestionsMap.get(course.id) || [];
      const totalQuestions = questionIds.length;
      
      const attemptedCount = questionIds.filter(id => attemptedQuestionIds.has(id)).length;
      const correctCount = questionIds.filter(id => correctQuestionIds.has(id)).length;
      const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

      return {
        ...course,
        total_questions: totalQuestions,
        attempted_questions: attemptedCount,
        correct_questions: correctCount,
        accuracy_percentage: accuracy,
      };
    });
  } catch (error) {
    logger.error('Error fetching courses with progress:', error);
    throw error;
  }
}

