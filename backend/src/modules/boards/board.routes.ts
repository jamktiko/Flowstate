import { Router } from 'express';
import { checkAuth } from '../auth/auth.middleware';
import {
  createBoardController,
  getBoardsByUserController,
  getBoardByIdController,
  renameBoardController,
  deleteBoardController,
  addColumnController,
  deleteColumnController,
  renameColumnController,
} from './board.controller';

const router = Router();

// Board routes — all protected by checkAuth middleware
// Router is mounted at /api/boards in app.ts

// POST /api/boards — create a new board
router.post('/', checkAuth, createBoardController);

// GET /api/boards — get all boards belonging to the authenticated user
router.get('/', checkAuth, getBoardsByUserController);

// GET /api/boards/:id — get a single board with all columns and cards
router.get('/:id', checkAuth, getBoardByIdController);

// PATCH /api/boards/:id — rename a board (also syncs users.boards[].name)
router.patch('/:id', checkAuth, renameBoardController);

// DELETE /api/boards/:id — delete a board and remove ref from user's board list
router.delete('/:id', checkAuth, deleteBoardController);

// POST /api/boards/:id/columns — add a new column to a board
router.post('/:id/columns', checkAuth, addColumnController);

// DELETE /api/boards/:id/columns/:colId — delete a column (must be empty first)
router.delete('/:id/columns/:colId', checkAuth, deleteColumnController);

// PATCH /api/boards/:id/columns/:colId — rename a column
router.patch('/:id/columns/:colId', checkAuth, renameColumnController);

export default router;
