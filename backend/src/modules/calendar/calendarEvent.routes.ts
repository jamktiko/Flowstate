import { Router } from 'express';
import { checkAuth } from '../auth/auth.middleware';
import {
  createEventController,
  getEventsByUserController,
  updateEventController,
  deleteEventController,
  linkEventToCardController,
  unlinkEventFromCardController,
} from './calendarEvent.controller';

const router = Router();

// Calendar routes — all protected by checkAuth middleware
// Router is mounted at /api/calendar in app.ts

// POST /api/calendar — create a new calendar event manually or from sync
router.post('/', checkAuth, createEventController);

// GET /api/calendar?from=2026-05-01&to=2026-05-31 — get events in date range
router.get('/', checkAuth, getEventsByUserController);

// PATCH /api/calendar/:id — update specific fields on an event
router.patch('/:id', checkAuth, updateEventController);

// DELETE /api/calendar/:id — delete event and clean up any card link
router.delete('/:id', checkAuth, deleteEventController);

// POST /api/calendar/:id/link — create bidirectional link between event and card
router.post('/:id/link', checkAuth, linkEventToCardController);

// DELETE /api/calendar/:id/link — remove bidirectional link between event and card
router.delete('/:id/link', checkAuth, unlinkEventFromCardController);

export default router;
