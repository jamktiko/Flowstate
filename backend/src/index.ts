import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/db';
import { validateEnv } from './config/env';

const PORT = process.env.PORT || 8080;

const start = async () => {
  validateEnv(); // fail fast if .env is missing variables
  await connectDB(); // connect to MongoDB
  app.listen(PORT, () => console.log(`✅ Server portissa ${PORT}`));
};

start();
