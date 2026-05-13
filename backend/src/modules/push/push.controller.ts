import { Request, Response } from 'express';
import { getUserByCognitoSub } from '../users/user.service';
import { saveSubscription, removeSubscription } from './push.service';
import { sendSuccess, sendError } from '../../utils/responseHelpers';
import { IPushSubscription } from '../users/user.model';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Resolves the MongoDB user._id from the Cognito JWT sub.
 * Returns null and writes a 404 response if the user doesn't exist.
 */
const resolveUserId = async (req: Request, res: Response) => {
  const sub = (req as any).user.sub;
  const user = await getUserByCognitoSub(sub);
  if (!user) {
    sendError(res, 'User not found', 404);
    return null;
  }
  return user._id;
};

// ─────────────────────────────────────────────
// Controllers
// ─────────────────────────────────────────────

/**
 * POST /api/push/subscribe
 * Saves the browser push subscription for the authenticated user.
 * Called by the frontend after the user grants notification permission.
 *
 * Body: { endpoint: string, keys: { p256dh: string, auth: string } }
 */
export async function subscribe(req: Request, res: Response): Promise<void> {
  const userId = await resolveUserId(req, res);
  if (!userId) return;

  const { endpoint, keys } = req.body as IPushSubscription;

  // Validate the subscription shape — frontend should always send these
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    sendError(res, 'Invalid subscription object', 400);
    return;
  }

  await saveSubscription(userId, { endpoint, keys });
  sendSuccess(res, { message: 'Push subscription saved' }, 201);
}

/**
 * DELETE /api/push/subscribe
 * Removes the push subscription for the authenticated user.
 * Called on logout or when the user disables notifications in settings.
 */
export async function unsubscribe(req: Request, res: Response): Promise<void> {
  const userId = await resolveUserId(req, res);
  if (!userId) return;

  await removeSubscription(userId);
  sendSuccess(res, { message: 'Push subscription removed' });
}
