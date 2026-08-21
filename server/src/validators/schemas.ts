import { z } from 'zod';

export const filterOperatorSchema = z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'contains', 'regex']);

export const filterConditionSchema = z.object({
  field: z.string().min(1).max(100),
  operator: filterOperatorSchema,
  value: z.unknown(),
});

export const queryParamsSchema = z.object({
  entity: z.string().min(1).max(100),
  filters: z.array(filterConditionSchema).optional(),
  sortBy: z.string().max(100).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
  skip: z.number().int().min(0).optional().default(0),
  fields: z.array(z.string()).optional(),
});

export const updateParamsSchema = z.object({
  entity: z.string().min(1).max(100),
  recordId: z.string().min(1).max(100),
  updates: z.record(z.unknown()),
});

export const analyticsParamsSchema = z.object({
  entity: z.string().min(1).max(100),
  chartType: z.enum(['bar', 'line', 'pie']),
  groupBy: z.string().min(1).max(100),
  aggregateField: z.string().min(1).max(100),
  aggregateFunc: z.enum(['sum', 'count', 'avg', 'max', 'min']),
  filters: z.array(filterConditionSchema).optional(),
  limit: z.number().int().min(1).max(50).optional().default(10),
  title: z.string().max(200).optional(),
});

export const functionParamsSchema = z.object({
  functionName: z.string().min(1).max(100),
  args: z.record(z.unknown()).optional().default({}),
});

export const confirmActionSchema = z.object({
  actionId: z.string().uuid(),
  confirmed: z.boolean(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const chatMessageSchema = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z.string().optional(),
  projectId: z.string().min(1),
});

export type QueryParams = z.infer<typeof queryParamsSchema>;
export type UpdateParams = z.infer<typeof updateParamsSchema>;
export type AnalyticsParams = z.infer<typeof analyticsParamsSchema>;
export type FunctionParams = z.infer<typeof functionParamsSchema>;
