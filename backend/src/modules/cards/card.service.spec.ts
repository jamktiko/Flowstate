/**
 * card.service.spec.ts — TDD specs for CardService
 *
 * STATUS: These tests are RED until card.service.ts is implemented.
 * Derived from SRS FR 4.1–4.5 and schema doc rules (order compacting,
 * embedded card structure, bidirectional calendar event link).
 *
 * Expected exports from card.service.ts:
 *   createCard(boardId, userId, columnId, cardData)  → IBoard (updated)
 *   updateCard(boardId, userId, columnId, cardId, updates) → IBoard
 *   deleteCard(boardId, userId, columnId, cardId)    → IBoard
 *   moveCard(boardId, userId, sourceColId, targetColId, cardId, newOrder) → IBoard
 *
 * COMMIT CHECKPOINT: "test(card-service): TDD specs — red until service implemented"
 */

import { Types } from 'mongoose';
import { connectTestDB, clearTestDB, disconnectTestDB } from '../../test/db';
import { makeUser, makeBoard, makeColumn, makeCard } from '../../test/factories';
import { User } from '../users/user.model';
import { Board } from '../boards/board.model';

import {
  createCard,
  updateCard,
  deleteCard,
  moveCard,
} from './card.service';

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(disconnectTestDB);

// ─────────────────────────────────────────────
// createCard — FR 4.1
// ─────────────────────────────────────────────

describe('CardService.createCard', () => {
  it('adds a card to the correct column and returns the updated board (FR 4.1)', async () => {
    const user = await User.create(makeUser());
    const col = makeColumn({ id: 'col_1' });
    const board = await Board.create(makeBoard(user._id, { columns: [col] as any }));

    const updated = await createCard(board._id, user._id, 'col_1', {
      title: 'Write tests',
      order: 0,
    });

    expect(updated.columns[0].cards).toHaveLength(1);
    expect(updated.columns[0].cards[0].title).toBe('Write tests');
  });

  it('throws when card title is empty (FR 4.1.2)', async () => {
    const user = await User.create(makeUser());
    const col = makeColumn({ id: 'col_1' });
    const board = await Board.create(makeBoard(user._id, { columns: [col] as any }));

    await expect(
      createCard(board._id, user._id, 'col_1', { title: '', order: 0 }),
    ).rejects.toThrow();
  });

  it('throws when board does not belong to the user (security FR 4.3)', async () => {
    const owner = await User.create(makeUser());
    const attacker = await User.create(makeUser());
    const col = makeColumn({ id: 'col_1' });
    const board = await Board.create(makeBoard(owner._id, { columns: [col] as any }));

    await expect(
      createCard(board._id, attacker._id, 'col_1', { title: 'Hack', order: 0 }),
    ).rejects.toThrow();
  });

  it('assigns priority when provided', async () => {
    const user = await User.create(makeUser());
    const col = makeColumn({ id: 'col_1' });
    const board = await Board.create(makeBoard(user._id, { columns: [col] as any }));

    const updated = await createCard(board._id, user._id, 'col_1', {
      title: 'Urgent task',
      order: 0,
      priority: 'urgent',
    });

    expect(updated.columns[0].cards[0].priority).toBe('urgent');
  });

  it('assigns dueDate when provided', async () => {
    const user = await User.create(makeUser());
    const col = makeColumn({ id: 'col_1' });
    const board = await Board.create(makeBoard(user._id, { columns: [col] as any }));
    const due = new Date('2026-06-01T00:00:00Z');

    const updated = await createCard(board._id, user._id, 'col_1', {
      title: 'Deadline task',
      order: 0,
      dueDate: due,
    });

    expect(updated.columns[0].cards[0].dueDate).toEqual(due);
  });
});

// ─────────────────────────────────────────────
// updateCard — FR 4.2
// ─────────────────────────────────────────────

