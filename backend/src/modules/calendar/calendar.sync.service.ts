import { Types } from 'mongoose';
import { Board, ICard } from '../boards/board.model';
import { CalendarEvent, ICalendarEvent } from '../calendar/calendarEvent.model';
import { getGoogleCalendarService } from './google.service';
import { IGoogleCalendarEvent } from './google.service';
import { isGoogleCalendarLinked } from './calendar.auth.service';

type GoogleEventDatePart = IGoogleCalendarEvent['start'];

function isDateTimePart(
  part: GoogleEventDatePart,
): part is { dateTime: string; timeZone?: string } {
  return 'dateTime' in part;
}

function getEventDate(part: GoogleEventDatePart): Date {
  if (isDateTimePart(part)) {
    return new Date(part.dateTime);
  }

  return new Date(`${part.date}T00:00:00.000Z`);
}

// ─────────────────────────────────────────────
// Mapping helpers
// ─────────────────────────────────────────────

/**
 * Converts a card (task) to a Google Calendar event.
 * Maps Flowstate task fields to Google Calendar event fields.
 * @param card - The card/task to convert
 * @param boardName - Board name (included in event description for context)
 * @returns Google Calendar event object
 */
export function cardToGoogleEvent(
  card: ICard,
  boardName: string,
): Partial<IGoogleCalendarEvent> {
  // Build event description from card details
  const descriptionParts = [
    card.description || '',
    `Priority: ${card.priority || 'normal'}`,
    `Board: ${boardName}`,
    `Tags: ${card.tags.map((t) => t.name).join(', ') || 'none'}`,
  ];

  const description = descriptionParts.filter(Boolean).join('\n');

  // If no due date, use current time
  if (!card.dueDate) {
    return {
      summary: card.title,
      description,
      start: {
        dateTime: new Date().toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour duration
        timeZone: 'UTC',
      },
    };
  }

  // All-day vs timed event
  const isAllDay = card.dueDate && !card.dueDate.getHours();

  if (isAllDay) {
    return {
      summary: card.title,
      description,
      start: {
        date: card.dueDate.toISOString().split('T')[0],
      },
      end: {
        date: new Date(card.dueDate.getTime() + 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
      },
    };
  }

  // Timed event — due date is start, end is 1 hour later
  return {
    summary: card.title,
    description,
    start: {
      dateTime: card.dueDate.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: new Date(card.dueDate.getTime() + 60 * 60 * 1000).toISOString(),
      timeZone: 'UTC',
    },
  };
}

/**
 * Converts a Google Calendar event to calendar event data.
 * Extracts summary as title, description is preserved.
 * @param googleEvent - Event from Google Calendar API
 * @param userId - MongoDB user ID
 * @returns Calendar event data suitable for storing in MongoDB
 */
export function googleEventToCalendarEvent(
  googleEvent: IGoogleCalendarEvent,
  userId: Types.ObjectId,
): Partial<ICalendarEvent> {
  // Parse start and end times
  const startTime = getEventDate(googleEvent.start);
  const endTime = getEventDate(googleEvent.end);
  const isAllDay = !isDateTimePart(googleEvent.start);

  return {
    userId,
    provider: 'google',
    externalEventId: googleEvent.id,
    title: googleEvent.summary,
    description: googleEvent.description,
    startTime,
    endTime,
    isAllDay,
    status: googleEvent.status as 'confirmed' | 'tentative' | 'cancelled',
  };
}

// ─────────────────────────────────────────────
// Push operations
// ─────────────────────────────────────────────

/**
 * Pushes a task (card) to Google Calendar as an event.
 * Creates event in Google Calendar and links it to the card in MongoDB.
 * @param userId - MongoDB user ID
 * @param boardId - MongoDB board ID
 * @param cardId - MongoDB card ID
 * @returns Created calendar event document
 */
export async function pushCardToGoogleCalendar(
  userId: Types.ObjectId,
  boardId: Types.ObjectId,
  cardId: Types.ObjectId,
): Promise<ICalendarEvent> {
  // Check if user has linked Google Calendar
  const isLinked = await isGoogleCalendarLinked(userId);
  if (!isLinked) {
    throw new Error('Google Calendar account is not linked');
  }

  // Find the board and card
  const board = await Board.findOne({ _id: boardId, userId });
  if (!board) {
    throw new Error('Board not found or does not belong to user');
  }

  // Find the card in the board's columns
  let card: ICard | null = null;
  for (const column of board.columns) {
    const found = column.cards.find((c) => c._id.equals(cardId));
    if (found) {
      card = found;
      break;
    }
  }

  if (!card) {
    throw new Error('Card not found in board');
  }

  // Check if card is already linked to an event
  if (card.linkedEventId) {
    throw new Error('Card is already linked to a calendar event');
  }

  // Convert card to Google Calendar event
  const googleEvent = cardToGoogleEvent(card, board.name);

  // Create event in Google Calendar
  const googleService = getGoogleCalendarService();
  let createdGoogleEvent: IGoogleCalendarEvent;

  try {
    createdGoogleEvent = await googleService.createEvent(userId, googleEvent);
  } catch (error) {
    throw new Error(
      `Failed to create event in Google Calendar: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }

  // Save the event in our MongoDB collection
  const calendarEvent = await CalendarEvent.create({
    userId,
    provider: 'google',
    externalEventId: createdGoogleEvent.id,
    title: createdGoogleEvent.summary,
    description: createdGoogleEvent.description,
    startTime: getEventDate(createdGoogleEvent.start),
    endTime: getEventDate(createdGoogleEvent.end),
    isAllDay: !isDateTimePart(createdGoogleEvent.start),
    status: createdGoogleEvent.status,
    linkedCardId: card._id,
    linkedBoardId: boardId,
  });

  // Update card with linked event ID
  card.linkedEventId = calendarEvent._id;
  await board.save();

  return calendarEvent;
}

/**
 * Updates a card's linked Google Calendar event.
 * Called when card is modified (title, due date, etc.).
 * @param userId - MongoDB user ID
 * @param boardId - MongoDB board ID
 * @param cardId - MongoDB card ID
 * @returns Updated calendar event document
 */
export async function updateCardInGoogleCalendar(
  userId: Types.ObjectId,
  boardId: Types.ObjectId,
  cardId: Types.ObjectId,
): Promise<ICalendarEvent> {
  // Find the board and card
  const board = await Board.findOne({ _id: boardId, userId });
  if (!board) {
    throw new Error('Board not found or does not belong to user');
  }

  // Find the card in the board's columns
  let card: ICard | null = null;
  for (const column of board.columns) {
    const found = column.cards.find((c) => c._id.equals(cardId));
    if (found) {
      card = found;
      break;
    }
  }

  if (!card) {
    throw new Error('Card not found in board');
  }

  if (!card.linkedEventId) {
    throw new Error('Card is not linked to a calendar event');
  }

  // Find the calendar event
  const calendarEvent = await CalendarEvent.findById(card.linkedEventId);
  if (!calendarEvent) {
    throw new Error('Linked calendar event not found');
  }

  // Convert updated card to Google Calendar event
  const googleEventUpdates = cardToGoogleEvent(card, board.name);

  // Update event in Google Calendar
  const googleService = getGoogleCalendarService();
  let updatedGoogleEvent: IGoogleCalendarEvent;

  try {
    updatedGoogleEvent = await googleService.updateEvent(
      userId,
      calendarEvent.externalEventId,
      googleEventUpdates,
    );
  } catch (error) {
    throw new Error(
      `Failed to update event in Google Calendar: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }

  // Update our MongoDB calendar event
  calendarEvent.title = updatedGoogleEvent.summary;
  calendarEvent.description = updatedGoogleEvent.description;
  calendarEvent.startTime = getEventDate(updatedGoogleEvent.start);
  calendarEvent.endTime = getEventDate(updatedGoogleEvent.end);
  calendarEvent.isAllDay = !isDateTimePart(updatedGoogleEvent.start);
  calendarEvent.status = updatedGoogleEvent.status;

  await calendarEvent.save();

  return calendarEvent;
}

// ─────────────────────────────────────────────
// Pull operations
// ─────────────────────────────────────────────

/**
 * Imports all Google Calendar events for a user into the local calendar.
 * Fetches events from Google and saves them to MongoDB, skipping duplicates.
 * @param userId - MongoDB user ID
 * @param from - Range start date
 * @param to - Range end date
 * @returns Array of imported calendar events
 */
export async function importGoogleCalendarEvents(
  userId: Types.ObjectId,
  from: Date,
  to: Date,
): Promise<ICalendarEvent[]> {
  // Check if user has linked Google Calendar
  const isLinked = await isGoogleCalendarLinked(userId);
  if (!isLinked) {
    throw new Error('Google Calendar account is not linked');
  }

  // Fetch events from Google Calendar
  const googleService = getGoogleCalendarService();
  let googleEvents: IGoogleCalendarEvent[];

  try {
    googleEvents = await googleService.getEvents(userId, from, to);
  } catch (error) {
    throw new Error(
      `Failed to fetch events from Google Calendar: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }

  // Import events to MongoDB, skipping duplicates
  const imported: ICalendarEvent[] = [];

  for (const googleEvent of googleEvents) {
    try {
      // Check if event already exists (by externalEventId + provider)
      const existing = await CalendarEvent.findOne({
        externalEventId: googleEvent.id,
        provider: 'google',
      });

      if (existing) {
        // Update existing event
        Object.assign(
          existing,
          googleEventToCalendarEvent(googleEvent, userId),
        );
        await existing.save();
        imported.push(existing);
      } else {
        // Create new event
        const newEvent = await CalendarEvent.create(
          googleEventToCalendarEvent(googleEvent, userId),
        );
        imported.push(newEvent);
      }
    } catch (error) {
      console.warn(
        `Failed to import event ${googleEvent.id}:`,
        error instanceof Error ? error.message : 'Unknown error',
      );
      // Continue with next event
    }
  }

  return imported;
}

/**
 * Deletes a card's linked Google Calendar event.
 * Called when card is deleted or when unlinking.
 * @param userId - MongoDB user ID
 * @param calendarEventId - MongoDB calendar event ID
 */
export async function deleteCardFromGoogleCalendar(
  userId: Types.ObjectId,
  calendarEventId: Types.ObjectId,
): Promise<void> {
  // Find the calendar event
  const calendarEvent = await CalendarEvent.findById(calendarEventId);
  if (!calendarEvent) {
    throw new Error('Calendar event not found');
  }

  if (calendarEvent.userId.toString() !== userId.toString()) {
    throw new Error('Calendar event does not belong to user');
  }

  // Delete event from Google Calendar
  const googleService = getGoogleCalendarService();

  try {
    await googleService.deleteEvent(userId, calendarEvent.externalEventId);
  } catch (error) {
    console.warn(
      `Failed to delete event from Google Calendar: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
    // Continue anyway — event will be deleted locally
  }

  // Delete the calendar event document
  await CalendarEvent.deleteOne({ _id: calendarEventId });
}
