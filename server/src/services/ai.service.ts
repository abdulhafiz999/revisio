import { GoogleGenerativeAI, type GenerationConfig } from '@google/generative-ai';
import { env } from '../config/environment';
import { logger } from '../utils/logger';
import { GeneratedQuestion, UserProfile } from '../models/types';
import { ExternalServiceError, RateLimitError } from '../middleware/errorHandler';

// ============================================================================
// AI Service Constants
// ============================================================================

/** Fallback models to try when the primary Gemini model is unavailable */
const GEMINI_FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'] as const;

/** Number of retries for transient errors (503, 502, 500) */
const TRANSIENT_RETRIES = 3;

/** Maximum number of chat messages to keep in context (prevents token overflow) */
const MAX_CHAT_HISTORY = 20;

// ============================================================================
// AI Prompts Configuration
// ============================================================================

const REVI_BASE_SYSTEM_PROMPT = `You are Revi, a friendly and knowledgeable AI study assistant built into Revisio — an AI-powered exam preparation platform for university students.

Your role:
- Help students understand academic concepts, theories, and subjects
- Explain difficult topics clearly and concisely
- Assist with exam preparation, study strategies, and learning techniques
- Answer quick study-related questions across all university subjects

Guidelines:
- Be encouraging and supportive — students may be stressed about exams
- Keep answers concise but thorough (aim for 2-4 paragraphs max for most answers)
- Use bullet points and structure when explaining complex topics
- If asked about something completely unrelated to studying or academics, politely redirect to study topics
- Always be professional yet friendly in tone

You are NOT a replacement for teachers or professional advice. If a student asks about mental health, medical, or legal issues, suggest they speak to a professional.`;

function buildReviSystemPrompt(profile?: UserProfile | null): string {
  if (!profile?.display_name && !profile?.program) {
    return REVI_BASE_SYSTEM_PROMPT;
  }

  const studentLines: string[] = [];
  if (profile.display_name) {
    studentLines.push(`- Name: ${profile.display_name}`);
  }
  if (profile.program) {
    studentLines.push(`- University program: ${profile.program}`);
  }

  return `${REVI_BASE_SYSTEM_PROMPT}

Current student context:
${studentLines.join('\n')}

Personalization rules:
- Act as a personal study tutor specialized in their university program (e.g. Medicine, Law, Computer Science, Physics).
- Address the student by name when natural (not every sentence).
- Use terminology, examples, and teaching style appropriate for their field of study.
- A Computer Science student should get CS-oriented explanations; a Medical student should get clinically relevant framing; a Law student should get legal reasoning patterns, etc.
- When a question spans multiple fields, answer from their program's perspective first, then broaden if helpful.
- If they ask about topics outside their program, still help — but connect back to their discipline when useful.`;
}

const buildQuestionPrompt = (
  count: number,
  difficulty: string,
  content: string
): string => `Create ${count} ${difficulty} multiple-choice questions from this study material.

Rules:
- 4 options per question; correct_answer must exactly match one option string
- explanation: one short sentence only
- Vary topics across the material

Material:
${content}

Return a JSON array only:
[{"question_text":"...","options":["...","...","...","..."],"correct_answer":"...","explanation":"..."}]`;

const buildSummarizePrompt = (content: string): string =>
  `Summarize this study material in 3-5 concise bullet points. Focus on the main concepts and key takeaways:

${content}

Return only the bullet points, no extra text.`;

const buildExplainPrompt = (concept: string, content: string): string =>
  `Based on this study material, explain the concept "${concept}" in simple terms. Include:
1. A clear definition
2. Why it's important
3. A simple example

Study material:
${content}

Keep the explanation concise and easy to understand.`;

const buildStudyGuidePrompt = (content: string): string =>
  `Create a comprehensive study guide from this material. Include:

1. **Key Concepts** - Main ideas and definitions
2. **Important Details** - Facts, dates, formulas, etc.
3. **Study Tips** - How to remember this material
4. **Practice Questions** - 2-3 questions to test understanding

Study material:
${content}

Format with clear headings and bullet points.`;

