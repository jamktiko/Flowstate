// /**
//  * calendarEvent.service.spec.ts — TDD specs for CalendarEventService
//  *
//  * STATUS: These tests are RED until calendarEvent.service.ts is implemented.
//  * Derived from SRS FR 5.1–5.5 and schema doc (bidirectional card↔event links,
//  * linkedBoardId requirement, unique externalEventId+provider constraint).
//  *
//  * Expected exports from calendarEvent.service.ts:
//  *   createEvent(userId, data)                      → ICalendarEvent
//  *   getEventsByUser(userId, from, to)              → ICalendarEvent[]
//  *   updateEvent(eventId, userId, updates)          → ICalendarEvent
//  *   deleteEvent(eventId, userId)                   → void
//  *   linkEventToCard(eventId, userId, cardId, boardId)  → { event, board }
//  *   unlinkEventFromCard(eventId, userId)           → { event, board }
//  *
//  * COMMIT CHECKPOINT: "test(calendar-service): TDD specs — red until service implemented"
//  */

// import { Types } from 'mongoose';
// import { connectTestDB, clearTestDB, disconnectTestDB } from '../../test/db';
// import {
//   makeUser,
//   makeBoard,
//   makeColumn,
//   makeCard,
//   makeCalendarEvent,
// } from '../../test/factories';
// import { User } from '../users/user.model';
// import { Board } from '../boards/board.model';
// import { CalendarEvent } from './calendarEvent.model';

// import {
//   createEvent,
//   getEventsByUser,
//   updateEvent,
//   deleteEvent,
//   linkEventToCard,
//   unlinkEventFromCard,
// } from './calendarEvent.service';

// beforeAll(connectTestDB);
// afterEach(clearTestDB);
// afterAll(disconnectTestDB);

// // ─────────────────────────────────────────────
// // createEvent — FR 5.1
// // ─────────────────────────────────────────────

// describe('CalendarEventService.createEvent', () => {
//   it('creates and persists a calendar event (FR 5.1)', async () => {
//     const user = await User.create(makeUser());
//     const data = makeCalendarEvent(user._id);

//     const event = await createEvent(user._id, data);

//     expect(event._id).toBeDefined();
//     expect(event.title).toBe(data.title);
//     expect(event.userId.toString()).toBe(user._id.toString());
//   });

//   it('throws when title is missing (FR 5.1.2)', async () => {
//     const user = await User.create(makeUser());
//     const data = makeCalendarEvent(user._id);
//     // @ts-expect-error
//     delete data.title;

//     await expect(createEvent(user._id, data)).rejects.toThrow();
//   });

//   it('throws on duplicate externalEventId + provider (sync guard)', async () => {
//     const user = await User.create(makeUser());
//     const data = makeCalendarEvent(user._id, {
//       externalEventId: 'ext-dupe',
//       provider: 'google',
//     });

//     await createEvent(user._id, data);

//     await expect(createEvent(user._id, { ...data })).rejects.toThrow();
//   });
// });

// // ─────────────────────────────────────────────
// // getEventsByUser — FR 5.4
// // ─────────────────────────────────────────────

// describe('CalendarEventService.getEventsByUser', () => {
//   it('returns events for the user within the requested date range (FR 5.4)', async () => {
//     const user = await User.create(makeUser());

//     await CalendarEvent.create(
//       makeCalendarEvent(user._id, {
//         externalEventId: 'e1',
//         startTime: new Date('2026-05-01T10:00:00Z'),
//         endTime: new Date('2026-05-01T11:00:00Z'),
//       }),
//     );
//     await CalendarEvent.create(
//       makeCalendarEvent(user._id, {
//         externalEventId: 'e2',
//         startTime: new Date('2026-06-01T10:00:00Z'),
//         endTime: new Date('2026-06-01T11:00:00Z'),
//       }),
//     );

//     const events = await getEventsByUser(
//       user._id,
//       new Date('2026-05-01T00:00:00Z'),
//       new Date('2026-05-31T23:59:59Z'),
//     );

//     expect(events).toHaveLength(1);
//     expect(events[0].externalEventId).toBe('e1');
//   });

//   it('does not return events belonging to another user', async () => {
//     const userA = await User.create(makeUser());
//     const userB = await User.create(makeUser());
//     await CalendarEvent.create(makeCalendarEvent(userA._id));

//     const events = await getEventsByUser(
//       userB._id,
//       new Date('2026-01-01'),
//       new Date('2026-12-31'),
//     );
//     expect(events).toHaveLength(0);
//   });
// });

// // ─────────────────────────────────────────────
// // updateEvent — FR 5.3
// // ─────────────────────────────────────────────

// describe('CalendarEventService.updateEvent', () => {
//   it('updates event title (FR 5.3)', async () => {
//     const user = await User.create(makeUser());
//     const event = await CalendarEvent.create(makeCalendarEvent(user._id));

//     const updated = await updateEvent(event._id, user._id, {
//       title: 'New Title',
//     });

//     expect(updated.title).toBe('New Title');
//   });

//   it('throws when title update is empty (FR 5.3.1)', async () => {
//     const user = await User.create(makeUser());
//     const event = await CalendarEvent.create(makeCalendarEvent(user._id));

//     await expect(
//       updateEvent(event._id, user._id, { title: '' }),
//     ).rejects.toThrow();
//   });

