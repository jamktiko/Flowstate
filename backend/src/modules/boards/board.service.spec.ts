/**
 * board.service.spec.ts — TDD specs for BoardService
 *
 * STATUS: These tests are RED until board.service.ts is implemented.
 * Derived from SRS FR 2.1–2.5 and schema doc rules.
 *
 * Expected exports from board.service.ts:
 *   createBoard(userId, name)           → IBoard
 *   getBoardsByUser(userId)             → IBoard[]
 *   getBoardById(boardId, userId)       → IBoard
 *   renameBoard(boardId, userId, name)  → IBoard  (must also sync user.boards[].name)
 *   deleteBoard(boardId, userId)        → void    (also removes user.boards[] ref)
 *   addColumn(boardId, userId, colData) → IBoard
 *   deleteColumn(boardId, userId, colId) → IBoard (only allowed when column is empty)
 *   renameColumn(boardId, userId, colId, name) → IBoard
 *
 * COMMIT CHECKPOINT: "test(board-service): TDD specs — red until service implemented"
 */

import { Types } from 'mongoose';
import { connectTestDB, clearTestDB, disconnectTestDB } from '../../test/db';
import { makeUser, makeBoard, makeColumn, makeCard } from '../../test/factories';
import { User } from '../users/user.model';
import { Board } from './board.model';

import {
  createBoard,
  getBoardsByUser,
  getBoardById,
  renameBoard,
  deleteBoard,
  addColumn,
  deleteColumn,
  renameColumn,
} from './board.service';

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(disconnectTestDB);

// ─────────────────────────────────────────────
// createBoard — FR 2.1
// ─────────────────────────────────────────────

describe('BoardService.createBoard', () => {
  it('creates a board and returns it (FR 2.1)', async () => {
    const user = await User.create(makeUser());

    const board = await createBoard(user._id, 'My Project');

    expect(board._id).toBeDefined();
    expect(board.name).toBe('My Project');
    expect(board.userId.toString()).toBe(user._id.toString());
  });

  it('adds a lightweight board reference to user.boards[] (FR 2.1.3)', async () => {
    const user = await User.create(makeUser());

    const board = await createBoard(user._id, 'My Project');

    const refreshed = await User.findById(user._id);
    const ref = refreshed!.boards.find(
      (b) => b.boardId.toString() === board._id.toString(),
    );
    expect(ref).toBeDefined();
    expect(ref!.name).toBe('My Project');
  });

  it('throws when board name is empty (FR 2.1.1)', async () => {
    const user = await User.create(makeUser());

    await expect(createBoard(user._id, '')).rejects.toThrow();
  });

  it('throws when board name is only whitespace', async () => {
    const user = await User.create(makeUser());

    await expect(createBoard(user._id, '   ')).rejects.toThrow();
  });
});

// ─────────────────────────────────────────────
// getBoardsByUser — FR 2.3
// ─────────────────────────────────────────────

