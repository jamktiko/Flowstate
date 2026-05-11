/**
 * auth.middleware.spec.ts — Unit tests for the checkAuth middleware
 *
 * WHY mock CognitoJwtVerifier instead of hitting real Cognito?
 * — Tests must be deterministic and offline-safe.
 * — We want to control exactly what the verifier returns or throws
 *   without needing valid AWS credentials or real tokens.
 *
 * We mock at the module boundary (aws-jwt-verify), not inside our own code.
 * This tests the middleware's *response* to what the verifier gives back,
 * which is the actual contract we own.
 *
 * COMMIT CHECKPOINT: "test(auth-middleware): checkAuth unit tests"
 */
import {
  vi,
  type MockedFunction,
  describe,
  it,
  expect,
  beforeEach,
} from 'vitest';
import { Request, Response, NextFunction } from 'express';

// ─────────────────────────────────────────────
// Mock aws-jwt-verify at module level
// ─────────────────────────────────────────────

// We create the mock before importing the middleware so the module receives
// the mocked version. vi.mock is hoisted automatically by Vitest.
const { mockVerify } = vi.hoisted(() => ({
  mockVerify: vi.fn(),
}));

vi.mock('aws-jwt-verify', () => ({
  CognitoJwtVerifier: {
    create: vi.fn(() => ({
      verify: mockVerify,
    })),
  },
}));

// Import AFTER the mock is in place
import { checkAuth } from './auth.middleware';

// ─────────────────────────────────────────────
// Helpers — minimal Express mock objects
// ─────────────────────────────────────────────

function makeReq(authHeader?: string): Partial<Request> {
  return {
    headers: {
      authorization: authHeader,
    } as Request['headers'],
  };
}

function makeRes(): {
  res: Partial<Response>;
  json: MockedFunction<any>;
  status: MockedFunction<any>;
} {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const res = { status, json } as unknown as Partial<Response>;
  return { res, json, status };
}

const next: NextFunction = vi.fn();

afterEach(() => {
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────

describe('checkAuth middleware', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const req = makeReq(undefined);
    const { res, status } = makeRes();

    await checkAuth(req as Request, res as Response, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header does not start with "Bearer "', async () => {
    const req = makeReq('Basic abc123');
    const { res, status } = makeRes();

    await checkAuth(req as Request, res as Response, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when the token is invalid or expired (verifier throws)', async () => {
    mockVerify.mockRejectedValueOnce(new Error('Token expired'));
    const req = makeReq('Bearer bad.token.here');
    const { res, status } = makeRes();

    await checkAuth(req as Request, res as Response, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() and attaches user payload to req when token is valid', async () => {
    const fakePayload = { sub: 'user-sub-123', username: 'testi' };
    mockVerify.mockResolvedValueOnce(fakePayload);

    const req = makeReq('Bearer valid.token.here') as any;
    const { res } = makeRes();

    await checkAuth(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledOnce();
    // Middleware should attach the Cognito payload for downstream handlers
    expect(req.user).toEqual(fakePayload);
  });

  it('error response body includes a human-readable message field', async () => {
    const req = makeReq(undefined);
    const { res, status, json } = makeRes();
    // Re-wire: status returns an object with json on it
    const jsonFn = vi.fn();
    status.mockReturnValue({ json: jsonFn });

    await checkAuth(req as Request, res as Response, next);

    expect(jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) }),
    );
  });
});
