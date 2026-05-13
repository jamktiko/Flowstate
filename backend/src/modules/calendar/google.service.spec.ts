import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Types } from 'mongoose';
import GoogleCalendarService from './google.service';
import * as tokenEncryption from '../../utils/tokenEncryption';

// ─────────────────────────────────────────────
// Mock setup
// ─────────────────────────────────────────────

vi.mock('../../utils/tokenEncryption');
vi.mock('../users/user.model');
vi.mock('axios');

import axios from 'axios';

// ─────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────

describe('GoogleCalendarService', () => {
  let service: GoogleCalendarService;

  beforeEach(() => {
    service = new GoogleCalendarService({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      redirectUri: 'http://localhost:3000/callback',
    });

    vi.clearAllMocks();
  });

  describe('getAuthUrl', () => {
    it('should generate a valid OAuth consent URL', () => {
      const state = 'test-state-token';
      const url = service.getAuthUrl(state);

      expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('state=test-state-token');
      expect(url).toContain('access_type=offline');
      expect(url).toContain('prompt=consent');
      expect(url).toContain('https://www.googleapis.com/auth/calendar.events');
    });

    it('should include both calendar scopes', () => {
      const state = 'test-state';
      const url = service.getAuthUrl(state);

      expect(url).toContain(
        encodeURIComponent('https://www.googleapis.com/auth/calendar.events'),
      );
      expect(url).toContain(
        encodeURIComponent('https://www.googleapis.com/auth/calendar.readonly'),
      );
    });
  });

  describe('exchangeCodeForTokens', () => {
    it('should exchange authorization code for tokens', async () => {
      const mockResponse = {
        data: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
          scope: 'https://www.googleapis.com/auth/calendar.events',
          token_type: 'Bearer',
        },
      };

      vi.mocked(axios.post).mockResolvedValueOnce(mockResponse);

      const result = await service.exchangeCodeForTokens('test-auth-code');

      expect(result).toEqual(mockResponse.data);
      expect(axios.post).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.objectContaining({
          code: 'test-auth-code',
          grant_type: 'authorization_code',
        }),
      );
    });

    it('should throw on failed code exchange', async () => {
      vi.mocked(axios.post).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        service.exchangeCodeForTokens('invalid-code'),
      ).rejects.toThrow('Failed to exchange code for tokens');
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh an expired access token', async () => {
      const mockResponse = {
        data: {
          access_token: 'new-access-token',
          expires_in: 3600,
          scope: 'https://www.googleapis.com/auth/calendar.events',
          token_type: 'Bearer',
        },
      };

      vi.mocked(axios.post).mockResolvedValueOnce(mockResponse);

      const result = await service.refreshAccessToken('test-refresh-token');

      expect(result).toEqual({
        accessToken: 'new-access-token',
        expiresIn: 3600,
      });
      expect(axios.post).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.objectContaining({
          refresh_token: 'test-refresh-token',
          grant_type: 'refresh_token',
        }),
      );
    });

    it('should throw on failed token refresh', async () => {
      vi.mocked(axios.post).mockRejectedValueOnce(
        new Error('Invalid refresh token'),
      );

      await expect(
        service.refreshAccessToken('invalid-refresh-token'),
      ).rejects.toThrow('Failed to refresh access token');
    });
  });

  describe('revokeToken', () => {
    it('should revoke a refresh token', async () => {
      vi.mocked(axios.post).mockResolvedValueOnce({ data: {} });

      await service.revokeToken('test-refresh-token');

      expect(axios.post).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/revoke',
        null,
        expect.objectContaining({
          params: { token: 'test-refresh-token' },
        }),
      );
    });

    it('should silently fail on revoke error', async () => {
      vi.mocked(axios.post).mockRejectedValueOnce(
        new Error('Token already revoked'),
      );

      // Should not throw
      await expect(
        service.revokeToken('already-revoked-token'),
      ).resolves.toBeUndefined();
    });
  });
});

describe('GoogleCalendarService - initialization', () => {
  it('should throw if required config is missing', () => {
    expect(
      () =>
        new GoogleCalendarService({
          clientId: '',
          clientSecret: 'secret',
          redirectUri: 'http://localhost',
        }),
    ).toThrow('GoogleCalendarService requires clientId');
  });

  it('should initialize with valid config', () => {
    const service = new GoogleCalendarService({
      clientId: 'id',
      clientSecret: 'secret',
      redirectUri: 'http://localhost',
    });

    expect(service).toBeDefined();
  });
});
