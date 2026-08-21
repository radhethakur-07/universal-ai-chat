import { TableResponse } from '../../../types';

interface Props {
  data: TableResponse;
}

// Format rupee values
function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) {
    try {
      return new Date(value as string).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(value);
    }
  }
  if (typeof value === 'number') {
    const moneyKeys = ['amount', 'totalamount', 'price', 'costprice', 'tax', 'totalrevenue', 'revenue'];
    if (moneyKeys.some((k) => key.toLowerCase().includes(k))) {
      return `₹${value.toLocaleString('en-IN')}`;
    }
    return value.toLocaleString('en-IN');
  }
  const str = String(value);
  if (str.length > 40) return str.slice(0, 40) + '…';
  return str;
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  confirmed: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  processing: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
  shipped: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
  delivered: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/25',
  paid: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  unpaid: 'bg-red-500/15 text-red-400 border-red-500/25',
  overdue: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
  partial: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  sent: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  draft: 'bg-gray-500/15 text-gray-400 border-gray-500/25',
  refunded: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
  retail: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
  wholesale: 'bg-teal-500/15 text-teal-400 border-teal-500/25',
  enterprise: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
};

const BADGE_KEYS = new Set(['status', 'paymentstatus', 'segment', 'paymentmethod']);

function CellValue({ colKey, value }: { colKey: string; value: unknown }) {
  const strVal = String(value ?? '').toLowerCase();
  if (BADGE_KEYS.has(colKey.toLowerCase()) && STATUS_BADGE[strVal]) {
    return (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border font-medium ${STATUS_BADGE[strVal]}`}>
        {String(value)}
      </span>
    );
  }
  return <span className="font-mono text-xs">{formatValue(colKey, value)}</span>;
}

export default function TableRenderer({ data }: Props) {
  const EXCLUDED = new Set(['__v', 'password', 'items', 'isActive', '__id']);
  const visibleColumns = data.columns
    .filter((c) => !EXCLUDED.has(c.key))
    .slice(0, 10);

  return (
    <div className="card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/50">
        <div>
          <h3 className="text-sm font-semibold text-white">{data.title}</h3>
          {data.summary && (
            <p className="text-xs text-gray-500 mt-0.5">{data.summary}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-gray-800 rounded-lg text-xs text-gray-400">
            {data.rows.length} row{data.rows.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
              >
                {visibleColumns.map((col) => (
                  <td key={col.key} className="px-4 py-2.5 text-gray-300 whitespace-nowrap">
                    <CellValue colKey={col.key} value={row[col.key]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.rows.length === 0 && (
        <div className="px-4 py-10 text-center">
          <p className="text-gray-600 text-sm">No records found matching your criteria</p>
        </div>
      )}
    </div>
  );
}
