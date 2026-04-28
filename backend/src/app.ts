import dotenv from 'dotenv';
// Load environment variables before importing modules that read process.env at import time.
dotenv.config();

import express from 'express';
import cors from 'cors';
import { checkAuth } from './modules/auth/auth.middleware';

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
  res.send('Backend API is running. Use /api/* for endpoints.');
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
  res.send(
    'This is the root of the backend server. For API endpoints, use /api/*',
  );
});

// Secured test route to verify that authentication middleware works correctly
app.get('/api/auth-test', checkAuth, (req, res) => {
  res.json({
    message: 'Token is valid and you are authenticated. 🔓',
    cognitoData: (req as any).user, // Shows the token's content (sub, username etc.)
  });
});

export default app; // No app.listen() here — allows Supertest to import without starting a server
