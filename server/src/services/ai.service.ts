import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/environment';
import { logger } from '../utils/logger';
import { GeneratedQuestion } from '../models/types';

// Initialize Gemini with v1beta API
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
// Use gemini-1.5-flash (standard model name)
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash',
});

/**
 * Generate practice questions from text content
 */
export async function generateQuestions(
  content: string,
  count: number,
  difficulty: 'easy' | 'medium' | 'hard'
): Promise<GeneratedQuestion[]> {
  try {
    logger.info(`Generating ${count} ${difficulty} questions from ${content.length} characters of content`);
    
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
    
    logger.info('Gemini API response received');
    
    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      logger.error('Could not find JSON in response:', text.substring(0, 200));
      throw new Error('Could not parse AI response');
    }

    const questions = JSON.parse(jsonMatch[0]);
    logger.info(`Successfully generated ${questions.length} questions`);
    
    return questions;
  } catch (error: any) {
    logger.error('Error generating questions:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw new Error(`Failed to generate questions: ${error.message}`);
  }
}
