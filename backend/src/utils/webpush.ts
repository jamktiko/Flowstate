// utils/webpush.ts

import webpush from 'web-push';

/**
 * Initialises web-push with VAPID credentials once at module load.
 * Import this configured instance anywhere you need to send notifications —
 * never import 'web-push' directly elsewhere in the codebase.
 */
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export default webpush;
