import { Menu, Zap, ChevronDown, LogOut } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useProjectStore } from '../../store/projectStore';
import { useChatStore } from '../../store/chatStore';
import { Project } from '../../types';

interface Props {
  onToggleSidebar: () => void;
}

export default function TopBar({ onToggleSidebar }: Props) {
  const { user, logout } = useAuthStore();
  const { projects, selectedProject, setSelectedProject } = useProjectStore();
  const { setActiveConversation, setMessages } = useChatStore();
  const [projectOpen, setProjectOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const projectRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (projectRef.current && !projectRef.current.contains(e.target as Node)) {
        setProjectOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const switchProject = (p: Project) => {
    setSelectedProject(p);
    setActiveConversation(null);
    setMessages([]);
    setProjectOpen(false);
  };

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-gray-800 bg-gray-950/90 backdrop-blur-md flex-shrink-0 z-10">
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar} className="btn-ghost p-2" title="Toggle sidebar">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-600/20 rounded-lg border border-brand-500/30 flex items-center justify-center">
            <Zap className="w-4 h-4 text-brand-400" />
          </div>
          <span className="font-semibold text-white text-sm hidden sm:block">Universal AI</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Project selector */}
        {selectedProject && (
          <div className="relative" ref={projectRef}>
            <button
              onClick={() => setProjectOpen(!projectOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/80 border border-gray-700 rounded-lg text-sm text-gray-300 hover:border-brand-500/40 hover:text-white transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
              <span className="max-w-[140px] truncate">{selectedProject.name}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${projectOpen ? 'rotate-180' : ''}`} />
            </button>
            {projectOpen && (
              <div className="absolute top-full right-0 mt-1 w-60 card shadow-xl z-50 py-1.5 animate-fade-in">
                <p className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Switch Project
                </p>
                {projects.map((p) => (
                  <button
                    key={p._id}
                    onClick={() => switchProject(p)}
                    className={`w-full text-left px-3 py-2.5 text-sm hover:bg-gray-800 transition-colors flex items-center gap-2 ${
                      selectedProject._id === p._id ? 'text-brand-400' : 'text-gray-300'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedProject._id === p._id ? 'bg-brand-400' : 'bg-gray-600'}`} />
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Connection indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">Live</span>
        </div>

        {/* User menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setUserOpen(!userOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-brand-600/25 border border-brand-500/35 flex items-center justify-center text-xs font-bold text-brand-300">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="hidden md:block text-sm text-gray-300 max-w-[120px] truncate">
              {user?.name}
            </span>
          </button>
          {userOpen && (
            <div className="absolute top-full right-0 mt-1 w-52 card shadow-xl z-50 py-1.5 animate-fade-in">
              <div className="px-3 py-2.5 border-b border-gray-800">
                <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-xs bg-brand-600/20 text-brand-400 border border-brand-500/20">
                  {user?.role}
                </span>
              </div>
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
