import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { getUserByCognitoSub } from '../users/user.service';
import { sendSuccess, sendError } from '../../utils/responseHelpers';
import {
  createCard,
  deleteCard,
  updateCard,
  moveCard,
  createCalendarEventFromCard,
} from './card.service';

// ─────────────────────────────────────────────
// Helper — resolves cognitoSub → MongoDB user._id
// Every card operation needs userId as ObjectId.
// sub (string) comes from JWT, _id (ObjectId) comes from MongoDB.
// Reused by every controller to avoid repetition.
// ─────────────────────────────────────────────
const resolveUserId = async (req: Request, res: Response) => {
  const sub = (req as any).user.sub; // cognitoSub from verified JWT
  const user = await getUserByCognitoSub(sub);
  if (!user) {
    sendError(res, 'User not found', 404);
    return null; // caller checks for null and returns early
  }
  return user._id;
};

/**
 * POST /api/boards/:boardId/columns/:colId/cards
 * Creates a new card inside a specific column.
 * boardId and colId come from URL params — cardData comes from request body.
 * Returns 201 Created with the updated board document.
 */
export const createCardController = async (req: Request, res: Response) => {
  try {
    const userId = await resolveUserId(req, res);
    if (!userId) return; // resolveUserId already sent 404

    const boardId = new Types.ObjectId(req.params.boardId); // convert string param to ObjectId
    const colId = req.params.colId; // string — client-generated, not ObjectId

    const cardData = req.body; // full card data object from client
    const card = await createCard(boardId, userId, colId, cardData);
    return sendSuccess(res, card, 201); // 201 = resource created
  } catch (error) {
    return sendError(res, 'Internal server error', 500);
  }
};

/**
 * PATCH /api/boards/:boardId/columns/:colId/cards/:cardId
 * Updates specific fields on a card — only fields provided in req.body are changed.
 * Uses dynamic $set in service layer so untouched fields are preserved.
 */
export const updateCardController = async (req: Request, res: Response) => {
  try {
    const userId = await resolveUserId(req, res);
    if (!userId) return;

    const boardId = new Types.ObjectId(req.params.boardId); // convert string param to ObjectId
    const colId = req.params.colId; // string — client-generated, not ObjectId
    const cardId = new Types.ObjectId(req.params.cardId); // convert string param to ObjectId

    const updates = req.body; // partial card object — only provided fields are updated
    const card = await updateCard(boardId, userId, colId, cardId, updates);
    return sendSuccess(res, card);
  } catch (error) {
    return sendError(res, 'Internal server error', 500);
  }
};

/**
 * DELETE /api/boards/:boardId/columns/:colId/cards/:cardId
 * Deletes a card and compacts the order values of remaining cards in the column.
 * Order compacting prevents gaps e.g. [0,1,2] → delete 1 → [0,1] not [0,2].
 */
export const deleteCardController = async (req: Request, res: Response) => {
  try {
    const userId = await resolveUserId(req, res);
    if (!userId) return;

    const boardId = new Types.ObjectId(req.params.boardId); // convert string param to ObjectId
    const colId = req.params.colId; // string — client-generated, not ObjectId
    const cardId = new Types.ObjectId(req.params.cardId); // convert string param to ObjectId

    await deleteCard(boardId, userId, colId, cardId);
    return sendSuccess(res, { message: 'Card deleted successfully' });
  } catch (error) {
    return sendError(res, 'Internal server error', 500);
  }
};

/**
 * PATCH /api/boards/:boardId/cards/:cardId/move
 * Moves a card to a new position — within the same column or to a different column.
 * sourceColId, targetColId, newOrder come from req.body — not URL params.
 * Same column: reorders cards between old and new position.
 * Different column: removes from source, inserts into target at newOrder.
 */
export const moveCardController = async (req: Request, res: Response) => {
  try {
    const userId = await resolveUserId(req, res);
    if (!userId) return;

    const boardId = new Types.ObjectId(req.params.boardId); // convert string param to ObjectId
    const cardId = new Types.ObjectId(req.params.cardId); // convert string param to ObjectId

    // move operation data comes from body — not URL since it's complex data
    const { sourceColId, targetColId, newOrder } = req.body;

    const board = await moveCard(
      boardId,
      userId,
      sourceColId,
      targetColId,
      cardId,
      newOrder,
    );
    return sendSuccess(res, board);
  } catch (error) {
    console.error('moveCard error', error);
    return sendError(res, 'Internal server error', 500);
  }
};
/**
 * POST /api/boards/:boardId/columns/:colId/cards/:cardId/calendar
 * Creates a calendar event from a card and links them bidirectionally.
 */
export async function createCalendarEventFromCardController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = await resolveUserId(req, res);
  if (!userId) return;

  const boardId = new Types.ObjectId(req.params.boardId);
  const columnId = req.params.colId;
  const cardId = new Types.ObjectId(req.params.cardId);

  const { board, eventId } = await createCalendarEventFromCard(
    boardId,
    userId,
    columnId,
    cardId,
  );

  sendSuccess(res, { board, eventId }, 201);
}
