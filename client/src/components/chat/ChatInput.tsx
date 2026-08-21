import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Send, Loader2, Zap } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { chatService } from '../../services/chatService';
import { useChatStore } from '../../store/chatStore';
import { useProjectStore } from '../../store/projectStore';
import toast from 'react-hot-toast';

const LOADING_STATUSES = [
  'Understanding request...',
  'Calling AI model...',
  'Executing tool...',
  'Fetching data...',
  'Preparing response...',
];

export default function ChatInput() {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const statusTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusIndexRef = useRef(0);

  const {
    isLoading,
    setLoading,
    addMessage,
    activeConversationId,
    setActiveConversation,
    addConversation,
    conversations,
    messages,
  } = useChatStore();

  const { selectedProject } = useProjectStore();

  // Listen for fill-input events from WelcomeScreen
  useEffect(() => {
    const handler = (e: Event) => {
      setInput((e as CustomEvent<string>).detail);
      textareaRef.current?.focus();
    };
    window.addEventListener('fill-input', handler);
    return () => window.removeEventListener('fill-input', handler);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const cycleLoadingStatus = () => {
    statusIndexRef.current = 0;
    useChatStore.getState().setLoading(true, LOADING_STATUSES[0]);

    statusTimerRef.current = setInterval(() => {
      statusIndexRef.current = Math.min(
        statusIndexRef.current + 1,
        LOADING_STATUSES.length - 1
      );
      useChatStore.getState().setLoading(
        true,
        LOADING_STATUSES[statusIndexRef.current]!
      );
    }, 2500);
  };

  const stopCycling = () => {
    if (statusTimerRef.current) {
      clearInterval(statusTimerRef.current);
      statusTimerRef.current = null;
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading || !selectedProject) return;

    setInput('');
    const userMsgId = uuidv4();

    addMessage({
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    });

    cycleLoadingStatus();

    try {
      const response = await chatService.sendMessage({
        message: text,
        conversationId: activeConversationId || undefined,
        projectId: selectedProject._id,
      });

      stopCycling();

      // Update active conversation
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
      stopCycling();
      const axiosErr = err as { response?: { data?: { message?: string } } };
      addMessage({
        id: uuidv4(),
        role: 'assistant',
        content:
          axiosErr?.response?.data?.message ||
          "I encountered an error processing your request. Please try again.",
        timestamp: new Date().toISOString(),
      });
      toast.error('Request failed');
    } finally {
      setLoading(false, '');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const currentStatus = useChatStore((s) => s.loadingStatus);

  return (
    <div className="flex-shrink-0 border-t border-gray-800 bg-gray-950/95 backdrop-blur-sm p-4">
      <div className="max-w-4xl mx-auto">
        {/* Loading status banner */}
        {isLoading && (
          <div className="flex items-center gap-2 mb-2.5 px-1 animate-fade-in">
            <Loader2 className="w-3.5 h-3.5 text-brand-400 animate-spin flex-shrink-0" />
            <span className="text-xs text-brand-400">{currentStatus}</span>
          </div>
        )}

        {/* Input container */}
        <div className="flex items-end gap-3 px-4 py-3 bg-gray-900 border border-gray-700 rounded-2xl focus-within:border-brand-500/50 focus-within:ring-1 focus-within:ring-brand-500/20 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedProject
                ? `Ask about ${selectedProject.name}...`
                : 'Select a project to start chatting...'
            }
            className="flex-1 bg-transparent text-gray-100 placeholder-gray-600 resize-none outline-none text-sm leading-relaxed min-h-[24px] max-h-[180px]"
            disabled={isLoading || !selectedProject}
            rows={1}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading || !selectedProject}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-brand-600 hover:bg-brand-500 disabled:bg-gray-800 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
            title="Send message (Enter)"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </button>
        </div>

        <p className="text-center text-xs text-gray-700 mt-2">
          <Zap className="w-3 h-3 inline mr-1 text-gray-700" />
          Universal AI · Dev Dynasty · SIH 2026 · PS12 · Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