describe('CardService.updateCard', () => {
  it('updates the card title and returns the updated board (FR 4.2)', async () => {
    const user = await User.create(makeUser());
    const card = makeCard({ title: 'Original' });
    const col = makeColumn({ id: 'col_1', cards: [card] as any });
    const board = await Board.create(makeBoard(user._id, { columns: [col] as any }));
    const cardId = board.columns[0].cards[0]._id;

    const updated = await updateCard(board._id, user._id, 'col_1', cardId, {
      title: 'Updated',
    });

    expect(updated.columns[0].cards[0].title).toBe('Updated');
  });

  it('throws when updated title is empty (FR 4.2.1)', async () => {
    const user = await User.create(makeUser());
    const card = makeCard();
    const col = makeColumn({ id: 'col_1', cards: [card] as any });
    const board = await Board.create(makeBoard(user._id, { columns: [col] as any }));
    const cardId = board.columns[0].cards[0]._id;

    await expect(
      updateCard(board._id, user._id, 'col_1', cardId, { title: '' }),
    ).rejects.toThrow();
  });

  it('updates dueDate on a card', async () => {
    const user = await User.create(makeUser());
    const card = makeCard();
    const col = makeColumn({ id: 'col_1', cards: [card] as any });
    const board = await Board.create(makeBoard(user._id, { columns: [col] as any }));
    const cardId = board.columns[0].cards[0]._id;
    const newDue = new Date('2026-07-15T00:00:00Z');

    const updated = await updateCard(board._id, user._id, 'col_1', cardId, {
      dueDate: newDue,
    });

    expect(updated.columns[0].cards[0].dueDate).toEqual(newDue);
  });
});

// ─────────────────────────────────────────────
// deleteCard — FR 4.4
// ─────────────────────────────────────────────

describe('CardService.deleteCard', () => {
  it('removes the card from the column (FR 4.4)', async () => {
    const user = await User.create(makeUser());
    const card = makeCard();
    const col = makeColumn({ id: 'col_1', cards: [card] as any });
    const board = await Board.create(makeBoard(user._id, { columns: [col] as any }));
    const cardId = board.columns[0].cards[0]._id;

    const updated = await deleteCard(board._id, user._id, 'col_1', cardId);

    expect(updated.columns[0].cards).toHaveLength(0);
  });

  it('compacts order values of remaining cards after deletion (schema doc rule)', async () => {
    // WHY: schema doc says order is compacted on delete — no gaps allowed.
    // Three cards with order 0, 1, 2; delete card at order 1; remaining
    // cards should have order 0, 1 (not 0, 2).
    const user = await User.create(makeUser());
    const card0 = makeCard({ title: 'Card 0', order: 0 });
    const card1 = makeCard({ title: 'Card 1', order: 1 });
    const card2 = makeCard({ title: 'Card 2', order: 2 });
    const col = makeColumn({ id: 'col_1', cards: [card0, card1, card2] as any });
    const board = await Board.create(makeBoard(user._id, { columns: [col] as any }));
    const cardToDelete = board.columns[0].cards[1]._id; // card1

    const updated = await deleteCard(board._id, user._id, 'col_1', cardToDelete);

    const orders = updated.columns[0].cards.map((c) => c.order).sort();
    expect(orders).toEqual([0, 1]);
  });
});

// ─────────────────────────────────────────────
// moveCard — FR 4.5 (drag-to-reorder across columns)
// ─────────────────────────────────────────────

describe('CardService.moveCard', () => {
  it('moves a card from one column to another', async () => {
    const user = await User.create(makeUser());
    const card = makeCard({ title: 'Movable' });
    const colA = makeColumn({ id: 'col_a', cards: [card] as any });
    const colB = makeColumn({ id: 'col_b' });
    const board = await Board.create(
      makeBoard(user._id, { columns: [colA, colB] as any }),
    );
    const cardId = board.columns[0].cards[0]._id;

    const updated = await moveCard(board._id, user._id, 'col_a', 'col_b', cardId, 0);

    const sourceCards = updated.columns.find((c) => c.id === 'col_a')!.cards;
    const targetCards = updated.columns.find((c) => c.id === 'col_b')!.cards;

    expect(sourceCards).toHaveLength(0);
    expect(targetCards).toHaveLength(1);
    expect(targetCards[0].title).toBe('Movable');
  });

  it('updates the card order within the same column when source === target', async () => {
    const user = await User.create(makeUser());
    const card0 = makeCard({ title: 'First', order: 0 });
    const card1 = makeCard({ title: 'Second', order: 1 });
    const col = makeColumn({ id: 'col_1', cards: [card0, card1] as any });
    const board = await Board.create(makeBoard(user._id, { columns: [col] as any }));
    const card0Id = board.columns[0].cards[0]._id;

    // Move card0 to position 1 (swap)
    const updated = await moveCard(board._id, user._id, 'col_1', 'col_1', card0Id, 1);

    const cards = updated.columns[0].cards.sort((a, b) => a.order - b.order);
    expect(cards[0].title).toBe('Second');
    expect(cards[1].title).toBe('First');
  });
});
