import { Router } from 'express';
import { checkAuth } from './auth.middleware'; // Preserving existing middleware
import { registerController, loginController } from './auth.controller';
// import { googleConnect, calendarCallback } from './calendar.controller';

const authRouter = Router();

/**
 * Standard Authentication Routes
 * These handle the primary Cognito-based registration and login.
 */

// POST /api/auth/register - Cognito signup + createUser()
authRouter.post('/register', registerController);

// POST /api/auth/login - Cognito login, returns AccessToken
authRouter.post('/login', loginController);

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
