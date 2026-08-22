import { useEffect, useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { useChatStore } from '../store/chatStore';
import { projectService } from '../services/projectService';
import { conversationService } from '../services/conversationService';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
import ChatArea from '../components/chat/ChatArea';
import ChatInput from '../components/chat/ChatInput';
import WelcomeScreen from '../components/chat/WelcomeScreen';
import toast from 'react-hot-toast';
import { Loader2, AlertTriangle } from 'lucide-react';

export default function ChatPage() {
  const { selectedProject, setProjects, setSelectedProject } = useProjectStore();
  const { setConversations, activeConversationId, setMessages, setActiveConversation, messages } =
    useChatStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState(false);

  useEffect(() => {
    setProjectsLoading(true);
    setProjectsError(false);
    projectService
      .getProjects()
      .then(({ projects }) => {
        setProjects(projects);
        if (projects.length > 0) {
          const currentSelected = useProjectStore.getState().selectedProject;
          const stillExists = currentSelected && projects.find((p) => p._id === currentSelected._id);
          if (!stillExists && projects[0]) {
            setSelectedProject(projects[0]);
          }
        }
      })
      .catch(() => {
        setProjectsError(true);
        toast.error('Failed to load projects');
      })
      .finally(() => setProjectsLoading(false));
  }, [setProjects, setSelectedProject]);

  useEffect(() => {
    if (!selectedProject) return;
    conversationService
      .getConversations(selectedProject._id)
      .then(({ conversations }) => setConversations(conversations))
      .catch(() => {});
  }, [selectedProject, setConversations]);

  const handleSelectConversation = async (id: string) => {
    setActiveConversation(id);
    try {
      const { conversation } = await conversationService.getConversation(id);
      const uiMessages = conversation.messages.map((m, i) => ({
        ...m,
        id: `${id}-${i}`,
        timestamp: m.timestamp || new Date().toISOString(),
      }));
      setMessages(uiMessages);
    } catch {
      toast.error('Failed to load conversation');
    }
  };

  // Show message history only when messages exist
  const showMessages = messages.length > 0 || activeConversationId !== null;

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelectConversation={handleSelectConversation}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {/* Main content — welcome or chat history */}
          {showMessages ? <ChatArea /> : <WelcomeScreen />}

          {/* Input area — always show appropriate state */}
          {projectsLoading ? (
            <div className="flex-shrink-0 border-t border-gray-800 p-4 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
              <span className="text-gray-500 text-sm">Loading project...</span>
            </div>
          ) : projectsError ? (
            <div className="flex-shrink-0 border-t border-gray-800 p-4">
              <div className="flex items-center gap-2 text-red-400 text-sm justify-center">
                <AlertTriangle className="w-4 h-4" />
                <span>Failed to load project. Check MongoDB connection and seed data.</span>
              </div>
            </div>
          ) : selectedProject ? (
            <ChatInput />
          ) : (
            <div className="flex-shrink-0 border-t border-gray-800 p-4">
              <p className="text-center text-gray-600 text-sm">
                No project available. Please seed the database first.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
