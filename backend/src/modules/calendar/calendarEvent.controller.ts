import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { getUserByCognitoSub } from '../users/user.service';
import { sendSuccess, sendError } from '../../utils/responseHelpers';
import {
  createEvent,
  getEventsByUser,
  updateEvent,
  deleteEvent,
  linkEventToCard,
  unlinkEventFromCard,
} from './calendarEvent.service';

// ─────────────────────────────────────────────
// Helper — resolves cognitoSub → MongoDB user._id
// Every calendar operation needs userId as ObjectId.
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
 * POST /api/calendar
 * Creates a new calendar event manually or from an external sync.
 * Schema enforces title required and externalEventId+provider uniqueness.
 * Returns 201 Created with the new event document.
 */
export const createEventController = async (req: Request, res: Response) => {
  try {
    const userId = await resolveUserId(req, res);
    if (!userId) return; // resolveUserId already sent 404

    const data = req.body; // full event data object from client
    const event = await createEvent(userId, data);
    return sendSuccess(res, event, 201); // 201 = resource created
  } catch (error) {
    return sendError(res, 'Internal server error', 500);
  }
};

/**
 * GET /api/calendar?from=2026-05-01&to=2026-05-31
 * Returns all events for the authenticated user within a date range.
 * from and to come as query parameters — converted to Date objects here.
 * Uses compound index { userId, startTime } for efficient range queries.
 */
export const getEventsByUserController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = await resolveUserId(req, res);
    if (!userId) return;

    // Date range comes from query params — e.g. ?from=2026-05-01&to=2026-05-31
    const { from, to } = req.query;
    const fromDate = new Date(from as string); // convert string to Date
    const toDate = new Date(to as string); // convert string to Date

    const events = await getEventsByUser(userId, fromDate, toDate);
    return sendSuccess(res, events);
  } catch (error) {
    return sendError(res, 'Internal server error', 500);
  }
};

/**
 * PATCH /api/calendar/:id
 * Updates specific fields on a calendar event.
 * Only fields provided in req.body are changed — other fields untouched.
 * Service throws if title is set to empty or event belongs to another user.
 */
export const updateEventController = async (req: Request, res: Response) => {
  try {
    const userId = await resolveUserId(req, res);
    if (!userId) return;

    const eventId = new Types.ObjectId(req.params.id); // convert string param to ObjectId
    const updates = req.body; // partial event object from client
    const updated = await updateEvent(eventId, userId, updates);
    return sendSuccess(res, updated);
  } catch (error) {
    return sendError(res, 'Internal server error', 500);
  }
};

/**
 * DELETE /api/calendar/:id
 * Deletes a calendar event and cleans up any bidirectional card link.
 * If event has linkedCardId, service also clears card.linkedEventId.
 */
export const deleteEventController = async (req: Request, res: Response) => {
  try {
    const userId = await resolveUserId(req, res);
    if (!userId) return;

    const eventId = new Types.ObjectId(req.params.id); // convert string param to ObjectId
    await deleteEvent(eventId, userId);
    return sendSuccess(res, { message: 'Event deleted successfully' });
  } catch (error) {
    return sendError(res, 'Internal server error', 500);
  }
};

/**
 * POST /api/calendar/:id/link
 * Creates a bidirectional link between a calendar event and a board card.
 * Requires cardId and boardId in request body — both needed to locate embedded card.
 * Updates BOTH event.linkedCardId AND card.linkedEventId atomically.
 */
export const linkEventToCardController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = await resolveUserId(req, res);
    if (!userId) return;

    const eventId = new Types.ObjectId(req.params.id); // event to link
    const { cardId, boardId } = req.body; // card location from body

    const result = await linkEventToCard(
      eventId,
      userId,
      new Types.ObjectId(cardId), // convert string to ObjectId
      new Types.ObjectId(boardId), // convert string to ObjectId
    );
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, 'Internal server error', 500);
  }
};

/**
 * DELETE /api/calendar/:id/link
 * Removes the bidirectional link between a calendar event and a board card.
 * Clears BOTH event.linkedCardId AND card.linkedEventId atomically.
 * Service fetches existing link data — no body needed from client.
 */
export const unlinkEventFromCardController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = await resolveUserId(req, res);
    if (!userId) return;

    const eventId = new Types.ObjectId(req.params.id); // event to unlink
    const result = await unlinkEventFromCard(eventId, userId);
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, 'Internal server error', 500);
  }
};
