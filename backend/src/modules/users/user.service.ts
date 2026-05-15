import { Types } from 'mongoose';
import {
  AdminDeleteUserCommand,
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  User,
  IUser,
  IUserPreferences,
  INotificationPrefs,
} from './user.model';
import { Board } from '../boards/board.model';
import { CalendarEvent } from '../calendar/calendarEvent.model';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.COGNITO_REGION,
});

const deleteCognitoUserBySub = async (cognitoSub: string) => {
  const userPoolId = process.env.COGNITO_USER_POOL_ID;

  if (!userPoolId) {
    return false;
  }

  const users = await cognitoClient.send(
    new ListUsersCommand({
      UserPoolId: userPoolId,
      Filter: `sub = "${cognitoSub}"`,
      Limit: 1,
    }),
  );

  const username = users.Users?.[0]?.Username;

  if (!username) {
    return false;
  }

  await cognitoClient.send(
    new AdminDeleteUserCommand({
      UserPoolId: userPoolId,
      Username: username,
    }),
  );

  return true;
};

//Comment to launch deploy workflow on push to main branch

/**
 * Creates a new user document in the database.
 * Called after successful Cognito registration to store profile data.
 * @param data - Partial user object containing required registration fields
 * @returns The newly created user document
 */
export const createUser = async (data: Partial<IUser>) => {
  return await User.create(data);
};

/**
 * Finds a user by their Cognito subject ID.
 * This is the primary login lookup — called after JWT verification
 * to bridge Cognito identity → MongoDB profile.
 * @param sub - Cognito subject ID extracted from verified JWT
 * @returns The user document, or null if not found
 */
export const getUserByCognitoSub = async (sub: string) => {
  return await User.findOne({ cognitoSub: sub });
};

// Added for Google login email lookup
// Gets a user by their email address. Used in Google OAuth flow to link accounts.
export const getUserByEmail = async (email: string) => {
  return await User.findOne({ email });
};

/**
 * Finds a user by their MongoDB _id.
 * Used internally when userId is already known (e.g. board operations).
 * @param id - MongoDB ObjectId of the user
 * @returns The user document, or null if not found
 */
export const getUserById = async (id: Types.ObjectId) => {
  return await User.findById(id);
};

/**
 * Updates the authenticated user's UI preferences (theme, defaultView, defaultBoardId).
 * Uses userId instead of cognitoSub — by the time this is called,
 * the controller has already resolved sub → user._id.
 * @param userId - MongoDB ObjectId of the user
 * @param prefs - Partial preferences object — only provided fields are updated via $set
 * @returns The updated user document
 */
export const updatePreferences = async (
  userId: Types.ObjectId,
  prefs: Partial<IUserPreferences>,
) => {
  const updated = await User.findByIdAndUpdate(
    userId,
    { $set: { preferences: prefs } },
    { new: true, runValidators: true },
  );
  if (!updated) throw new Error('User not found');

  return updated;
};

/**
 * Updates the authenticated user's notification settings (enabled toggle, leadTime).
 * Uses userId instead of cognitoSub — controller resolves sub → user._id first.
 * @param userId - MongoDB ObjectId of the user
 * @param data - Partial notifications object — only provided fields are updated via $set
 * @returns The updated user document, or null if user not found
 */
export const updateNotifications = async (
  userId: Types.ObjectId,
  data: Partial<INotificationPrefs>,
) => {
  return await User.findByIdAndUpdate(
    userId,
    { $set: { notifications: data } },
    { new: true, runValidators: true },
  );
};

/**
 * Keeps users.boards[].name in sync when a board is renamed.
 * Board name is duplicated in the user document for fast board list rendering.
 * Must be called alongside every board rename operation.
 * @param userId - MongoDB ObjectId of the user
 * @param boardId - MongoDB ObjectId of the board being renamed
 * @param newName - The new board name to set
 */
export const syncBoardName = async (
  userId: Types.ObjectId,
  boardId: Types.ObjectId,
  newName: string,
) => {
  await User.updateOne(
    { _id: userId, 'boards.boardId': boardId },
    { $set: { 'boards.$.name': newName } },
  );
};

/**
 * Deletes the user account and all associated data in parallel.
 * Removes user document, all boards, and all calendar events.
 * @param userId - MongoDB ObjectId of the user to delete
 * @returns null if user not found, otherwise deletion results
 */
export const deleteUser = async (userId: Types.ObjectId) => {
  const user = await User.findById(userId);
  if (!user) return null;

  await deleteCognitoUserBySub(user.cognitoSub);

  return await Promise.all([
    User.findByIdAndDelete(userId),
    Board.deleteMany({ userId }),
    CalendarEvent.deleteMany({ userId }),
  ]);
};
