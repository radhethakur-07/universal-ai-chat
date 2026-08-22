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
  const irregulars: Record<string, string> = {
    people: 'Person',
    children: 'Child',
    teeth: 'Tooth',
  };
  if (irregulars[lower]) return irregulars[lower]!;
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
  async query(params: QueryParams, projectId?: string): Promise<Record<string, unknown>[]> {
    const model = getModel(params.entity);
    const filter = buildMongoFilter(params.filters);
    if (projectId) {
      filter.project = new mongoose.Types.ObjectId(projectId);
    }
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

  async update(params: UpdateParams, projectId?: string): Promise<{ success: boolean; record?: Record<string, unknown> }> {
    const model = getModel(params.entity);
    const singular = entityToModelName(params.entity);
    const idField = singular.charAt(0).toLowerCase() + singular.slice(1) + 'Id';
    const query: Record<string, unknown> = { [idField]: params.recordId };
    if (projectId) {
      query.project = new mongoose.Types.ObjectId(projectId);
    }

    const doc = await model.findOneAndUpdate(
      query,
      { $set: params.updates },
      { new: true, lean: true }
    );
    if (!doc) {
      const byObjectIdQuery: Record<string, unknown> = { _id: params.recordId };
      if (projectId) byObjectIdQuery.project = new mongoose.Types.ObjectId(projectId);
      const byObjectId = await model.findOneAndUpdate(
        byObjectIdQuery,
        { $set: params.updates },
        { new: true, lean: true }
      );
      if (!byObjectId) return { success: false };
      return { success: true, record: byObjectId as Record<string, unknown> };
    }
    return { success: true, record: doc as Record<string, unknown> };
  }

  async create(entity: string, data: Record<string, unknown>, projectId: string, userId?: string): Promise<Record<string, unknown>> {
    const model = getModel(entity);
    const doc = await model.create({
      ...data,
      project: new mongoose.Types.ObjectId(projectId),
      ...(userId ? { user: new mongoose.Types.ObjectId(userId) } : {}),
    });
    return doc.toObject() as Record<string, unknown>;
  }

  async bulkCreate(entity: string, records: Record<string, unknown>[], projectId: string, userId?: string): Promise<{ count: number }> {
    const model = getModel(entity);
    const projectObjId = new mongoose.Types.ObjectId(projectId);
    const userObjId = userId ? new mongoose.Types.ObjectId(userId) : undefined;
    const docs = records.map((r) => ({
      ...r,
      project: projectObjId,
      ...(userObjId ? { user: userObjId } : {}),
    }));
    const inserted = await model.insertMany(docs);
    return { count: inserted.length };
  }

  async count(entity: string, filters?: QueryParams['filters'], projectId?: string): Promise<number> {
    const model = getModel(entity);
    const filter = buildMongoFilter(filters);
    if (projectId) {
      filter.project = new mongoose.Types.ObjectId(projectId);
    }
    return model.countDocuments(filter);
  }

  async aggregate(entity: string, pipeline: Record<string, unknown>[], projectId?: string): Promise<Record<string, unknown>[]> {
    const model = getModel(entity);
    const scopedPipeline: Record<string, unknown>[] = [];
    if (projectId) {
      scopedPipeline.push({ $match: { project: new mongoose.Types.ObjectId(projectId) } });
    }
    scopedPipeline.push(...pipeline);
    const stages = scopedPipeline as unknown as mongoose.PipelineStage[];
    const result = await model.aggregate(stages);
    return result as Record<string, unknown>[];
  }

  async findById(entity: string, id: string, projectId?: string): Promise<Record<string, unknown> | null> {
    const model = getModel(entity);
    const singular = entityToModelName(entity);
    const idField = singular.charAt(0).toLowerCase() + singular.slice(1) + 'Id';
    const query: Record<string, unknown> = { [idField]: id };
    if (projectId) {
      query.project = new mongoose.Types.ObjectId(projectId);
    }
    const doc =
      (await model.findOne(query).lean()) ??
      (await model.findOne({ _id: id, ...(projectId ? { project: new mongoose.Types.ObjectId(projectId) } : {}) }).lean());
    return doc as Record<string, unknown> | null;
  }
}
