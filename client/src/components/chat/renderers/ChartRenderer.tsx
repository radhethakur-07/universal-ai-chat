import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ChartResponse } from '../../../types';

const CHART_COLORS = [
  '#6366f1', '#8b5cf6', '#06b6d4', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#84cc16',
  '#f97316', '#14b8a6',
];

const TOOLTIP_STYLE = {
  backgroundColor: '#111827',
  border: '1px solid #374151',
  borderRadius: '10px',
  color: '#f9fafb',
  fontSize: '13px',
};

function formatAxisValue(value: number): string {
  if (value >= 1_000_000) return `₹${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

function formatTooltipValue(value: number): string {
  if (value >= 1_000) return `₹${value.toLocaleString('en-IN')}`;
  return String(value);
}

interface Props {
  data: ChartResponse;
}

export default function ChartRenderer({ data }: Props) {
  const chartData = data.data.map((d) => ({
    ...d,
    [data.xKey]: String(d[data.xKey] ?? ''),
    [data.yKey]: typeof d[data.yKey] === 'number' ? d[data.yKey] : Number(d[data.yKey]),
  }));

  return (
    <div className="card p-4 animate-fade-in">
      <h3 className="text-sm font-semibold text-white mb-1">{data.title}</h3>
      {data.summary && (
        <p className="text-xs text-gray-500 mb-4">{data.summary}</p>
      )}
      <ResponsiveContainer width="100%" height={320}>
        {data.chartType === 'bar' ? (
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis
              dataKey={data.xKey}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatAxisValue}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v: number) => [formatTooltipValue(v), 'Value']}
              cursor={{ fill: 'rgba(99,102,241,0.05)' }}
            />
            <Bar dataKey={data.yKey} radius={[6, 6, 0, 0]}>
              {chartData.map((_, index) => (
                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        ) : data.chartType === 'line' ? (
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis
              dataKey={data.xKey}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatAxisValue}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v: number) => [formatTooltipValue(v), 'Value']}
            />
            <Line
              type="monotone"
              dataKey={data.yKey}
              stroke="#6366f1"
              strokeWidth={2.5}
              dot={{ fill: '#6366f1', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: '#818cf8' }}
            />
          </LineChart>
        ) : (
          <PieChart>
            <Pie
              data={chartData}
              dataKey={data.yKey}
              nameKey={data.xKey}
              cx="50%"
              cy="50%"
              outerRadius={110}
              paddingAngle={3}
              label={({ name, percent }: { name: string; percent: number }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
              labelLine={{ stroke: '#4b5563', strokeWidth: 1 }}
            >
              {chartData.map((_, index) => (
                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v: number) => [formatTooltipValue(v), 'Value']}
            />
            <Legend
              formatter={(value) => (
                <span style={{ color: '#9ca3af', fontSize: '12px' }}>{value}</span>
              )}
            />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
