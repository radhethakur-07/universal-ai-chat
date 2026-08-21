import { QueryParams, UpdateParams } from '../validators/schemas';

export interface DataAdapter {
  query(params: QueryParams): Promise<Record<string, unknown>[]>;
  update(params: UpdateParams): Promise<{ success: boolean; record?: Record<string, unknown> }>;
  count(entity: string, filters?: QueryParams['filters']): Promise<number>;
  aggregate(entity: string, pipeline: Record<string, unknown>[]): Promise<Record<string, unknown>[]>;
  findById(entity: string, id: string): Promise<Record<string, unknown> | null>;
}
