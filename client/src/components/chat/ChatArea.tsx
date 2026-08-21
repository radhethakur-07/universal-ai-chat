import { useEffect, useRef } from 'react';
import { useChatStore } from '../../store/chatStore';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

export default function ChatArea() {
  const { messages, isLoading, loadingStatus } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-1">
        {messages.map((msg) => (
          <MessageBubble key={msg.id || `${msg.role}-${msg.timestamp}`} message={msg} />
        ))}
        {isLoading && <TypingIndicator status={loadingStatus} />}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}
