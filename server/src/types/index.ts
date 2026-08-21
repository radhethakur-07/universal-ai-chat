export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export type ResponseType = 'text' | 'table' | 'chart' | 'confirmation' | 'error' | 'function_result';

export type ChartType = 'bar' | 'line' | 'pie';

export interface TableResponse {
  type: 'table';
  title: string;
  columns: { key: string; label: string }[];
  rows: Record<string, unknown>[];
  summary?: string;
}

export interface ChartResponse {
  type: 'chart';
  chartType: ChartType;
  title: string;
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  summary?: string;
}

export interface TextResponse {
  type: 'text';
  content: string;
}

export interface ConfirmationResponse {
  type: 'confirmation';
  actionId: string;
  action: string;
  entity: string;
  recordId?: string;
  description: string;
  previewData?: Record<string, unknown>;
}

export interface ErrorResponse {
  type: 'error';
  message: string;
  code?: string;
}

export type ChatResponse = TableResponse | ChartResponse | TextResponse | ConfirmationResponse | ErrorResponse;

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolCall?: ToolCall;
  responseType?: ResponseType;
  responseData?: ChatResponse;
  timestamp: Date;
}

export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'regex';

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

export interface QueryParams {
  entity: string;
  filters?: FilterCondition[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  skip?: number;
  fields?: string[];
}

export interface UpdateParams {
  entity: string;
  recordId: string;
  updates: Record<string, unknown>;
}

export interface AnalyticsParams {
  entity: string;
  chartType: ChartType;
  groupBy: string;
  aggregateField: string;
  aggregateFunc: 'sum' | 'count' | 'avg' | 'max' | 'min';
  filters?: FilterCondition[];
  limit?: number;
  title?: string;
}

export interface FunctionParams {
  functionName: string;
  args?: Record<string, unknown>;
}

export interface PendingConfirmation {
  actionId: string;
  userId: string;
  projectId: string;
  action: string;
  entity: string;
  recordId?: string;
  updates?: Record<string, unknown>;
  expiresAt: Date;
}
