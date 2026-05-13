import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { getUserByCognitoSub } from '../users/user.service';
import { sendSuccess, sendError } from '../../utils/responseHelpers';
import {
  pushCardToGoogleCalendar,
  updateCardInGoogleCalendar,
  importGoogleCalendarEvents,
  deleteCardFromGoogleCalendar,
} from './calendar.sync.service';

// ─────────────────────────────────────────────
// Helper — resolves cognitoSub → MongoDB user._id
// ─────────────────────────────────────────────
const resolveUserId = async (req: Request, res: Response) => {
  const sub = (req as any).user.sub; // cognitoSub from verified JWT
  const user = await getUserByCognitoSub(sub);
  if (!user) {
    sendError(res, 'User not found', 404);
    return null;
  }
  return user._id;
};

/**
 * POST /api/calendar/sync/push-card/:boardId/:cardId
 * Pushes a task (card) to Google Calendar as an event.
 * Creates event in Google Calendar and links it to the card.
 * Returns the created calendar event document.
 */
export const pushCardToGoogleController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = await resolveUserId(req, res);
    if (!userId) return;

    const boardId = new Types.ObjectId(req.params.boardId);
    const cardId = new Types.ObjectId(req.params.cardId);

    const calendarEvent = await pushCardToGoogleCalendar(
      userId,
      boardId,
      cardId,
    );

    return sendSuccess(res, calendarEvent, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return sendError(res, message, 400);
  }
};

/**
 * PUT /api/calendar/sync/update-card/:boardId/:cardId
 * Updates a card's linked Google Calendar event.
 * Called after card is modified (title, due date, etc.).
 * Returns the updated calendar event document.
 */
export const updateCardInGoogleController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = await resolveUserId(req, res);
    if (!userId) return;

    const boardId = new Types.ObjectId(req.params.boardId);
    const cardId = new Types.ObjectId(req.params.cardId);

    const calendarEvent = await updateCardInGoogleCalendar(
      userId,
      boardId,
      cardId,
    );

    return sendSuccess(res, calendarEvent);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return sendError(res, message, 400);
  }
};

/**
 * POST /api/calendar/sync/import?from=2026-05-01&to=2026-05-31
 * Imports all Google Calendar events within a date range into local calendar.
 * Fetches events from Google and saves them to MongoDB, skipping duplicates.
 * Returns array of imported calendar events.
 */
export const importGoogleEventsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = await resolveUserId(req, res);
    if (!userId) return;

    // Parse date range from query parameters
    const { from, to } = req.query;

    if (!from || !to) {
      return sendError(res, 'Missing from and to date parameters', 400);
    }

    const fromDate = new Date(from as string);
    const toDate = new Date(to as string);

    // Validate dates
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return sendError(res, 'Invalid date format. Use ISO string format.', 400);
    }

    const imported = await importGoogleCalendarEvents(userId, fromDate, toDate);

    return sendSuccess(res, {
      count: imported.length,
      events: imported,
      message: `Imported ${imported.length} events from Google Calendar`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return sendError(res, message, 400);
  }
};

/**
 * DELETE /api/calendar/sync/delete-card-event/:calendarEventId
 * Deletes a card's linked Google Calendar event.
 * Called when card is deleted or when unlinking.
 * Deletes both from Google Calendar and from local MongoDB.
 */
export const deleteCardFromGoogleController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = await resolveUserId(req, res);
    if (!userId) return;

    const calendarEventId = new Types.ObjectId(req.params.calendarEventId);

    await deleteCardFromGoogleCalendar(userId, calendarEventId);

    return sendSuccess(res, {
      message: 'Calendar event deleted successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return sendError(res, message, 400);
  }
};
