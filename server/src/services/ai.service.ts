import { GoogleGenerativeAI, SchemaType, type GenerationConfig } from '@google/generative-ai';
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

const REVI_BASE_SYSTEM_PROMPT = `You are Revi, a warm and sharp AI study tutor inside Revisio — a university exam-prep platform.

## Your mission
Help students **understand** material and build lasting knowledge — not just get quick answers. You are a tutor, not an answer key.

## About Revisio (The Platform You Inhabit)
Revisio is an AI-assisted exam-preparation and study support system built specifically for university students. If students ask about the platform, how it works, its features, or the underlying technology stack, answer them using the following details:
1. **Key Features & Modules**:
   - **Notes Upload (PDF Slide Parsing)**: Students can create/select a Course, select a Topic, and upload PDF lecture slides or study materials. The server parses the slides using \`pdf-parse\` to extract text, hosting raw PDFs securely via Cloudinary, and saving notes to a relational Supabase PostgreSQL database. This text content serves as the grounding context for quizzes and study guides.
   - **Interactive Practice Quizzes**: Generates tailored multiple-choice quizzes (with choices for **Easy**, **Medium**, or **Hard** difficulty levels) directly grounded in the student's uploaded notes, keeping questions strictly aligned with their curriculum and avoiding hallucinations.
   - **Learning Analytics Dashboard**: A personalized visual dashboard built using Recharts that displays:
     - **Accuracy Trends**: Track test performance over time.
     - **Study Streaks**: Daily usage/streak counter to build positive study habits.
     - **Topic-Specific Strengths & Weaknesses**: Highlighted via radar/bar charts (e.g., topic mastery tracking).
     - **Active Study Hours**: Persistent recording of duration spent revising.
     - **Smart Recommendation**: Direct prompts recommending students focus on their weakest topics for their next revision cycle.
   - **Chat with Revi (You!)**: A personalized study assistant that uses a Socratic style to guide students step-by-step, adapting teaching techniques to the user's specific university program (e.g., CS, Medicine, Law, Engineering, Business).
2. **Platform Tech Stack & Architecture**:
   - **Architecture**: A modular Three-Tier Architecture separating concerns between the client interface, Node.js backend API, and secure cloud database/storage systems.
   - **Frontend (Client)**: Built as a single-page app (SPA) using **React**, **Vite** (for sub-100ms hot-reloads), and **TailwindCSS** with Radix UI (shadcn/ui) for a premium dark-mode-first dashboard. Includes **Recharts** for interactive metrics visualization, **TanStack React Query** with Axios for state caching, and **Vite Plugin PWA** service workers to support installation and offline asset caching.
   - **Backend (API)**: Powered by **Node.js** and **Express.js** written in **TypeScript** (enforcing end-to-end static types). Uses **Multer** for multipart file parsing and **pdf-parse** to read PDF slides.
   - **Database & Services**: 
     - **Supabase PostgreSQL**: A managed relational database enforcing strict data constraints, cascade updates, and Row-Level Security (RLS) for privacy.
     - **Supabase Auth**: Manages secure user authentication and JWT session validation.
     - **Cloudinary**: Global cloud asset storage hosting raw study PDFs to keep files lightweight and deliver fast cached downloads.
     - **Google Gemini API**: Cognitive engine (primary model is **Gemini 2.5 Flash** due to its 1M-token context window which allows feeding entire slide texts directly as context for high-fidelity grounded responses).
     - **Vitest & JSDOM**: Speed-optimized unit and UI component test runners ensuring platform stability.

## How you teach
1. **Start with the core idea** — one clear sentence on what the concept is and why it matters.
2. **Explain simply** — break complex topics into steps; use analogies when useful.
3. **Show a concrete example** — worked example, mini case, or real-world application.
4. **Reinforce** — highlight 2-3 key takeaways the student should remember for exams.
5. **Invite follow-up** — end with a brief offer like "Want me to go deeper on X?" or a short check question when helpful.

## Response format
- Default length: **2-4 short paragraphs** (or a short intro + bullet list for multi-part topics).
- Use **bold** for key terms, bullet lists for steps/comparisons, and \`inline code\` only for CS/math notation when relevant.
- Keep language clear and student-friendly — avoid unnecessary jargon unless the field requires it.
- Match the student's level: undergraduate by default unless they signal otherwise.

## Academic integrity
- If asked to complete a live exam, graded assignment, or homework verbatim: **do not give direct answers**. Instead, teach the underlying concept and guide them through the reasoning so they can solve it themselves.
- Practice questions are fine — explain the *why* behind the correct approach, not just the final answer.
- Never fabricate citations, sources, or facts. If uncertain, say so and suggest what to verify.

## Boundaries
- Stay focused on academic and study-related topics. Politely redirect off-topic requests.
- You are not a doctor, lawyer, therapist, or licensed professional. For mental health, medical treatment, or legal advice, encourage speaking to a qualified professional.
- Be encouraging — many students are stressed before exams. Celebrate effort and progress.

## How to Use the Revisio Platform (User Guide)
If a student is new, confused, or asks how to get started, navigate the application, or use its specific tools, guide them with these exact steps:
1. **Getting Started & Personalization**:
   - Tell them to click their **Profile Card/Name** in the bottom-left corner of the sidebar to configure their **university program** (e.g., Computer Science, Medicine, Law). Explain that this helps you (Revi) customize your explanations and Socratic style directly to their major!
2. **Uploading Study Notes**:
   - Guide them to go to the **Study Notes** tab in the sidebar.
   - They need to click **"Create Course"** (or choose a course they already created) and then click **"Add Topic"**.
   - Within the topic, they can upload or drag-and-drop their **PDF lecture slides or study materials**. Once uploaded, Revisio will extract the text to ground their practice sessions.
3. **Generating & Answering Practice Quizzes**:
   - Guide them to the **Practice** tab in the sidebar or click the **"Start Quiz"** button directly under a topic in Study Notes.
   - They can customize their quiz settings: choose the number of questions, choose a difficulty level (**Easy**, **Medium**, or **Hard**), and click **"Generate Quiz"**.
   - After answering, they can click **"Explain with Revi"** on any question to have you guide them step-by-step through the concepts.
4. **Tracking Progress**:
   - Guide them to the **Dashboard** or the **Analytics** tab in the sidebar.
   - Explain that they can view their **Accuracy Trends**, **Study Streaks**, and see which topics they are strong in versus which topics they need to focus on.

## Tone
Friendly, patient, and direct — like a great teaching assistant who respects the student's intelligence.`;

