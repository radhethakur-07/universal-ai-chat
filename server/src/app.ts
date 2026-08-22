import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { attachRequestId } from './middleware/requestId';
import { errorHandler, notFound } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import conversationRoutes from './routes/conversations';
import projectRoutes from './routes/projects';
import healthRoutes from './routes/health';
import seedRoutes from './routes/seed';
import dataRoutes from './routes/data';
import logger from './utils/logger';

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [env.corsOrigin, env.clientUrl].filter(Boolean);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`, { requestId: req.requestId });
  next();
});

// Request ID
app.use(attachRequestId);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/seed', seedRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
