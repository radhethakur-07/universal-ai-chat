import { GoogleGenerativeAI, FunctionDeclaration, Tool, Part } from '@google/generative-ai';
import { env } from '../config/env';
import logger from '../utils/logger';

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(env.geminiApiKey);
  }
  return genAI;
}

export const geminiTools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'query_data',
        description: 'Query business data (orders, customers, products, invoices) with optional filters, sorting and pagination. Use this when the user wants to see, list, find or search data.',
        parameters: {
          type: 'object' as any,
          properties: {
            entity: { type: 'string' as any, description: 'The entity to query: orders, customers, products, or invoices' },
            filters: {
              type: 'array' as any,
              description: 'Optional filter conditions',
              items: {
                type: 'object' as any,
                properties: {
                  field: { type: 'string' as any, description: 'Field name to filter on' },
                  operator: { type: 'string' as any, enum: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'contains'], description: 'Filter operator' },
                  value: { type: 'string' as any, description: 'Filter value (use string representation)' },
                },
                required: ['field', 'operator', 'value'],
              },
            },
            sortBy: { type: 'string' as any, description: 'Field to sort by' },
            sortOrder: { type: 'string' as any, enum: ['asc', 'desc'], description: 'Sort direction' },
            limit: { type: 'number' as any, description: 'Max number of records to return (default 20)' },
          },
          required: ['entity'],
        },
      } as FunctionDeclaration,
      {
        name: 'update_data',
        description: 'Update a specific record in business data. This requires user confirmation before executing. Use when user wants to update, change, modify or set a value on a record.',
        parameters: {
          type: 'object' as any,
          properties: {
            entity: { type: 'string' as any, description: 'Entity to update: orders, customers, products, or invoices' },
            recordId: { type: 'string' as any, description: 'The ID of the record to update (e.g. order ID like "102" or "ORD-102")' },
            updates: {
              type: 'object' as any,
              description: 'Key-value pairs of fields to update',
            },
          },
          required: ['entity', 'recordId', 'updates'],
        },
      } as FunctionDeclaration,
      {
        name: 'get_analytics',
        description: 'Generate analytics/charts from business data. Use when user asks for charts, graphs, visualizations, analysis, revenue by region, top products etc.',
        parameters: {
          type: 'object' as any,
          properties: {
            entity: { type: 'string' as any, description: 'Data entity: orders, customers, products, invoices' },
            chartType: { type: 'string' as any, enum: ['bar', 'line', 'pie'], description: 'Chart type' },
            groupBy: { type: 'string' as any, description: 'Field to group data by (e.g. region, city, status, category)' },
            aggregateField: { type: 'string' as any, description: 'Field to aggregate (e.g. totalAmount, amount). Use any field name for count.' },
            aggregateFunc: { type: 'string' as any, enum: ['sum', 'count', 'avg', 'max', 'min'], description: 'Aggregation function' },
            limit: { type: 'number' as any, description: 'Max groups to return' },
            title: { type: 'string' as any, description: 'Chart title' },
          },
          required: ['entity', 'chartType', 'groupBy', 'aggregateField', 'aggregateFunc'],
        },
      } as FunctionDeclaration,
      {
        name: 'run_function',
        description: 'Execute a registered business function. Available: getOrderSummary, calculateInvoiceTotal, getTopProducts, calculateRevenueByRegion',
        parameters: {
          type: 'object' as any,
          properties: {
            functionName: {
              type: 'string' as any,
              enum: ['getOrderSummary', 'calculateInvoiceTotal', 'getTopProducts', 'calculateRevenueByRegion'],
              description: 'Name of the registered function to execute',
            },
            args: {
              type: 'object' as any,
              description: 'Optional arguments for the function. calculateInvoiceTotal accepts {status: "unpaid"|"paid"}, getTopProducts accepts {limit: number}',
            },
          },
          required: ['functionName'],
        },
      } as FunctionDeclaration,
      {
        name: 'get_record',
        description: 'Get a specific record by its ID',
        parameters: {
          type: 'object' as any,
          properties: {
            entity: { type: 'string' as any, description: 'Entity name: orders, customers, products, invoices' },
            recordId: { type: 'string' as any, description: 'The ID of the record' },
          },
          required: ['entity', 'recordId'],
        },
      } as FunctionDeclaration,
    ],
  },
];

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: Part[];
}

export async function runGeminiChat(
  systemPrompt: string,
  history: GeminiMessage[],
  userMessage: string,
  onToolCall: (name: string, args: Record<string, unknown>) => Promise<unknown>,
): Promise<{ text: string; toolsUsed: string[] }> {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({
    model: env.geminiModel,
    systemInstruction: systemPrompt,
    tools: geminiTools,
  });

  const chat = model.startChat({ history });
  const toolsUsed: string[] = [];

  let result = await chat.sendMessage(userMessage);
  let response = result.response;

  // Handle function calling loop
  let iterations = 0;
  const MAX_ITERATIONS = 5;

  while (response.functionCalls() && response.functionCalls()!.length > 0 && iterations < MAX_ITERATIONS) {
    iterations++;
    const functionCall = response.functionCalls()![0];
    const { name, args } = functionCall;
    toolsUsed.push(name);
    logger.info('Gemini function call', { functionName: name, args });

    let toolResult: unknown;
    try {
      toolResult = await onToolCall(name, args as Record<string, unknown>);
    } catch (error) {
      toolResult = { error: (error as Error).message };
    }

    result = await chat.sendMessage([
      {
        functionResponse: {
          name,
          response: { result: toolResult },
        },
      },
    ]);
    response = result.response;
  }

  return {
    text: response.text(),
    toolsUsed,
  };
}
