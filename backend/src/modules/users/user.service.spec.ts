/**
 * user.service.spec.ts — TDD specs for UserService
 *
 * STATUS: These tests are RED until user.service.ts is implemented.
 * They define the exact contract the service must satisfy, derived from
 * SRS requirements FR 1.1–1.3 and the schema doc.
 *
 * Expected exports from user.service.ts:
 *   createUser(data)          → IUser
 *   getUserByCognitoSub(sub)  → IUser | null
 *   getUserById(id)           → IUser | null
 *   updatePreferences(id, prefs) → IUser
 *   syncBoardName(userId, boardId, newName) → void
 *   deleteUser(id)            → void
 *
 * COMMIT CHECKPOINT: "test(user-service): TDD specs — red until service implemented"
 */
/// <reference types="vitest/globals" />
import { Types } from 'mongoose';
import { connectTestDB, clearTestDB, disconnectTestDB } from '../../test/db';
import { makeUser, makeBoard } from '../../test/factories';
import { User } from './user.model';
import { Board } from '../boards/board.model';

// NOTE: Update this import path when user.service.ts is created.
import {
  createUser,
  getUserByCognitoSub,
  getUserById,
  updatePreferences,
  syncBoardName,
  deleteUser,
} from './user.service';

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(disconnectTestDB);

// ─────────────────────────────────────────────
// createUser
// ─────────────────────────────────────────────

describe('UserService.createUser', () => {
  it('creates and returns a new user with all required fields', async () => {
    const data = makeUser();
    const user = await createUser(data);

    expect(user._id).toBeDefined();
    expect(user.email).toBe(data.email);
    expect(user.cognitoSub).toBe(data.cognitoSub);
  });

  it('persists the user to the database', async () => {
    const data = makeUser();
    await createUser(data);

    const found = await User.findOne({ email: data.email });
    expect(found).not.toBeNull();
  });

  it('throws when email is already taken (FR 1.1.1.1)', async () => {
    const email = 'taken@flowstate.fi';
    await createUser(makeUser({ email }));

    await expect(
      createUser(makeUser({ email, cognitoSub: 'another-sub' })),
    ).rejects.toThrow();
  });

  it('throws when cognitoSub is already registered', async () => {
    const sub = 'duplicate-sub';
    await createUser(makeUser({ cognitoSub: sub }));

    await expect(
      createUser(makeUser({ cognitoSub: sub, email: 'new@flowstate.fi' })),
    ).rejects.toThrow();
  });
});

// ─────────────────────────────────────────────
// getUserByCognitoSub — used on every login
// ─────────────────────────────────────────────

describe('UserService.getUserByCognitoSub', () => {
  it('returns the user matching the Cognito subject', async () => {
    const data = makeUser({ cognitoSub: 'known-sub' });
    await User.create(data);

    const user = await getUserByCognitoSub('known-sub');
    expect(user).not.toBeNull();
    expect(user!.cognitoSub).toBe('known-sub');
  });

  it('returns null when no user matches the sub', async () => {
    const result = await getUserByCognitoSub('ghost-sub');
    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────
// getUserById
// ─────────────────────────────────────────────

describe('UserService.getUserById', () => {
  it('returns the user by their MongoDB _id', async () => {
    const created = await User.create(makeUser());

    const user = await getUserById(created._id);
    expect(user).not.toBeNull();
    expect(user!._id.toString()).toBe(created._id.toString());
  });

  it('returns null for a non-existent id', async () => {
    const result = await getUserById(new Types.ObjectId());
    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────
// updatePreferences — FR 2.5 (default board), theme, defaultView
// ─────────────────────────────────────────────

describe('UserService.updatePreferences', () => {
  it('updates defaultView preference', async () => {
    const user = await User.create(makeUser());

    const updated = await updatePreferences(user._id, {
      defaultView: 'calendar',
    });
    expect(updated.preferences.defaultView).toBe('calendar');
  });

  it('updates defaultBoardId preference', async () => {
    const user = await User.create(makeUser());
    const boardId = new Types.ObjectId();

    const updated = await updatePreferences(user._id, {
      defaultBoardId: boardId,
    });
    expect(updated.preferences.defaultBoardId?.toString()).toBe(
      boardId.toString(),
    );
  });

  it('updates theme preference', async () => {
    const user = await User.create(makeUser());

    const updated = await updatePreferences(user._id, { theme: 'light' });
    expect(updated.preferences.theme).toBe('light');
  });

  it('throws for an unknown user id', async () => {
    await expect(
      updatePreferences(new Types.ObjectId(), { theme: 'light' }),
    ).rejects.toThrow();
  });
});

// ─────────────────────────────────────────────
// syncBoardName — schema doc constraint: keep user.boards[].name in sync
// ─────────────────────────────────────────────

describe('UserService.syncBoardName', () => {
  it('updates the board name inside the user.boards array', async () => {
    // Arrange: create a user with a board reference
    const user = await User.create(makeUser());
    const board = await Board.create(makeBoard(user._id, { name: 'Old Name' }));

    // Manually add the board ref to the user (service will automate this later)
    await User.updateOne(
      { _id: user._id },
      { $push: { boards: { boardId: board._id, name: 'Old Name' } } },
    );

    // Act
    await syncBoardName(user._id, board._id, 'New Name');

    // Assert
    const refreshed = await User.findById(user._id);
    const ref = refreshed!.boards.find(
      (b) => b.boardId.toString() === board._id.toString(),
    );
    expect(ref?.name).toBe('New Name');
  });
});

// ─────────────────────────────────────────────
// deleteUser — FR 7.1: deletes user and all their data
// ─────────────────────────────────────────────

describe('UserService.deleteUser', () => {
  it('removes the user document from the database', async () => {
    const user = await User.create(makeUser());

    await deleteUser(user._id);

    const found = await User.findById(user._id);
    expect(found).toBeNull();
  });

  it('also removes all boards belonging to the deleted user (FR 7.1.1)', async () => {
    const user = await User.create(makeUser());
    await Board.create(makeBoard(user._id));
    await Board.create(makeBoard(user._id));

    await deleteUser(user._id);

    const boards = await Board.find({ userId: user._id });
    expect(boards).toHaveLength(0);
  });
});
