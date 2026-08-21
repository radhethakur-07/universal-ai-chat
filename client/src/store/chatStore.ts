import { create } from 'zustand';
import { Conversation, Message } from '../types';

export interface UIMessage extends Message {
  id: string;
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: UIMessage[];
  isLoading: boolean;
  loadingStatus: string;
  setConversations: (convs: Conversation[]) => void;
  setActiveConversation: (id: string | null) => void;
  setMessages: (messages: UIMessage[]) => void;
  addMessage: (message: UIMessage) => void;
  setLoading: (loading: boolean, status?: string) => void;
  addConversation: (conv: Conversation) => void;
  removeConversation: (id: string) => void;
  updateConversationTitle: (id: string, title: string) => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isLoading: false,
  loadingStatus: '',
  setConversations: (conversations) => set({ conversations }),
  setActiveConversation: (id) => set({ activeConversationId: id, messages: [] }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setLoading: (isLoading, loadingStatus = '') => set({ isLoading, loadingStatus }),
  addConversation: (conv) =>
    set((state) => ({ conversations: [conv, ...state.conversations] })),
  removeConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c._id !== id),
    })),
  updateConversationTitle: (id, title) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c._id === id ? { ...c, title } : c
      ),
    })),
}));
