import { Router } from 'express';
import { checkAuth } from '../auth/auth.middleware';
import {
  initiateLinkingController,
  oauthCallbackController,
  unlinkCalendarController,
  linkingStatusController,
} from './calendar.auth.controller';

const router = Router();

// ─────────────────────────────────────────────
// Google Calendar OAuth routes
// ─────────────────────────────────────────────

// POST /api/calendar/auth/link/google
// Initiates the Google Calendar linking flow.
// Protected by checkAuth middleware — only authenticated users can link their account.
// Returns OAuth consent URL for frontend to redirect to.
router.post('/link/google', checkAuth, initiateLinkingController);

// GET /api/calendar/auth/callback/google?code=...&state=...
// OAuth callback endpoint from Google.
// NOT protected by checkAuth — Google redirects here after user grants consent.
// Exchanges authorization code for tokens and stores them encrypted.
router.get('/callback/google', oauthCallbackController);

// POST /api/calendar/auth/unlink/google
// Unlinks user's Google Calendar account.
// Protected by checkAuth middleware.
// Revokes tokens on Google's end and clears them from the database.
router.post('/unlink/google', checkAuth, unlinkCalendarController);

// GET /api/calendar/auth/status/google
// Returns the linking status of the user's Google Calendar account.
// Protected by checkAuth middleware.
router.get('/status/google', checkAuth, linkingStatusController);

export default router;
