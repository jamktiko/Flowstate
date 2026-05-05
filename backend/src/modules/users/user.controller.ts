import { Request, Response } from 'express';
import {
  getUserByCognitoSub,
  updatePreferences,
  updateNotifications,
  deleteUser,
  createUser, // Added: Required to sync Google users to MongoDB
} from './user.service';
import { sendSuccess, sendError } from '../../utils/responseHelpers';

/**
 * GET /users/me
 * Returns the authenticated user's full profile.
 * Bridges Cognito identity (sub) → MongoDB profile via getUserByCognitoSub.
 */
export const getMeController = async (req: Request, res: Response) => {
  try {
    const sub = (req as any).user.sub; // cognitoSub from verified JWT
    let user = await getUserByCognitoSub(sub); // Changed from const to let so we can assign a new user

    // CRITICAL: If a Google user logs in via Cognito, their MongoDB document won't exist yet.
    // Instead of returning 404, we must create it here.
    if (!user) {
      const email = (req as any).user.email;
      const firstName = (req as any).user.given_name || 'Google';
      const lastName = (req as any).user.family_name || 'User';

      user = await createUser({
        cognitoSub: sub,
        email,
        firstName,
        lastName,
        role: 'user',
      });
    }

    return sendSuccess(res, user);
  } catch (error) {
    return sendError(res, 'Internal server error', 500);
  }
};

/**
 * PATCH /users/me/preferences
 * Updates UI preferences (theme, defaultView, defaultBoardId).
 * Resolves sub → user._id first, then passes _id to service.
 */
export const updatePreferencesController = async (
  req: Request,
  res: Response,
) => {
  try {
    const sub = (req as any).user.sub;
    const user = await getUserByCognitoSub(sub);
    if (!user) return sendError(res, 'User not found', 404);

    const updated = await updatePreferences(user._id, req.body);
    return sendSuccess(res, updated);
  } catch (error) {
    return sendError(res, 'Internal server error', 500);
  }
};

/**
 * PATCH /users/me/notifications
 * Updates notification settings (enabled toggle, leadTime).
 * Resolves sub → user._id first, then passes _id to service.
 */
export const updateNotificationsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const sub = (req as any).user.sub;
    const user = await getUserByCognitoSub(sub);
    if (!user) return sendError(res, 'User not found', 404);

    const updated = await updateNotifications(user._id, req.body);
    return sendSuccess(res, updated);
  } catch (error) {
    return sendError(res, 'Internal server error', 500);
  }
};

/**
 * DELETE /users/me
 * Deletes the user account and all associated data (boards, calendar events).
 * Resolves sub → user._id first, then passes _id to service.
 */
export const deleteUserController = async (req: Request, res: Response) => {
  try {
    const sub = (req as any).user.sub;
    const user = await getUserByCognitoSub(sub);
    if (!user) return sendError(res, 'User not found', 404);

    await deleteUser(user._id);
    return sendSuccess(res, { message: 'User deleted successfully' });
  } catch (error) {
    return sendError(res, 'Internal server error', 500);
  }
};
