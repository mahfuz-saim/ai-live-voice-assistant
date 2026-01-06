
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Helper to create a chainable mock builder
const createMockBuilder = (result = []) => {
    return {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue(result),
        // Make it awaitable
        then: (resolve) => resolve(result)
    };
};

const mockDb = {
    insert: jest.fn(),
    select: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
};

// Mock the db module
jest.unstable_mockModule('../../src/db/index.js', () => ({
    db: mockDb
}));

jest.unstable_mockModule('../../src/db/schema.js', () => ({
    users: { name: 'users' },
    sessions: { name: 'sessions' },
    sessionHistory: { name: 'session_history' }
}));

jest.unstable_mockModule('../../src/utils/gemini.js', () => ({
    generateSessionTitle: jest.fn(() => Promise.resolve("Generated Title"))
}));

const { default: sessionRouter } = await import('../../src/routes/session.js');

const app = express();
app.use(express.json());
app.use('/', sessionRouter);

describe('Session Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /users', () => {
        it('should create a user', async () => {
            const newUser = { id: 1, name: 'Test', email: 't@t.com' };
            mockDb.insert.mockReturnValue(createMockBuilder([newUser]));

            const res = await request(app)
                .post('/users')
                .send({ name: 'Test', email: 't@t.com' });
            
            expect(res.statusCode).toBe(200);
            expect(res.body.user).toEqual(newUser);
        });
    });

    describe('POST /save-session', () => {
        it('should save session and history', async () => {
            // First insert (session) returns session ID
            mockDb.insert
                .mockReturnValueOnce(createMockBuilder([{ id: 123, title: 'Title' }]))
                .mockReturnValueOnce(createMockBuilder([])); // Second insert (history)

            const res = await request(app)
                .post('/save-session')
                .send({ userId: 1, messages: [] });
            
            expect(res.statusCode).toBe(200);
            expect(res.body.sessionId).toBe(123);
        });
    });

    describe('GET /sessions/:id', () => {
        it('should return session', async () => {
            const session = { id: 1, title: 'Session' };
            const history = { id: 1, sessionId: 1 };

            // Mock implementation sequence for select()
            mockDb.select
                .mockReturnValueOnce(createMockBuilder([session])) // First call: session
                .mockReturnValueOnce(createMockBuilder([history])); // Second call: history

            const res = await request(app).get('/sessions/1');
            expect(res.statusCode).toBe(200);
            expect(res.body.session.id).toBe(1);
        });

         it('should return 404 if session not found', async () => {
            mockDb.select.mockReturnValueOnce(createMockBuilder([])); // Empty result

            const res = await request(app).get('/sessions/999');
            expect(res.statusCode).toBe(404);
        });
    });
});
