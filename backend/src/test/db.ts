import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Import all models so Mongoose registers them before syncIndexes runs
import '../../src/modules/users/user.model';
import '../../src/modules/calendar/calendarEvent.model';
import '../../src/modules/boards/board.model';

let mongod: MongoMemoryServer;

export async function connectTestDB(): Promise<void> {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri, { autoIndex: true });
  // Wait for all indexes to be built before any test runs
  await mongoose.syncIndexes();
}

/** Revert to deleteMany — drop() was too aggressive, it destroys indexes */
export async function clearTestDB(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

export async function disconnectTestDB(): Promise<void> {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
}
