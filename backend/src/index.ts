import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/db';
import { validateEnv } from './config/env';
import { checkAndSendNotifications } from './modules/notifications/notification.service';
import { initGoogleCalendarService } from './modules/calendar/google.service';

const PORT = process.env.PORT || 8080;

const start = async () => {
  validateEnv(); // fail fast if .env is missing variables
  await connectDB(); // connect to MongoDB first

  // Initialize Google Calendar service
  try {
    initGoogleCalendarService();
    console.log('✅ Google Calendar service initialized');
  } catch (err) {
    console.error('Failed to initialize Google Calendar service:', err);
    process.exit(1);
  }

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
