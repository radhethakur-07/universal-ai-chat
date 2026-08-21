import { useState } from 'react';
import { AlertTriangle, Check, X, Loader2, Shield } from 'lucide-react';
import { ConfirmationResponse } from '../../../types';
import { chatService } from '../../../services/chatService';
import { useProjectStore } from '../../../store/projectStore';
import toast from 'react-hot-toast';

interface Props {
  data: ConfirmationResponse;
}

type Status = 'pending' | 'loading' | 'done' | 'cancelled';

export default function ConfirmationCard({ data }: Props) {
  const [status, setStatus] = useState<Status>('pending');
  const { selectedProject } = useProjectStore();

  const handleAction = async (confirmed: boolean) => {
    if (status !== 'pending') return;
    setStatus('loading');
    try {
      await chatService.confirmAction(
        data.actionId,
        confirmed,
        selectedProject?._id || ''
      );
      if (confirmed) {
        setStatus('done');
        toast.success('Action completed successfully!');
      } else {
        setStatus('cancelled');
        toast('Action cancelled.');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setStatus('pending');
      toast.error(axiosErr?.response?.data?.error || 'Failed to execute action');
    }
  };

  return (
    <div className="card border-amber-500/25 bg-amber-500/5 animate-fade-in">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-white">Confirmation Required</h3>
              <Shield className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">{data.description}</p>
          </div>
        </div>

        {/* Change preview */}
        {data.previewData && Object.keys(data.previewData).length > 0 && (
          <div className="mb-4 p-3 bg-gray-900 border border-gray-700/50 rounded-xl">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Changes to Apply
            </p>
            <div className="space-y-1.5">
              {Object.entries(data.previewData).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 capitalize min-w-0">{key}:</span>
                  <span className="font-mono text-xs bg-gray-800 text-gray-200 px-2 py-0.5 rounded border border-gray-700">
                    {String(val)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Entity info */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-4 px-1">
          <span>Entity: <span className="text-gray-400 font-medium">{data.entity}</span></span>
          {data.recordId && (
            <>
              <span className="text-gray-700">·</span>
              <span>Record: <span className="text-gray-400 font-medium font-mono">{data.recordId}</span></span>
            </>
          )}
        </div>

        {/* Action buttons */}
        {status === 'pending' && (
          <div className="flex gap-3">
            <button
              onClick={() => handleAction(true)}
              className="btn-primary flex-1 justify-center"
            >
              <Check className="w-4 h-4" />
              Confirm Action
            </button>
            <button
              onClick={() => handleAction(false)}
              className="btn-secondary flex-1 justify-center"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        )}

        {status === 'loading' && (
          <div className="flex items-center justify-center gap-2 py-3 bg-gray-800/50 rounded-xl">
            <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
            <span className="text-sm text-gray-400">Executing action...</span>
          </div>
        )}

        {status === 'done' && (
          <div className="flex items-center gap-2 py-3 px-4 bg-emerald-500/10 border border-emerald-500/25 rounded-xl">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-sm text-emerald-400 font-medium">Action completed successfully</span>
          </div>
        )}

        {status === 'cancelled' && (
          <div className="flex items-center gap-2 py-3 px-4 bg-gray-800/50 border border-gray-700/50 rounded-xl">
            <X className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="text-sm text-gray-500">Action was cancelled</span>
          </div>
        )}
      </div>
    </div>
  );
}
