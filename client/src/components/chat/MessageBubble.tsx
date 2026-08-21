import { User, Zap, Clock, Wrench, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { UIMessage } from '../../store/chatStore';
import TableRenderer from './renderers/TableRenderer';
import ChartRenderer from './renderers/ChartRenderer';
import ConfirmationCard from './renderers/ConfirmationCard';

interface Props {
  message: UIMessage;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';
  const [showTools, setShowTools] = useState(false);

  return (
    <div className={`flex gap-3 animate-slide-up mb-5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 self-start mt-0.5 ${
          isUser
            ? 'bg-gray-700 border border-gray-600'
            : 'bg-brand-600/20 border border-brand-500/30'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-gray-300" />
        ) : (
          <Zap className="w-4 h-4 text-brand-400" />
        )}
      </div>

      {/* Content */}
      <div className={`flex flex-col gap-2 max-w-[85%] min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Text bubble */}
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? 'bg-brand-600 text-white rounded-tr-sm shadow-sm shadow-brand-900/30'
              : 'bg-gray-800 border border-gray-700/60 text-gray-200 rounded-tl-sm'
          }`}
        >
          {message.content}
        </div>

        {/* Rich response renderers */}
        {!isUser && message.responseData && (
          <div className="w-full max-w-3xl">
            {message.responseData.type === 'table' && (
              <TableRenderer data={message.responseData} />
            )}
            {message.responseData.type === 'chart' && (
              <ChartRenderer data={message.responseData} />
            )}
            {message.responseData.type === 'confirmation' && (
              <ConfirmationCard data={message.responseData} />
            )}
          </div>
        )}

        {/* Metadata row */}
        <div className={`flex items-center gap-3 text-xs text-gray-600 flex-wrap ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(message.timestamp).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>

          {message.toolsUsed && message.toolsUsed.length > 0 && (
            <button
              onClick={() => setShowTools(!showTools)}
              className="flex items-center gap-1 text-brand-600 hover:text-brand-500 transition-colors"
            >
              <Wrench className="w-3 h-3" />
              <span>{message.toolsUsed.length} tool{message.toolsUsed.length > 1 ? 's' : ''}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showTools ? 'rotate-180' : ''}`} />
            </button>
          )}

          {message.processingTime && (
            <span className="text-gray-700">
              {(message.processingTime / 1000).toFixed(1)}s
            </span>
          )}
        </div>

        {/* Tool details */}
        {showTools && message.toolsUsed && (
          <div className="flex gap-2 flex-wrap">
            {message.toolsUsed.map((tool) => (
              <span
                key={tool}
                className="px-2 py-0.5 rounded-md bg-brand-600/10 border border-brand-500/20 text-brand-400 text-xs font-mono"
              >
                {tool}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
