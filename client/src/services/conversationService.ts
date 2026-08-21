import api from '../lib/api';
import { Conversation, Message } from '../types';

export const conversationService = {
  async getConversations(projectId?: string): Promise<{ conversations: Conversation[] }> {
    const params = projectId ? { projectId } : {};
    const res = await api.get('/api/conversations', { params });
    return res.data;
  },

  async getConversation(
    id: string
  ): Promise<{ conversation: { _id: string; title: string; messages: Message[] } }> {
    const res = await api.get(`/api/conversations/${id}`);
    return res.data;
  },

  async updateTitle(id: string, title: string): Promise<void> {
    await api.patch(`/api/conversations/${id}`, { title });
  },

  async deleteConversation(id: string): Promise<void> {
    await api.delete(`/api/conversations/${id}`);
  },
};
