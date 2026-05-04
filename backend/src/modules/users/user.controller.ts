import { Request, Response } from 'express';
import {
  getUserByCognitoSub,
  updatePreferences,
  updateNotifications,
  deleteUser,
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
    const user = await getUserByCognitoSub(sub);

    if (!user) return sendError(res, 'User not found', 404);
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
