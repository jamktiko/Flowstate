import app from './app';
import mongoose from 'mongoose';

const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI || '';

//Comment to launch backend deployment pipeline!!

// Database connection (commented for testing.)

if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI, {
      autoIndex: true, //  default in dev — creates indexes on startup
      // autoIndex: false  //  recommended for production
    }) //
    .then(() => console.log('✅ MongoDB connected'))
    .catch((err) => console.error('❌ Connection error:', err));
}

app.listen(PORT, () => console.log(`✅ Server portissa ${PORT}`));
