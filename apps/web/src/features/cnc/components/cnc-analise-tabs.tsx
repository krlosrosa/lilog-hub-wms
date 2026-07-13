'use client';

import { cn } from '@lilog/ui';
import {
  AlertTriangle,
  ClipboardCheck,
  History,
  Info,
} from 'lucide-react';

import {
  segmentButtonClassName,
  segmentGroupClassName,
} from '@/features/expedicao-impressao-config/components/panel-styles';

export type CncAnaliseAba =
  | 'anomalias'
  | 'checklist'
  | 'resumo'
  | 'historico';

const ABAS: {
  id: CncAnaliseAba;
  label: string;
  icon: typeof AlertTriangle;
  badgeKey?: 'anomalias' | 'checklist';
}[] = [
  { id: 'anomalias', label: 'Anomalias', icon: AlertTriangle, badgeKey: 'anomalias' },
  { id: 'checklist', label: 'Checklist', icon: ClipboardCheck, badgeKey: 'checklist' },
  { id: 'resumo', label: 'Resumo', icon: Info },
  { id: 'historico', label: 'Histórico', icon: History },
];

type CncAnaliseTabsProps = {
  abaAtiva: CncAnaliseAba;
  onChange: (aba: CncAnaliseAba) => void;
  badges?: Partial<Record<'anomalias' | 'checklist', number>>;
  className?: string;
};

export function CncAnaliseTabs({
  abaAtiva,
  onChange,
  badges,
  className,
}: CncAnaliseTabsProps) {
  return (
    <div
      className={cn(
        segmentGroupClassName,
        'w-full overflow-x-auto sm:w-auto',
        className,
      )}
      role="tablist"
      aria-label="Seções da análise"
    >
      {ABAS.map(({ id, label, icon: Icon, badgeKey }) => {
        const badge = badgeKey ? badges?.[badgeKey] : undefined;

        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={abaAtiva === id}
            onClick={() => onChange(id)}
            className={cn(
              segmentButtonClassName(abaAtiva === id),
              'inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5',
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            {label}
            {badge !== undefined && badge > 0 ? (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0 text-[9px] font-bold tabular-nums',
                  abaAtiva === id
                    ? 'bg-on-primary/20 text-on-primary'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
