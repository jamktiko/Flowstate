import { Request, Response } from 'express';
import { Types } from 'mongoose';
import {
  createBoard,
  getBoardsByUser,
  getBoardById,
  renameBoard,
  deleteBoard,
  addColumn,
  deleteColumn,
  renameColumn,
} from './board.service';
import { getUserByCognitoSub } from '../users/user.service';
import { sendSuccess, sendError } from '../../utils/responseHelpers';

// ─────────────────────────────────────────────
// Helper — resolves sub → user._id
// Every board operation needs userId as ObjectId.
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
 * POST /api/boards
 * Creates a new board and adds a lightweight ref to the user's board list.
 * Returns 201 Created with the new board document.
 */
export const createBoardController = async (req: Request, res: Response) => {
  try {
    const userId = await resolveUserId(req, res);
    if (!userId) return; // resolveUserId already sent 404

    const { name } = req.body; // board name from request body
    const board = await createBoard(userId, name);
    return sendSuccess(res, board, 201); // 201 = resource created
  } catch (error) {
    return sendError(res, 'Internal server error', 500);
  }
};

/**
 * GET /api/boards
 * Returns all boards belonging to the authenticated user.
 * Board list is lightweight — no columns or cards included.
 */
export const getBoardsByUserController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = await resolveUserId(req, res);
    if (!userId) return;

    const boards = await getBoardsByUser(userId);
    return sendSuccess(res, boards);
  } catch (error) {
    return sendError(res, 'Internal server error', 500);
  }
};

/**
 * GET /api/boards/:id
 * Returns a single board with all columns and embedded cards.
 * Throws 500 if board not found or belongs to a different user (IDOR protection).
 */
export const getBoardByIdController = async (req: Request, res: Response) => {
  try {
    const userId = await resolveUserId(req, res);
    if (!userId) return;

    const boardId = new Types.ObjectId(req.params.id); // convert string param to ObjectId
    const board = await getBoardById(boardId, userId);
    return sendSuccess(res, board);
  } catch (error) {
    return sendError(res, 'Internal server error', 500);
  }
};

/**
 * PATCH /api/boards/:id
 * Renames a board and syncs the new name to users.boards[].name.
 * Both operations must succeed — partial state is not allowed.
 */
export const renameBoardController = async (req: Request, res: Response) => {
  try {
    const userId = await resolveUserId(req, res);
    if (!userId) return;

    const boardId = new Types.ObjectId(req.params.id);
    const { name } = req.body; // new board name from request body
    const board = await renameBoard(boardId, userId, name);
    return sendSuccess(res, board);
  } catch (error) {
    return sendError(res, 'Internal server error', 500);
  }
};

/**
 * DELETE /api/boards/:id
 * Deletes a board and removes its reference from the user's board list.
 * Both operations run in parallel via Promise.all in the service layer.
 */
export const deleteBoardController = async (req: Request, res: Response) => {
  try {
    const userId = await resolveUserId(req, res);
    if (!userId) return;

    const boardId = new Types.ObjectId(req.params.id);
    await deleteBoard(boardId, userId);
    return sendSuccess(res, { message: 'Board deleted successfully' });
  } catch (error) {
    return sendError(res, 'Internal server error', 500);
  }
};

/**
 * POST /api/boards/:id/columns
 * Adds a new column to a board.
 * Expects { id, name, order } in request body.
 * Returns 201 Created with the updated board document.
 */
export const addColumnController = async (req: Request, res: Response) => {
  try {
    const userId = await resolveUserId(req, res);
    if (!userId) return;

    const boardId = new Types.ObjectId(req.params.id);
    const data = req.body; // { id, name, order } from client
    const board = await addColumn(boardId, userId, data);
    return sendSuccess(res, board, 201);
  } catch (error) {
    return sendError(res, 'Internal server error', 500);
  }
};

/**
 * DELETE /api/boards/:id/columns/:colId
 * Deletes a column — only succeeds if the column is empty (FR 3.4.2).
 * colId is the client-generated string ID e.g. 'col_1'.
 */
export const deleteColumnController = async (req: Request, res: Response) => {
  try {
    const userId = await resolveUserId(req, res);
    if (!userId) return;

    const boardId = new Types.ObjectId(req.params.id);
    const colId = req.params.colId; // string — not an ObjectId
    await deleteColumn(boardId, userId, colId);
    return sendSuccess(res, { message: 'Column deleted successfully' });
  } catch (error) {
    return sendError(res, 'Internal server error', 500);
  }
};

/**
 * PATCH /api/boards/:id/columns/:colId
 * Renames a column using MongoDB arrayFilters to target the specific column.
 * Returns the updated board document.
 */
export const renameColumnController = async (req: Request, res: Response) => {
  try {
    const userId = await resolveUserId(req, res);
    if (!userId) return;

    const boardId = new Types.ObjectId(req.params.id);
    const colId = req.params.colId; // string — not an ObjectId
    const { name } = req.body; // new column name from request body
    const board = await renameColumn(boardId, userId, colId, name);
    return sendSuccess(res, board);
  } catch (error) {
    return sendError(res, 'Internal server error', 500);
  }
};
