import 'dotenv/config';
import { validateEnv } from './config/env';
import connectDB from './config/database';
import app from './app';
import { env } from './config/env';
import logger from './utils/logger';
import { runSeed } from './utils/seed';

// Register all models so Mongoose knows about them
import './models/User';
import './models/Project';
import './models/Conversation';
import './models/AuditLog';
import './models/business/Customer';
import './models/business/Product';
import './models/business/Order';
import './models/business/Invoice';

async function start() {
  try {
    validateEnv();
    await connectDB();

    // Auto-seed demo data if database is empty
    try {
      const result = await runSeed();
      logger.info('Seed check complete', result);
    } catch (seedErr) {
      // Non-fatal — server still starts even if seed fails
      logger.warn('Auto-seed skipped or failed', seedErr);
    }

    app.listen(env.port, '0.0.0.0', () => {
      logger.info(`Server running on port ${env.port}`, { env: env.nodeEnv });
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

start();
