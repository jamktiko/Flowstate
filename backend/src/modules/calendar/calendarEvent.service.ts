import { Types } from 'mongoose';
import { CalendarEvent, ICalendarEvent } from './calendarEvent.model';
import { Board, IBoard } from '../boards/board.model';

// ─────────────────────────────────────────────
// createEvent — FR 5.1
// ─────────────────────────────────────────────

/**
 * Creates a new calendar event document.
 * No manual validation needed — schema enforces:
 *   - title required (throws if missing)
 *   - externalEventId + provider unique index (throws on duplicate sync)
 * userId is always taken from the verified JWT, never from client data.
 * @param userId - MongoDB ObjectId of the event owner
 * @param data - Event data from Google/Microsoft sync or manual creation
 * @returns The newly created calendar event document
 */
export async function createEvent(
  userId: Types.ObjectId,
  data: Partial<ICalendarEvent>,
): Promise<ICalendarEvent> {
  // Spread data first, then override userId — prevents client from spoofing ownership
  return await CalendarEvent.create({ ...data, userId });
}

// ─────────────────────────────────────────────
// getEventsByUser — FR 5.4
// ─────────────────────────────────────────────

/**
 * Returns all calendar events for a user within a date range.
 * Uses the compound index { userId: 1, startTime: 1 } for efficient queries.
 * Only returns events where startTime falls within the requested range.
 * @param userId - MongoDB ObjectId of the requesting user
 * @param from - Range start — events with startTime >= from are included
 * @param to - Range end — events with startTime <= to are included
 * @returns Array of calendar event documents — empty array if none found
 */
export async function getEventsByUser(
  userId: Types.ObjectId,
  from: Date,
  to: Date,
): Promise<ICalendarEvent[]> {
  return await CalendarEvent.find({
    userId, // only this user's events — never returns other users' data
    startTime: {
      $gte: from, // greater than or equal to range start
      $lte: to, // less than or equal to range end
    },
  });
}

// ─────────────────────────────────────────────
// updateEvent — FR 5.3
// ─────────────────────────────────────────────

/**
 * Updates specific fields on a calendar event.
 * userId in query acts as ownership check — prevents IDOR attacks.
 * Only fields provided in updates are changed — other fields untouched.
 * @param eventId - MongoDB ObjectId of the event to update
 * @param userId - MongoDB ObjectId of the requesting user
 * @param updates - Partial event object — only provided fields are updated
 * @returns The updated calendar event document
 * @throws If title is explicitly set to empty (FR 5.3.1)
 * @throws If event not found or belongs to a different user (FR 4.3)
 */
export async function updateEvent(
  eventId: Types.ObjectId,
  userId: Types.ObjectId,
  updates: Partial<ICalendarEvent>,
): Promise<ICalendarEvent> {
  // Guard: only throw if title was explicitly provided AND is empty
  // undefined means client didn't send title — that's fine, leave it unchanged
  if (updates.title !== undefined && !updates.title.trim()) {
    throw new Error('Event title cannot be empty');
  }

  // userId in query prevents updating other users' events (IDOR protection)
  // $set only updates provided fields — leaves everything else untouched
  const updated = await CalendarEvent.findOneAndUpdate(
    { _id: eventId, userId },
    { $set: updates },
    { new: true, runValidators: true }, // return updated doc, run schema validators
  );

  // Single throw covers both "not found" and "wrong user" — never expose which
  if (!updated) throw new Error('Event not found or does not belong to user');

  return updated;
}

// ─────────────────────────────────────────────
// deleteEvent — FR 5.5
// ─────────────────────────────────────────────

/**
 * Deletes a calendar event and cleans up any bidirectional card link.
 * Schema doc rule: if event has linkedCardId, must clear card.linkedEventId too.
 * Both operations run in parallel via Promise.all — independent of each other.
 * @param eventId - MongoDB ObjectId of the event to delete
 * @param userId - MongoDB ObjectId of the requesting user
 * @throws If event not found or belongs to a different user (FR 4.3)
 */
export async function deleteEvent(
  eventId: Types.ObjectId,
  userId: Types.ObjectId,
): Promise<void> {
  // Fetch event first — need linkedCardId and linkedBoardId for cleanup
  const event = await CalendarEvent.findOne({ _id: eventId, userId });
  if (!event) throw new Error('Event not found or does not belong to user');

  if (event.linkedCardId && event.linkedBoardId) {
    // Event is linked to a card — must clear card.linkedEventId (bidirectional cleanup)
    // Run deletion and card cleanup in parallel — neither depends on the other
    await Promise.all([
      CalendarEvent.findByIdAndDelete(eventId),
      Board.findOneAndUpdate(
        { _id: event.linkedBoardId },
        { $set: { 'columns.$[col].cards.$[card].linkedEventId': null } },
        {
          arrayFilters: [
            { 'col.cards._id': event.linkedCardId }, // find column containing the card
            { 'card._id': event.linkedCardId }, // find the specific card
          ],
        },
      ),
    ]);
  } else {
    // No card link — simple delete
    await CalendarEvent.findByIdAndDelete(eventId);
  }
}