// ============================================================================
// Gemini Helper Utilities
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getModelsToTry(primaryModel: string): string[] {
  return [primaryModel, ...GEMINI_FALLBACK_MODELS.filter((m) => m !== primaryModel)];
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
  const message = error instanceof Error ? error.message : String(error);
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

function quotaRetryMessage(errorMessage: string, modelName: string): string {
  const secondsMatch = errorMessage.match(/retry in ([\d.]+)s/i);
  const seconds = secondsMatch ? Math.ceil(parseFloat(secondsMatch[1])) : 60;
  return (
    `Gemini API free-tier limit reached for model "${modelName}" ` +
    `(about ${seconds}s until you can retry). ` +
    `Try again later, switch GEMINI_MODEL in .env (e.g. gemini-2.5-flash), or enable billing in Google AI Studio.`
  );
}

function truncateContent(content: string, maxChars: number): string {
  const trimmed = content.trim();
  if (trimmed.length <= maxChars) return trimmed;
  logger.info(
    `Truncating note content from ${trimmed.length} to ${maxChars} characters for faster generation`
  );
  return `${trimmed.slice(0, maxChars)}\n\n[Note: content truncated for faster question generation.]`;
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

function validateQuestionInputs(content: string, count: number): void {
  if (!content.trim()) {
    throw new Error('Content cannot be empty');
  }
  if (count < 1 || count > 10) {
    throw new Error('Count must be between 1 and 10');
  }
}

function getRetryDelay(attempt: number): number {
  return (attempt + 1) * 1000;
}

// ============================================================================
// Gemini Client
// ============================================================================

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

// ============================================================================
// Core Engine
// ============================================================================

async function generateGeminiText(
  prompt: string,
  generationConfig: GenerationConfig,
  action: string
): Promise<string> {
  const models = getModelsToTry(env.GEMINI_MODEL);
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

        // Quota errors — switch to next model immediately (don't retry this model, try fallback)
        if (isQuotaError(err.message)) {
          logger.warn(`Gemini "${modelName}" quota exceeded for ${action}. Trying next fallback model...`);
          break;
        }

        // Transient errors — retry with backoff
        if (isTransientGeminiError(err) && attempt < TRANSIENT_RETRIES - 1) {
          const delayMs = getRetryDelay(attempt);
          logger.warn(
            `Gemini "${modelName}" busy (${action}), retry ${attempt + 2}/${TRANSIENT_RETRIES} in ${delayMs}ms`
          );
          await sleep(delayMs);
          continue;
        }

        // Model unavailable or max retries hit — try next model
        if (isTransientGeminiError(err) || isModelUnavailableError(err.message)) {
          logger.warn(`Gemini "${modelName}" unavailable for ${action}, trying next model`);
          break;
        }

        // Unknown error — throw immediately
        throw err;
      }
    }
  }

  // All models exhausted
  if (!lastError) {
    throw new ExternalServiceError('AI service unavailable. Please try again.');
  }
  if (isQuotaError(lastError.message)) {
    const failedModel = models[models.length - 1] || env.GEMINI_MODEL;
    throw new RateLimitError(quotaRetryMessage(lastError.message, failedModel));
  }
  if (isTransientGeminiError(lastError)) {
    throw new ExternalServiceError(
      `Gemini is busy right now (high demand). Wait a minute and try again, or switch GEMINI_MODEL in server/.env.`
    );
  }
  throw new Error(`Failed to ${action}: ${lastError.message}`);
}

// ============================================================================
// Question Generation
// ============================================================================

