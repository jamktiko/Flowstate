import app from './app';
import mongoose from 'mongoose';

const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI || '';

// Database connection (commented for testing.)
/*
if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch((err) => console.error('❌ Connection error:', err));
}
*/

app.listen(PORT, () => console.log(`✅ Server portissa ${PORT}`));
