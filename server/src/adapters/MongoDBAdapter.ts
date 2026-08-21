import mongoose from 'mongoose';
import { DataAdapter } from './DataAdapter';
import { QueryParams, UpdateParams } from '../validators/schemas';
import logger from '../utils/logger';

const ALLOWED_ENTITIES = ['orders', 'customers', 'products', 'invoices'];

function getModel(entity: string): mongoose.Model<mongoose.Document> {
  const entityMap: Record<string, string> = {
    orders: 'Order',
    customers: 'Customer',
    products: 'Product',
    invoices: 'Invoice',
  };
  const modelName = entityMap[entity.toLowerCase()];
  if (!modelName) {
    throw new Error(`Entity '${entity}' is not registered`);
  }
  return mongoose.model(modelName);
}

function buildMongoFilter(filters?: QueryParams['filters']): Record<string, unknown> {
  if (!filters || filters.length === 0) return {};
  const query: Record<string, unknown> = {};
  for (const filter of filters) {
    const { field, operator, value } = filter;
    switch (operator) {
      case 'eq': query[field] = value; break;
      case 'ne': query[field] = { $ne: value }; break;
      case 'gt': query[field] = { $gt: value }; break;
      case 'gte': query[field] = { $gte: value }; break;
      case 'lt': query[field] = { $lt: value }; break;
      case 'lte': query[field] = { $lte: value }; break;
      case 'in': query[field] = { $in: Array.isArray(value) ? value : [value] }; break;
      case 'contains': query[field] = { $regex: value, $options: 'i' }; break;
      case 'regex': query[field] = { $regex: value, $options: 'i' }; break;
    }
  }
  return query;
}

export class MongoDBAdapter implements DataAdapter {
  async query(params: QueryParams): Promise<Record<string, unknown>[]> {
    if (!ALLOWED_ENTITIES.includes(params.entity.toLowerCase())) {
      throw new Error(`Entity '${params.entity}' is not allowed`);
    }
    const model = getModel(params.entity);
    const filter = buildMongoFilter(params.filters);
    const sort: Record<string, 1 | -1> = {};
    if (params.sortBy) {
      sort[params.sortBy] = params.sortOrder === 'desc' ? -1 : 1;
    } else {
      sort['createdAt'] = -1;
    }
    const docs = await model
      .find(filter)
      .sort(sort)
      .skip(params.skip ?? 0)
      .limit(params.limit ?? 20)
      .lean();
    return docs as Record<string, unknown>[];
  }

  async update(params: UpdateParams): Promise<{ success: boolean; record?: Record<string, unknown> }> {
    if (!ALLOWED_ENTITIES.includes(params.entity.toLowerCase())) {
      throw new Error(`Entity '${params.entity}' is not allowed`);
    }
    const model = getModel(params.entity);
    const idField = params.entity.toLowerCase().slice(0, -1) + 'Id'; // orderId, customerId, etc.
    const doc = await model.findOneAndUpdate(
      { [idField]: params.recordId },
      { $set: params.updates },
      { new: true, lean: true }
    );
    if (!doc) {
      const byObjectId = await model.findByIdAndUpdate(
        params.recordId,
        { $set: params.updates },
        { new: true, lean: true }
      );
      if (!byObjectId) return { success: false };
      return { success: true, record: byObjectId as Record<string, unknown> };
    }
    return { success: true, record: doc as Record<string, unknown> };
  }

  async count(entity: string, filters?: QueryParams['filters']): Promise<number> {
    if (!ALLOWED_ENTITIES.includes(entity.toLowerCase())) {
      throw new Error(`Entity '${entity}' is not allowed`);
    }
    const model = getModel(entity);
    const filter = buildMongoFilter(filters);
    return model.countDocuments(filter);
  }

  async aggregate(entity: string, pipeline: Record<string, unknown>[]): Promise<Record<string, unknown>[]> {
    if (!ALLOWED_ENTITIES.includes(entity.toLowerCase())) {
      throw new Error(`Entity '${entity}' is not allowed`);
    }
    const model = getModel(entity);
    return model.aggregate(pipeline) as Promise<Record<string, unknown>[]>;
  }

  async findById(entity: string, id: string): Promise<Record<string, unknown> | null> {
    if (!ALLOWED_ENTITIES.includes(entity.toLowerCase())) {
      throw new Error(`Entity '${entity}' is not allowed`);
    }
    const model = getModel(entity);
    const idField = entity.toLowerCase().slice(0, -1) + 'Id';
    const doc = await model.findOne({ [idField]: id }).lean();
    return doc as Record<string, unknown> | null;
  }
}