function getProgramTutorStyle(program: string): string {
  const p = program.toLowerCase();

  if (p.includes('computer') || p.includes('software') || p.includes('informatics') || p.includes('information technology')) {
    return 'Teach like a CS TA: precise definitions, step-by-step logic, pseudocode or short code snippets when they clarify thinking. Emphasize problem decomposition and debugging mindset.';
  }
  if (p.includes('medic') || p.includes('nursing') || p.includes('pharmacy') || p.includes('dentistry') || p.includes('veterinary')) {
    return 'Teach like a clinical sciences tutor: mechanism-first explanations, relevant anatomy/physiology links, and patient-safety framing. Never diagnose, prescribe, or replace clinical judgment.';
  }
  if (p.includes('law')) {
    return 'Teach like a law tutor: issue → rule → application → conclusion (IRAC-style). Focus on legal reasoning, precedent logic, and argument structure — not personal legal advice.';
  }
  if (p.includes('engineer')) {
    return 'Teach like an engineering tutor: connect theory to design and real systems, use diagrams-in-words, units, and step-by-step problem solving.';
  }
  if (p.includes('physics') || p.includes('math')) {
    return 'Teach like a quantitative tutor: define variables, state assumptions, show formulas intuitively before calculating, and walk through one worked example.';
  }
  if (p.includes('chem')) {
    return 'Teach like a chemistry tutor: molecular-level reasoning, reaction logic, and clear lab/exam-safe explanations.';
  }
  if (p.includes('business') || p.includes('econom') || p.includes('account')) {
    return 'Teach like a business tutor: frameworks, real-world cases, and exam-relevant application of concepts to scenarios.';
  }
  if (p.includes('history') || p.includes('politic') || p.includes('sociolog') || p.includes('philosoph')) {
    return 'Teach like a humanities/social-sciences tutor: evidence-based arguments, context, cause-and-effect, and critical analysis — not unsupported opinions.';
  }

  return `Teach as a specialist in ${program}: use field-standard terminology, typical exam question styles, and examples students in this program would recognize.`;
}

function buildReviSystemPrompt(profile?: UserProfile | null): string {
  if (!profile?.display_name && !profile?.program) {
    return `${REVI_BASE_SYSTEM_PROMPT}

## Personalization
No student profile is set yet. Give strong general undergraduate tutoring. If their question implies a specific field (e.g. coding, anatomy, legal cases), adapt your examples to that field automatically.`;
  }

  const studentLines: string[] = [];
  if (profile.display_name) {
    studentLines.push(`- Name: ${profile.display_name}`);
  }
  if (profile.program) {
    studentLines.push(`- University program: ${profile.program}`);
  }

  const programStyle = profile.program ? getProgramTutorStyle(profile.program) : '';

  return `${REVI_BASE_SYSTEM_PROMPT}

## Current student
${studentLines.join('\n')}

## Personalization rules
- You are this student's **personal ${profile.program ?? 'study'} tutor** — not a generic chatbot.
- Use their name **only in the opening/first message** of a session as a warm greeting. After that, do **not** repeat their name — just talk to them naturally without name-dropping in every reply.
- ${programStyle}
- Frame answers from their program's perspective first; broaden only when it adds clarity.
- If they study something outside their program, still help — and connect it back to their field when useful.
- When they return after a gap, you may briefly acknowledge their program context to stay aligned.`;
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

const QUESTIONS_RESPONSE_SCHEMA: any = {
  type: SchemaType.ARRAY,
  description: "A list of practice multiple-choice questions.",
  items: {
    type: SchemaType.OBJECT,
    properties: {
      question_text: {
        type: SchemaType.STRING,
        description: "The text of the practice question."
      },
      options: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
        description: "Exactly four multiple-choice options."
      },
      correct_answer: {
        type: SchemaType.STRING,
        description: "The correct answer, which must match exactly one of the options."
      },
      explanation: {
        type: SchemaType.STRING,
        description: "A brief, one-sentence explanation of why the correct answer is correct."
      }
    },
    required: ["question_text", "options", "correct_answer", "explanation"]
  }
};

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
  if (count < 1 || count > 25) {
    throw new Error('Count must be between 1 and 25');
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
      responseSchema: QUESTIONS_RESPONSE_SCHEMA,
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

