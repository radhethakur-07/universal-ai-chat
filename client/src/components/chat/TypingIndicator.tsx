import { Zap, Database, BarChart2, RefreshCw, Search } from 'lucide-react';

interface Props {
  status?: string;
}

function getStatusIcon(status: string) {
  const s = status.toLowerCase();
  if (s.includes('query') || s.includes('fetch')) return <Database className="w-3.5 h-3.5" />;
  if (s.includes('chart') || s.includes('analytic')) return <BarChart2 className="w-3.5 h-3.5" />;
  if (s.includes('updat') || s.includes('execut')) return <RefreshCw className="w-3.5 h-3.5" />;
  if (s.includes('search') || s.includes('find')) return <Search className="w-3.5 h-3.5" />;
  return <Zap className="w-3.5 h-3.5" />;
}

export default function TypingIndicator({ status = 'Thinking...' }: Props) {
  return (
    <div className="flex gap-3 animate-slide-up py-2">
      <div className="w-8 h-8 rounded-full bg-brand-600/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0 text-brand-400">
        {getStatusIcon(status)}
      </div>
      <div className="flex flex-col gap-1.5 justify-center">
        <div className="bg-gray-800 border border-gray-700/70 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="thinking-dot" />
            <span className="thinking-dot" />
            <span className="thinking-dot" />
          </div>
          <span className="text-xs text-gray-500 animate-pulse">{status}</span>
        </div>
      </div>
    </div>
  );
}
