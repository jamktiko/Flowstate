import mongoose from 'mongoose';

/**
 * Connects to MongoDB using the MONGO_URI environment variable.
 * autoIndex: true in development — creates indexes on startup.
 * autoIndex: false in production — prevents index rebuilds on every restart
 * which can lock collections and cause downtime on large datasets.
 */
export const connectDB = async (): Promise<void> => {
  const MONGO_URI = process.env.MONGO_URI || '';

  if (!MONGO_URI) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  await mongoose.connect(MONGO_URI, {
    autoIndex: process.env.NODE_ENV !== 'production',
  });

  console.log('✅ MongoDB connected');
};
