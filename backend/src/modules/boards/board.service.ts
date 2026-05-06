/**
 * board.service.ts — STUB
 * TODO: Implement these functions. Tests in board.service.spec.ts are already written
 * and will go green as each function is implemented correctly.
 */
import { Types } from 'mongoose';
import { Board, IBoard } from './board.model';
import { User } from '../users/user.model';
import { getUserByCognitoSub, syncBoardName } from '../users/user.service';

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

/**
 * Returns a single board by ID, enforcing ownership check.
 * Includes userId in the query — prevents users from accessing other users' boards (IDOR).
 * @param boardId - MongoDB ObjectId of the board
 * @param userId - MongoDB ObjectId of the requesting user
 * @returns The full board document including columns and embedded cards
 * @throws If board not found OR board belongs to a different user (FR 4.3)
 */
export async function getBoardById(
  boardId: Types.ObjectId,
  userId: Types.ObjectId,
): Promise<IBoard> {
  // userId in query acts as authorization — returns null if board belongs to someone else

  const board = await Board.findOne({ _id: boardId, userId });

  // Single throw covers both "not found" and "wrong user" — never expose which one to client
  if (!board) {
    throw new Error('Board not found or does not belong to user');
  }
  return board;
}

/**
 * Renames a board and keeps the user's board list in sync.
 * Two sequential operations — sync requires updated._id and updated.name
 * from the board update result so they cannot run in parallel.
 * @param boardId - MongoDB ObjectId of the board to rename
 * @param userId - MongoDB ObjectId of the requesting user
 * @param name - New board name — must be non-empty after trimming whitespace
 * @returns The updated board document
 * @throws If name is empty (FR 2.2.1)
 * @throws If board not found or belongs to a different user (FR 4.3)
 * @throws If syncBoardName fails — rename is aborted to prevent data inconsistency
 */

export async function renameBoard(
  boardId: Types.ObjectId,
  userId: Types.ObjectId,
  name: string,
): Promise<IBoard> {
  // Guard: reject empty or whitespace-only names before hitting the database
  if (!name || name.trim() === '') {
    throw new Error('Board name cannot be empty');
  }

  // Update board name — userId in query prevents accessing other users' boards (IDOR)
  const updated = await Board.findOneAndUpdate(
    { _id: boardId, userId },
    { $set: { name: name.trim() } },
    { new: true }, // return updated document, not original
  );

  // Single throw covers both "not found" and "wrong user"
  if (!updated) throw new Error('Board not found or does not belong to user');

  // Sync name to users.boards[].name — board name is duplicated there for fast list rendering
  // If this fails, the whole operation fails — partial state would cause board list to show wrong name
  await syncBoardName(userId, updated._id, updated.name);

  return updated;
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