// ─────────────────────────────────────────────
// linkEventToCard — bidirectional schema doc rule
// ─────────────────────────────────────────────

/**
 * Creates a bidirectional link between a calendar event and an embedded card.
 * Schema doc rule: BOTH sides must be updated atomically:
 *   - event.linkedCardId + event.linkedBoardId
 *   - card.linkedEventId
 * linkedBoardId is required because cards are embedded — no standalone cards collection.
 * @param eventId - MongoDB ObjectId of the event to link
 * @param userId - MongoDB ObjectId of the requesting user
 * @param cardId - MongoDB ObjectId of the card to link to
 * @param boardId - MongoDB ObjectId of the board containing the card
 * @returns Object containing the updated event and updated board
 * @throws If event not found or belongs to a different user
 */
export async function linkEventToCard(
  eventId: Types.ObjectId,
  userId: Types.ObjectId,
  cardId: Types.ObjectId,
  boardId: Types.ObjectId,
): Promise<{ event: ICalendarEvent; board: IBoard }> {
  // Update both sides in parallel — neither depends on the other's result
  const [event, board] = await Promise.all([
    // Side 1: set linkedCardId + linkedBoardId on the event
    CalendarEvent.findOneAndUpdate(
      { _id: eventId, userId }, // ownership check
      { $set: { linkedCardId: cardId, linkedBoardId: boardId } },
      { new: true },
    ),
    // Side 2: set linkedEventId on the card inside the board
    Board.findOneAndUpdate(
      { _id: boardId, userId }, // ownership check
      { $set: { 'columns.$[col].cards.$[card].linkedEventId': eventId } },
      {
        new: true,
        arrayFilters: [
          { 'col.cards._id': cardId }, // find column containing the card
          { 'card._id': cardId }, // find the specific card
        ],
      },
    ),
  ]);

  if (!event) throw new Error('Event not found or does not belong to user');
  if (!board) throw new Error('Board not found or does not belong to user');

  return { event, board };
}

// ─────────────────────────────────────────────
// unlinkEventFromCard — bidirectional cleanup
// ─────────────────────────────────────────────

/**
 * Removes the bidirectional link between a calendar event and a card.
 * Clears BOTH sides simultaneously:
 *   - event.linkedCardId → null
 *   - event.linkedBoardId → null
 *   - card.linkedEventId → null
 * Must fetch event first to get linkedCardId and linkedBoardId for the card update.
 * @param eventId - MongoDB ObjectId of the event to unlink
 * @param userId - MongoDB ObjectId of the requesting user
 * @returns Object containing the updated event and updated board
 * @throws If event not found or belongs to a different user
 * @throws If event has no linked card to unlink
 */
export async function unlinkEventFromCard(
  eventId: Types.ObjectId,
  userId: Types.ObjectId,
): Promise<{ event: ICalendarEvent; board: IBoard }> {
  // Fetch event first — need linkedCardId and linkedBoardId to clear the card side
  const existing = await CalendarEvent.findOne({ _id: eventId, userId });
  if (!existing) throw new Error('Event not found or does not belong to user');
  if (!existing.linkedCardId || !existing.linkedBoardId) {
    throw new Error('Event is not linked to any card');
  }

  // Clear both sides in parallel — neither depends on the other
  const [event, board] = await Promise.all([
    // Side 1: clear linkedCardId + linkedBoardId on the event
    CalendarEvent.findOneAndUpdate(
      { _id: eventId, userId },
      { $set: { linkedCardId: null, linkedBoardId: null } },
      { new: true },
    ),
    // Side 2: clear linkedEventId on the card inside the board
    Board.findOneAndUpdate(
      { _id: existing.linkedBoardId, userId },
      { $set: { 'columns.$[col].cards.$[card].linkedEventId': null } },
      {
        new: true,
        arrayFilters: [
          { 'col.cards._id': existing.linkedCardId }, // find column containing card
          { 'card._id': existing.linkedCardId }, // find the specific card
        ],
      },
    ),
  ]);

  if (!event) throw new Error('Event not found or does not belong to user');
  if (!board) throw new Error('Board not found or does not belong to user');

  return { event, board };
}
