import { Types } from 'mongoose';
import { Board } from '../boards/board.model';
import { User } from '../users/user.model';

/**
 * Scans all boards for cards with upcoming due dates and sends notifications.
 * Called by a cron job every minute.
 *
 * Priority rules:
 *   1. User master toggle (notifications.enabled = false) → skip ALL cards
 *   2. Card level enabled = false → skip this card
 *   3. Card level enabled = null → inherit from user
 *   4. Card leadTime overrides user defaultLeadTime if set
 *   5. sentAt !== null → notification already sent, skip
 */
export async function checkAndSendNotifications(): Promise<void> {
  // Fetch all users with notifications enabled at master level
  const users = await User.find({ 'notifications.enabled': true });

  for (const user of users) {
    // Get all boards for this user that have cards with due dates
    const boards = await Board.find({
      userId: user._id,
      'columns.cards.dueDate': { $ne: null },
    });

    for (const board of boards) {
      for (const column of board.columns) {
        for (const card of column.cards) {
          // Skip cards with no due date
          if (!card.dueDate) continue;

          // Skip if card-level notifications explicitly disabled
          if (card.notifications?.enabled === false) continue;

          // Skip if notification already sent
          if (card.notifications?.sentAt) continue;

          // Determine lead time — card overrides user default
          const leadTime =
            card.notifications?.leadTime ?? user.notifications.defaultLeadTime;

          // Calculate notification window
          const now = new Date();
          const notifyAt = new Date(
            card.dueDate.getTime() - leadTime * 60 * 1000,
          );

          // Check if we're within the notification window
          if (now >= notifyAt && now < card.dueDate) {
            // Send notification
            await sendNotification(user._id, card.title, card.dueDate);

            // Mark notification as sent — prevents duplicate notifications
            await Board.updateOne(
              {
                _id: board._id,
                'columns.id': column.id,
                'columns.cards._id': card._id,
              },
              {
                $set: {
                  'columns.$[col].cards.$[card].notifications.sentAt':
                    new Date(),
                },
              },
              {
                arrayFilters: [
                  { 'col.id': column.id },
                  { 'card._id': card._id },
                ],
              },
            );
          }

          // Reset sentAt after due date passes — allows future notifications
          if (now > card.dueDate && card.notifications?.sentAt) {
            await Board.updateOne(
              {
                _id: board._id,
                'columns.id': column.id,
                'columns.cards._id': card._id,
              },
              {
                $set: {
                  'columns.$[col].cards.$[card].notifications.sentAt': null,
                },
              },
              {
                arrayFilters: [
                  { 'col.id': column.id },
                  { 'card._id': card._id },
                ],
              },
            );
          }
        }
      }
    }
  }
}

/**
 * Sends a notification to a user about an upcoming card deadline.
 * Currently logs to console — replace with real notification delivery
 * (email, push notification, WebSocket) when implementing FR 6.1.
 * @param userId - MongoDB ObjectId of the user to notify
 * @param cardTitle - Title of the card with upcoming deadline
 * @param dueDate - Due date of the card
 */
async function sendNotification(
  userId: Types.ObjectId,
  cardTitle: string,
  dueDate: Date,
): Promise<void> {
  // TODO: replace with real notification delivery
  // Options: email (nodemailer), push (Firebase), WebSocket (socket.io)
  console.log(
    `🔔 Notification for user ${userId}: "${cardTitle}" is due at ${dueDate.toISOString()}`,
  );
}
