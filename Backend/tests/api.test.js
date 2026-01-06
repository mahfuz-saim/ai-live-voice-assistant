import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../src/server.js';

describe('Server & Session API', () => {
  let server;
  let createdSessionId;

  beforeAll((done) => {
    // Start the server on a random port for testing
    server = app.listen(0, () => {
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it('GET / should return health status', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'running');
  });

  it('should handle 404 for unknown routes', async () => {
    const res = await request(app).get('/unknown-route');
    expect(res.statusCode).toEqual(404);
  });
  
  // Note: We are skipping DB writes to avoid polluting the database 
  // without a proper test DB setup.
  // In a real scenario, you would use a separate test database.
});
