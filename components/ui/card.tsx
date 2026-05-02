import { cn } from '@/lib/utils';

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5', className)}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  subtext,
  color = 'default',
}: {
  label: string;
  value: string;
  subtext?: string;
  color?: 'default' | 'green' | 'red' | 'orange' | 'yellow';
}) {
  return (
    <Card>
      <div className="text-[10px] text-muted-foreground uppercase tracking-[1px] font-mono">{label}</div>
      <div
        className={cn(
          'text-2xl font-bold mt-1',
          color === 'green' && 'text-green-400',
          color === 'red' && 'text-red-400',
          color === 'orange' && 'text-orange-400',
          color === 'yellow' && 'text-yellow-400',
          color === 'default' && 'text-foreground'
        )}
      >
        {value}
      </div>
      {subtext && <div className="text-xs text-muted-foreground mt-0.5">{subtext}</div>}
    </Card>
  );
}
