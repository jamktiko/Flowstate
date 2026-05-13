import { Router } from 'express';
import { checkAuth } from '../auth/auth.middleware';
import {
  pushCardToGoogleController,
  updateCardInGoogleController,
  importGoogleEventsController,
  deleteCardFromGoogleController,
} from './calendar.sync.controller';

const router = Router();

// ─────────────────────────────────────────────
// Calendar sync routes
// ─────────────────────────────────────────────

// All sync routes are protected by checkAuth middleware

// POST /api/calendar/sync/push-card/:boardId/:cardId
// Pushes a task (card) to Google Calendar as an event
router.post(
  '/push-card/:boardId/:cardId',
  checkAuth,
  pushCardToGoogleController,
);

// PATCH /api/calendar/sync/update-card/:boardId/:cardId
// Updates a card's linked Google Calendar event
router.patch(
  '/update-card/:boardId/:cardId',
  checkAuth,
  updateCardInGoogleController,
);

// POST /api/calendar/sync/import?from=date&to=date
// Imports all Google Calendar events within a date range
router.post('/import', checkAuth, importGoogleEventsController);

// DELETE /api/calendar/sync/delete-card-event/:calendarEventId
// Deletes a card's linked Google Calendar event
router.delete(
  '/delete-card-event/:calendarEventId',
  checkAuth,
  deleteCardFromGoogleController,
);

export default router;