describe('BoardService.getBoardsByUser', () => {
  it('returns all boards belonging to the user', async () => {
    const user = await User.create(makeUser());
    await Board.create(makeBoard(user._id, { name: 'Board A' }));
    await Board.create(makeBoard(user._id, { name: 'Board B' }));

    const boards = await getBoardsByUser(user._id);
    expect(boards).toHaveLength(2);
  });

  it('does not return boards belonging to another user', async () => {
    const userA = await User.create(makeUser());
    const userB = await User.create(makeUser());
    await Board.create(makeBoard(userA._id));

    const boards = await getBoardsByUser(userB._id);
    expect(boards).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────
// getBoardById — FR 2.3.1
// ─────────────────────────────────────────────

describe('BoardService.getBoardById', () => {
  it('returns the full board including columns and cards', async () => {
    const user = await User.create(makeUser());
    const card = makeCard({ title: 'Task A' });
    const col = makeColumn({ cards: [card] as any });
    const created = await Board.create(
      makeBoard(user._id, { columns: [col] as any }),
    );

    const board = await getBoardById(created._id, user._id);

    expect(board.columns).toHaveLength(1);
    expect(board.columns[0].cards[0].title).toBe('Task A');
  });

  it('throws when board does not belong to requesting user (FR 4.3 / security)', async () => {
    const owner = await User.create(makeUser());
    const attacker = await User.create(makeUser());
    const board = await Board.create(makeBoard(owner._id));

    await expect(getBoardById(board._id, attacker._id)).rejects.toThrow();
  });

  it('throws when board does not exist', async () => {
    const user = await User.create(makeUser());

    await expect(getBoardById(new Types.ObjectId(), user._id)).rejects.toThrow();
  });
});

// ─────────────────────────────────────────────
// renameBoard — FR 2.2
// ─────────────────────────────────────────────

describe('BoardService.renameBoard', () => {
  it('renames the board document', async () => {
    const user = await User.create(makeUser());
    const board = await Board.create(makeBoard(user._id, { name: 'Old' }));

    const updated = await renameBoard(board._id, user._id, 'New Name');
    expect(updated.name).toBe('New Name');
  });

  it('syncs the new name to user.boards[].name (schema doc sync rule)', async () => {
    const user = await User.create(makeUser());
    const board = await Board.create(makeBoard(user._id, { name: 'Old' }));
    await User.updateOne(
      { _id: user._id },
      { $push: { boards: { boardId: board._id, name: 'Old' } } },
    );

    await renameBoard(board._id, user._id, 'New Name');

    const refreshed = await User.findById(user._id);
    const ref = refreshed!.boards.find(
      (b) => b.boardId.toString() === board._id.toString(),
    );
    expect(ref?.name).toBe('New Name');
  });

  it('throws when new name is empty (FR 2.2.1)', async () => {
    const user = await User.create(makeUser());
    const board = await Board.create(makeBoard(user._id));

    await expect(renameBoard(board._id, user._id, '')).rejects.toThrow();
  });
});

// ─────────────────────────────────────────────
// deleteBoard — FR 2.4
// ─────────────────────────────────────────────

describe('BoardService.deleteBoard', () => {
  it('removes the board document (FR 2.4)', async () => {
    const user = await User.create(makeUser());
    const board = await Board.create(makeBoard(user._id));

    await deleteBoard(board._id, user._id);

    const found = await Board.findById(board._id);
    expect(found).toBeNull();
  });

  it('removes the board reference from user.boards[] (FR 2.4.2)', async () => {
    const user = await User.create(makeUser());
    const board = await Board.create(makeBoard(user._id));
    await User.updateOne(
      { _id: user._id },
      { $push: { boards: { boardId: board._id, name: board.name } } },
    );

    await deleteBoard(board._id, user._id);

    const refreshed = await User.findById(user._id);
    const ref = refreshed!.boards.find(
      (b) => b.boardId.toString() === board._id.toString(),
    );
    expect(ref).toBeUndefined();
  });

  it('throws when board does not belong to the requesting user (security FR 4.3)', async () => {
    const owner = await User.create(makeUser());
    const attacker = await User.create(makeUser());
    const board = await Board.create(makeBoard(owner._id));

    await expect(deleteBoard(board._id, attacker._id)).rejects.toThrow();
  });
});

// ─────────────────────────────────────────────
// addColumn — FR 3.1
// ─────────────────────────────────────────────

describe('BoardService.addColumn', () => {
  it('adds a column to the board and returns the updated board', async () => {
    const user = await User.create(makeUser());
    const board = await Board.create(makeBoard(user._id));

    const updated = await addColumn(board._id, user._id, { id: 'col_1', name: 'To Do', order: 0 });

    expect(updated.columns).toHaveLength(1);
    expect(updated.columns[0].name).toBe('To Do');
  });

  it('throws when column name is empty (FR 3.1.2)', async () => {
    const user = await User.create(makeUser());
    const board = await Board.create(makeBoard(user._id));

    await expect(
      addColumn(board._id, user._id, { id: 'col_1', name: '', order: 0 }),
    ).rejects.toThrow();
  });
});

// ─────────────────────────────────────────────
// deleteColumn — FR 3.4 (only empty columns can be deleted)
// ─────────────────────────────────────────────

describe('BoardService.deleteColumn', () => {
  it('deletes an empty column (FR 3.4)', async () => {
    const user = await User.create(makeUser());
    const col = makeColumn({ id: 'col_1' });
    const board = await Board.create(makeBoard(user._id, { columns: [col] as any }));

    const updated = await deleteColumn(board._id, user._id, 'col_1');

    expect(updated.columns).toHaveLength(0);
  });

  it('throws when column still contains cards (FR 3.4.2)', async () => {
    const user = await User.create(makeUser());
    const card = makeCard();
    const col = makeColumn({ id: 'col_1', cards: [card] as any });
    const board = await Board.create(makeBoard(user._id, { columns: [col] as any }));

    await expect(deleteColumn(board._id, user._id, 'col_1')).rejects.toThrow();
  });
});

// ─────────────────────────────────────────────
// renameColumn — FR 3.2
// ─────────────────────────────────────────────

describe('BoardService.renameColumn', () => {
  it('renames the column and returns updated board (FR 3.2)', async () => {
    const user = await User.create(makeUser());
    const col = makeColumn({ id: 'col_1', name: 'Old' });
    const board = await Board.create(makeBoard(user._id, { columns: [col] as any }));

    const updated = await renameColumn(board._id, user._id, 'col_1', 'In Progress');

    expect(updated.columns[0].name).toBe('In Progress');
  });

  it('throws when new name is empty (FR 3.2.1)', async () => {
    const user = await User.create(makeUser());
    const col = makeColumn({ id: 'col_1' });
    const board = await Board.create(makeBoard(user._id, { columns: [col] as any }));

    await expect(
      renameColumn(board._id, user._id, 'col_1', ''),
    ).rejects.toThrow();
  });
});
