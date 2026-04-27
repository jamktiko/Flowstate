import dotenv from 'dotenv';
// Load environment variables before importing modules that read process.env at import time.
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
/* 
ROUTES WILL BE IMPORTED HERE
*
*
*
* 
*/

const app = express();
const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI || '';

// Database connection (Kommentoitu pois testauksen ajaksi)
/*
if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch((err) => console.error('❌ Connection error:', err));
}
*/
/*Route connections
 *
 *
 *
 */

// Created for testing purposes, can be removed later
app.use(cors());
app.use(express.json());

// Create a router for API endpoints
const router = express.Router();

router.get('/', (req, res) => {
  res.send('Backend rullaa siististi CloudFrontin läpi! 🚀');
});

router.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// All routes will be prefixed with /api
app.use('/api', router);

// This route is for testing the server root, it can be removed later
app.get('/', (req, res) => {
  res.send('Tämä on backendin juuri. API löytyy polusta /api');
});

app.listen(PORT, () => console.log(`✅ Server portissa ${PORT}`));