async function generateBatch(
  content: string,
  count: number,
  difficulty: 'easy' | 'medium' | 'hard'
): Promise<GeneratedQuestion[]> {
  const text = await generateGeminiText(
    buildQuestionPrompt(count, difficulty, content),
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
  // Validate inputs before hitting the API
  validateQuestionInputs(content, count);

  const started = Date.now();
  const truncated = truncateContent(content, env.GEMINI_CONTENT_MAX_CHARS);

  try {
    logger.info(
      `Generating ${count} ${difficulty} questions (${truncated.length} chars, model: ${env.GEMINI_MODEL})`
    );

    const questions = await generateBatch(truncated, count, difficulty);

    logger.info(`Successfully generated ${questions.length} questions in ${Date.now() - started}ms`);
    return questions;
  } catch (error: unknown) {
    if (error instanceof RateLimitError || error instanceof ExternalServiceError) throw error;
    const err = error as Error;
    logger.error('Error generating questions:', { message: err.message, stack: err.stack, name: err.name });
    if (isQuotaError(err.message)) throw new RateLimitError(quotaRetryMessage(err.message, env.GEMINI_MODEL));
    throw new Error(`Failed to generate questions: ${err.message}`);
  }
}

// ============================================================================
// Note Utilities
// ============================================================================

/**
 * Summarize note content into concise bullet points
 */
export async function summarizeNotes(content: string): Promise<string> {
  if (!content.trim()) throw new Error('Content cannot be empty');

  try {
    logger.info(`Summarizing ${content.length} characters of content`);
    const summary = await generateGeminiText(
      buildSummarizePrompt(truncateContent(content, env.GEMINI_CONTENT_MAX_CHARS)),
      { temperature: 0.3, maxOutputTokens: 1024 },
      'summarize notes'
    );
    logger.info('Summary generated successfully');
    return summary;
  } catch (error: unknown) {
    if (error instanceof RateLimitError || error instanceof ExternalServiceError) throw error;
    const err = error as Error;
    logger.error('Error summarizing notes:', err);
    throw new Error(`Failed to summarize notes: ${err.message}`);
  }
}

/**
 * Explain a specific concept from study notes
 */
export async function explainConcept(content: string, concept: string): Promise<string> {
  if (!content.trim()) throw new Error('Content cannot be empty');
  if (!concept.trim()) throw new Error('Concept cannot be empty');

  try {
    logger.info(`Explaining concept: ${concept}`);
    const explanation = await generateGeminiText(
      buildExplainPrompt(concept, truncateContent(content, env.GEMINI_CONTENT_MAX_CHARS)),
      { temperature: 0.4, maxOutputTokens: 1024 },
      'explain concept'
    );
    logger.info('Concept explained successfully');
    return explanation;
  } catch (error: unknown) {
    if (error instanceof RateLimitError || error instanceof ExternalServiceError) throw error;
    const err = error as Error;
    logger.error('Error explaining concept:', err);
    if (isQuotaError(err.message)) throw new RateLimitError(quotaRetryMessage(err.message, env.GEMINI_MODEL));
    throw new Error(`Failed to explain concept: ${err.message}`);
  }
}

/**
 * Generate a comprehensive study guide from note content
 */
export async function generateStudyGuide(content: string): Promise<string> {
  if (!content.trim()) throw new Error('Content cannot be empty');

  try {
    logger.info(`Generating study guide from ${content.length} characters`);
    const guide = await generateGeminiText(
      buildStudyGuidePrompt(truncateContent(content, env.GEMINI_CONTENT_MAX_CHARS)),
      { temperature: 0.4, maxOutputTokens: 2048 },
      'generate study guide'
    );
    logger.info('Study guide generated successfully');
    return guide;
  } catch (error: unknown) {
    if (error instanceof RateLimitError || error instanceof ExternalServiceError) throw error;
    const err = error as Error;
    logger.error('Error generating study guide:', err);
    if (isQuotaError(err.message)) throw new RateLimitError(quotaRetryMessage(err.message, env.GEMINI_MODEL));
    throw new Error(`Failed to generate study guide: ${err.message}`);
  }
}

// ============================================================================
// AI Chat Agent
// ============================================================================

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Chat with the Revi AI study assistant (multi-turn conversation)
 * Uses native Gemini startChat() for proper multi-turn context handling
 */
export async function chatWithAgent(
  messages: ChatMessage[],
  profile?: UserProfile | null
): Promise<string> {
  if (!messages.length) throw new Error('Messages cannot be empty');

  const models = getModelsToTry(env.GEMINI_MODEL);
  let lastError: Error | null = null;
  const recentMessages = messages.slice(-MAX_CHAT_HISTORY);
  const systemPrompt = buildReviSystemPrompt(profile);

  logger.info(`Chat request with ${recentMessages.length} messages. Primary model: ${env.GEMINI_MODEL}`);

  for (const modelName of models) {
    for (let attempt = 0; attempt < TRANSIENT_RETRIES; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
          systemInstruction: systemPrompt,
        });

        // Use native startChat() for proper multi-turn handling
        const chat = model.startChat({
          history: recentMessages.slice(0, -1).map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
        });

        const lastMessage = recentMessages[recentMessages.length - 1];
        const result = await chat.sendMessage(lastMessage.content);
        const reply = result.response.text().trim();

        if (modelName !== env.GEMINI_MODEL) {
          logger.info(`Chat agent used fallback model "${modelName}"`);
        }

        logger.info('Chat response generated successfully');
        return reply;
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        lastError = err;

        logger.error(`Error in chat agent for model ${modelName} (attempt ${attempt + 1}/${TRANSIENT_RETRIES}):`, err);

        // Quota errors — switch to next model immediately (don't retry this model, try fallback)
        if (isQuotaError(err.message)) {
          logger.warn(`Chat model "${modelName}" quota exceeded. Trying next fallback model...`);
          break;
        }

        // Transient errors — retry with backoff
        if (isTransientGeminiError(err) && attempt < TRANSIENT_RETRIES - 1) {
          const delayMs = getRetryDelay(attempt);
          logger.warn(
            `Chat model "${modelName}" busy, retry ${attempt + 2}/${TRANSIENT_RETRIES} in ${delayMs}ms`
          );
          await sleep(delayMs);
          continue;
        }

        // Model unavailable or max retries hit — try next model
        if (isTransientGeminiError(err) || isModelUnavailableError(err.message)) {
          logger.warn(`Chat model "${modelName}" unavailable, trying next model`);
          break;
        }

        // Unknown error — throw immediately
        throw err;
      }
    }
  }

  // All models exhausted
  if (!lastError) {
    throw new ExternalServiceError('AI chat service unavailable. Please try again.');
  }
  if (isQuotaError(lastError.message)) {
    const failedModel = models[models.length - 1] || env.GEMINI_MODEL;
    throw new RateLimitError(quotaRetryMessage(lastError.message, failedModel));
  }
  if (isTransientGeminiError(lastError)) {
    throw new ExternalServiceError(
      `Gemini is busy right now (high demand). Wait a minute and try again, or switch GEMINI_MODEL in server/.env.`
    );
  }
  throw new Error(`Failed to get chat response: ${lastError.message}`);
}

