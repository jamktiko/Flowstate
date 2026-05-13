import webpush from '../../utils/webpush';
import { User } from '../users/user.model';
import { Types } from 'mongoose';
import { IPushSubscription } from '../users/user.model';

/**
 * Saves (or overwrites) a browser push subscription on the user document.
 * Called when the user grants notification permission in the frontend.
 */
export async function saveSubscription(
  userId: Types.ObjectId,
  subscription: IPushSubscription,
): Promise<void> {
  await User.findByIdAndUpdate(userId, {
    $set: { pushSubscription: subscription },
  });
}

/**
 * Removes the stored push subscription from the user document.
 * Call this on logout or when the user revokes notification permission.
 */
export async function removeSubscription(
  userId: Types.ObjectId,
): Promise<void> {
  await User.findByIdAndUpdate(userId, { $unset: { pushSubscription: '' } });
}

/**
 * Sends a push notification to a single user.
 * Returns true if sent, false if the user has no subscription (not opted in).
 *
 * Handles 410 Gone — when a browser subscription expires or the user
 * revokes permission, the push service returns 410. We clean up the
 * stale subscription automatically so we don't keep hitting a dead endpoint.
 *
 * @param userId  - MongoDB ObjectId of the recipient
 * @param payload - Notification title and body shown on the device
 */
export async function sendPushToUser(
  userId: Types.ObjectId,
  payload: { title: string; body: string },
): Promise<boolean> {
  const user = await User.findById(userId).select('pushSubscription');

  // User hasn't opted in to push notifications yet
  if (!user?.pushSubscription?.endpoint) return false;

  try {
    await webpush.sendNotification(
      user.pushSubscription as webpush.PushSubscription,
      JSON.stringify(payload),
    );
    return true;
  } catch (err: any) {
    // 410 Gone — subscription is dead (user revoked permission or
    // browser expired it). Clean it up so we don't retry next cron tick.
    if (err?.statusCode === 410) {
      await removeSubscription(userId);
    }
    // Re-throw anything else — unexpected errors should surface
    throw err;
  }
}
