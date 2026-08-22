import mongoose from 'mongoose';
import { DataAdapter } from './DataAdapter';
import { QueryParams, UpdateParams } from '../validators/schemas';

/**
 * Converts a plural entity name to a Mongoose model name.
 * Domain-agnostic: works for any entity registered in Mongoose.
 * Examples: orders→Order, customers→Customer, invoices→Invoice, patients→Patient
 */
function entityToModelName(entity: string): string {
  const lower = entity.toLowerCase().trim();
  // Handle common irregular plurals
  const irregulars: Record<string, string> = {
    people: 'Person',
    children: 'Child',
    teeth: 'Tooth',
  };
  if (irregulars[lower]) return irregulars[lower]!;
  // Strip trailing 's' for simple plurals, then capitalize
  const singular = lower.endsWith('ies')
    ? lower.slice(0, -3) + 'y'   // categories→Category
    : lower.endsWith('ses')
    ? lower.slice(0, -2)          // statuses→Status
    : lower.endsWith('s')
    ? lower.slice(0, -1)          // orders→Order
    : lower;
  return singular.charAt(0).toUpperCase() + singular.slice(1);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getModel(entity: string): mongoose.Model<any> {
  const modelName = entityToModelName(entity);
  const registered = mongoose.modelNames();
  if (!registered.includes(modelName)) {
    throw new Error(
      `Entity '${entity}' maps to model '${modelName}' which is not registered. ` +
      `Registered: ${registered.join(', ')}`
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return mongoose.model<any>(modelName);
}

function buildMongoFilter(filters?: QueryParams['filters']): Record<string, unknown> {
  if (!filters || filters.length === 0) return {};
  const query: Record<string, unknown> = {};
  for (const filter of filters) {
    const { field, operator, value } = filter;
    // Try to parse numeric values for comparison operators
    const numVal = parseFloat(value as string);
    const isNum = !isNaN(numVal) && String(numVal) === String(value);
    const parsed = isNum ? numVal : value;
    switch (operator) {
      case 'eq':       query[field] = parsed; break;
      case 'ne':       query[field] = { $ne: parsed }; break;
      case 'gt':       query[field] = { $gt: parsed }; break;
      case 'gte':      query[field] = { $gte: parsed }; break;
      case 'lt':       query[field] = { $lt: parsed }; break;
      case 'lte':      query[field] = { $lte: parsed }; break;
      case 'in':       query[field] = { $in: Array.isArray(value) ? value : [value] }; break;
      case 'contains': query[field] = { $regex: value, $options: 'i' }; break;
      case 'regex':    query[field] = { $regex: value, $options: 'i' }; break;
    }
  }
  return query;
}

export class MongoDBAdapter implements DataAdapter {
  async query(params: QueryParams): Promise<Record<string, unknown>[]> {
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
    const model = getModel(params.entity);
    // Try custom ID field first (e.g. orderId, customerId), then MongoDB _id
    const singular = entityToModelName(params.entity);
    const idField = singular.charAt(0).toLowerCase() + singular.slice(1) + 'Id';
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
    const model = getModel(entity);
    const filter = buildMongoFilter(filters);
    return model.countDocuments(filter);
  }

  async aggregate(entity: string, pipeline: Record<string, unknown>[]): Promise<Record<string, unknown>[]> {
    const model = getModel(entity);
    // Double-cast via unknown to safely convert generic pipeline to Mongoose PipelineStage[]
    const stages = pipeline as unknown as mongoose.PipelineStage[];
    const result = await model.aggregate(stages);
    return result as Record<string, unknown>[];
  }

  async findById(entity: string, id: string): Promise<Record<string, unknown> | null> {
    const model = getModel(entity);
    const singular = entityToModelName(entity);
    const idField = singular.charAt(0).toLowerCase() + singular.slice(1) + 'Id';
    // Try custom ID field first, then MongoDB ObjectId
    const doc =
      (await model.findOne({ [idField]: id }).lean()) ??
      (await model.findById(id).lean());
    return doc as Record<string, unknown> | null;
  }
}
