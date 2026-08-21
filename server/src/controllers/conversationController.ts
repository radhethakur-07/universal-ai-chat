import { Request, Response } from 'express';
import { Conversation } from '../models/Conversation';
import mongoose from 'mongoose';

export const getConversations = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const projectId = req.query.projectId as string;
  const filter: Record<string, unknown> = { user: userId, isActive: true };
  if (projectId) filter.project = new mongoose.Types.ObjectId(projectId);
  const conversations = await Conversation.find(filter)
    .select('title project createdAt updatedAt')
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean();
  res.json({ conversations });
};

export const getConversation = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const conv = await Conversation.findOne({ _id: req.params.id, user: userId }).lean();
  if (!conv) { res.status(404).json({ error: 'Conversation not found' }); return; }
  res.json({ conversation: conv });
};

export const updateConversation = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { title } = req.body;
  const conv = await Conversation.findOneAndUpdate(
    { _id: req.params.id, user: userId },
    { title },
    { new: true }
  ).lean();
  if (!conv) { res.status(404).json({ error: 'Conversation not found' }); return; }
  res.json({ conversation: conv });
};

export const deleteConversation = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  await Conversation.findOneAndUpdate(
    { _id: req.params.id, user: userId },
    { isActive: false }
  );
  res.json({ message: 'Conversation deleted' });
};
