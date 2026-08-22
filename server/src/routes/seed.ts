import { Router, Request, Response } from 'express';
import { runSeed } from '../utils/seed';
import logger from '../utils/logger';

const router = Router();

// GET /api/seed — trigger seed from browser (one-time use for free-tier deployments)
// Protected by a secret key in query param: /api/seed?secret=YOUR_JWT_SECRET_FIRST_8_CHARS
router.get('/', async (req: Request, res: Response) => {
  try {
    const secret = req.query['secret'] as string;
    const jwtSecret = process.env.JWT_SECRET || '';

    // Simple protection: first 8 chars of JWT_SECRET must match
    if (!secret || !jwtSecret.startsWith(secret) || secret.length < 6) {
      res.status(401).json({ error: 'Unauthorized. Pass ?secret=<first 8 chars of JWT_SECRET>' });
      return;
    }

    const result = await runSeed();
    res.json({ success: true, ...result });
  } catch (error) {
    logger.error('Seed route error', error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

export default router;
