
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock the Gemini utils BEFORE importing the route
jest.unstable_mockModule('../../src/utils/gemini.js', () => ({
    sendChatMessage: jest.fn(),
    getContextualResponse: jest.fn(),
}));

const { sendChatMessage, getContextualResponse } = await import('../../src/utils/gemini.js');

// Import the router
// Note: Dynamic import needed after mocking
const { default: chatRouter } = await import('../../src/routes/chat.js');

const app = express();
app.use(express.json());
app.use('/chat', chatRouter);

describe('Chat Routes', () => {
    beforeEach(() => {
        sendChatMessage.mockClear();
        getContextualResponse.mockClear();
        sendChatMessage.mockResolvedValue("Mocked Text Response");
        getContextualResponse.mockResolvedValue("Mocked Contextual Response");
    });

    describe('POST /chat', () => {
        it('should return 400 if message is missing', async () => {
            const res = await request(app)
                .post('/chat')
                .send({});
            
            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should handle text-only chat', async () => {
            const res = await request(app)
                .post('/chat')
                .send({ message: "Hello" });
            
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.response).toBe("Mocked Text Response");
            expect(sendChatMessage).toHaveBeenCalledWith("Hello", []);
        });

        it('should handle chat with screen context', async () => {
            const res = await request(app)
                .post('/chat')
                .send({ 
                    message: "Analyze this",
                    includeScreen: true,
                    screenFrame: "base64data"
                });
            
            expect(res.statusCode).toBe(200);
            expect(res.body.response).toBe("Mocked Contextual Response");
            expect(getContextualResponse).toHaveBeenCalled();
        });

        it('should handle API errors gracefully', async () => {
            sendChatMessage.mockRejectedValue(new Error("AI Error"));
            
            const res = await request(app)
                .post('/chat')
                .send({ message: "Hello" });
            
            expect(res.statusCode).toBe(500);
            expect(res.body.error).toBe("Failed to process chat message");
        });
    });

    describe('POST /chat/analyze', () => {
        it('should analyze content', async () => {
             const res = await request(app)
                .post('/chat/analyze')
                .send({ content: "Some code" });
            
            expect(res.statusCode).toBe(200);
            expect(sendChatMessage).toHaveBeenCalled();
        });

        it('should require content', async () => {
            const res = await request(app)
               .post('/chat/analyze')
               .send({});
           
           expect(res.statusCode).toBe(400);
       });
    });
});
