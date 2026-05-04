import { Router } from 'express';
import { checkAuth } from '../auth/auth.middleware';
import {
  getMeController,
  updatePreferencesController,
  updateNotificationsController,
  deleteUserController,
} from './user.controller';

const router = Router();

// GET /users/me — returns the authenticated user's full profile
router.get('/me', checkAuth, getMeController);

// PATCH /users/me/preferences — updates theme, defaultView, defaultBoardId
router.patch('/me/preferences', checkAuth, updatePreferencesController);

// PATCH /users/me/notifications — updates enabled toggle and leadTime
router.patch('/me/notifications', checkAuth, updateNotificationsController);

router.delete('/me', checkAuth, deleteUserController);
export default router;
