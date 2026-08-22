import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { env } from '../config/env';
import { loginSchema, registerSchema } from '../validators/schemas';
import logger from '../utils/logger';
import { sendOTPEmail } from '../services/emailService';
import { generateOTP, storeOTP, verifyOTP } from '../utils/otpStore';
import {
  seedProjectData,
  defaultProjectCollections,
  defaultRegisteredFunctions,
} from '../utils/seed';
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
      res.status(400).json({ error: 'Email verification required. Please verify your email first.' });
      return;
    }

    const existing = await User.findOne({ email: body.email });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    // 1. Create User
    const user = await User.create(body);

    // 2. Create Isolated Private Workspace for this User
    const cleanSlug = `${user.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
    const userProject = await Project.create({
      name: `${user.name}'s Workspace`,
      description: `Private e-commerce data workspace for ${user.name}`,
      slug: cleanSlug,
      owner: user._id,
      members: [user._id],
      collections: defaultProjectCollections,
      registeredFunctions: defaultRegisteredFunctions,
    });

    // 3. Seed starter dataset into this user's private workspace
    try {
      await seedProjectData(userProject._id, user._id);
      logger.info('Private workspace and starter data created for new user', { userId: user._id });
    } catch (seedErr) {
      logger.warn('Failed to seed starter data for new user workspace', seedErr);
    }

    const token = signToken(user._id.toString(), user.email);
    logger.info('User registered', { userId: user._id });
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      project: { id: userProject._id, name: userProject.name },
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
