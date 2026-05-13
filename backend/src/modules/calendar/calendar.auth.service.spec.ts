import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Types } from 'mongoose';
import {
  generateState,
  validateState,
  extractUserIdFromState,
  completeLinking,
  unlinkGoogle,
} from './calendar.auth.service';

// ─────────────────────────────────────────────
// Mock setup
// ─────────────────────────────────────────────

vi.mock('./google.service');
vi.mock('../users/user.model');

// ─────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────

describe('Calendar Auth Service', () => {
  const userId = new Types.ObjectId();

  describe('generateState', () => {
    it('should generate a state token with encoded user ID', () => {
      const state = generateState(userId);

      expect(state).toBeDefined();
      expect(state).toContain('.');

      const [, userIdHex] = state.split('.');
      expect(userIdHex).toBe(userId.toString());
    });

    it('should generate unique state tokens', () => {
      const state1 = generateState(userId);
      const state2 = generateState(userId);

      expect(state1).not.toBe(state2);
    });
  });

  describe('extractUserIdFromState', () => {
    it('should extract user ID from valid state token', () => {
      const state = generateState(userId);
      const extracted = extractUserIdFromState(state);

      expect(extracted).toBeDefined();
      expect(extracted?.toString()).toBe(userId.toString());
    });

    it('should return null for invalid state format', () => {
      const invalidState = 'invalid-format';
      const extracted = extractUserIdFromState(invalidState);

      expect(extracted).toBeNull();
    });

    it('should return null for malformed user ID', () => {
      const invalidState = 'nonce.notahexid';
      const extracted = extractUserIdFromState(invalidState);

      expect(extracted).toBeNull();
    });
  });

  describe('validateState', () => {
    it('should validate and delete state token', () => {
      const state = generateState(userId);
      const validated = validateState(state);

      expect(validated.toString()).toBe(userId.toString());
    });

    it('should throw on invalid state token', () => {
      expect(() => validateState('invalid-state')).toThrow(
        'Invalid or expired state token',
      );
    });

    it('should throw on state token reuse (one-time use)', () => {
      const state = generateState(userId);
      validateState(state); // First use succeeds

      // Second use should throw
      expect(() => validateState(state)).toThrow(
        'Invalid or expired state token',
      );
    });

    it('should throw on expired state token', () => {
      const state = generateState(userId);

      // Fast-forward time to expire the token (15 minutes)
      vi.useFakeTimers();
      vi.setSystemTime(Date.now() + 16 * 60 * 1000);

      expect(() => validateState(state)).toThrow('State token expired');

      vi.useRealTimers();
    });
  });
});

describe('Calendar Auth Service - Linking/Unlinking', () => {
  // These tests would require mocking the User model and Google Calendar service
  // For now, test structure is defined

  it('should be tested with mocked dependencies', () => {
    // In a real scenario:
    // 1. Mock User model methods
    // 2. Mock GoogleCalendarService
    // 3. Test completeLinking(), unlinkGoogle(), isGoogleCalendarLinked()
    // 4. Verify token encryption/decryption
    expect(true).toBe(true);
  });
});
