import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { env } from '../config/env';
import { loginSchema, registerSchema } from '../validators/schemas';
import logger from '../utils/logger';
import { sendOTPEmail } from '../services/emailService';
import { generateOTP, storeOTP, verifyOTP } from '../utils/otpStore';
import { z } from 'zod';

function signToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn } as Parameters<typeof jwt.sign>[2]
  );
}

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name } = z
      .object({
        email: z.string().email(),
        name: z.string().min(2).max(100).optional(),
      })
      .parse(req.body);

    // Check if email is already registered
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(409).json({ error: 'Email already registered. Please sign in instead.' });
      return;
    }

    const otp = generateOTP();
    storeOTP(email, otp, name || email);
    await sendOTPEmail(email, otp, name);

    res.json({ message: 'Verification code sent to your email. It expires in 10 minutes.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid email address.' });
      return;
    }
    logger.error('sendOtp error', error);
    throw error;
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = registerSchema.parse(req.body);

    // Verify OTP if provided
    if (req.body.otp) {
      const { valid, error } = verifyOTP(body.email, String(req.body.otp));
      if (!valid) {
        res.status(400).json({ error: error || 'Invalid verification code.' });
        return;
      }
    } else if (process.env.BREVO_API_KEY) {
      // OTP is required when Brevo is configured
      res.status(400).json({ error: 'Email verification required. Please verify your email first.' });
      return;
    }
    // If BREVO_API_KEY is not set, allow registration without OTP (dev/demo mode)

    const existing = await User.findOne({ email: body.email });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    const user = await User.create(body);
    const token = signToken(user._id.toString(), user.email);
    logger.info('User registered', { userId: user._id });
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    throw error;
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await User.findOne({ email: body.email }).select('+password');
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const valid = await user.comparePassword(body.password);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    user.lastLogin = new Date();
    await user.save();
    const token = signToken(user._id.toString(), user.email);
    logger.info('User logged in', { userId: user._id });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    throw error;
  }
};

export const me = async (req: Request, res: Response): Promise<void> => {
  res.json({ user: req.user });
};
