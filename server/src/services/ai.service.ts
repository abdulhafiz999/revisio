import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/environment';
import { logger } from '../utils/logger';
import { GeneratedQuestion } from '../models/types';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Generate practice questions from text content
 */
export async function generateQuestions(
  content: string,
  count: number,
  difficulty: 'easy' | 'medium' | 'hard'
): Promise<GeneratedQuestion[]> {
  try {
    const prompt = `Generate ${count} ${difficulty} multiple-choice questions from this content:

${content}

Return ONLY a JSON array with this exact format:
[
  {
    "question_text": "question here",
    "options": ["A", "B", "C", "D"],
    "correct_answer": "A",
    "explanation": "why this is correct"
  }
]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    const questions = JSON.parse(jsonMatch[0]);
    logger.info(`Generated ${questions.length} questions`);
    
    return questions;
  } catch (error) {
    logger.error('Error generating questions:', error);
    throw new Error('Failed to generate questions');
  }
}
