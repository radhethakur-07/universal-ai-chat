export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Project {
  _id: string;
  name: string;
  description: string;
  slug: string;
}

export interface Conversation {
  _id: string;
  title: string;
  project: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id?: string;
  role: 'user' | 'assistant';
  content: string;
  responseType?: ResponseType;
  responseData?: ChatResponse;
  toolsUsed?: string[];
  processingTime?: number;
  timestamp: string;
}

export type ResponseType = 'text' | 'table' | 'chart' | 'confirmation' | 'error';

export interface TableColumn {
  key: string;
  label: string;
}

export interface TableResponse {
  type: 'table';
  title: string;
  columns: TableColumn[];
  rows: Record<string, unknown>[];
  summary?: string;
}

export interface ChartResponse {
  type: 'chart';
  chartType: 'bar' | 'line' | 'pie';
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
}

export type ChatResponse =
  | TableResponse
  | ChartResponse
  | TextResponse
  | ConfirmationResponse
  | ErrorResponse;

export interface ChatApiResponse {
  conversationId: string;
  message: string;
  responseType: ResponseType;
  responseData?: ChatResponse;
  toolsUsed: string[];
  processingTime: number;
}

export interface SendMessagePayload {
  message: string;
  conversationId?: string;
  projectId: string;
}
