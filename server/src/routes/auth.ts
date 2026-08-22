import { Router } from 'express';
import { register, login, me, sendOtp } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.post('/send-otp', sendOtp);
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, me);
export default router;
