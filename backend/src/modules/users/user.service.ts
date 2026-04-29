/**
 * user.service.ts — STUB
 * TODO: Implement these functions. Tests in user.service.spec.ts are already written
 * and will go green as each function is implemented correctly.
 */
import { Types } from 'mongoose';
import { IUser, IUserPreferences } from './user.model';

export async function createUser(_data: Partial<IUser>): Promise<IUser> {
  throw new Error('Not implemented: createUser');
}

export async function getUserByCognitoSub(_sub: string): Promise<IUser | null> {
  throw new Error('Not implemented: getUserByCognitoSub');
}

export async function getUserById(_id: Types.ObjectId): Promise<IUser | null> {
  throw new Error('Not implemented: getUserById');
}

export async function updatePreferences(
  _userId: Types.ObjectId,
  _prefs: Partial<IUserPreferences>,
): Promise<IUser> {
  throw new Error('Not implemented: updatePreferences');
}

export async function syncBoardName(
  _userId: Types.ObjectId,
  _boardId: Types.ObjectId,
  _newName: string,
): Promise<void> {
  throw new Error('Not implemented: syncBoardName');
}

export async function deleteUser(_userId: Types.ObjectId): Promise<void> {
  throw new Error('Not implemented: deleteUser');
}
