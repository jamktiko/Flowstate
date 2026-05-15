import { Router } from 'express';
import { checkAuth } from './auth.middleware'; // Preserving existing middleware
import {
  checkEmailAvailabilityController,
  registerController,
  loginController,
  confirmRegistrationController,
  socialCallbackController,
} from './auth.controller';
// import { googleConnect, calendarCallback } from './calendar.controller';

const authRouter = Router();

/**
 * Standard Authentication Routes
 * These handle the primary Cognito-based registration and login.
 */

// POST /api/auth/register - Cognito signup + createUser()
authRouter.post('/register', registerController);

// POST /api/auth/check-email - lightweight duplicate email check
authRouter.post('/check-email', checkEmailAvailabilityController);

// POST /api/auth/login - Cognito login, returns AccessToken
authRouter.post('/login', loginController);

// POST /api/auth/confirm - Cognito signup confirmation
authRouter.post('/confirm', confirmRegistrationController);

// POST /api/auth/social-callback - OAuth callback
authRouter.post('/social-callback', socialCallbackController);
/**
 * Google Calendar Integration Routes (Disabled for now)
 */

/**
 * GET /api/auth/calendar/connect
 * authRouter.get('/calendar/connect', checkAuth, googleConnect);
 */

/**
 * GET /api/auth/calendar/callback
 * authRouter.get('/calendar/callback', calendarCallback);
 */

export default authRouter;
// deploy comment
