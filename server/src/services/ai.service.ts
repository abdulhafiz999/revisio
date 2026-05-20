import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/environment';
import { logger } from '../utils/logger';
import { GeneratedQuestion } from '../models/types';
import { RateLimitError } from '../middleware/errorHandler';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

function isQuotaError(message: string): boolean {
  return (
    message.includes('429') ||
    message.includes('Too Many Requests') ||
    message.includes('quota') ||
    message.includes('Quota exceeded')
  );
}

function quotaRetryMessage(errorMessage: string): string {
  const secondsMatch = errorMessage.match(/retry in ([\d.]+)s/i);
  const seconds = secondsMatch ? Math.ceil(parseFloat(secondsMatch[1])) : 60;
  return (
    `Gemini API free-tier limit reached for model "${env.GEMINI_MODEL}" ` +
    `(about ${seconds}s until you can retry). ` +
    `Try again later, switch GEMINI_MODEL in .env (e.g. gemini-2.5-flash), or enable billing in Google AI Studio.`
  );
}

function truncateContent(content: string, maxChars: number): string {
  const trimmed = content.trim();
  if (trimmed.length <= maxChars) {
    return trimmed;
  }
  logger.info(`Truncating note content from ${trimmed.length} to ${maxChars} characters for faster generation`);
  return `${trimmed.slice(0, maxChars)}\n\n[Note: content truncated for faster question generation.]`;
}

function buildPrompt(count: number, difficulty: string, content: string): string {
  return `Create ${count} ${difficulty} multiple-choice questions from this study material.

Rules:
- 4 options per question; correct_answer must exactly match one option string
- explanation: one short sentence only
- Vary topics across the material

Material:
${content}

Return a JSON array only:
[{"question_text":"...","options":["...","...","...","..."],"correct_answer":"...","explanation":"..."}]`;
}

function parseQuestionsResponse(text: string): GeneratedQuestion[] {
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  const raw = jsonMatch ? jsonMatch[0] : text;
  const questions = JSON.parse(raw);
  if (!Array.isArray(questions)) {
    throw new Error('AI response was not a JSON array');
  }
  return questions;
}

async function generateBatch(
  content: string,
  count: number,
  difficulty: 'easy' | 'medium' | 'hard'
): Promise<GeneratedQuestion[]> {
  const model = genAI.getGenerativeModel({
    model: env.GEMINI_MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.5,
      maxOutputTokens: Math.min(8192, count * 400 + 256),
    },
  });

  const result = await model.generateContent(buildPrompt(count, difficulty, content));
  const questions = parseQuestionsResponse(result.response.text());
  logger.info(`Batch generated ${questions.length} questions`);
  return questions;
}

/**
 * Generate practice questions from text content
 */
export async function generateQuestions(
  content: string,
  count: number,
  difficulty: 'easy' | 'medium' | 'hard'
): Promise<GeneratedQuestion[]> {
  const started = Date.now();
  const truncated = truncateContent(content, env.GEMINI_CONTENT_MAX_CHARS);

  try {
    logger.info(
      `Generating ${count} ${difficulty} questions (${truncated.length} chars, model: ${env.GEMINI_MODEL})`
    );

    let questions: GeneratedQuestion[];

    // One API call per generation — parallel batches use 2x free-tier quota (20/day per model)
    questions = await generateBatch(truncated, count, difficulty);

    logger.info(
      `Successfully generated ${questions.length} questions in ${Date.now() - started}ms`
    );
    return questions;
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Error generating questions:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
    });
    if (isQuotaError(err.message)) {
      throw new RateLimitError(quotaRetryMessage(err.message));
    }
    throw new Error(`Failed to generate questions: ${err.message}`);
  }
}
