import { runGeminiChat, GeminiMessage } from '../ai/geminiClient';
import { buildSystemPrompt } from '../ai/systemPrompt';
import { toolHandlers } from '../tools/registry';
import { Project } from '../models/Project';
import { Conversation } from '../models/Conversation';
import { AuditLog } from '../models/AuditLog';
import { ChatResponse } from '../types';
import logger from '../utils/logger';
import { chatMessageSchema } from '../validators/schemas';

const ALLOWED_TOOLS = new Set(Object.keys(toolHandlers));

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
    const columns = Object.keys(data[0])
      .filter(k => k !== '__v' && k !== '_id')
      .slice(0, 12)
      .map(k => ({ key: k, label: k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1') }));
    return {
      type: 'table',
      title: `${r.entity as string} Results`,
      columns,
      rows: data,
      summary: `Found ${r.count} records`,
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
    // If result has array data, show as table
    const arrayKey = Object.keys(result).find(k => Array.isArray(result[k]));
    if (arrayKey && Array.isArray(result[arrayKey]) && (result[arrayKey] as unknown[]).length > 0) {
      const arr = result[arrayKey] as Record<string, unknown>[];
      const columns = Object.keys(arr[0])
        .filter(k => k !== '_id')
        .map(k => ({ key: k, label: k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1') }));
      return {
        type: 'table',
        title: `${r.functionName} Results`,
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

  // Load project with context
  const project = await Project.findById(validated.projectId);
  if (!project) throw new Error('Project not found');

  const systemPrompt = buildSystemPrompt(project);

  // Load or create conversation
  let conversation = validated.conversationId
    ? await Conversation.findOne({ _id: validated.conversationId, user: userId })
    : null;

  if (!conversation) {
    conversation = new Conversation({
      user: userId,
      project: project._id,
      title: validated.message.slice(0, 60),
      messages: [],
    });
  }

  // Build history for Gemini (last 10 message pairs)
  const history: GeminiMessage[] = [];
  const recentMessages = conversation.messages.slice(-20);
  for (const msg of recentMessages) {
    history.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    });
  }

  // Track UI response data from tool calls
  let uiResponseData: ChatResponse | null = null;
  const toolsUsed: string[] = [];

  const { text: aiText } = await runGeminiChat(
    systemPrompt,
    history,
    validated.message,
    async (toolName, args) => {
      if (!ALLOWED_TOOLS.has(toolName)) {
        throw new Error(`Tool '${toolName}' is not registered`);
      }
      const handler = toolHandlers[toolName];
      toolsUsed.push(toolName);
      const result = await handler(args, userId, validated.projectId);

      // Capture UI response data from the first significant result
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

  // Save messages
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


  // Auto-title first message
  if (conversation.messages.length <= 2) {
    conversation.title = validated.message.slice(0, 60);
  }

  await conversation.save();

  logger.info('Chat processed', { userId, conversationId: conversation._id, toolsUsed, processingTime, requestId });

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

