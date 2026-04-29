/**
 * app.spec.ts — Integration smoke tests for the Express app
 *
 * Uses Supertest to send real HTTP requests through the Express app without
 * starting an actual server. These tests verify that the app wires up
 * correctly at a high level — correct status codes, basic response shapes,
 * and that the auth guard is connected to the auth-test route.
 *
 * No database connection needed here — these routes don't touch Mongo.
 *
 * COMMIT CHECKPOINT: "test(app): health and auth route smoke tests"
 */

import request from 'supertest';
import { vi } from 'vitest';

// Mock aws-jwt-verify so importing app.ts (which imports auth middleware)
// doesn't fail when Cognito env vars are absent in the test environment.
vi.mock('aws-jwt-verify', () => ({
  CognitoJwtVerifier: {
    create: vi.fn(() => ({
      verify: vi.fn().mockRejectedValue(new Error('Token invalid')),
    })),
  },
}));

import app from './app';

// ─────────────────────────────────────────────
// Basic API routes
// ─────────────────────────────────────────────

describe('GET /api', () => {
  it('returns 200 and a running message', async () => {
    const res = await request(app).get('/api');

    expect(res.status).toBe(200);
    expect(res.text).toContain('running');
  });
});

describe('GET /api/health', () => {
  it('returns 200 OK', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.text).toBe('OK');
  });
});

// ─────────────────────────────────────────────
// Auth-guarded route
// ─────────────────────────────────────────────

describe('GET /api/auth-test', () => {
  it('returns 401 when no Authorization header is provided', async () => {
    const res = await request(app).get('/api/auth-test');

    expect(res.status).toBe(401);
  });

  it('returns 401 when token is invalid', async () => {
    const res = await request(app)
      .get('/api/auth-test')
      .set('Authorization', 'Bearer bad.token');

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────
// 404 — unknown route
// ─────────────────────────────────────────────

describe('Unknown routes', () => {
  it('returns 404 for a completely unknown path', async () => {
    const res = await request(app).get('/api/does-not-exist');

    // Express default behaviour — no custom 404 handler yet
    expect(res.status).toBe(404);
  });
});
