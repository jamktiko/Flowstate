import dotenv from 'dotenv';
// Load environment variables before importing modules that read process.env at import time.
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { checkAuth } from './modules/auth/auth.middleware';
import userRouter from './modules/users/user.routes';
import boardRouter from './modules/boards/board.routes';
import authRouter from './modules/auth/auth.routes';
import cardRouter from './modules/cards/card.routes';
import calendarRouter from './modules/calendar/calendarEvent.routes';
import calendarAuthRouter from './modules/calendar/calendar.auth.routes';
import calendarSyncRouter from './modules/calendar/calendar.sync.routes';
import pushRouter from './modules/push/push.routes';

const app = express();
app.set('trust proxy', 1);

// ─────────────────────────────────────────────
// Security middleware
// ─────────────────────────────────────────────

// Sets secure HTTP headers
app.use(helmet());

// Restrict CORS to the configured frontend URL
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  }),
);

// Limit request body size
app.use(express.json({ limit: '50kb' }));

// Rate limit auth endpoints
// 10 requests per 15 minutes per IP on auth routes
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─────────────────────────────────────────────
// API router for health/root endpoints
// ─────────────────────────────────────────────

app.get('/', (req, res) => {
  res.status(200).send('Backend API is running. Use /api/* for endpoints.');
});

const router = express.Router();

router.get('/', (req, res) => {
  res.send('Backend API is running. Use /api/* for endpoints.');
});

router.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.use('/api', router);

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────

// Auth routes — rate limited
app.use('/api/auth', authRateLimit, authRouter);

// Feature routers
app.use('/api/users', userRouter);
app.use('/api/boards', boardRouter);
// Cards share the /api/boards prefix since cards live inside boards
app.use('/api/boards', cardRouter);
app.use('/api/calendar', calendarRouter);
// Calendar auth routes for OAuth linking/unlinking
app.use('/api/calendar/auth', calendarAuthRouter);
// Calendar sync routes for pushing/pulling events
app.use('/api/calendar/sync', calendarSyncRouter);
app.use('/api/push', pushRouter);

// Secured test route to verify that authentication middleware works correctly
app.get('/api/auth-test', checkAuth, (req, res) => {
  res.json({
    message: 'Token is valid and you are authenticated. 🔓',
    cognitoData: (req as any).user,
  });
});

export default app;
