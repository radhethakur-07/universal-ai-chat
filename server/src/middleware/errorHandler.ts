import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '../utils/logger';

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  const requestId = req.requestId;

  if (err instanceof ZodError) {
    logger.warn('Validation error', { requestId, errors: err.errors });
    res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map(e => ({ path: e.path.join('.'), message: e.message })),
    });
    return;
  }

  logger.error('Unhandled error', { requestId, error: err.message, stack: err.stack });
  res.status(500).json({ error: 'An internal error occurred. Please try again.' });
};

export const notFound = (_req: Request, res: Response): void => {
  res.status(404).json({ error: 'Route not found' });
};
