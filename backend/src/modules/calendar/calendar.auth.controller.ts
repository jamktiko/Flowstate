import { Request, Response } from 'express';
import { getUserByCognitoSub } from '../users/user.service';
import { sendSuccess, sendError } from '../../utils/responseHelpers';
import {
  initiateLinking,
  completeLinking,
  unlinkGoogle,
  isGoogleCalendarLinked,
} from './calendar.auth.service';

const isLocalHost = (value: string): boolean => {
  return value.includes('localhost') || value.includes('127.0.0.1');
};

const getRequestOrigin = (req: Request): string => {
  const forwardedProto = req.header('x-forwarded-proto');
  const protocol = forwardedProto ? forwardedProto.split(',')[0] : req.protocol;
  const host =
    req.header('x-forwarded-host') || req.get('host') || 'localhost:8080';

  return `${protocol}://${host}`;
};

const getFrontendBaseUrl = (req: Request): string => {
  const configured = process.env.FRONTEND_URL?.trim();
  const requestOrigin = getRequestOrigin(req);

  // In production behind CloudFront/ALB, a localhost FRONTEND_URL is almost always a bad deploy env.
  if (configured) {
    if (isLocalHost(configured) && !isLocalHost(requestOrigin)) {
      return requestOrigin;
    }

    return configured;
  }

  return requestOrigin;
};

// ─────────────────────────────────────────────
// Helper — resolves cognitoSub → MongoDB user._id
// ─────────────────────────────────────────────
const resolveUserId = async (req: Request, res: Response) => {
  const sub = (req as any).user.sub; // cognitoSub from verified JWT
  const user = await getUserByCognitoSub(sub);
  if (!user) {
    sendError(res, 'User not found', 404);
    return null;
  }
  return user._id;
};

/**
 * POST /api/calendar/auth/link/google
 * Initiates the Google Calendar linking flow.
 * Returns the OAuth consent URL that the frontend should redirect to.
 * Frontend captures the callback with authorization code.
 */
export const initiateLinkingController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = await resolveUserId(req, res);
    if (!userId) return;

    const authUrl = initiateLinking(userId);

    console.log(
      '✅ Google Calendar OAuth auth URL returned to client:',
      authUrl,
    );

    return sendSuccess(res, { authUrl, message: 'Redirect user to this URL' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return sendError(res, message, 500);
  }
};

/**
 * GET /api/calendar/auth/callback/google?code=...&state=...
 * OAuth callback endpoint — handles the redirect from Google after user grants consent.
 * Exchanges authorization code for access and refresh tokens, stores them encrypted.
 * This endpoint is NOT protected by checkAuth middleware — user comes from Google redirect.
 */
export const oauthCallbackController = async (req: Request, res: Response) => {
  try {
    console.log('✅ Google Calendar OAuth callback received:', {
      url: req.originalUrl,
      query: req.query,
    });

    const frontendBaseUrl = getFrontendBaseUrl(req);

    // Extract authorization code and state from query parameters
    const { code, state, error, error_description } = req.query;

    // Handle OAuth errors (e.g., user denied consent)
    if (error) {
      const errorMsg = Array.isArray(error_description)
        ? error_description.join(', ')
        : String(error_description || 'OAuth flow cancelled or failed');
      // Redirect to frontend with error (or return error response)
      return res.redirect(
        `${frontendBaseUrl}/calendar-error?error=${encodeURIComponent(errorMsg)}`,
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return sendError(res, 'Missing authorization code or state token', 400);
    }

    // Complete the linking flow — validateState extracts userId from state token
    try {
      const user = await completeLinking(code as string, state as string);

      // Success — redirect to frontend success page with user ID as confirmation
      return res.redirect(
        `${frontendBaseUrl}/calendar-linked?success=true&userId=${user._id}`,
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return res.redirect(
        `${frontendBaseUrl}/calendar-error?error=${encodeURIComponent(errorMsg)}`,
      );
    }
  } catch (error) {
    const frontendBaseUrl = getFrontendBaseUrl(req);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.redirect(
      `${frontendBaseUrl}/calendar-error?error=${encodeURIComponent(message)}`,
    );
  }
};

/**
 * POST /api/calendar/auth/unlink/google
 * Unlinks user's Google Calendar account.
 * Revokes tokens on Google's end and clears them from the database.
 */
export const unlinkCalendarController = async (req: Request, res: Response) => {
  try {
    const userId = await resolveUserId(req, res);
    if (!userId) return;

    const user = await unlinkGoogle(userId);

    return sendSuccess(res, {
      message: 'Google Calendar account unlinked successfully',
      integrations: user.integrations,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return sendError(res, message, 400);
  }
};

/**
 * GET /api/calendar/auth/status/google
 * Returns the linking status of the user's Google Calendar account.
 */
export const linkingStatusController = async (req: Request, res: Response) => {
  try {
    const userId = await resolveUserId(req, res);
    if (!userId) return;

    const isLinked = await isGoogleCalendarLinked(userId);

    return sendSuccess(res, {
      provider: 'google',
      isLinked,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return sendError(res, message, 500);
  }
};
