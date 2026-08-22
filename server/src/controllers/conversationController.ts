import { Request, Response } from 'express';
import { Conversation } from '../models/Conversation';
import mongoose from 'mongoose';
import { assertProjectAccess } from '../utils/projectAuth';

export const getConversations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const projectId = req.query.projectId as string | undefined;
    const filter: Record<string, unknown> = { user: userId, isActive: true };

    if (projectId) {
      await assertProjectAccess(userId, projectId);
      filter.project = new mongoose.Types.ObjectId(projectId);
    }

    const conversations = await Conversation.find(filter)
      .select('title project createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    res.json({ conversations });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    throw error;
  }
};

export const getConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    let convId: mongoose.Types.ObjectId;
    try {
      convId = new mongoose.Types.ObjectId(req.params.id);
    } catch {
      res.status(400).json({ error: 'Invalid conversation ID' });
      return;
    }

    const conv = await Conversation.findOne({ _id: convId, user: userId, isActive: true }).lean();
    if (!conv) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.json({ conversation: conv });
  } catch (error) {
    throw error;
  }
};

export const updateConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { title } = req.body;
    let convId: mongoose.Types.ObjectId;
    try {
      convId = new mongoose.Types.ObjectId(req.params.id);
    } catch {
      res.status(400).json({ error: 'Invalid conversation ID' });
      return;
    }

    const conv = await Conversation.findOneAndUpdate(
      { _id: convId, user: userId, isActive: true },
      { title },
      { new: true }
    ).lean();

    if (!conv) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.json({ conversation: conv });
  } catch (error) {
    throw error;
  }
};

export const deleteConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    let convId: mongoose.Types.ObjectId;
    try {
      convId = new mongoose.Types.ObjectId(req.params.id);
    } catch {
      res.status(400).json({ error: 'Invalid conversation ID' });
      return;
    }

    await Conversation.findOneAndUpdate(
      { _id: convId, user: userId },
      { isActive: false }
    );
    res.json({ message: 'Conversation deleted' });
  } catch (error) {
    throw error;
  }
};
