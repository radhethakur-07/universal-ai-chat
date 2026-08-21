import { Zap, Search, Database, BarChart2, RefreshCw, HelpCircle } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';

const examplePrompts = [
  {
    icon: Search,
    text: "Show me today's orders",
    category: 'Query',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    icon: Database,
    text: 'Show Mumbai orders above ₹5000',
    category: 'Filter',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
  {
    icon: HelpCircle,
    text: 'What is the total unpaid invoice amount?',
    category: 'Answer',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    icon: BarChart2,
    text: 'Generate a bar chart of revenue by region',
    category: 'Analytics',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  {
    icon: RefreshCw,
    text: 'Update order ORD-101 to shipped',
    category: 'Update',
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
  },
  {
    icon: Zap,
    text: 'Show me the top 5 products by revenue',
    category: 'Function',
    color: 'text-brand-400',
    bg: 'bg-brand-500/10 border-brand-500/20',
  },
];

export default function WelcomeScreen() {
  const { selectedProject } = useProjectStore();

  const handlePrompt = (text: string) => {
    window.dispatchEvent(new CustomEvent('fill-input', { detail: text }));
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-2xl w-full text-center animate-fade-in">
        {/* Hero icon */}
        <div className="relative inline-flex items-center justify-center mb-8">
          <div className="absolute inset-0 bg-brand-600/20 rounded-full blur-2xl scale-150" />
          <div className="relative w-20 h-20 bg-gray-900 rounded-3xl border border-brand-500/30 flex items-center justify-center shadow-xl shadow-brand-900/30">
            <Zap className="w-10 h-10 text-brand-400" />
          </div>
        </div>

        <h2 className="text-4xl font-bold text-white mb-3 tracking-tight">
          How can I help you?
        </h2>

        {selectedProject ? (
          <p className="text-gray-400 text-lg mb-2">
            Working with{' '}
            <span className="text-brand-400 font-semibold">{selectedProject.name}</span>
          </p>
        ) : (
          <p className="text-gray-500 text-lg mb-2">Select a project to get started</p>
        )}

        <p className="text-gray-600 text-sm mb-10">
          Query data · Update records · Generate charts · Run functions · Get answers
        </p>

        {/* Example prompts grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          {examplePrompts.map(({ icon: Icon, text, category, color, bg }) => (
            <button
              key={text}
              onClick={() => handlePrompt(text)}
              className="group flex items-start gap-3 p-4 card hover:border-gray-700 hover:bg-gray-800/60 transition-all duration-200 text-left rounded-xl"
            >
              <div className={`w-8 h-8 rounded-lg border ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-semibold uppercase tracking-wider mb-0.5 ${color}`}>
                  {category}
                </p>
                <p className="text-sm text-gray-300 group-hover:text-white transition-colors leading-relaxed">
                  {text}
                </p>
              </div>
            </button>
          ))}
        </div>

        <p className="text-gray-700 text-xs mt-8">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
