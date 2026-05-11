/**
 * factories.ts — Test object factories
 *
 * WHY: Factories (rather than static fixtures) let each test override only the
 * field it cares about. This keeps tests focused and prevents "mystery object"
 * anti-patterns where you can't tell which field actually drives the assertion.
 *
 * Pattern:
 *   const user = makeUser({ email: 'custom@test.fi' });
 *   // All other fields get safe, valid defaults.
 *
 * IMPORTANT: These return plain objects suitable for `new Model(data)` or
 * `Model.create(data)`. They do NOT persist to the DB — callers decide that.
 */

import { Types } from 'mongoose';
import type { IUser } from '../modules/users/user.model';
import type { IBoard, ICard, IColumn } from '../modules/boards/board.model';
import type { ICalendarEvent } from '../modules/calendar/calendarEvent.model';

// ─────────────────────────────────────────────
// User factory
// ─────────────────────────────────────────────

type UserInput = Partial<
  Pick<IUser, 'cognitoSub' | 'firstName' | 'lastName' | 'email' | 'role'>
>;

let userCounter = 0;

export function makeUser(overrides: UserInput = {}): UserInput & {
  cognitoSub: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'admin';
} {
  userCounter++;
  return {
    cognitoSub: `cognito-sub-${userCounter}`,
    firstName: 'Testi',
    lastName: 'Käyttäjä',
    email: `testi${userCounter}@flowstate.fi`,
    role: 'user',
    ...overrides,
  };
}

// ─────────────────────────────────────────────
// Card factory
// ─────────────────────────────────────────────

type CardInput = Partial<
  Pick<ICard, 'title' | 'description' | 'priority' | 'order' | 'dueDate'>
>;

let cardCounter = 0;

export function makeCard(overrides: CardInput = {}): CardInput & {
  title: string;
  order: number;
} {
  cardCounter++;
  return {
    title: `Test Card ${cardCounter}`,
    order: cardCounter - 1,
    ...overrides,
  };
}

// ─────────────────────────────────────────────
// Column factory
// ─────────────────────────────────────────────

type ColumnInput = Partial<Pick<IColumn, 'id' | 'name' | 'order' | 'cards'>>;

let colCounter = 0;

export function makeColumn(overrides: ColumnInput = {}): ColumnInput & {
  id: string;
  name: string;
  order: number;
  cards: ReturnType<typeof makeCard>[];
} {
  colCounter++;
  return {
    id: `col_${colCounter}`,
    name: `Column ${colCounter}`,
    order: colCounter - 1,
    cards: [],
    ...overrides,
  };
}

// ─────────────────────────────────────────────
// Board factory
// ─────────────────────────────────────────────

type BoardInput = Partial<Pick<IBoard, 'name' | 'columns'>> & {
  userId?: Types.ObjectId;
};

let boardCounter = 0;

export function makeBoard(
  userId: Types.ObjectId,
  overrides: Omit<BoardInput, 'userId'> = {},
): {
  userId: Types.ObjectId;
  name: string;
  columns: ReturnType<typeof makeColumn>[];
} {
  boardCounter++;
  return {
    userId,
    name: `Test Board ${boardCounter}`,
    columns: [],
    ...overrides,
  };
}

// ─────────────────────────────────────────────
// CalendarEvent factory
// ─────────────────────────────────────────────

type CalendarEventInput = Partial<
  Pick<
    ICalendarEvent,
    | 'provider'
    | 'externalEventId'
    | 'title'
    | 'description'
    | 'startTime'
    | 'endTime'
    | 'isAllDay'
    | 'status'
    | 'linkedCardId'
    | 'linkedBoardId'
  >
> & { userId?: Types.ObjectId };

let eventCounter = 0;

export function makeCalendarEvent(
  userId: Types.ObjectId,
  overrides: Omit<CalendarEventInput, 'userId'> = {},
): CalendarEventInput & {
  userId: Types.ObjectId;
  provider: 'google' | 'microsoft';
  externalEventId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  status: 'confirmed' | 'tentative' | 'cancelled';
} {
  eventCounter++;
  const start = new Date('2026-05-01T10:00:00Z');
  const end = new Date('2026-05-01T11:00:00Z');
  return {
    userId,
    provider: 'google',
    externalEventId: `ext-event-${eventCounter}`,
    title: `Test Event ${eventCounter}`,
    description: '',
    startTime: start,
    endTime: end,
    isAllDay: false,
    status: 'confirmed',
    ...overrides,
  };
}
