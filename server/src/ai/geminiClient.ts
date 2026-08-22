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
        description:
          'Query business data with optional filters, sorting and pagination. Use when the user wants to see, list, find, filter or search data records.',
        parameters: {
          type: 'object' as any,
          properties: {
            entity: {
              type: 'string' as any,
              description: 'The entity/collection to query (e.g. orders, customers, products, invoices)',
            },
            filters: {
              type: 'array' as any,
              description: 'Optional array of filter conditions',
              items: {
                type: 'object' as any,
                properties: {
                  field: { type: 'string' as any, description: 'Field name to filter on' },
                  operator: {
                    type: 'string' as any,
                    enum: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'contains', 'regex'],
                    description: 'Filter operator',
                  },
                  value: {
                    type: 'string' as any,
                    description: 'Filter value as a string (numbers will be parsed)',
                  },
                },
                required: ['field', 'operator', 'value'],
              },
            },
            sortBy: { type: 'string' as any, description: 'Field to sort by' },
            sortOrder: { type: 'string' as any, enum: ['asc', 'desc'] },
            limit: { type: 'number' as any, description: 'Max records to return (default 20)' },
          },
          required: ['entity'],
        },
      } as FunctionDeclaration,
      {
        name: 'update_data',
        description:
          'Update a specific record. Requires user confirmation before executing. Use when user wants to update, change, modify, or set a field on a record.',
        parameters: {
          type: 'object' as any,
          properties: {
            entity: { type: 'string' as any, description: 'Entity to update (e.g. orders, customers)' },
            recordId: {
              type: 'string' as any,
              description: 'The ID of the record (e.g. ORD-101, CUST-001)',
            },
            updates: {
              type: 'object' as any,
              description: 'Key-value pairs of fields and new values to set',
            },
          },
          required: ['entity', 'recordId', 'updates'],
        },
      } as FunctionDeclaration,
      {
        name: 'get_analytics',
        description:
          'Generate charts and analytics from business data. Use for visualizations, trends, revenue analysis, comparisons, top-N queries.',
        parameters: {
          type: 'object' as any,
          properties: {
            entity: { type: 'string' as any },
            chartType: { type: 'string' as any, enum: ['bar', 'line', 'pie'] },
            groupBy: {
              type: 'string' as any,
              description: 'Field to group data by (e.g. region, city, status, category)',
            },
            aggregateField: { type: 'string' as any, description: 'Field to aggregate' },
            aggregateFunc: {
              type: 'string' as any,
              enum: ['sum', 'count', 'avg', 'max', 'min'],
            },
            limit: { type: 'number' as any, description: 'Max groups to return' },
            title: { type: 'string' as any, description: 'Descriptive chart title' },
          },
          required: ['entity', 'chartType', 'groupBy', 'aggregateField', 'aggregateFunc'],
        },
      } as FunctionDeclaration,
      {
        name: 'run_function',
        description:
          'Execute a registered business function. Available: getOrderSummary, calculateInvoiceTotal (args: {status: "paid"|"unpaid"}), getTopProducts (args: {limit: number}), calculateRevenueByRegion',
        parameters: {
          type: 'object' as any,
          properties: {
            functionName: {
              type: 'string' as any,
              enum: [
                'getOrderSummary',
                'calculateInvoiceTotal',
                'getTopProducts',
                'calculateRevenueByRegion',
              ],
              description: 'Registered function name',
            },
            args: {
              type: 'object' as any,
              description: 'Optional arguments for the function',
            },
          },
          required: ['functionName'],
        },
      } as FunctionDeclaration,
      {
        name: 'get_record',
        description: 'Get a specific record by its ID or order ID',
        parameters: {
          type: 'object' as any,
          properties: {
            entity: { type: 'string' as any, description: 'Entity name' },
            recordId: { type: 'string' as any, description: 'The record ID to look up' },
          },
          required: ['entity', 'recordId'],
        },
      } as FunctionDeclaration,
      {
        name: 'track_shipment',
        description:
          'Track a shipment / order delivery status via the shipping API. Use when the user asks to track an order, check delivery ETA, or asks where an order is.',
        parameters: {
          type: 'object' as any,
          properties: {
            orderId: {
              type: 'string' as any,
              description: 'The order ID to track (e.g. ORD-101, ORD-205)',
            },
          },
          required: ['orderId'],
        },
      } as FunctionDeclaration,
      {
        name: 'create_data',
        description:
          'Create and insert a new record into a business collection (e.g. products, customers, orders, invoices). Use when user asks to add, insert, create, or register new items, products, customers or orders.',
        parameters: {
          type: 'object' as any,
          properties: {
            entity: {
              type: 'string' as any,
              description: 'The collection name (e.g. products, customers, orders, invoices)',
            },
            data: {
              type: 'object' as any,
              description: 'Key-value pairs of the record fields to insert (e.g. { name: "MacBook", price: 120000, category: "Electronics" })',
            },
          },
          required: ['entity', 'data'],
        },
      } as FunctionDeclaration,
    ],
  },
];

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: Part[];
}

