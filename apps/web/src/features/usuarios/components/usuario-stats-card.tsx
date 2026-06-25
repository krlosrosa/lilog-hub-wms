import type { LucideIcon } from 'lucide-react';

import { cn } from '@lilog/ui';

import { glassPanelClassName } from '@/features/usuarios/components/usuario-form-field-classes';

type UsuarioStatsCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  trend?: string;
  iconClassName?: string;
  valueClassName?: string;
  borderClassName?: string;
};

export function UsuarioStatsCard({
  icon: Icon,
  label,
  value,
  trend,
  iconClassName,
  valueClassName,
  borderClassName,
}: UsuarioStatsCardProps) {
  return (
    <div
      className={cn(
        glassPanelClassName,
        'p-4 shadow-inner-glow',
        borderClassName,
      )}
    >
      <div className="mb-2 flex items-start justify-between">
        <span
          className={cn(
            'rounded-lg bg-primary/10 p-2 text-primary',
            iconClassName,
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        {trend && (
          <span className="font-mono text-[10px] text-tertiary">{trend}</span>
        )}
      </div>
      <p className="text-caption font-medium text-muted-foreground">{label}</p>
      <h3
        className={cn(
          'text-headline-md font-black text-foreground',
          valueClassName,
        )}
      >
        {value}
      </h3>
    </div>
  );
}
