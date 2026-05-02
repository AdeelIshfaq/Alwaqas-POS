import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'red' | 'yellow' | 'blue' | 'orange' | 'purple' | 'default';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold font-mono uppercase tracking-wide',
        variant === 'green' && 'bg-green-500/10 text-green-400',
        variant === 'red' && 'bg-red-500/10 text-red-400',
        variant === 'yellow' && 'bg-yellow-500/10 text-yellow-400',
        variant === 'blue' && 'bg-blue-500/10 text-blue-400',
        variant === 'orange' && 'bg-orange-500/10 text-orange-400',
        variant === 'purple' && 'bg-purple-500/10 text-purple-400',
        variant === 'default' && 'bg-secondary text-muted-foreground',
        className
      )}
    >
      {children}
    </span>
  );
}
