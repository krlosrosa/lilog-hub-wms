import type { LucideIcon } from 'lucide-react';

import { cn } from '@lilog/ui';

import { glassPanelClassName } from '@/features/pessoas/components/pessoa-form-field-classes';

type PessoaStatsCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  trend?: string;
  iconClassName?: string;
  valueClassName?: string;
  borderClassName?: string;
};

export function PessoaStatsCard({
  icon: Icon,
  label,
  value,
  trend,
  iconClassName,
  valueClassName,
  borderClassName,
}: PessoaStatsCardProps) {
  return (
    <div
      className={cn(
        glassPanelClassName,
        'p-4',
        borderClassName,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            'flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary',
            iconClassName,
          )}
        >
          <Icon className="size-4" aria-hidden />
        </div>
        {trend ? (
          <span className="text-[10px] font-medium text-muted-foreground">
            {trend}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          'mt-1 text-xl font-semibold text-foreground',
          valueClassName,
        )}
      >
        {value}
      </p>
    </div>
  );
}
