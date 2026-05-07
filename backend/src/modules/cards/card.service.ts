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

/**
 * Updates specific fields on an embedded card.
 * Uses a dynamic $set object because the client may send any combination
 * of fields — we only update what was explicitly provided.
 * Two arrayFilters are needed to navigate: board → column → card.
 * @param boardId - MongoDB ObjectId of the board
 * @param userId - MongoDB ObjectId of the requesting user
 * @param columnId - Client-generated column ID e.g. 'col_1'
 * @param cardId - MongoDB ObjectId of the card to update
 * @param updates - Partial card object — only provided fields are updated
 * @returns The updated board document
 * @throws If title is explicitly set to empty (FR 4.2.1)
 * @throws If board not found or belongs to a different user (FR 4.3)
 */
export async function updateCard(
  boardId: Types.ObjectId,
  userId: Types.ObjectId,
  columnId: string,
  cardId: Types.ObjectId,
  updates: Partial<ICard>,
): Promise<IBoard> {
  // Guard: only throw if title was explicitly provided AND is empty
  // undefined means client didn't send title at all — that's fine
  if (updates.title !== undefined && !updates.title.trim()) {
    throw new Error('Card title cannot be empty');
  }

  // Build $set dynamically — only include fields the client actually sent
  // This prevents accidentally overwriting fields the client didn't mention
  // Record<string, any> = object with string keys and any values
  const setFields: Record<string, any> = {};

  // Each key follows MongoDB's dot notation for nested array items:
  // 'columns.$[col].cards.$[card].fieldName'
  // $[col] and $[card] are placeholders resolved by arrayFilters below
  if (updates.title)
    setFields['columns.$[col].cards.$[card].title'] = updates.title.trim();

  if (updates.description !== undefined)
    // undefined check (not just falsy) — allows clearing description to empty string
    setFields['columns.$[col].cards.$[card].description'] = updates.description;

  if (updates.priority)
    setFields['columns.$[col].cards.$[card].priority'] = updates.priority;

  if (updates.dueDate)
    setFields['columns.$[col].cards.$[card].dueDate'] = updates.dueDate;

  // Single atomic operation — find board, navigate to card, update fields
  const updated = await Board.findOneAndUpdate(
    { _id: boardId, userId }, // userId prevents accessing other users' boards (IDOR)
    { $set: setFields }, // only update the fields we built above
    {
      new: true, // return updated document, not original
      arrayFilters: [
        { 'col.id': columnId }, // Step 1: find column matching columnId string
        { 'card._id': cardId }, // Step 2: find card matching cardId ObjectId
      ],
    },
  );

  // Covers both "board not found" and "wrong user" — never expose which one
  if (!updated) throw new Error('Board not found or does not belong to user');

  return updated;
}

/**
 * Deletes a card from a column and compacts the order values of remaining cards.
 * Uses findBoardForUser + save() pattern instead of findOneAndUpdate because
 * we need to inspect card order before deletion and modify remaining cards.
 * @param boardId - MongoDB ObjectId of the board
 * @param userId - MongoDB ObjectId of the requesting user
 * @param columnId - Client-generated column ID e.g. 'col_1'
 * @param cardId - MongoDB ObjectId of the card to delete
 * @returns The updated board document with card removed and orders compacted
 * @throws If board not found or belongs to a different user (FR 4.3)
 * @throws If column not found
 * @throws If card not found
 */
export async function deleteCard(
  boardId: Types.ObjectId,
  userId: Types.ObjectId,
  columnId: string,
  cardId: Types.ObjectId,
): Promise<IBoard> {
  // Step 1: fetch board and verify ownership in one query
  const board = await findBoardForUser(boardId, userId);

  // Step 2: find the target column by its client-generated string id
  const column = board.columns.find((col) => col.id === columnId);
  if (!column) throw new Error('Column not found');

  // Step 3: find the target card inside the column
  const card = column.cards.find((c) => c._id.toString() === cardId.toString());
  if (!card) throw new Error('Card not found');

  // Step 4: save deleted card's order BEFORE removing it
  // Needed to know which remaining cards need order compacting
  const deletedOrder = card.order;

  // Step 5: remove the card from the column
  // filter returns new array keeping only cards that DON'T match the deleted id
  column.cards = column.cards.filter(
    (c) => c._id.toString() !== cardId.toString(),
  );

  // Step 6: compact order values of remaining cards
  // Cards after the deleted position have a gap — decrement their order by 1
  // Example: orders [0,1,2] → delete order 1 → compact to [0,1] not [0,2]
  column.cards.forEach((c) => {
    if (c.order > deletedOrder) {
      c.order -= 1;
    }
  });

  // Step 7: persist all changes and return updated board
  return await board.save();
}

export async function moveCard(
  boardId: Types.ObjectId,
  userId: Types.ObjectId,
  sourceColId: string,
  targetColId: string,
  cardId: Types.ObjectId,
  newOrder: number,
): Promise<IBoard> {
  const board = await findBoardForUser(boardId, userId);

  const sourceCol = board.columns.find((col) => col.id === sourceColId);
  if (!sourceCol) throw new Error('Source column not found');

  const card = sourceCol.cards.find(
    (c) => c._id.toString() === cardId.toString(),
  );
  if (!card) throw new Error('Card not found');

  if (sourceColId === targetColId) {
    const oldOrder = card.order;

    // bump cards between old and new position
    sourceCol.cards.forEach((c) => {
      if (c._id.toString() !== cardId.toString()) {
        // moving DOWN the list
        if (oldOrder < newOrder && c.order > oldOrder && c.order <= newOrder) {
          c.order -= 1;
        }
        // moving UP the list
        if (oldOrder > newOrder && c.order >= newOrder && c.order < oldOrder) {
          c.order += 1;
        }
      }
      // set new order AFTER adjusting others
      card.order = newOrder;
    });
  } else {
    // remove card from source column
    sourceCol.cards = sourceCol.cards.filter(
      (c) => c._id.toString() !== cardId.toString(),
    );

    // compact source column orders after removal
    sourceCol.cards.forEach((c) => {
      if (c.order > card.order) c.order -= 1;
    });

    // find target column
    const targetCol = board.columns.find((col) => col.id === targetColId);
    if (!targetCol) throw new Error('Target column not found');

    // make room in target column at the drop position
    targetCol.cards.forEach((c) => {
      if (c.order >= newOrder) c.order += 1;
    });

    // add card to target column at new position
    card.order = newOrder;
    targetCol.cards.push(card);
  }
  // persist all changes to database and return updated board
  return await board.save();
}
