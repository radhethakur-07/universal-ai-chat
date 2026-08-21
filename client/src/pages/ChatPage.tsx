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

export default function ChatPage() {
  const { selectedProject, setProjects, setSelectedProject } = useProjectStore();
  const { setConversations, activeConversationId, setMessages, setActiveConversation, messages } =
    useChatStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    projectService
      .getProjects()
      .then(({ projects }) => {
        setProjects(projects);
        if (projects.length > 0) {
          setSelectedProject(projects[0]!);
        }
      })
      .catch(() => toast.error('Failed to load projects'));
  }, [setProjects, setSelectedProject]);

  useEffect(() => {
    if (!selectedProject) return;
    conversationService
      .getConversations(selectedProject._id)
      .then(({ conversations }) => {
        setConversations(conversations);
      })
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

  const showChat = activeConversationId !== null || messages.length > 0;

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelectConversation={handleSelectConversation}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex-1 overflow-hidden flex flex-col">
          {showChat ? <ChatArea /> : <WelcomeScreen />}
          {selectedProject && <ChatInput />}
          {!selectedProject && (
            <div className="flex-shrink-0 border-t border-gray-800 p-4">
              <p className="text-center text-gray-600 text-sm">
                No project available. Please check your MongoDB connection and seed data.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
