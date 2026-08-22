import { Zap } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';

const examples = [
  "Show today's orders",
  "Mumbai orders above ₹5000",
  "Total unpaid invoice amount",
  "Revenue by region chart",
  "Top 5 products by revenue",
  "Update order ORD-101 to shipped",
  "Track ORD-101",
  "Which customers placed the most orders?",
  "Show overdue invoices",
];

export default function WelcomeScreen() {
  const { selectedProject } = useProjectStore();

  const handlePrompt = (text: string) => {
    window.dispatchEvent(new CustomEvent('send-prompt', { detail: text }));
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-2xl w-full text-center animate-fade-in">
        {/* Hero */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="absolute inset-0 bg-brand-600/20 rounded-full blur-2xl scale-150" />
          <div className="relative w-16 h-16 bg-gray-900 rounded-2xl border border-brand-500/30 flex items-center justify-center shadow-xl shadow-brand-900/30">
            <Zap className="w-8 h-8 text-brand-400" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
          How can I help you?
        </h2>

        {selectedProject ? (
          <p className="text-gray-400 mb-1">
            Working with{' '}
            <span className="text-brand-400 font-semibold">{selectedProject.name}</span>
          </p>
        ) : (
          <p className="text-gray-500 mb-1">Select a project to get started</p>
        )}

        <p className="text-gray-600 text-sm mb-8">
          Ask anything in plain English — query data, generate charts, update records, track shipments
        </p>

        {/* Example prompt chips */}
        <div className="flex flex-wrap gap-2 justify-center mb-8 max-w-xl mx-auto">
          {examples.map((example) => (
            <button
              key={example}
              onClick={() => handlePrompt(example)}
              className="px-3.5 py-2 bg-gray-900/80 border border-gray-800 hover:border-brand-500/50 hover:bg-gray-800/80 rounded-xl text-xs text-gray-300 hover:text-white transition-all duration-200 text-left shadow-sm"
            >
              {example}
            </button>
          ))}
        </div>

        <p className="text-gray-700 text-xs">
          Click any prompt above to run it instantly · Enter to send
        </p>
      </div>
    </div>
  );
}
