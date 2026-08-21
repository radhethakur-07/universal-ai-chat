import api from '../lib/api';
import { ChatApiResponse, SendMessagePayload } from '../types';

export const chatService = {
  async sendMessage(payload: SendMessagePayload): Promise<ChatApiResponse> {
    const res = await api.post('/api/chat', payload);
    return res.data;
  },

  async confirmAction(
    actionId: string,
    confirmed: boolean,
    projectId: string
  ): Promise<{ message: string; record?: unknown }> {
    const res = await api.post('/api/chat/confirm', { actionId, confirmed, projectId });
    return res.data;
  },
};
