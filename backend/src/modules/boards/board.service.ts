/**
 * board.service.ts — STUB
 * TODO: Implement these functions. Tests in board.service.spec.ts are already written
 * and will go green as each function is implemented correctly.
 */
import { Types } from 'mongoose';
import { Board, IBoard } from './board.model';
import { User } from '../users/user.model';
import { getUserByCognitoSub } from '../users/user.service';

/**
 * Creates a new board and registers it in the user's board list.
 * Two sequential operations — user ref requires board._id so they cannot run in parallel.
 * @param userId - MongoDB ObjectId of the board owner
 * @param name - Board display name — must be non-empty after trimming whitespace
 * @returns The newly created board document
 * @throws If name is empty or only whitespace (FR 2.1.1)
 */
export async function createBoard(
  userId: Types.ObjectId,
  name: string,
): Promise<IBoard> {
  // Guard: reject empty or whitespace-only names before hitting the database
  if (!name || name.trim() === '') {
    throw new Error('Board name cannot be empty');
  }
  // Step 1: create the board document in the boards collection
  // name.trim() removes accidental leading/trailing whitespace from user input
  const board = await Board.create({
    name: name.trim(),
    userId,
    columns: [], // new boards start with no columns
  });
  // Step 2: push a lightweight ref into users.boards[]
  // Only stores boardId + name — no columns or cards — for fast board list rendering
  // Must run AFTER Board.create() since it needs board._id
  await User.updateOne(
    { _id: userId },
    { $push: { boards: { boardId: board._id, name: board.name } } },
  );
  return board;
}

/**
 * Returns all boards belonging to the specified user.
 * Uses userId as the filter — never returns boards owned by other users.
 * @param userId - MongoDB ObjectId of the requesting user
 * @returns Array of board documents — empty array if user has no boards
 */
export async function getBoardsByUser(
  userId: Types.ObjectId,
): Promise<IBoard[]> {
  // find() returns all matching documents — empty array if none found
  return await Board.find({ userId });
}

export async function getBoardById(
  _boardId: Types.ObjectId,
  _userId: Types.ObjectId,
): Promise<IBoard> {
  throw new Error('Not implemented: getBoardById');
}

export async function renameBoard(
  _boardId: Types.ObjectId,
  _userId: Types.ObjectId,
  _name: string,
): Promise<IBoard> {
  throw new Error('Not implemented: renameBoard');
}

export async function deleteBoard(
  _boardId: Types.ObjectId,
  _userId: Types.ObjectId,
): Promise<void> {
  throw new Error('Not implemented: deleteBoard');
}

export async function addColumn(
  _boardId: Types.ObjectId,
  _userId: Types.ObjectId,
  _colData: { id: string; name: string; order: number },
): Promise<IBoard> {
  throw new Error('Not implemented: addColumn');
}

export async function deleteColumn(
  _boardId: Types.ObjectId,
  _userId: Types.ObjectId,
  _colId: string,
): Promise<IBoard> {
  throw new Error('Not implemented: deleteColumn');
}

export async function renameColumn(
  _boardId: Types.ObjectId,
  _userId: Types.ObjectId,
  _colId: string,
  _name: string,
): Promise<IBoard> {
  throw new Error('Not implemented: renameColumn');
}
