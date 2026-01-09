
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Create the mock function in the outer scope
const mockGenerateContent = jest.fn();

// Mock the module
jest.unstable_mockModule('@google/genai', () => {
    return {
        GoogleGenAI: class {
            constructor() {
                this.models = {
                    generateContent: mockGenerateContent
                };
            }
        }
    };
});

// Import the module under test AFTER mocking
const { getGeminiModelName, sendChatMessage, analyzeScreenFrame, generateSessionTitle } = await import('../../src/utils/gemini.js');

describe('Gemini Utils', () => {
    beforeEach(() => {
        mockGenerateContent.mockClear();
        // Setup default success response
        mockGenerateContent.mockResolvedValue({
            text: "Mocked AI response"
        });
    });

    describe('getGeminiModelName', () => {
        it('should return correct model name', () => {
            expect(getGeminiModelName(false)).toBe('gemini-2.5-flash');
        });
    });

    describe('sendChatMessage', () => {
        it('should call generateContent', async () => {
            await sendChatMessage('Hello');
            expect(mockGenerateContent).toHaveBeenCalled();
            const args = mockGenerateContent.mock.calls[0][0];
            expect(args.contents).toContain('User: Hello');
        });
        
        it('should propagate API errors', async () => {
            mockGenerateContent.mockRejectedValue(new Error('API Fail'));
            await expect(sendChatMessage('Hi')).rejects.toThrow();
        });
    });

    describe('analyzeScreenFrame', () => {
        it('should call with image', async () => {
            const base64 = 'SGVsbG8='; // "Hello" in base64
            await analyzeScreenFrame(base64, 'goal');
            expect(mockGenerateContent).toHaveBeenCalled();
            // detailed inspection of args is possible here
        });
    });

    describe('generateSessionTitle', () => {
        it('should assume title from AI response', async () => {
            mockGenerateContent.mockResolvedValue({
                text: "My Title"
            });
            const title = await generateSessionTitle([{content: 'hi'}]);
            expect(title).toBe("My Title");
        });
    });
});
