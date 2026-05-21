import { GoogleGenerativeAI, type GenerationConfig } from '@google/generative-ai';
import { env } from '../config/environment';
import { logger } from '../utils/logger';
import { GeneratedQuestion } from '../models/types';
import { ExternalServiceError, RateLimitError } from '../middleware/errorHandler';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

/** Used when the primary model is overloaded (503) or unavailable */
const GEMINI_FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'];

const TRANSIENT_RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getModelsToTry(): string[] {
  const primary = env.GEMINI_MODEL;
  return [primary, ...GEMINI_FALLBACK_MODELS.filter((m) => m !== primary)];
}

function isQuotaError(message: string): boolean {
  return (
    message.includes('429') ||
    message.includes('Too Many Requests') ||
    message.includes('quota') ||
    message.includes('Quota exceeded')
  );
}

function isTransientGeminiError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : String(error);
  const status = (error as { status?: number })?.status;
  return (
    status === 503 ||
    status === 502 ||
    status === 500 ||
    message.includes('503') ||
    message.includes('502') ||
    message.includes('Service Unavailable') ||
    message.includes('high demand') ||
    message.includes('overloaded') ||
    message.includes('temporarily unavailable') ||
    message.includes('Please try again later')
  );
}

function isModelUnavailableError(message: string): boolean {
  return (
    message.includes('404') ||
    message.includes('not found') ||
    message.includes('is not supported') ||
    message.includes('Invalid model')
  );
}

function handleGeminiFailure(lastError: Error | null, action: string): never {
  if (!lastError) {
    throw new ExternalServiceError('AI service unavailable. Please try again.');
  }
  if (isQuotaError(lastError.message)) {
    throw new RateLimitError(quotaRetryMessage(lastError.message));
  }
  if (isTransientGeminiError(lastError)) {
    throw new ExternalServiceError(
      `Gemini is busy right now (high demand). Wait a minute and try again, or set GEMINI_MODEL=gemini-2.5-flash in server/.env instead of ${env.GEMINI_MODEL}.`
    );
  }
  throw new Error(`Failed to ${action}: ${lastError.message}`);
}

async function generateGeminiText(
  prompt: string,
  generationConfig: GenerationConfig,
  action: string
): Promise<string> {
  const models = getModelsToTry();
  let lastError: Error | null = null;

  for (const modelName of models) {
    for (let attempt = 0; attempt < TRANSIENT_RETRIES; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName, generationConfig });
        const result = await model.generateContent(prompt);
        if (modelName !== env.GEMINI_MODEL) {
          logger.info(`Gemini used fallback model "${modelName}" for ${action}`);
        }
        return result.response.text();
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        lastError = err;

        if (isQuotaError(err.message)) {
          throw new RateLimitError(quotaRetryMessage(err.message));
        }

        if (isTransientGeminiError(err) && attempt < TRANSIENT_RETRIES - 1) {
          const delayMs = (attempt + 1) * 1000;
          logger.warn(
            `Gemini "${modelName}" busy (${action}), retry ${attempt + 2}/${TRANSIENT_RETRIES} in ${delayMs}ms`
          );
          await sleep(delayMs);
          continue;
        }

        if (isTransientGeminiError(err) || isModelUnavailableError(err.message)) {
          logger.warn(`Gemini "${modelName}" unavailable for ${action}, trying next model`);
          break;
        }

        throw err;
      }
    }
  }

  handleGeminiFailure(lastError, action);
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
  const text = await generateGeminiText(
    buildPrompt(count, difficulty, content),
    {
      responseMimeType: 'application/json',
      temperature: 0.5,
      maxOutputTokens: Math.min(8192, count * 400 + 256),
    },
    'generate questions'
  );
  const questions = parseQuestionsResponse(text);
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
    if (error instanceof RateLimitError || error instanceof ExternalServiceError) {
      throw error;
    }
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

/**
 * Summarize note content
 */
