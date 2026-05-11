/**
 * calendarEvent.model.spec.ts — Schema validation tests for CalendarEvent
 *
 * CalendarEvents live in their own collection, separate from boards.
 * Tests verify: required fields, enum values, unique index on
 * (externalEventId + provider), and optional bidirectional card link fields.
 *
 * COMMIT CHECKPOINT: "test(calendar-model): schema validation tests"
 */

import mongoose, { Types } from 'mongoose';
import { CalendarEvent } from './calendarEvent.model';
import { connectTestDB, clearTestDB, disconnectTestDB } from '../../test/db';
import { makeCalendarEvent } from '../../test/factories';

const fakeUserId = new Types.ObjectId();

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(disconnectTestDB);

// ─────────────────────────────────────────────
// Happy path
// ─────────────────────────────────────────────

describe('CalendarEvent model — valid documents', () => {
  it('saves a valid calendar event', async () => {
    const event = await CalendarEvent.create(makeCalendarEvent(fakeUserId));

    expect(event._id).toBeDefined();
    expect(event.provider).toBe('google');
    expect(event.status).toBe('confirmed');
  });

  it('sets timestamps automatically', async () => {
    const event = await CalendarEvent.create(makeCalendarEvent(fakeUserId));

    expect(event.createdAt).toBeInstanceOf(Date);
    expect(event.updatedAt).toBeInstanceOf(Date);
  });

  it('defaults isAllDay to false', async () => {
    const event = await CalendarEvent.create(makeCalendarEvent(fakeUserId));
    expect(event.isAllDay).toBe(false);
  });

  it('defaults linkedCardId and linkedBoardId to null', async () => {
    const event = await CalendarEvent.create(makeCalendarEvent(fakeUserId));

    expect(event.linkedCardId).toBeNull();
    expect(event.linkedBoardId).toBeNull();
  });

  it('accepts a microsoft provider', async () => {
    const event = await CalendarEvent.create(
      makeCalendarEvent(fakeUserId, { provider: 'microsoft' }),
    );
    expect(event.provider).toBe('microsoft');
  });

  it('stores optional card link when both linkedCardId and linkedBoardId are provided', async () => {
    const cardId = new Types.ObjectId();
    const boardId = new Types.ObjectId();

    const event = await CalendarEvent.create(
      makeCalendarEvent(fakeUserId, {
        linkedCardId: cardId as any,
        linkedBoardId: boardId as any,
      }),
    );

    expect(event.linkedCardId?.toString()).toBe(cardId.toString());
    expect(event.linkedBoardId?.toString()).toBe(boardId.toString());
  });
});

// ─────────────────────────────────────────────
// Required fields
// ─────────────────────────────────────────────

describe('CalendarEvent model — required field validation', () => {
  it('rejects an event missing userId', async () => {
    const data = makeCalendarEvent(fakeUserId);
    // @ts-expect-error
    delete data.userId;

    await expect(CalendarEvent.create(data)).rejects.toThrow(
      mongoose.Error.ValidationError,
    );
  });

  it('rejects an event missing title', async () => {
    const data = makeCalendarEvent(fakeUserId);
    // @ts-expect-error
    delete data.title;

    await expect(CalendarEvent.create(data)).rejects.toThrow(
      mongoose.Error.ValidationError,
    );
  });

  it('rejects an event missing startTime', async () => {
    const data = makeCalendarEvent(fakeUserId);
    // @ts-expect-error
    delete data.startTime;

    await expect(CalendarEvent.create(data)).rejects.toThrow(
      mongoose.Error.ValidationError,
    );
  });

  it('rejects an event missing endTime', async () => {
    const data = makeCalendarEvent(fakeUserId);
    // @ts-expect-error
    delete data.endTime;

    await expect(CalendarEvent.create(data)).rejects.toThrow(
      mongoose.Error.ValidationError,
    );
  });

  it('rejects an event missing provider', async () => {
    const data = makeCalendarEvent(fakeUserId);
    // @ts-expect-error
    delete data.provider;

    await expect(CalendarEvent.create(data)).rejects.toThrow(
      mongoose.Error.ValidationError,
    );
  });
});

// ─────────────────────────────────────────────
// Enum enforcement
// ─────────────────────────────────────────────

describe('CalendarEvent model — enum validation', () => {
  it('rejects an invalid provider value', async () => {
    await expect(
      CalendarEvent.create(
        // @ts-expect-error
        makeCalendarEvent(fakeUserId, { provider: 'apple' }),
      ),
    ).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('rejects an invalid status value', async () => {
    await expect(
      CalendarEvent.create(
        // @ts-expect-error
        makeCalendarEvent(fakeUserId, { status: 'pending' }),
      ),
    ).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('accepts all valid status values', async () => {
    const statuses = ['confirmed', 'tentative', 'cancelled'] as const;

    for (const status of statuses) {
      const event = await CalendarEvent.create(
        makeCalendarEvent(fakeUserId, {
          status,
          externalEventId: `ext-${status}`,
        }),
      );
      expect(event.status).toBe(status);
    }
  });
});

// ─────────────────────────────────────────────
// Unique index: externalEventId + provider
// ─────────────────────────────────────────────

describe('CalendarEvent model — unique index', () => {
  it('rejects a duplicate (externalEventId + provider) combination', async () => {
    const data = makeCalendarEvent(fakeUserId, {
      externalEventId: 'ext-001',
      provider: 'google',
    });
    await CalendarEvent.create(data);

    // Same external ID + same provider for a different user should still fail —
    // the index is global, not per-user (matches schema doc).
    await expect(
      CalendarEvent.create(
        makeCalendarEvent(new Types.ObjectId(), {
          externalEventId: 'ext-001',
          provider: 'google',
        }),
      ),
    ).rejects.toThrow();
  });

  it('allows the same externalEventId from different providers', async () => {
    const externalEventId = 'shared-id-001';

    await CalendarEvent.create(
      makeCalendarEvent(fakeUserId, { externalEventId, provider: 'google' }),
    );
    // Different provider — should succeed
    const event2 = await CalendarEvent.create(
      makeCalendarEvent(fakeUserId, { externalEventId, provider: 'microsoft' }),
    );

    expect(event2._id).toBeDefined();
  });
});
