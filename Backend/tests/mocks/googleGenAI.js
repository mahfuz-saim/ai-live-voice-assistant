import { jest } from '@jest/globals';

// Mock the GoogleGenAI class and its methods
const mockGenerateContent = jest.fn();
const mockModels = {
  generateContent: mockGenerateContent,
};

// Default mock response
mockGenerateContent.mockResolvedValue({
  response: {
    text: () => "Mocked AI response",
  },
});

export class GoogleGenAI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.getGenerativeModel = jest.fn(() => ({
      generateContent: mockGenerateContent,
    }));
    // Start of new SDK structure mock if needed, 
    // but the code uses ai.models.generateContent or getGenerativeModel depending on version.
    // Looking at gemini.js: `const ai = new GoogleGenAI(...)` and then `ai.models.generateContent(...)` (Wait, usually it's getGenerativeModel or similar).
    // Let's re-read gemini.js carefully.
    // Line 10: const ai = new GoogleGenAI({ apiKey: ... });
    // Line 47: const response = await ai.models.generateContent(...) 
    // Make sure the mock matches this structure.
    this.models = mockModels;
  }
}

export const mockGenerateContentFn = mockGenerateContent;
