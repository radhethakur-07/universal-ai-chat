import mongoose from 'mongoose';
import logger from '../utils/logger';

/**
 * Drops legacy single-field unique indexes created before multi-tenant scoping was introduced.
 * This allows multiple users to have their own CUST-001, ORD-001, etc. scoped by project.
 */
export async function syncLegacyIndexes(): Promise<void> {
  const collections = ['customers', 'products', 'orders', 'invoices'];
  for (const colName of collections) {
    try {
      const col = mongoose.connection.collection(colName);
      const indexes = await col.indexes();
      for (const idx of indexes) {
        // Drop any old unique index that does NOT include the 'project' field
        if (
          idx.name &&
          !idx.name.startsWith('_id') &&
          !idx.name.includes('project') &&
          idx.unique
        ) {
          try {
            await col.dropIndex(idx.name);
            logger.info(`Dropped legacy unique index '${idx.name}' on collection '${colName}'`);
          } catch (dropErr) {
            logger.warn(`Could not drop index ${idx.name} on ${colName}`, dropErr);
          }
        }
      }
    } catch {
      // Collection might not exist yet, safe to ignore
    }
  }

  // Ensure all projects allow ['read', 'create', 'update'] on their collections
  try {
    const projCol = mongoose.connection.collection('projects');
    await projCol.updateMany(
      {},
      { $addToSet: { 'collections.$[].allowedOperations': { $each: ['read', 'create', 'update'] } } }
    );
    const demoProj = await projCol.findOne({ slug: 'ecommerce-demo' });
    if (demoProj) {
      for (const colName of ['orders', 'customers', 'products', 'invoices']) {
        const c = mongoose.connection.collection(colName);
        await c.updateMany(
          { project: { $exists: false } },
          { $set: { project: demoProj._id } }
        );
      }
    }
  } catch {
    // Safe to ignore
  }
}

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info('MongoDB Atlas connected successfully');

    // Clean up old single-tenant indexes
    await syncLegacyIndexes();
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    throw error;
  }

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected. Attempting to reconnect...');
  });
};

export default connectDB;
