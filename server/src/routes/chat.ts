import { Router } from 'express';
import { chat, confirmAction } from '../controllers/chatController';
import { authenticate } from '../middleware/auth';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

const chatLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.chatRateLimitMax,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();
router.post('/', authenticate, chatLimiter, chat);
router.post('/confirm', authenticate, confirmAction);
export default router;
