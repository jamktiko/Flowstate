import mongoose from 'mongoose';

/**
 * Connects to MongoDB using the MONGO_URI environment variable.
 * autoIndex: true in development — creates indexes on startup.
 * autoIndex: false recommended for production — too slow on large collections.
 */
export const connectDB = async (): Promise<void> => {
  const MONGO_URI = process.env.MONGO_URI || '';

  if (!MONGO_URI) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  await mongoose.connect(MONGO_URI, {
    autoIndex: true, // change to false before production
  });

  console.log('✅ MongoDB connected');
};
