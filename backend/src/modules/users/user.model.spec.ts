/**
 * user.model.spec.ts — Mongoose schema validation tests for the User model
 *
 * These tests run against mongodb-memory-server (real Mongo, no mocking).
 * They verify that the schema enforces all constraints documented in
 * flowstate_schema_v3.1 — required fields, unique indexes, enum values,
 * and default values.
 *
 * COMMIT CHECKPOINT: "test(user-model): schema validation tests"
 */
/// <reference types="vitest/globals" />
import mongoose from 'mongoose';
import { User } from './user.model';
import { connectTestDB, clearTestDB, disconnectTestDB } from '../../test/db';
import { makeUser } from '../../test/factories';

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(disconnectTestDB);

// ─────────────────────────────────────────────
// Happy path
// ─────────────────────────────────────────────

describe('User model — valid documents', () => {
  it('saves a minimal valid user with all required fields', async () => {
    const data = makeUser();
    const user = await User.create(data);

    expect(user._id).toBeDefined();
    expect(user.email).toBe(data.email);
    expect(user.cognitoSub).toBe(data.cognitoSub);
    expect(user.role).toBe('user');
  });

  it('applies default preferences on creation', async () => {
    const user = await User.create(makeUser());

    expect(user.preferences.defaultView).toBe('list');
    expect(user.preferences.defaultBoardId).toBeNull();
    expect(user.preferences.theme).toBe('dark');
  });

  it('applies default notifications on creation', async () => {
    const user = await User.create(makeUser());

    expect(user.notifications.enabled).toBe(true);
    expect(user.notifications.defaultLeadTime).toBe(30);
  });

  it('applies default integrations (both unlinked) on creation', async () => {
    const user = await User.create(makeUser());

    expect(user.integrations.google.isLinked).toBe(false);
    expect(user.integrations.microsoft.isLinked).toBe(false);
    expect(user.integrations.google.accessToken).toBeNull();
  });

  it('stores boards array as empty by default', async () => {
    const user = await User.create(makeUser());
    expect(user.boards).toHaveLength(0);
  });

  it('lowercases the email before saving', async () => {
    const user = await User.create(
      makeUser({ email: 'UPPERCASE@FLOWSTATE.FI' }),
    );
    expect(user.email).toBe('uppercase@flowstate.fi');
  });

  it('sets timestamps (createdAt / updatedAt) automatically', async () => {
    const user = await User.create(makeUser());

    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });

  it('accepts role = "admin"', async () => {
    const user = await User.create(makeUser({ role: 'admin' }));
    expect(user.role).toBe('admin');
  });
});

// ─────────────────────────────────────────────
// Required field enforcement
// ─────────────────────────────────────────────

describe('User model — required field validation', () => {
  it('rejects a document missing cognitoSub', async () => {
    const data = makeUser();
    // @ts-expect-error — intentionally omitting required field
    delete data.cognitoSub;

    await expect(User.create(data)).rejects.toThrow(
      mongoose.Error.ValidationError,
    );
  });

  it('rejects a document missing firstName', async () => {
    const data = makeUser();
    // @ts-expect-error
    delete data.firstName;

    await expect(User.create(data)).rejects.toThrow(
      mongoose.Error.ValidationError,
    );
  });

  it('rejects a document missing email', async () => {
    const data = makeUser();
    // @ts-expect-error
    delete data.email;

    await expect(User.create(data)).rejects.toThrow(
      mongoose.Error.ValidationError,
    );
  });
});

// ─────────────────────────────────────────────
// Unique index enforcement
// ─────────────────────────────────────────────

describe('User model — unique constraints', () => {
  it('rejects a duplicate email', async () => {
    const email = 'duplicate@flowstate.fi';
    await User.create(makeUser({ email }));

    // A different cognitoSub but same email must fail
    await expect(
      User.create(makeUser({ email, cognitoSub: 'different-sub' })),
    ).rejects.toThrow();
  });

  it('rejects a duplicate cognitoSub', async () => {
    const sub = 'same-cognito-sub';
    await User.create(makeUser({ cognitoSub: sub }));

    await expect(
      User.create(makeUser({ cognitoSub: sub, email: 'other@flowstate.fi' })),
    ).rejects.toThrow();
  });
});

// ─────────────────────────────────────────────
// Enum enforcement
// ─────────────────────────────────────────────

describe('User model — enum validation', () => {
  it('rejects an invalid role value', async () => {
    await expect(
      // @ts-expect-error — testing invalid runtime value
      User.create(makeUser({ role: 'superuser' })),
    ).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('rejects an invalid preferences.defaultView value', async () => {
    const data = {
      ...makeUser(),
      preferences: { defaultView: 'timeline' }, // invalid enum
    };
    await expect(User.create(data)).rejects.toThrow(
      mongoose.Error.ValidationError,
    );
  });
});
