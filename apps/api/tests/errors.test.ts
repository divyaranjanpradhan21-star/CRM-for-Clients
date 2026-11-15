import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { z } from 'zod';
import express from 'express';

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://x:x@localhost:5432/x';
  process.env.JWT_ACCESS_SECRET = 'a'.repeat(32);
  process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
});

async function buildApp() {
  const { validate } = await import('../src/middleware/validate');
  const { errorHandler, notFoundHandler } = await import('../src/middleware/errorHandler');
  const { requestId } = await import('../src/middleware/requestId');
  const app = express();
  app.use(requestId, express.json());
  app.post('/x', validate({ body: z.object({ email: z.string().email() }) }), (_req, res) => res.json({ success: true }));
  app.use(notFoundHandler, errorHandler);
  return app;
}

describe('error handling & validation', () => {
  it('rejects invalid body with 422 and field details', async () => {
    const res = await request(await buildApp()).post('/x').send({ email: 'nope' });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.body[0].path).toBe('email');
    expect(res.body.error.requestId).toBeTruthy();
  });
  it('accepts valid body', async () => {
    const res = await request(await buildApp()).post('/x').send({ email: 'a@b.co' });
    expect(res.status).toBe(200);
  });
  it('returns 400 for malformed JSON', async () => {
    const res = await request(await buildApp()).post('/x').set('content-type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
  });
  it('returns standardized 404', async () => {
    const res = await request(await buildApp()).get('/missing');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
