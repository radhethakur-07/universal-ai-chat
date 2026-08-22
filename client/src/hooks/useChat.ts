import { useCallback } from 'react';
import { useChatStore } from '../store/chatStore';
import { useProjectStore } from '../store/projectStore';
import { chatService } from '../services/chatService';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

export function useChat() {
  const {
    messages,
    isLoading,
    activeConversationId,
    conversations,
    addMessage,
    setLoading,
    setActiveConversation,
    setMessages,
    addConversation,
  } = useChatStore();
  const { selectedProject } = useProjectStore();

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading || !selectedProject) return;

      addMessage({
        id: uuidv4(),
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      });
      setLoading(true, 'Thinking...');

      try {
        const response = await chatService.sendMessage({
          message: text,
          conversationId: activeConversationId || undefined,
          projectId: selectedProject._id,
        });

        if (!activeConversationId && response.conversationId) {
          setActiveConversation(response.conversationId);
          const exists = conversations.find((c) => c._id === response.conversationId);
          if (!exists) {
            addConversation({
              _id: response.conversationId,
              title: text.slice(0, 60),
              project: selectedProject._id,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        }

        addMessage({
          id: uuidv4(),
          role: 'assistant',
          content: response.message,
          responseType: response.responseType,
          responseData: response.responseData,
          toolsUsed: response.toolsUsed,
          processingTime: response.processingTime,
          timestamp: new Date().toISOString(),
        });
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        addMessage({
          id: uuidv4(),
          role: 'assistant',
          content:
            axiosErr?.response?.data?.message || 'I encountered an error. Please try again.',
          timestamp: new Date().toISOString(),
        });
        toast.error('Request failed');
      } finally {
        setLoading(false, '');
      }
    },
    [
      isLoading,
      selectedProject,
      activeConversationId,
      conversations,
      addMessage,
      setLoading,
      setActiveConversation,
      addConversation,
    ]
  );

  const startNewChat = useCallback(() => {
    setActiveConversation(null);
    setMessages([]);
  }, [setActiveConversation, setMessages]);

  return { messages, isLoading, activeConversationId, sendMessage, startNewChat };
}
