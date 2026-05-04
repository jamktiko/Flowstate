import { User, IUserPreferences, INotificationPrefs } from './user.model';
import { Board } from '../boards/board.model';
import { CalendarEvent } from '../calendar/calendarEvent.model';
import { Types } from 'mongoose';

/**
 * Fetches the authenticated user's full profile from the database.
 * @param sub - The Cognito subject ID extracted from the verified JWT by auth.middleware
 * @returns The full user document, or null if not found
 */
export const getUserByCognitoSub = async (sub: string) => {
  return await User.findOne({ cognitoSub: sub });
};

export const getUserById = async (id: Types.ObjectId) => {
  return await User.findOne(id);
};
/**
 * Updates the authenticated user's UI preferences (default view, theme, default board).
 * Uses findOneAndUpdate with { new: true } to return the updated document, not the old one.
 * runValidators ensures Mongoose schema rules (e.g. valid enum values) are enforced on update.
 * @param sub - Cognito subject ID from JWT
 * @param data - Partial preferences object — only provided fields are updated via $set
 * @returns The updated user document, or null if user not found
 */
export const updatePreferences = async (
  sub: string,
  data: Partial<IUserPreferences>,
) => {
  return await User.findOneAndUpdate(
    { cognitoSub: sub },
    { $set: { preferences: data } },
    { new: true, runValidators: true },
  );
};

/**
 * Updates the authenticated user's notification settings (master toggle, lead time).
 * Same pattern as updatePreferences — $set only touches the notifications field,
 * leaving all other user fields untouched.
 * @param sub - Cognito subject ID from JWT
 * @param data - Partial notifications object — only provided fields are updated
 * @returns The updated user document, or null if user not found
 */
export const updateNotifications = async (
  sub: string,
  data: Partial<INotificationPrefs>,
) => {
  return await User.findOneAndUpdate(
    { cognitoSub: sub },
    { $set: { notifications: data } },
    { new: true, runValidators: true },
  );
};

/**
 * Deletes the authenticated user's account and all associated data.
 * Runs all three deletions in parallel using Promise.all() for efficiency.
 * @param sub - Cognito subject ID from JWT
 * @returns null if user not found, otherwise the deletion results
 */

export const deleteUser = async (sub: string) => {
  const user = await User.findOne({ cognitoSub: sub });
  if (!user) return null;
  return await Promise.all([
    User.findOneAndDelete({ cognitoSub: sub }),
    Board.deleteMany({ userId: user._id }),
    CalendarEvent.deleteMany({ userId: user._id }),
  ]);
};
