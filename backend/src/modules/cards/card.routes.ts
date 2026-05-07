import { Router } from 'express';
import { checkAuth } from '../auth/auth.middleware';
import {
  createCardController,
  updateCardController,
  deleteCardController,
  moveCardController,
} from './card.controller';

const router = Router();

// Card routes — all protected by checkAuth middleware
// Router is mounted at /api/boards in app.ts
// Full paths are /api/boards/:boardId/columns/:colId/cards/...

// POST /api/boards/:boardId/columns/:colId/cards
// Creates a new card inside a specific column
router.post('/:boardId/columns/:colId/cards', checkAuth, createCardController);

// PATCH /api/boards/:boardId/columns/:colId/cards/:cardId
// Updates specific fields on a card — only provided fields are changed
router.patch(
  '/:boardId/columns/:colId/cards/:cardId',
  checkAuth,
  updateCardController,
);

// DELETE /api/boards/:boardId/columns/:colId/cards/:cardId
// Deletes a card and compacts order values of remaining cards
router.delete(
  '/:boardId/columns/:colId/cards/:cardId',
  checkAuth,
  deleteCardController,
);

// PATCH /api/boards/:boardId/cards/:cardId/move
// Moves a card within the same column or to a different column
// sourceColId, targetColId, newOrder come from request body
router.patch('/:boardId/cards/:cardId/move', checkAuth, moveCardController);

export default router;
