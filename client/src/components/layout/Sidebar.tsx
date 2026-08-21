import {
  PlusCircle,
  MessageSquare,
  Trash2,
  FolderOpen,
  Zap,
  X,
  ChevronRight,
  Database,
  BarChart2,
  RefreshCw,
  Search,
  HelpCircle,
} from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import { useProjectStore } from '../../store/projectStore';
import { conversationService } from '../../services/conversationService';
import toast from 'react-hot-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelectConversation: (id: string) => void;
}

const capabilities = [
  { icon: Search, label: 'Query Data', desc: 'Filter, sort and retrieve records' },
  { icon: RefreshCw, label: 'Update Records', desc: 'Mutation with confirmation' },
  { icon: BarChart2, label: 'Analytics', desc: 'Charts and visualizations' },
  { icon: Zap, label: 'Run Functions', desc: 'Registered business functions' },
  { icon: HelpCircle, label: 'Answer Questions', desc: 'Natural language answers' },
];

export default function Sidebar({ open, onClose, onSelectConversation }: Props) {
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    setMessages,
    removeConversation,
    addConversation,
  } = useChatStore();
  const { selectedProject } = useProjectStore();

  const handleNewChat = () => {
    setActiveConversation(null);
    setMessages([]);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await conversationService.deleteConversation(id);
      removeConversation(id);
      if (activeConversationId === id) {
        setActiveConversation(null);
        setMessages([]);
      }
      toast.success('Conversation deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`flex-shrink-0 flex flex-col bg-gray-900/95 border-r border-gray-800 transition-all duration-300 overflow-hidden ${
          open
            ? 'w-64 fixed lg:relative z-30 h-full translate-x-0'
            : 'w-0 -translate-x-full lg:w-0'
        }`}
        style={{ minHeight: '100vh' }}
      >
        <div className="flex flex-col h-full w-64">
          {/* Header */}
          <div className="p-4 flex items-center justify-between flex-shrink-0 border-b border-gray-800/50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-brand-600/20 rounded-lg border border-brand-500/30 flex items-center justify-center">
                <Zap className="w-4 h-4 text-brand-400" />
              </div>
              <span className="font-bold text-white text-sm">Universal AI</span>
            </div>
            <button onClick={onClose} className="btn-ghost p-1.5 lg:hidden">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-3 flex-shrink-0">
            <button
              onClick={handleNewChat}
              className="btn-primary w-full justify-center text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Recent Conversations */}
            <div className="px-3 pb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">
                Recent
              </p>
              {conversations.length === 0 ? (
                <div className="px-2 py-4 text-center">
                  <MessageSquare className="w-6 h-6 text-gray-700 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">No conversations yet</p>
                  <p className="text-xs text-gray-700 mt-1">Start chatting below</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv._id}
                    onClick={() => onSelectConversation(conv._id)}
                    className={`group w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-all mb-0.5 ${
                      activeConversationId === conv._id
                        ? 'bg-brand-600/15 text-brand-300 border border-brand-500/20'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                    <span className="text-xs truncate flex-1">{conv.title}</span>
                    <button
                      onClick={(e) => handleDelete(e, conv._id)}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all p-0.5 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </button>
                ))
              )}
            </div>

            {/* Current Project */}
            {selectedProject && (
              <div className="mx-3 mb-3 p-3 bg-gray-800/50 border border-gray-700/50 rounded-xl">
                <div className="flex items-center gap-2 mb-1.5">
                  <FolderOpen className="w-3.5 h-3.5 text-brand-400" />
                  <p className="text-xs font-semibold text-white">{selectedProject.name}</p>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                  {selectedProject.description}
                </p>
              </div>
            )}

            {/* Capabilities */}
            <div className="px-3 pb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">
                Capabilities
              </p>
              {capabilities.map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="flex items-start gap-2 px-2 py-2 rounded-lg hover:bg-gray-800/50 transition-colors group cursor-default mb-0.5"
                >
                  <Icon className="w-3.5 h-3.5 text-brand-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-400 group-hover:text-gray-300">
                      {label}
                    </p>
                    <p className="text-xs text-gray-600">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-800 flex-shrink-0">
            <div className="flex items-center gap-2 px-2">
              <Database className="w-3.5 h-3.5 text-gray-600" />
              <span className="text-xs text-gray-600">v1.0 · Dev Dynasty · SIH 2026</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
