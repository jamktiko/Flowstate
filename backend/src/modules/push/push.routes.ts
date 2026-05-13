import { Router } from 'express';
import { checkAuth } from '../auth/auth.middleware';
import { subscribe, unsubscribe } from './push.controller';

const router = Router();

// All push routes require authentication
router.post('/subscribe', checkAuth, subscribe);
router.delete('/subscribe', checkAuth, unsubscribe);

export default router;
