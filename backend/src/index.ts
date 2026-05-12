import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/db';
import { validateEnv } from './config/env';
import { checkAndSendNotifications } from './modules/notifications/notification.service';

const PORT = process.env.PORT || 8080;

const start = async () => {
  validateEnv(); // fail fast if .env is missing variables
  await connectDB(); // connect to MongoDB first

  // Start notification job after DB is connected
  setInterval(async () => {
    try {
      await checkAndSendNotifications();
    } catch (err) {
      console.error('Notification job failed:', err);
    }
  }, 60 * 1000); // runs every 60 seconds

  app.listen(PORT, () => console.log(`✅ Server on port ${PORT}`));
};

start();
