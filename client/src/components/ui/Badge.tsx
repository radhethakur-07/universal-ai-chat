import { cn } from '../../utils/cn';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-gray-800 text-gray-300 border-gray-700',
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  danger: 'bg-red-500/15 text-red-400 border-red-500/25',
  info: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  purple: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
};

// Auto-detect status variant from string values
export function statusVariant(status: string): BadgeVariant {
  const s = status?.toLowerCase();
  if (['delivered', 'paid', 'active', 'completed', 'success'].includes(s)) return 'success';
  if (['pending', 'processing', 'partial'].includes(s)) return 'warning';
  if (['cancelled', 'failed', 'overdue', 'rejected'].includes(s)) return 'danger';
  if (['shipped', 'confirmed', 'in transit'].includes(s)) return 'info';
  if (['unpaid', 'draft'].includes(s)) return 'purple';
  return 'default';
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
