import { MongoDBAdapter } from '../adapters/MongoDBAdapter';
import { analyticsParamsSchema, functionParamsSchema, queryParamsSchema, updateParamsSchema } from '../validators/schemas';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import { trackOrder } from '../services/shippingService';
import { z } from 'zod';

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

export const createDataSchema = z.object({
  entity: z.string().min(1),
  data: z.record(z.unknown()),
});

export const toolHandlers: Record<string, (args: Record<string, unknown>, userId: string, projectId: string) => Promise<unknown>> = {
  async query_data(args, _userId, projectId) {
    const params = queryParamsSchema.parse(args);
    const rows = await adapter.query(params, projectId);
    return {
      success: true,
      entity: params.entity,
      count: rows.length,
      data: rows,
    };
  },

  async create_data(args, userId, projectId) {
    const params = createDataSchema.parse(args);
    // Auto-generate IDs if missing
    const data = { ...params.data };
    const entity = params.entity.toLowerCase();
    if (entity === 'products' && !data.productId) {
      data.productId = `PROD-${Date.now().toString().slice(-4)}`;
      if (!data.sku) data.sku = `SKU-${Date.now().toString().slice(-6)}`;
      if (!data.subcategory) data.subcategory = 'General';
      if (!data.costPrice) data.costPrice = typeof data.price === 'number' ? Math.round((data.price as number) * 0.7) : 0;
    } else if (entity === 'customers' && !data.customerId) {
      data.customerId = `CUST-${Date.now().toString().slice(-4)}`;
      if (!data.city) data.city = 'Unknown';
      if (!data.state) data.state = 'Unknown';
      if (!data.phone) data.phone = '+91-0000000000';
    } else if (entity === 'orders' && !data.orderId) {
      data.orderId = `ORD-${Date.now().toString().slice(-4)}`;
      if (!data.region) data.region = 'Central';
      if (!data.city) data.city = 'Delhi';
      if (!data.state) data.state = 'Delhi';
      if (!data.amount && data.totalAmount) data.amount = data.totalAmount;
      if (!data.totalAmount && data.amount) data.totalAmount = data.amount;
    } else if (entity === 'invoices' && !data.invoiceId) {
      data.invoiceId = `INV-${Date.now().toString().slice(-4)}`;
      if (!data.dueDate) data.dueDate = new Date();
      if (!data.orderId) data.orderId = 'ORD-000';
      if (!data.customerId) data.customerId = 'CUST-000';
      if (!data.customerName) data.customerName = 'General';
    }

    const created = await adapter.create(entity, data, projectId, userId);
    return {
      success: true,
      entity: params.entity,
      record: created,
      message: `Successfully added new record to ${params.entity}`,
    };
  },

  async update_data(args, userId, projectId) {
    const params = updateParamsSchema.parse(args);
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

  async get_analytics(args, _userId, projectId) {
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

    const raw = await adapter.aggregate(params.entity, pipeline, projectId);
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

  async run_function(args, _userId, projectId) {
    const params = functionParamsSchema.parse(args);
    const fnArgs = params.args ?? {};

    switch (params.functionName) {
      case 'getOrderSummary': {
        const total = await adapter.count('orders', [], projectId);
        const pending = await adapter.count('orders', [{ field: 'status', operator: 'eq', value: 'pending' }], projectId);
        const shipped = await adapter.count('orders', [{ field: 'status', operator: 'eq', value: 'shipped' }], projectId);
        const delivered = await adapter.count('orders', [{ field: 'status', operator: 'eq', value: 'delivered' }], projectId);
        const cancelled = await adapter.count('orders', [{ field: 'status', operator: 'eq', value: 'cancelled' }], projectId);
        return { functionName: 'getOrderSummary', result: { total, pending, shipped, delivered, cancelled } };
      }
      case 'calculateInvoiceTotal': {
        const statusFilter = fnArgs.status as string | undefined;
        const filters: { field: string; operator: 'eq'; value: unknown }[] = statusFilter
          ? [{ field: 'status', operator: 'eq' as const, value: statusFilter }]
          : [];
        const invoices = await adapter.query({ entity: 'invoices', filters, limit: 1000 }, projectId);

        const total = invoices.reduce((sum, inv) => sum + ((inv.totalAmount as number) || 0), 0);
        return { functionName: 'calculateInvoiceTotal', result: { total: Math.round(total * 100) / 100, count: invoices.length, status: statusFilter || 'all' } };
      }
      case 'getTopProducts': {
        const limit = (fnArgs.limit as number) || 5;
        const orderPipeline = [
          { $unwind: '$items' },
          { $group: { _id: '$items.productId', productName: { $first: '$items.productName' }, totalRevenue: { $sum: '$items.totalPrice' }, totalQty: { $sum: '$items.quantity' } } },
          { $sort: { totalRevenue: -1 } },
          { $limit: limit },
        ];
        const result = await adapter.aggregate('orders', orderPipeline, projectId);
        return { functionName: 'getTopProducts', result: { products: result, limit } };
      }
      case 'calculateRevenueByRegion': {
        const pipeline = [
          { $group: { _id: '$region', totalRevenue: { $sum: '$totalAmount' }, orderCount: { $sum: 1 } } },
          { $sort: { totalRevenue: -1 } },
        ];
        const result = await adapter.aggregate('orders', pipeline, projectId);
        return { functionName: 'calculateRevenueByRegion', result: { regions: result } };
      }
      default:
        throw new Error(`Function '${params.functionName}' is not registered`);
    }
  },

  async get_record(args, _userId, projectId) {
    const { entity, recordId } = args as { entity: string; recordId: string };
    const record = await adapter.findById(entity, recordId, projectId);
    return { success: !!record, record };
  },

  async track_shipment(args, _userId, _projectId) {
    const { orderId } = args as { orderId: string };
    if (!orderId) throw new Error('orderId is required');
    const status = await trackOrder(orderId);
    return { success: true, status };
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
  const result = await adapter.update(
    {
      entity: pending.entity,
      recordId: pending.recordId,
      updates: pending.updates,
    },
    pending.projectId
  );
  return result;
}
