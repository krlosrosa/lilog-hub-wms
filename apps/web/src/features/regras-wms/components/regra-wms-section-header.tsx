'use client';

import type { LucideIcon } from 'lucide-react';

import { cn } from '@lilog/ui';

import { sectionHeaderIconClassName } from '@/features/regras-wms/components/regra-wms-form-field-classes';

type RegraWmsSectionHeaderProps = {
  icon: LucideIcon;
  step?: number;
  title: string;
  action?: React.ReactNode;
  className?: string;
};

export function RegraWmsSectionHeader({
  icon: Icon,
  step,
  title,
  action,
  className,
}: RegraWmsSectionHeaderProps) {
  return (
    <header
      className={cn(
        'mb-2.5 flex items-center justify-between gap-2 border-b border-outline-variant/30 pb-2',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <div className={sectionHeaderIconClassName}>
          <Icon className="size-3.5" aria-hidden />
        </div>
        {step !== undefined && (
          <span className="text-[9px] font-bold text-primary">{step}.</span>
        )}
        <h2 className="text-caption font-semibold text-foreground">{title}</h2>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
