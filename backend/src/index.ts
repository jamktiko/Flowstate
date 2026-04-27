import dotenv from 'dotenv';
// Load environment variables before importing modules that read process.env at import time.
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

/* 
ROUTES WILL BE IMPORTED HERE
*/

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || '';

// Database connection
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ Connection error:', err));

/*Route connections
 *
 *
 * */

//basic routes for testing
app.get('/', (req, res) => res.send('Backend rullaa siististi! 🚀'));

app.listen(PORT, () => console.log(`✅ Server portissa ${PORT}`));
