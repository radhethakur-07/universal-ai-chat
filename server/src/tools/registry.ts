import { MongoDBAdapter } from '../adapters/MongoDBAdapter';
import { analyticsParamsSchema, functionParamsSchema, queryParamsSchema, updateParamsSchema } from '../validators/schemas';
import { v4 as uuidv4 } from 'uuid';
import { ChartResponse, TableResponse } from '../types';
import logger from '../utils/logger';

const adapter = new MongoDBAdapter();

// In-memory confirmation store (use Redis in production)
const pendingConfirmations = new Map<string, {
  userId: string;
  projectId: string;
  entity: string;
  recordId: string;
  updates: Record<string, unknown>;
  expiresAt: Date;
}>();

export function cleanExpiredConfirmations() {
  const now = new Date();
  for (const [key, val] of pendingConfirmations.entries()) {
    if (val.expiresAt < now) pendingConfirmations.delete(key);
  }
}

// Clean every 5 minutes
setInterval(cleanExpiredConfirmations, 5 * 60 * 1000);

export const toolHandlers: Record<string, (args: Record<string, unknown>, userId: string, projectId: string) => Promise<unknown>> = {
  async query_data(args, _userId, _projectId) {
    const params = queryParamsSchema.parse(args);
    const rows = await adapter.query(params);
    return {
      success: true,
      entity: params.entity,
      count: rows.length,
      data: rows,
    };
  },

  async update_data(args, userId, projectId) {
    const params = updateParamsSchema.parse(args);
    // Instead of updating directly, create a confirmation request
    const actionId = uuidv4();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    pendingConfirmations.set(actionId, {
      userId,
      projectId,
      entity: params.entity,
      recordId: params.recordId,
      updates: params.updates,
      expiresAt,
    });
    return {
      requiresConfirmation: true,
      actionId,
      action: 'update_data',
      entity: params.entity,
      recordId: params.recordId,
      description: `Update ${params.entity} record '${params.recordId}' with: ${JSON.stringify(params.updates)}`,
      previewData: params.updates,
    };
  },

  async get_analytics(args, _userId, _projectId) {
    const params = analyticsParamsSchema.parse(args);
    const matchStage: Record<string, unknown> = {};
    if (params.filters && params.filters.length > 0) {
      for (const f of params.filters) {
        if (f.operator === 'eq') matchStage[f.field] = f.value;
        else if (f.operator === 'gte') matchStage[f.field] = { $gte: f.value };
        else if (f.operator === 'lte') matchStage[f.field] = { $lte: f.value };
      }
    }
    const aggFunc = params.aggregateFunc === 'count' ? { $sum: 1 } :
      params.aggregateFunc === 'sum' ? { $sum: `$${params.aggregateField}` } :
      params.aggregateFunc === 'avg' ? { $avg: `$${params.aggregateField}` } :
      params.aggregateFunc === 'max' ? { $max: `$${params.aggregateField}` } :
      { $min: `$${params.aggregateField}` };

    const pipeline: Record<string, unknown>[] = [];
    if (Object.keys(matchStage).length > 0) pipeline.push({ $match: matchStage });
    pipeline.push({
      $group: {
        _id: `$${params.groupBy}`,
        value: aggFunc,
      }
    });
    pipeline.push({ $sort: { value: -1 } });
    pipeline.push({ $limit: params.limit ?? 10 });

    const raw = await adapter.aggregate(params.entity, pipeline);
    const data = raw.map((r) => ({
      [params.groupBy]: r._id,
      value: typeof r.value === 'number' ? Math.round((r.value as number) * 100) / 100 : r.value,
    }));

    return {
      success: true,
      chartType: params.chartType,
      title: params.title || `${params.aggregateFunc.toUpperCase()} of ${params.aggregateField} by ${params.groupBy}`,
      entity: params.entity,
      groupBy: params.groupBy,
      aggregateField: params.aggregateField,
      data,
    };
  },

  async run_function(args, _userId, _projectId) {
    const params = functionParamsSchema.parse(args);
    const fnArgs = params.args ?? {};

    switch (params.functionName) {
      case 'getOrderSummary': {
        const total = await adapter.count('orders');
        const pending = await adapter.count('orders', [{ field: 'status', operator: 'eq', value: 'pending' }]);
        const shipped = await adapter.count('orders', [{ field: 'status', operator: 'eq', value: 'shipped' }]);
        const delivered = await adapter.count('orders', [{ field: 'status', operator: 'eq', value: 'delivered' }]);
        const cancelled = await adapter.count('orders', [{ field: 'status', operator: 'eq', value: 'cancelled' }]);
        return { functionName: 'getOrderSummary', result: { total, pending, shipped, delivered, cancelled } };
      }
      case 'calculateInvoiceTotal': {
        const statusFilter = fnArgs.status as string | undefined;
        const filters: { field: string; operator: 'eq'; value: unknown }[] = statusFilter
          ? [{ field: 'status', operator: 'eq' as const, value: statusFilter }]
          : [];
        const invoices = await adapter.query({ entity: 'invoices', filters, limit: 1000 });


        const total = invoices.reduce((sum, inv) => sum + ((inv.totalAmount as number) || 0), 0);
        return { functionName: 'calculateInvoiceTotal', result: { total: Math.round(total * 100) / 100, count: invoices.length, status: statusFilter || 'all' } };
      }
      case 'getTopProducts': {
        const limit = (fnArgs.limit as number) || 5;
        const pipeline = [
          { $group: { _id: '$productId', productName: { $first: '$productName' }, totalRevenue: { $sum: '$totalPrice' }, totalQty: { $sum: '$quantity' } } },
          { $sort: { totalRevenue: -1 } },
          { $limit: limit },
        ];
        // Aggregate from order items - need to unwind items first
        const orderPipeline = [
          { $unwind: '$items' },
          { $group: { _id: '$items.productId', productName: { $first: '$items.productName' }, totalRevenue: { $sum: '$items.totalPrice' }, totalQty: { $sum: '$items.quantity' } } },
          { $sort: { totalRevenue: -1 } },
          { $limit: limit },
        ];
        const result = await adapter.aggregate('orders', orderPipeline);
        return { functionName: 'getTopProducts', result: { products: result, limit } };
      }
      case 'calculateRevenueByRegion': {
        const pipeline = [
          { $group: { _id: '$region', totalRevenue: { $sum: '$totalAmount' }, orderCount: { $sum: 1 } } },
          { $sort: { totalRevenue: -1 } },
        ];
        const result = await adapter.aggregate('orders', pipeline);
        return { functionName: 'calculateRevenueByRegion', result: { regions: result } };
      }
      default:
        throw new Error(`Function '${params.functionName}' is not registered`);
    }
  },

  async get_record(args, _userId, _projectId) {
    const { entity, recordId } = args as { entity: string; recordId: string };
    const record = await adapter.findById(entity, recordId);
    return { success: !!record, record };
  },
};

export async function executeConfirmedAction(actionId: string, userId: string): Promise<{ success: boolean; record?: Record<string, unknown>; error?: string }> {
  const pending = pendingConfirmations.get(actionId);
  if (!pending) {
    return { success: false, error: 'Confirmation not found or expired' };
  }
  if (pending.userId !== userId) {
    return { success: false, error: 'Unauthorized confirmation' };
  }
  if (pending.expiresAt < new Date()) {
    pendingConfirmations.delete(actionId);
    return { success: false, error: 'Confirmation expired' };
  }
  pendingConfirmations.delete(actionId);
  const result = await adapter.update({
    entity: pending.entity,
    recordId: pending.recordId,
    updates: pending.updates,
  });
  return result;
}
