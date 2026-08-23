import { Request, Response } from 'express';
import { processChat } from '../services/chatService';
import { executeConfirmedAction } from '../tools/registry';
import { confirmActionSchema } from '../validators/schemas';
import { AuditLog } from '../models/AuditLog';
import logger from '../utils/logger';

export const chat = async (req: Request, res: Response): Promise<void> => {
  const requestId = req.requestId!;
  const userId = req.user!.id;
  try {
    const result = await processChat(userId, req.body, requestId);
    res.json(result);
  } catch (error) {
    const err = error as Error;
    logger.error('Chat error', { requestId, userId, error: err.message });
    res.status(500).json({
      message: 'I encountered an error processing your request. Please try again.',
      responseType: 'error',
      error: err.message,
    });
  }
};

export const confirmAction = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  try {
    const { actionId, confirmed } = confirmActionSchema.parse(req.body);
    if (!confirmed) {
      res.json({ message: 'Action cancelled.', responseType: 'text' });
      return;
    }
    const result = await executeConfirmedAction(actionId, userId);
    if (!result.success) {
      res.status(400).json({ error: result.error || 'Action failed' });
      return;
    }
    const targetProject = (result as any).projectId || req.body.projectId;
    if (targetProject) {
      await AuditLog.create({
        user: userId,
        project: targetProject,
        action: 'confirm_update',
        success: true,
        metadata: { actionId, record: result.record },
      }).catch((e) => logger.warn('AuditLog creation warning', e));
    }
    res.json({ message: 'Action completed successfully.', record: result.record, responseType: 'text' });
  } catch (error) {
    logger.error('Confirm action error', { userId, error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message || 'Failed to execute action' });
  }
};
