import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { env } from '../config/env';
import { loginSchema, registerSchema } from '../validators/schemas';
import logger from '../utils/logger';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = registerSchema.parse(req.body);
    const existing = await User.findOne({ email: body.email });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    const user = await User.create(body);
    const token = jwt.sign({ userId: user._id.toString(), email: user.email }, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as any);
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
    const token = jwt.sign({ userId: user._id.toString(), email: user.email }, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as any);
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
