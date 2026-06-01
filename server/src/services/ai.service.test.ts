import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chatWithAgent, generateQuestions } from './ai.service';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock environment
vi.mock('../config/environment', () => ({
  env: {
    GEMINI_API_KEY: 'test-key',
    GEMINI_MODEL: 'gemini-2.5-flash',
    GEMINI_CONTENT_MAX_CHARS: 10000,
  },
}));

vi.mock('@google/generative-ai', () => {
  const mockSendMessage = vi.fn();
  const mockStartChat = vi.fn(() => ({
    sendMessage: mockSendMessage,
  }));
  const mockGenerateContent = vi.fn();
  const mockGetGenerativeModel = vi.fn(() => ({
    startChat: mockStartChat,
    generateContent: mockGenerateContent,
  }));

  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    })),
  };
});

describe('AI Service Fallbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('chatWithAgent', () => {
    it('should successfully call primary model and return response if no error occurs', async () => {
      const mockGenAI = new GoogleGenerativeAI('test-key');
      const getModelMock = mockGenAI.getGenerativeModel as any;

      const mockSendMessage = vi.fn().mockResolvedValue({
        response: { text: () => 'Hello from primary model!' },
      });
      getModelMock.mockReturnValue({
        startChat: () => ({ sendMessage: mockSendMessage }),
      });

      const reply = await chatWithAgent([{ role: 'user', content: 'hello' }]);

      expect(reply).toBe('Hello from primary model!');
      expect(getModelMock).toHaveBeenCalledTimes(1);
      expect(getModelMock.mock.calls[0][0].model).toBe('gemini-2.5-flash');
    });

    it('should fall back to next model when primary model hits a 429 quota error', async () => {
      const mockGenAI = new GoogleGenerativeAI('test-key');
      const getModelMock = mockGenAI.getGenerativeModel as any;

      // Model 1: throws quota error
      const mockSendMessage1 = vi.fn().mockRejectedValue(new Error('Quota exceeded for metric'));
      // Model 2: succeeds
      const mockSendMessage2 = vi.fn().mockResolvedValue({
        response: { text: () => 'Hello from fallback model!' },
      });

      getModelMock
        .mockReturnValueOnce({
          startChat: () => ({ sendMessage: mockSendMessage1 }),
        })
        .mockReturnValueOnce({
          startChat: () => ({ sendMessage: mockSendMessage2 }),
        });

      const reply = await chatWithAgent([{ role: 'user', content: 'hello' }]);

      expect(reply).toBe('Hello from fallback model!');
      expect(getModelMock).toHaveBeenCalledTimes(2);
      expect(getModelMock.mock.calls[0][0].model).toBe('gemini-2.5-flash');
      expect(getModelMock.mock.calls[1][0].model).toBe('gemini-2.0-flash');
    });
  });

  describe('generateQuestions (uses generateGeminiText)', () => {
    it('should fall back to next model when primary model hits a 429 quota error', async () => {
      const mockGenAI = new GoogleGenerativeAI('test-key');
      const getModelMock = mockGenAI.getGenerativeModel as any;

      // Model 1: throws quota error
      const mockGenerateContent1 = vi.fn().mockRejectedValue(new Error('429 Too Many Requests'));
      // Model 2: succeeds
      const mockGenerateContent2 = vi.fn().mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify([
              {
                question_text: 'What is 2+2?',
                options: ['3', '4', '5', '6'],
                correct_answer: '4',
                explanation: 'Basic math',
              },
            ]),
        },
      });

      getModelMock
        .mockReturnValueOnce({
          generateContent: mockGenerateContent1,
        })
        .mockReturnValueOnce({
          generateContent: mockGenerateContent2,
        });

      const questions = await generateQuestions('Some study material content', 1, 'easy');

      expect(questions).toHaveLength(1);
      expect(questions[0].question_text).toBe('What is 2+2?');
      expect(getModelMock).toHaveBeenCalledTimes(2);
      expect(getModelMock.mock.calls[0][0].model).toBe('gemini-2.5-flash');
      expect(getModelMock.mock.calls[1][0].model).toBe('gemini-2.0-flash');
    });
  });
});