export async function summarizeNotes(content: string): Promise<string> {
  try {
    logger.info(`Summarizing ${content.length} characters of content`);

    const prompt = `Summarize this study material in 3-5 concise bullet points. Focus on the main concepts and key takeaways:

${truncateContent(content, env.GEMINI_CONTENT_MAX_CHARS)}

Return only the bullet points, no extra text.`;

    const summary = await generateGeminiText(
      prompt,
      { temperature: 0.3, maxOutputTokens: 1024 },
      'summarize notes'
    );

    logger.info('Summary generated successfully');
    return summary;
  } catch (error: unknown) {
    if (error instanceof RateLimitError || error instanceof ExternalServiceError) {
      throw error;
    }
    const err = error as Error;
    logger.error('Error summarizing notes:', err);
    throw new Error(`Failed to summarize notes: ${err.message}`);
  }
}

/**
 * Explain a specific concept from notes
 */
export async function explainConcept(content: string, concept: string): Promise<string> {
  try {
    logger.info(`Explaining concept: ${concept}`);

    const prompt = `Based on this study material, explain the concept "${concept}" in simple terms. Include:
1. A clear definition
2. Why it's important
3. A simple example

Study material:
${truncateContent(content, env.GEMINI_CONTENT_MAX_CHARS)}

Keep the explanation concise and easy to understand.`;

    const explanation = await generateGeminiText(
      prompt,
      { temperature: 0.4, maxOutputTokens: 1024 },
      'explain concept'
    );

    logger.info('Concept explained successfully');
    return explanation;
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Error explaining concept:', err);
    if (error instanceof RateLimitError || error instanceof ExternalServiceError) {
      throw error;
    }
    if (isQuotaError(err.message)) {
      throw new RateLimitError(quotaRetryMessage(err.message));
    }
    throw new Error(`Failed to explain concept: ${err.message}`);
  }
}

/**
 * Generate flashcards from notes
 */
export async function generateFlashcards(content: string, count: number): Promise<Array<{front: string, back: string}>> {
  try {
    logger.info(`Generating ${count} flashcards`);

    const prompt = `Create ${count} flashcards from this study material. Each flashcard should have:
- front: A question or term
- back: The answer or definition (keep it concise)

Study material:
${truncateContent(content, env.GEMINI_CONTENT_MAX_CHARS)}

Return a JSON array:
[{"front":"...","back":"..."}]`;

    const text = await generateGeminiText(
      prompt,
      {
        responseMimeType: 'application/json',
        temperature: 0.5,
        maxOutputTokens: count * 200 + 256,
      },
      'generate flashcards'
    );
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const flashcards = JSON.parse(jsonMatch ? jsonMatch[0] : text);

    logger.info(`Generated ${flashcards.length} flashcards`);
    return flashcards;
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Error generating flashcards:', err);
    if (error instanceof RateLimitError || error instanceof ExternalServiceError) {
      throw error;
    }
    if (isQuotaError(err.message)) {
      throw new RateLimitError(quotaRetryMessage(err.message));
    }
    throw new Error(`Failed to generate flashcards: ${err.message}`);
  }
}

/**
 * Generate a comprehensive study guide
 */
export async function generateStudyGuide(content: string): Promise<string> {
  try {
    logger.info(`Generating study guide from ${content.length} characters`);

    const prompt = `Create a comprehensive study guide from this material. Include:

1. **Key Concepts** - Main ideas and definitions
2. **Important Details** - Facts, dates, formulas, etc.
3. **Study Tips** - How to remember this material
4. **Practice Questions** - 2-3 questions to test understanding

Study material:
${truncateContent(content, env.GEMINI_CONTENT_MAX_CHARS)}

Format with clear headings and bullet points.`;

    const guide = await generateGeminiText(
      prompt,
      { temperature: 0.4, maxOutputTokens: 2048 },
      'generate study guide'
    );

    logger.info('Study guide generated successfully');
    return guide;
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Error generating study guide:', err);
    if (error instanceof RateLimitError || error instanceof ExternalServiceError) {
      throw error;
    }
    if (isQuotaError(err.message)) {
      throw new RateLimitError(quotaRetryMessage(err.message));
    }
    throw new Error(`Failed to generate study guide: ${err.message}`);
  }
}
