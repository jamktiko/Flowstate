/**
 * card.service.ts — STUB
 * TODO: Implement these functions. Tests in card.service.spec.ts are already written
 * and will go green as each function is implemented correctly.
 */
import { Types } from 'mongoose';
import { Board, IBoard, ICard } from '../boards/board.model';

// ─────────────────────────────────────────────
// Helper — find board and verify ownership
// Reused by every card operation
// ─────────────────────────────────────────────
const findBoardForUser = async (
  boardId: Types.ObjectId,
  userId: Types.ObjectId,
): Promise<IBoard> => {
  const board = await Board.findOne({ _id: boardId, userId });
  if (!board) throw new Error('Board not found or does not belong to user');
  return board;
};

/**
 * Creates a new card inside a specific column of a board.
 * Uses findOneAndUpdate with arrayFilters to target the correct column
 * without loading the entire board document into memory first.
 * @param boardId - MongoDB ObjectId of the board
 * @param userId - MongoDB ObjectId of the requesting user
 * @param columnId - Client-generated column ID e.g. 'col_1'
 * @param cardData - Card data — title required, all other fields optional
 * @returns The updated board document with the new card embedded
 * @throws If title is empty (FR 4.1.2)
 * @throws If board not found or belongs to a different user (FR 4.3)
 * @throws If column not found
 */
export async function createCard(
  boardId: Types.ObjectId,
  userId: Types.ObjectId,
  columnId: string,
  cardData: Partial<ICard>,
): Promise<IBoard> {
  // Guard: title is required before hitting the database
  if (!cardData.title || !cardData.title.trim()) {
    throw new Error('Card title is required');
  }

  // Build the new card object — _id must be generated manually since
  // cards are embedded and don't go through their own Mongoose model
  const newCard = {
    title: cardData.title.trim(),
    order: cardData.order ?? 0,
    // optional fields — only include if provided, schema defaults handle the rest
    ...(cardData.description && { description: cardData.description }),
    ...(cardData.priority && { priority: cardData.priority }),
    ...(cardData.dueDate && { dueDate: cardData.dueDate }),
    ...(cardData.tags && { tags: cardData.tags }),
  } as ICard;

  // arrayFilters targets the specific column by its string id
  // userId in query prevents accessing other users' boards (IDOR)
  const updated = await Board.findOneAndUpdate(
    { _id: boardId, userId }, // find board owned by user
    { $push: { 'columns.$[col].cards': newCard } }, // push card into matching column
    {
      new: true, // return updated document
      arrayFilters: [{ 'col.id': columnId }], // target column by id
    },
  );

  // Covers both "board not found" and "wrong user" cases
  if (!updated) throw new Error('Board not found or does not belong to user');

  return updated;
}

export async function updateCard(
  boardId: Types.ObjectId,
  userId: Types.ObjectId,
  columnId: string,
  cardId: Types.ObjectId,
  updates: Partial<ICard>,
): Promise<IBoard> {}

export async function deleteCard(
  _boardId: Types.ObjectId,
  _userId: Types.ObjectId,
  _columnId: string,
  _cardId: Types.ObjectId,
): Promise<IBoard> {
  throw new Error('Not implemented: deleteCard');
}

export async function moveCard(
  _boardId: Types.ObjectId,
  _userId: Types.ObjectId,
  _sourceColId: string,
  _targetColId: string,
  _cardId: Types.ObjectId,
  _newOrder: number,
): Promise<IBoard> {
  throw new Error('Not implemented: moveCard');
}