function getValidModelName(): string {
  const m = (env.geminiModel || '').trim();
  if (m && m !== 'gemini-2.0-flash') {
    return m;
  }
  return 'gemini-3.6-flash';
}

export async function runGeminiChat(
  systemPrompt: string,
  history: GeminiMessage[],
  userMessage: string,
  onToolCall: (name: string, args: Record<string, unknown>) => Promise<unknown>,
): Promise<{ text: string; toolsUsed: string[] }> {
  const ai = getGenAI();
  const modelName = getValidModelName();
  const model = ai.getGenerativeModel({
    model: modelName,
    systemInstruction: systemPrompt,
    tools: geminiTools,
  });

  const contents: Array<{ role: 'user' | 'model'; parts: Part[] }> = [
    ...history,
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  const toolsUsed: string[] = [];
  let iterations = 0;
  const MAX_ITERATIONS = 5;

  let result;
  try {
    result = await model.generateContent({ contents });
  } catch (err: any) {
    if (err.message && err.message.includes('429')) {
      throw new Error('Gemini API rate limit exceeded. Please wait 30 seconds and try again.');
    }
    throw err;
  }

  let response = result.response;

  while (
    response.functionCalls() &&
    response.functionCalls()!.length > 0 &&
    iterations < MAX_ITERATIONS
  ) {
    iterations++;
    const calls = response.functionCalls()!;
    logger.info(`Gemini function calls (iteration ${iterations})`, {
      count: calls.length,
      names: calls.map((c) => c.name),
    });

    // 1. Add model's functionCall parts to contents history
    const modelParts: Part[] = calls.map((c) => ({
      functionCall: {
        name: c.name,
        args: c.args,
      },
    }));
    contents.push({ role: 'model', parts: modelParts });

    // 2. Execute all function calls in parallel
    const functionResponses: Part[] = await Promise.all(
      calls.map(async (call) => {
        const { name, args } = call;
        toolsUsed.push(name);
        let toolResult: unknown;
        try {
          toolResult = await onToolCall(name, args as Record<string, unknown>);
        } catch (error) {
          logger.warn('Tool call failed', { name, error: (error as Error).message });
          toolResult = { error: (error as Error).message };
        }
        return {
          functionResponse: {
            name,
            response: { result: toolResult },
          },
        };
      })
    );

    // 3. Add function responses with role: 'user' (Required by Gemini API v1beta)
    contents.push({ role: 'user', parts: functionResponses });

    // 4. Send updated contents back to model
    try {
      result = await model.generateContent({ contents });
      response = result.response;
    } catch (err: any) {
      if (err.message && err.message.includes('429')) {
        throw new Error('Gemini API rate limit exceeded. Please wait 30 seconds and try again.');
      }
      throw err;
    }
  }

  let text = '';
  try {
    text = response.text();
  } catch {
    text = 'Operation completed successfully.';
  }

  return {
    text,
    toolsUsed,
  };
}
