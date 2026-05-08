/**
 * board.model.spec.ts — Mongoose schema validation tests for Board / Column / Card
 *
 * Covers the embedded architecture: boards hold columns, columns hold cards.
 * Validates schema doc constraints: required fields, enum values, embedded
 * sub-document defaults, and index presence.
 *
 * COMMIT CHECKPOINT: "test(board-model): schema validation tests"
 */
/// <reference types="vitest/globals" />
import mongoose, { Types } from 'mongoose';
import { Board } from './board.model';
import { connectTestDB, clearTestDB, disconnectTestDB } from '../../test/db';
import { makeBoard, makeColumn, makeCard } from '../../test/factories';

const fakeUserId = new Types.ObjectId();

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(disconnectTestDB);

// ─────────────────────────────────────────────
// Happy path — board level
// ─────────────────────────────────────────────

describe('Board model — valid documents', () => {
  it('saves a minimal board with userId and name', async () => {
    const board = await Board.create(makeBoard(fakeUserId));

    expect(board._id).toBeDefined();
    expect(board.userId.toString()).toBe(fakeUserId.toString());
    expect(board.columns).toHaveLength(0);
  });

  it('sets timestamps (createdAt / updatedAt) automatically', async () => {
    const board = await Board.create(makeBoard(fakeUserId));

    expect(board.createdAt).toBeInstanceOf(Date);
    expect(board.updatedAt).toBeInstanceOf(Date);
  });

  it('saves a board with columns and cards fully embedded', async () => {
    const card = makeCard({ title: 'Implement auth', priority: 'high' });
    const col = makeColumn({ cards: [card] as any });
    const board = await Board.create(
      makeBoard(fakeUserId, { columns: [col] as any }),
    );

    expect(board.columns).toHaveLength(1);
    expect(board.columns[0].cards).toHaveLength(1);
    expect(board.columns[0].cards[0].title).toBe('Implement auth');
  });
});

// ─────────────────────────────────────────────
// Board required fields
// ─────────────────────────────────────────────

describe('Board model — required field validation', () => {
  it('rejects a board missing name', async () => {
    const data = makeBoard(fakeUserId);
    // @ts-expect-error
    delete data.name;

    await expect(Board.create(data)).rejects.toThrow(
      mongoose.Error.ValidationError,
    );
  });

  it('rejects a board missing userId', async () => {
    await expect(Board.create({ name: 'No Owner' })).rejects.toThrow(
      mongoose.Error.ValidationError,
    );
  });
});

// ─────────────────────────────────────────────
// Column sub-document
// ─────────────────────────────────────────────

describe('Board model — column validation', () => {
  it('rejects a column missing its id', async () => {
    const col = makeColumn();
    // @ts-expect-error
    delete col.id;

    await expect(
      Board.create(makeBoard(fakeUserId, { columns: [col] as any })),
    ).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('rejects a column missing name', async () => {
    const col = makeColumn();
    // @ts-expect-error
    delete col.name;

    await expect(
      Board.create(makeBoard(fakeUserId, { columns: [col] as any })),
    ).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('defaults cards to an empty array when not provided', async () => {
    const col = makeColumn(); // cards defaults to []
    const board = await Board.create(
      makeBoard(fakeUserId, { columns: [col] as any }),
    );

    expect(board.columns[0].cards).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────
// Card sub-document
// ─────────────────────────────────────────────

describe('Board model — card validation', () => {
  it('rejects a card missing title', async () => {
    // @ts-expect-error — intentionally omitting required field
    const card = makeCard({ title: undefined });
    const col = makeColumn({ cards: [card] as any });

    await expect(
      Board.create(makeBoard(fakeUserId, { columns: [col] as any })),
    ).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('rejects a card with an invalid priority value', async () => {
    const card = { ...makeCard(), priority: 'critical' }; // not in enum
    const col = makeColumn({ cards: [card] as any });

    await expect(
      Board.create(makeBoard(fakeUserId, { columns: [col] as any })),
    ).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('rejects a card with an invalid tag name', async () => {
    const card = {
      ...makeCard(),
      tags: [{ name: 'design', visible: true }], // 'design' not in enum
    };
    const col = makeColumn({ cards: [card] as any });

    await expect(
      Board.create(makeBoard(fakeUserId, { columns: [col] as any })),
    ).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('accepts all valid priority values', async () => {
    const priorities = ['low', 'medium', 'high', 'urgent'] as const;

    for (const priority of priorities) {
      const card = makeCard({ priority });
      const col = makeColumn({ id: `col_${priority}`, cards: [card] as any });
      const board = await Board.create(
        makeBoard(fakeUserId, { columns: [col] as any }),
      );

      expect(board.columns[0].cards[0].priority).toBe(priority);
      await Board.deleteMany({});
    }
  });

  it('auto-generates _id for each embedded card', async () => {
    const card = makeCard();
    const col = makeColumn({ cards: [card] as any });
    const board = await Board.create(
      makeBoard(fakeUserId, { columns: [col] as any }),
    );

    // Cards must have ObjectId _ids so calendarEvents can reference them
    expect(board.columns[0].cards[0]._id).toBeDefined();
    expect(board.columns[0].cards[0]._id).toBeInstanceOf(Types.ObjectId);
  });

  it('sets card timestamps automatically', async () => {
    const card = makeCard();
    const col = makeColumn({ cards: [card] as any });
    const board = await Board.create(
      makeBoard(fakeUserId, { columns: [col] as any }),
    );

    expect(board.columns[0].cards[0].createdAt).toBeInstanceOf(Date);
    expect(board.columns[0].cards[0].updatedAt).toBeInstanceOf(Date);
  });

  it('defaults dueDate to null', async () => {
    const card = makeCard(); // no dueDate
    const col = makeColumn({ cards: [card] as any });
    const board = await Board.create(
      makeBoard(fakeUserId, { columns: [col] as any }),
    );

    expect(board.columns[0].cards[0].dueDate).toBeNull();
  });
});
