import dotenv from 'dotenv';
// Load environment variables before importing modules that read process.env at import time.
dotenv.config();

import express from 'express';
import cors from 'cors';

/* 
ROUTES WILL BE IMPORTED HERE
*
*
*
* 
*/

const app = express();

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

/*Route connections
 *
 *
 *
 */

// All routes will be prefixed with /api
app.use('/api', router);

// This route is for testing the server root, it can be removed later
app.get('/', (req, res) => {
  res.send('Tämä on backendin juuri. API löytyy polusta /api');
});

export default app; // No app.listen() here — allows Supertest to import without starting a server
