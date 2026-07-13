'use client';

import { cn } from '@lilog/ui';
import {
  AlertTriangle,
  CheckCircle2,
  Truck,
  UserCheck,
} from 'lucide-react';

import type { DemandaFilter } from '@/features/gestao-recursos-recebimento/components/demandas-filter-chips';
import type { DemandaRecebimentoRecursoApi } from '@/features/gestao-recursos-recebimento/types/recebimento-recursos.api';
import { hapticLight } from '@/lib/haptics';

type RecebimentoDemandasResumoProps = {
  demandas: DemandaRecebimentoRecursoApi[];
  activeFilter?: DemandaFilter;
  onFilterChange?: (filter: DemandaFilter) => void;
};

type StatItem = {
  id: Exclude<DemandaFilter, 'all'>;
  label: string;
  value: number;
  icon: typeof Truck;
  tone: 'default' | 'urgent' | 'warning' | 'active' | 'success';
};

const TONE_CLASS: Record<StatItem['tone'], string> = {
  default: 'bg-surface border-outline-variant/50 text-on-surface-variant',
  urgent: 'bg-error-container border-error/20 text-error',
  warning: 'bg-orange-500/10 border-orange-500/30 text-orange-700',
  active: 'bg-primary-container border-primary/20 text-on-primary-container',
  success: 'bg-secondary-container border-secondary/20 text-on-secondary-container',
};

const ACTIVE_RING: Record<StatItem['tone'], string> = {
  default: 'ring-2 ring-secondary ring-offset-2 ring-offset-surface',
  urgent: 'ring-2 ring-error ring-offset-2 ring-offset-surface',
  warning: 'ring-2 ring-orange-500 ring-offset-2 ring-offset-surface',
  active: 'ring-2 ring-primary ring-offset-2 ring-offset-surface',
  success: 'ring-2 ring-secondary ring-offset-2 ring-offset-surface',
};

export function RecebimentoDemandasResumo({
  demandas,
  activeFilter,
  onFilterChange,
}: RecebimentoDemandasResumoProps) {
  const impedidas = demandas.filter((d) => d.statusDemanda === 'impedido').length;
  const disponiveis = demandas.filter((d) => d.statusDemanda === 'disponivel').length;
  const atribuidas = demandas.filter((d) => d.statusDemanda === 'atribuida').length;
  const emConferencia = demandas.filter(
    (d) => d.statusDemanda === 'em_conferencia',
  ).length;

  const stats: StatItem[] = [
    {
      id: 'impedido',
      label: 'Impedidas',
      value: impedidas,
      icon: AlertTriangle,
      tone: impedidas > 0 ? 'warning' : 'default',
    },
    {
      id: 'disponivel',
      label: 'Sem conferente',
      value: disponiveis,
      icon: Truck,
      tone: disponiveis > 0 ? 'urgent' : 'default',
    },
    {
      id: 'atribuida',
      label: 'Atribuídas',
      value: atribuidas,
      icon: UserCheck,
      tone: atribuidas > 0 ? 'active' : 'default',
    },
    {
      id: 'em_conferencia',
      label: 'Conferindo',
      value: emConferencia,
      icon: CheckCircle2,
      tone: emConferencia > 0 ? 'success' : 'default',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {stats.map(({ id, label, value, icon: Icon, tone }) => {
        const isActive = activeFilter === id;
        const isClickable = Boolean(onFilterChange);

        const content = (
          <>
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                tone === 'default' ? 'bg-surface-container' : 'bg-on-surface/5',
              )}
            >
              <Icon className="size-3.5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-label-md font-bold tabular-nums leading-none">
                {value}
              </p>
              <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-wide opacity-80">
                {label}
              </p>
            </div>
          </>
        );

        if (!isClickable) {
          return (
            <div
              key={id}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-2.5 py-2',
                TONE_CLASS[tone],
              )}
            >
              {content}
            </div>
          );
        }

        return (
          <button
            key={id}
            type="button"
            onClick={() => {
              hapticLight();
              onFilterChange?.(id);
            }}
            className={cn(
              'flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-transform touch-manipulation active:scale-[0.98]',
              TONE_CLASS[tone],
              isActive && ACTIVE_RING[tone],
            )}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
