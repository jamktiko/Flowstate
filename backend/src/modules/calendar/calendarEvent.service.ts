/**
 * calendarEvent.service.ts — STUB
 * TODO: Implement these functions. Tests in calendarEvent.service.spec.ts are already
 * written and will go green as each function is implemented correctly.
 */
import { Types } from 'mongoose';
import { ICalendarEvent } from './calendarEvent.model';
import { IBoard } from '../boards/board.model';

export async function createEvent(
  _userId: Types.ObjectId,
  _data: Partial<ICalendarEvent>,
): Promise<ICalendarEvent> {
  throw new Error('Not implemented: createEvent');
}

export async function getEventsByUser(
  _userId: Types.ObjectId,
  _from: Date,
  _to: Date,
): Promise<ICalendarEvent[]> {
  throw new Error('Not implemented: getEventsByUser');
}

export async function updateEvent(
  _eventId: Types.ObjectId,
  _userId: Types.ObjectId,
  _updates: Partial<ICalendarEvent>,
): Promise<ICalendarEvent> {
  throw new Error('Not implemented: updateEvent');
}

export async function deleteEvent(
  _eventId: Types.ObjectId,
  _userId: Types.ObjectId,
): Promise<void> {
  throw new Error('Not implemented: deleteEvent');
}

export async function linkEventToCard(
  _eventId: Types.ObjectId,
  _userId: Types.ObjectId,
  _cardId: Types.ObjectId,
  _boardId: Types.ObjectId,
): Promise<{ event: ICalendarEvent; board: IBoard }> {
  throw new Error('Not implemented: linkEventToCard');
}

export async function unlinkEventFromCard(
  _eventId: Types.ObjectId,
  _userId: Types.ObjectId,
): Promise<{ event: ICalendarEvent; board: IBoard }> {
  throw new Error('Not implemented: unlinkEventFromCard');
}
