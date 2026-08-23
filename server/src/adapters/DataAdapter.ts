import { QueryParams, UpdateParams } from '../validators/schemas';

export interface DataAdapter {
  query(params: QueryParams, projectId?: string): Promise<Record<string, unknown>[]>;
  update(params: UpdateParams, projectId?: string): Promise<{ success: boolean; record?: Record<string, unknown>; error?: string }>;
  create(entity: string, data: Record<string, unknown>, projectId: string, userId?: string): Promise<Record<string, unknown>>;
  bulkCreate(entity: string, records: Record<string, unknown>[], projectId: string, userId?: string): Promise<{ count: number }>;
  count(entity: string, filters?: QueryParams['filters'], projectId?: string): Promise<number>;
  aggregate(entity: string, pipeline: Record<string, unknown>[], projectId?: string): Promise<Record<string, unknown>[]>;
  findById(entity: string, id: string, projectId?: string): Promise<Record<string, unknown> | null>;
}
