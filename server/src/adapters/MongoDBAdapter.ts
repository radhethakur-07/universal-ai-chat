import mongoose from 'mongoose';
import { DataAdapter } from './DataAdapter';
import { QueryParams, UpdateParams } from '../validators/schemas';

/**
 * Converts a plural entity name to a Mongoose model name.
 * Domain-agnostic: works for any entity registered in Mongoose.
 * Examples: orders→Order, customers→Customer, invoices→Invoice, products→Product
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

/**
 * Builds a flexible ID query for record lookup and updates.
 * Matches exact IDs, uppercase, padded numbers, and handles legacy records.
 */
function buildIdQuery(entity: string, recordId: string, projectId?: string): Record<string, unknown> {
  const singular = entityToModelName(entity);
  const idField = singular.charAt(0).toLowerCase() + singular.slice(1) + 'Id';

  const cleanId = (recordId || '').trim();
  const idConditions: Record<string, unknown>[] = [
    { [idField]: cleanId },
    { [idField]: cleanId.toUpperCase() },
    { [idField]: { $regex: new RegExp(`^${cleanId}$`, 'i') } },
  ];

  // Try extracting numeric portion: e.g. "001" or "1" -> "ORD-001"
  const digits = cleanId.replace(/[^0-9]/g, '');
  if (digits) {
    const num = parseInt(digits, 10);
    idConditions.push(
      { [idField]: `ORD-${String(num).padStart(3, '0')}` },
      { [idField]: `PROD-${String(num).padStart(3, '0')}` },
      { [idField]: `CUST-${String(num).padStart(3, '0')}` },
      { [idField]: `INV-${String(num).padStart(3, '0')}` },
      { [idField]: { $regex: new RegExp(`0*${num}$`, 'i') } }
    );
  }

  // Only check MongoDB _id if recordId is a valid 24-character hexadecimal ObjectId
  if (mongoose.isValidObjectId(cleanId)) {
    idConditions.push({ _id: new mongoose.Types.ObjectId(cleanId) });
  }

  if (projectId) {
    return {
      $and: [
        { $or: idConditions },
        {
          $or: [
            { project: new mongoose.Types.ObjectId(projectId) },
            { project: { $exists: false } },
            { project: null },
          ],
        },
      ],
    };
  }

  return { $or: idConditions };
}

export class MongoDBAdapter implements DataAdapter {
  async query(params: QueryParams, projectId?: string): Promise<Record<string, unknown>[]> {
    const model = getModel(params.entity);
    const filter = buildMongoFilter(params.filters);
    if (projectId) {
      const projectClause = {
        $or: [
          { project: new mongoose.Types.ObjectId(projectId) },
          { project: { $exists: false } },
          { project: null },
        ],
      };
      if (Object.keys(filter).length > 0) {
        filter.$and = [{ ...filter }, projectClause];
      } else {
        Object.assign(filter, projectClause);
      }
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

  async update(params: UpdateParams, projectId?: string): Promise<{ success: boolean; record?: Record<string, unknown>; error?: string }> {
    const model = getModel(params.entity);
    const query = buildIdQuery(params.entity, params.recordId, projectId);

    const doc = await model.findOneAndUpdate(
      query,
      {
        $set: {
          ...params.updates,
          ...(projectId ? { project: new mongoose.Types.ObjectId(projectId) } : {}),
        },
      },
      { new: true, lean: true }
    );

    if (!doc) {
      // If scoped search failed, try finding without project scoping as fallback
      const fallbackQuery = buildIdQuery(params.entity, params.recordId);
      const fallbackDoc = await model.findOneAndUpdate(
        fallbackQuery,
        {
          $set: {
            ...params.updates,
            ...(projectId ? { project: new mongoose.Types.ObjectId(projectId) } : {}),
          },
        },
        { new: true, lean: true }
      );
      if (fallbackDoc) {
        return { success: true, record: fallbackDoc as Record<string, unknown> };
      }
      return { success: false, error: `Record '${params.recordId}' not found in ${params.entity}` };
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
      const projectClause = {
        $or: [
          { project: new mongoose.Types.ObjectId(projectId) },
          { project: { $exists: false } },
          { project: null },
        ],
      };
      if (Object.keys(filter).length > 0) {
        filter.$and = [{ ...filter }, projectClause];
      } else {
        Object.assign(filter, projectClause);
      }
    }
    return model.countDocuments(filter);
  }

  async aggregate(entity: string, pipeline: Record<string, unknown>[], projectId?: string): Promise<Record<string, unknown>[]> {
    const model = getModel(entity);
    const scopedPipeline: Record<string, unknown>[] = [];
    if (projectId) {
      scopedPipeline.push({
        $match: {
          $or: [
            { project: new mongoose.Types.ObjectId(projectId) },
            { project: { $exists: false } },
            { project: null },
          ],
        },
      });
    }
    scopedPipeline.push(...pipeline);
    const stages = scopedPipeline as unknown as mongoose.PipelineStage[];
    const result = await model.aggregate(stages);
    return result as Record<string, unknown>[];
  }

  async findById(entity: string, id: string, projectId?: string): Promise<Record<string, unknown> | null> {
    const model = getModel(entity);
    const query = buildIdQuery(entity, id, projectId);
    const doc = await model.findOne(query).lean();
    return doc as Record<string, unknown> | null;
  }
}
