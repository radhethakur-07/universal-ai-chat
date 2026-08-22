import { runGeminiChat, GeminiMessage } from '../ai/geminiClient';
import { buildSystemPrompt } from '../ai/systemPrompt';
import { toolHandlers } from '../tools/registry';
import { Conversation } from '../models/Conversation';
import { AuditLog } from '../models/AuditLog';
import { ChatResponse } from '../types';
import logger from '../utils/logger';
import { chatMessageSchema } from '../validators/schemas';
import {
  assertProjectAccess,
  assertCollectionOperation,
  getAllowedEntities,
} from '../utils/projectAuth';

const ALLOWED_TOOLS = new Set(Object.keys(toolHandlers));

// Maps tool names to the required collection operation type
const TOOL_OPERATION_MAP: Record<string, 'read' | 'update' | 'create' | 'delete'> = {
  query_data: 'read',
  get_record: 'read',
  get_analytics: 'read',
  update_data: 'update',
  run_function: 'read',
  track_shipment: 'read',
};

// Tools that don't operate on a specific collection (skip collection auth check)
const ENTITY_LESS_TOOLS = new Set(['run_function', 'track_shipment']);

function formatToolResultForUI(toolName: string, result: unknown): ChatResponse | null {
  const r = result as Record<string, unknown>;

  if (r.requiresConfirmation) {
    return {
      type: 'confirmation',
      actionId: r.actionId as string,
      action: r.action as string,
      entity: r.entity as string,
      recordId: r.recordId as string,
      description: r.description as string,
      previewData: r.previewData as Record<string, unknown>,
    };
  }

  if (toolName === 'query_data' && r.success && Array.isArray(r.data)) {
    const data = r.data as Record<string, unknown>[];
    if (data.length === 0) return null;
    const columns = Object.keys(data[0]!)
      .filter((k) => k !== '__v' && k !== '_id')
      .slice(0, 12)
      .map((k) => ({
        key: k,
        label: k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1'),
      }));
    return {
      type: 'table',
      title: `${r.entity as string} Results`,
      columns,
      rows: data,
      summary: `Found ${r.count as number} records`,
    };
  }

  if (toolName === 'get_record' && r.success && r.record) {
    const rec = r.record as Record<string, unknown>;
    const columns = Object.keys(rec)
      .filter((k) => k !== '__v' && k !== '_id')
      .map((k) => ({
        key: k,
        label: k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1'),
      }));
    return {
      type: 'table',
      title: 'Record Details',
      columns,
      rows: [rec],
    };
  }

  if (toolName === 'get_analytics' && r.success) {
    const data = r.data as Record<string, unknown>[];
    const groupBy = r.groupBy as string;
    return {
      type: 'chart',
      chartType: r.chartType as 'bar' | 'line' | 'pie',
      title: r.title as string,
      data,
      xKey: groupBy,
      yKey: 'value',
    };
  }

  if (toolName === 'run_function' && r.result) {
    const result = r.result as Record<string, unknown>;
    const arrayKey = Object.keys(result).find((k) => Array.isArray(result[k]));
    if (
      arrayKey &&
      Array.isArray(result[arrayKey]) &&
      (result[arrayKey] as unknown[]).length > 0
    ) {
      const arr = result[arrayKey] as Record<string, unknown>[];
      const columns = Object.keys(arr[0]!)
        .filter((k) => k !== '_id')
        .map((k) => ({
          key: k,
          label: k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1'),
        }));
      return {
        type: 'table',
        title: `${r.functionName as string} Results`,
        columns,
        rows: arr,
      };
    }
  }

  return null;
}

export async function processChat(
  userId: string,
  input: { message: string; conversationId?: string; projectId: string },
  requestId: string,
) {
  const validated = chatMessageSchema.parse(input);
  const startTime = Date.now();

  // ✅ SECURITY: Verify user has access to this project (owner or member)
  const project = await assertProjectAccess(userId, validated.projectId);
  const allowedEntities = getAllowedEntities(project);

  const systemPrompt = buildSystemPrompt(project);

  // Load or create conversation — scoped to user + project
  let conversation = validated.conversationId
    ? await Conversation.findOne({
        _id: validated.conversationId,
        user: userId,
        project: project._id,
      })
    : null;

  if (!conversation) {
    conversation = new Conversation({
      user: userId,
      project: project._id,
      title: validated.message.slice(0, 60),
      messages: [],
    });
  }

  // Build Gemini history (last 20 messages = 10 pairs for multi-turn context)
  const history: GeminiMessage[] = [];
  const recentMessages = conversation.messages.slice(-20);
  for (const msg of recentMessages) {
    history.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    });
  }

  let uiResponseData: ChatResponse | null = null;
  const toolsUsed: string[] = [];

  const { text: aiText } = await runGeminiChat(
    systemPrompt,
    history,
    validated.message,
    async (toolName, args) => {
      // ✅ SECURITY: Only allow registered tools
      if (!ALLOWED_TOOLS.has(toolName)) {
        throw new Error(`Tool '${toolName}' is not registered`);
      }

      // ✅ SECURITY: Check collection-level operation permission
      if (!ENTITY_LESS_TOOLS.has(toolName)) {
        const entity = ((args.entity as string | undefined) || '').toLowerCase();
        if (!allowedEntities.includes(entity)) {
          throw new Error(`Entity '${entity}' is not available in this project`);
        }
        const operation = TOOL_OPERATION_MAP[toolName] ?? 'read';
        assertCollectionOperation(project, entity, operation);
      }

      const handler = toolHandlers[toolName]!;
      toolsUsed.push(toolName);
      const result = await handler(args, userId, validated.projectId);

      // Capture the first meaningful UI response
      if (!uiResponseData) {
        const formatted = formatToolResultForUI(toolName, result);
        if (formatted) uiResponseData = formatted;
      }

      await AuditLog.create({
        user: userId,
        project: project._id,
        action: toolName,
        toolName,
        success: true,
        requestId,
        duration: Date.now() - startTime,
      });

      return result;
    },
  );

  const processingTime = Date.now() - startTime;

  conversation.messages.push({
    role: 'user',
    content: validated.message,
    timestamp: new Date(),
  });
  conversation.messages.push({
    role: 'assistant',
    content: aiText,
    responseType: uiResponseData ? (uiResponseData as { type: string }).type : undefined,
    responseData: uiResponseData ? (uiResponseData as Record<string, unknown>) : undefined,
    toolsUsed,
    processingTime,
    timestamp: new Date(),
  });

  // Auto-title on first exchange
  if (conversation.messages.length <= 2) {
    conversation.title = validated.message.slice(0, 60);
  }

  await conversation.save();

  logger.info('Chat processed', {
    userId,
    conversationId: conversation._id,
    toolsUsed,
    processingTime,
    requestId,
  });

  const responseType = uiResponseData ? (uiResponseData as { type: string }).type : 'text';

  return {
    conversationId: conversation._id,
    message: aiText,
    responseType,
    responseData: uiResponseData,
    toolsUsed,
    processingTime,
  };
}
