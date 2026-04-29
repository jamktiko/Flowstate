/**
 * db.ts — Shared mongodb-memory-server helpers
 *
 * WHY: Every spec that touches Mongoose needs a real in-memory Mongo instance.
 * Centralising connect/disconnect/clear here means we never duplicate this
 * setup boilerplate across files, and we never mock the Mongoose driver
 * (mocking the driver produces false confidence — it won't catch schema errors).
 *
 * Usage in a spec file:
 *   import { connectTestDB, disconnectTestDB, clearTestDB } from '../test/db';
 *   beforeAll(connectTestDB);
 *   afterEach(clearTestDB);   // isolate each test
 *   afterAll(disconnectTestDB);
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

/** Start an in-memory Mongo instance and connect Mongoose to it. */
export async function connectTestDB(): Promise<void> {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
}

/** Drop all collections between tests — gives each `it` a clean slate. */
export async function clearTestDB(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

/** Close the Mongoose connection and stop the in-memory server. */
export async function disconnectTestDB(): Promise<void> {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
}
