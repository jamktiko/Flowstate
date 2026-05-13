import { Types } from 'mongoose';
import { User } from '../users/user.model';
import {
  getGoogleCalendarService,
  IGoogleOAuthTokenResponse,
} from './google.service';
import { encrypt, decrypt } from '../../utils/tokenEncryption';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface ILinkingState {
  state: string;
  userId: Types.ObjectId;
  createdAt: number;
  expiresAt: number;
}

// ─────────────────────────────────────────────
// In-memory state store (in production, use Redis or MongoDB)
// ─────────────────────────────────────────────

import crypto from 'crypto';

// Store CSRF tokens temporarily to prevent cross-site request forgery
const stateStore = new Map<string, ILinkingState>();

// Clean up expired states every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [state, data] of stateStore.entries()) {
      if (now > data.expiresAt) {
        stateStore.delete(state);
      }
    }
  },
  5 * 60 * 1000,
);

// ─────────────────────────────────────────────
// State management
// ─────────────────────────────────────────────

/**
 * Generates a random CSRF state token for OAuth flow.
 * Stores it temporarily with the user ID and expiry time.
 * Encodes userId in state for retrieval in callback (no session required).
 * Format: random_nonce.userIdHex for easy parsing
 * @param userId - MongoDB user ID
 * @returns State string to include in OAuth redirect
 */
export function generateState(userId: Types.ObjectId): string {
  const nonce = crypto.randomBytes(16).toString('hex');
  const userIdHex = userId.toString();
  const state = `${nonce}.${userIdHex}`;

  stateStore.set(state, {
    state,
    userId,
    createdAt: Date.now(),
    expiresAt: Date.now() + 15 * 60 * 1000, // Expires in 15 minutes
  });

  return state;
}

/**
 * Validates a state token and returns the associated user ID.
 * Deletes the state token after validation (one-time use).
 * Decodes userId from state format: random_nonce.userIdHex
 * @param state - The state string from OAuth callback
 * @returns User ID if state is valid
 * @throws If state is invalid, expired, or not found
 */
export function validateState(state: string): Types.ObjectId {
  const data = stateStore.get(state);

  if (!data) {
    throw new Error('Invalid or expired state token');
  }

  if (Date.now() > data.expiresAt) {
    stateStore.delete(state);
    throw new Error('State token expired');
  }

  // One-time use — delete after validation
  stateStore.delete(state);

  return data.userId;
}

/**
 * Extracts userId from state token without validation.
 * Used in unauthenticated OAuth callback endpoint.
 * @param state - The state string from OAuth callback
 * @returns User ID from state, or null if invalid format
 */
export function extractUserIdFromState(state: string): Types.ObjectId | null {
  try {
    const parts = state.split('.');
    if (parts.length !== 2) {
      return null;
    }

    const userIdHex = parts[1];
    return new Types.ObjectId(userIdHex);
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Linking and unlinking
// ─────────────────────────────────────────────

/**
 * Initiates the Google Calendar linking flow.
 * Generates a state token for CSRF protection and returns the OAuth consent URL.
 * @param userId - MongoDB user ID of the user linking their account
 * @returns OAuth consent URL that the user should be redirected to
 */
export function initiateLinking(userId: Types.ObjectId): string {
  const state = generateState(userId);
  const googleService = getGoogleCalendarService();

  return googleService.getAuthUrl(state);
}

/**
 * Completes the Google Calendar linking flow after OAuth callback.
 * Exchanges the authorization code for tokens and stores them encrypted in the database.
 * @param code - Authorization code from OAuth callback
 * @param state - State token from OAuth callback
 * @returns User object with updated integrations
 */
export async function completeLinking(code: string, state: string) {
  // Validate state token (CSRF protection) and extract userId
  const userId = validateState(state);

  // Exchange authorization code for tokens
  const googleService = getGoogleCalendarService();
  let tokenResponse: IGoogleOAuthTokenResponse;

  try {
    tokenResponse = await googleService.exchangeCodeForTokens(code);
  } catch (error) {
    throw new Error(
      `Failed to exchange authorization code: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }

  // Load user and update their integrations
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Encrypt tokens before storing
  const encryptedAccessToken = encrypt(tokenResponse.access_token);
  const encryptedRefreshToken = tokenResponse.refresh_token
    ? encrypt(tokenResponse.refresh_token)
    : null;

  const expiryDate = Date.now() + tokenResponse.expires_in * 1000;

  // Update user's Google integration
  user.integrations.google = {
    isLinked: true,
    accessToken: encryptedAccessToken,
    refreshToken: encryptedRefreshToken,
    expiryDate,
  };

  await user.save();

  return user;
}

/**
 * Unlinks a user's Google Calendar account.
 * Revokes tokens on Google's end and clears them from the database.
 * @param userId - MongoDB user ID
 */
export async function unlinkGoogle(userId: Types.ObjectId) {
  // Load user
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Check if account is linked
  if (!user.integrations.google.isLinked) {
    throw new Error('Google Calendar account is not linked');
  }

  // Revoke refresh token on Google's end
  const refreshToken = user.integrations.google.refreshToken;
  if (refreshToken) {
    try {
      const decryptedRefreshToken = decrypt(refreshToken);
      const googleService = getGoogleCalendarService();
      await googleService.revokeToken(decryptedRefreshToken);
    } catch (error) {
      // Log but don't fail — token may already be revoked
      console.warn(
        'Failed to revoke Google Calendar token:',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  // Clear tokens from database
  user.integrations.google = {
    isLinked: false,
    accessToken: null,
    refreshToken: null,
    expiryDate: null,
  };

  await user.save();

  return user;
}

/**
 * Checks if a user has an active Google Calendar link.
 * @param userId - MongoDB user ID
 * @returns Boolean indicating if account is linked and has valid tokens
 */
export async function isGoogleCalendarLinked(
  userId: Types.ObjectId,
): Promise<boolean> {
  const user = await User.findById(userId);
  if (!user) {
    return false;
  }

  return (
    user.integrations.google.isLinked && !!user.integrations.google.accessToken
  );
}
