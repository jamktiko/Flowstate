import { Request, Response } from 'express';
import {
  getMe,
  updatePreferences,
  updateNotifications,
  deleteUser,
} from './user.service';
import { sendSuccess, sendError } from '../../utils/responseHelpers';

/**
 * GET /users/me
 * Returns the authenticated user's full profile from MongoDB.
 * sub is extracted from the JWT payload attached by checkAuth middleware.
 */
export const getMeController = async (req: Request, res: Response) => {
  try {
    const sub = (req as any).user.sub; // cognitoSub from verified JWT

    const user = await getMe(sub);

    if (!user) return sendError(res, 'User not found', 404);

    return sendSuccess(res, user);
  } catch (error) {
    return sendError(res, 'Internal server error', 500);
  }
};

/**
 * PATCH /users/me/preferences
 * Updates the authenticated user's UI preferences (theme, defaultView, defaultBoardId).
 * Only fields provided in req.body are updated — other fields are left untouched.
 */
export const updatePreferencesController = async (
  req: Request,
  res: Response,
) => {
  try {
    const sub = (req as any).user.sub; // cognitoSub from verified JWT
    const data = req.body; // partial preferences object from client

    const preferences = await updatePreferences(sub, data);

    if (!preferences) return sendError(res, 'User not found', 404);

    return sendSuccess(res, preferences);
  } catch (error) {
    return sendError(res, 'Internal server error', 500);
  }
};

/**
 * PATCH /users/me/notifications
 * Updates the authenticated user's notification settings (enabled toggle, leadTime).
 * Only fields provided in req.body are updated — other fields are left untouched.
 */
export const updateNotificationsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const sub = (req as any).user.sub; // cognitoSub from verified JWT
    const data = req.body; // partial notifications object from client

    const notifications = await updateNotifications(sub, data);

    if (!notifications) return sendError(res, 'User not found', 404);

    return sendSuccess(res, notifications);
  } catch (error) {
    return sendError(res, 'Internal server error', 500);
  }
};

/**
 * DELETE /users/me
 * Deletes the authenticated user's account and all associated data.
 * Removes the user document, all their boards, and all their calendar events.
 * Uses Promise.all() in the service layer to delete from all collections in parallel.
 */
export const deleteUserController = async (req: Request, res: Response) => {
  try {
    const sub = (req as any).user.sub; // cognitoSub from verified JWT

    const result = await deleteUser(sub);

    // deleteUser returns null if no user was found with this cognitoSub
    if (!result) return sendError(res, 'User not found', 404);

    return sendSuccess(res, { message: 'User deleted successfully' });
  } catch (error) {
    // Catches unexpected errors e.g. database connection failure
    return sendError(res, 'Internal server error', 500);
  }
};