//   it('throws when event does not belong to the user', async () => {
//     const owner = await User.create(makeUser());
//     const attacker = await User.create(makeUser());
//     const event = await CalendarEvent.create(makeCalendarEvent(owner._id));

//     await expect(
//       updateEvent(event._id, attacker._id, { title: 'Hacked' }),
//     ).rejects.toThrow();
//   });
// });

// // ─────────────────────────────────────────────
// // deleteEvent — FR 5.5
// // ─────────────────────────────────────────────

// describe('CalendarEventService.deleteEvent', () => {
//   it('removes the event document (FR 5.5)', async () => {
//     const user = await User.create(makeUser());
//     const event = await CalendarEvent.create(makeCalendarEvent(user._id));

//     await deleteEvent(event._id, user._id);

//     const found = await CalendarEvent.findById(event._id);
//     expect(found).toBeNull();
//   });

//   it('throws when event does not belong to the user', async () => {
//     const owner = await User.create(makeUser());
//     const attacker = await User.create(makeUser());
//     const event = await CalendarEvent.create(makeCalendarEvent(owner._id));

//     await expect(deleteEvent(event._id, attacker._id)).rejects.toThrow();
//   });

//   it('clears linkedEventId on the card when a linked event is deleted (bidirectional cleanup)', async () => {
//     // WHY: schema doc says the link is bidirectional — deleting an event
//     // must clear the card's linkedEventId so the board stays consistent.
//     const user = await User.create(makeUser());
//     const card = makeCard();
//     const col = makeColumn({ id: 'col_1', cards: [card] as any });
//     const board = await Board.create(
//       makeBoard(user._id, { columns: [col] as any }),
//     );
//     const cardId = board.columns[0].cards[0]._id;

//     const event = await CalendarEvent.create(
//       makeCalendarEvent(user._id, {
//         linkedCardId: cardId as any,
//         linkedBoardId: board._id as any,
//       }),
//     );

//     // Manually set card's linkedEventId (board.service will do this properly later)
//     await Board.updateOne(
//       { _id: board._id, 'columns.id': 'col_1', 'columns.cards._id': cardId },
//       { $set: { 'columns.$[col].cards.$[card].linkedEventId': event._id } },
//       { arrayFilters: [{ 'col.id': 'col_1' }, { 'card._id': cardId }] },
//     );

//     await deleteEvent(event._id, user._id);

//     const updatedBoard = await Board.findById(board._id);
//     expect(updatedBoard!.columns[0].cards[0].linkedEventId).toBeNull();
//   });
// });

// // ─────────────────────────────────────────────
// // linkEventToCard — bidirectional schema doc rule
// // ─────────────────────────────────────────────

// describe('CalendarEventService.linkEventToCard', () => {
//   it('sets linkedCardId + linkedBoardId on the event', async () => {
//     const user = await User.create(makeUser());
//     const card = makeCard();
//     const col = makeColumn({ id: 'col_1', cards: [card] as any });
//     const board = await Board.create(
//       makeBoard(user._id, { columns: [col] as any }),
//     );
//     const cardId = board.columns[0].cards[0]._id;
//     const event = await CalendarEvent.create(makeCalendarEvent(user._id));

//     const { event: updatedEvent } = await linkEventToCard(
//       event._id,
//       user._id,
//       cardId,
//       board._id,
//     );

//     expect(updatedEvent.linkedCardId?.toString()).toBe(cardId.toString());
//     expect(updatedEvent.linkedBoardId?.toString()).toBe(board._id.toString());
//   });

//   it('sets linkedEventId on the card (bidirectional)', async () => {
//     const user = await User.create(makeUser());
//     const card = makeCard();
//     const col = makeColumn({ id: 'col_1', cards: [card] as any });
//     const board = await Board.create(
//       makeBoard(user._id, { columns: [col] as any }),
//     );
//     const cardId = board.columns[0].cards[0]._id;
//     const event = await CalendarEvent.create(makeCalendarEvent(user._id));

//     const { board: updatedBoard } = await linkEventToCard(
//       event._id,
//       user._id,
//       cardId,
//       board._id,
//     );

//     const linkedCard = updatedBoard.columns[0].cards[0];
//     expect(linkedCard.linkedEventId?.toString()).toBe(event._id.toString());
//   });
// });

// // ─────────────────────────────────────────────
// // unlinkEventFromCard
// // ─────────────────────────────────────────────

// describe('CalendarEventService.unlinkEventFromCard', () => {
//   it('clears linkedCardId and linkedBoardId on the event', async () => {
//     const user = await User.create(makeUser());
//     const card = makeCard();
//     const col = makeColumn({ id: 'col_1', cards: [card] as any });
//     const board = await Board.create(
//       makeBoard(user._id, { columns: [col] as any }),
//     );
//     const cardId = board.columns[0].cards[0]._id;
//     const event = await CalendarEvent.create(
//       makeCalendarEvent(user._id, {
//         linkedCardId: cardId as any,
//         linkedBoardId: board._id as any,
//       }),
//     );

//     const { event: updatedEvent } = await unlinkEventFromCard(
//       event._id,
//       user._id,
//     );

//     expect(updatedEvent.linkedCardId).toBeNull();
//     expect(updatedEvent.linkedBoardId).toBeNull();
//   });
// });
