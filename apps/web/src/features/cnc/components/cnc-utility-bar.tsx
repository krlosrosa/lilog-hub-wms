'use client';

import { cn } from '@lilog/ui';
import { Search } from 'lucide-react';

import type { CncKpi, FiltroSituacaoCnc } from '@/features/cnc/types/cnc.schema';
import { CNC_SITUACAO_LABELS } from '@/features/cnc/types/cnc.schema';

const SITUACAO_TABS: {
  value: FiltroSituacaoCnc;
  label: string;
  dotClass?: string;
  pulse?: boolean;
}[] = [
  { value: 'todos', label: 'Todas' },
  {
    value: 'pendente',
    label: CNC_SITUACAO_LABELS.pendente,
    dotClass: 'bg-amber-400',
    pulse: true,
  },
  {
    value: 'em_analise',
    label: CNC_SITUACAO_LABELS.em_analise,
    dotClass: 'bg-secondary',
    pulse: true,
  },
  {
    value: 'encerrada',
    label: CNC_SITUACAO_LABELS.encerrada,
    dotClass: 'bg-primary',
  },
  {
    value: 'cancelada',
    label: CNC_SITUACAO_LABELS.cancelada,
    dotClass: 'bg-muted-foreground',
  },
];

type CncUtilityBarProps = {
  filtroSituacao: FiltroSituacaoCnc;
  onSituacaoChange: (value: FiltroSituacaoCnc) => void;
  busca: string;
  onBuscaChange: (value: string) => void;
  kpi: CncKpi;
  totalFiltrados?: number;
};

function countForTab(value: FiltroSituacaoCnc, kpi: CncKpi): number {
  switch (value) {
    case 'todos':
      return kpi.total;
    case 'pendente':
      return kpi.pendentes;
    case 'em_analise':
      return kpi.emAnalise;
    case 'encerrada':
      return kpi.encerradas;
    case 'cancelada':
      return kpi.canceladas;
    default:
      return 0;
  }
}

export function CncUtilityBar({
  filtroSituacao,
  onSituacaoChange,
  busca,
  onBuscaChange,
  kpi,
  totalFiltrados,
}: CncUtilityBarProps) {
  return (
    <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div
          className="inline-flex max-w-full flex-wrap gap-0.5 rounded-lg border border-outline-variant/60 bg-surface-lowest p-0.5"
          role="tablist"
          aria-label="Filtrar por situação"
        >
          {SITUACAO_TABS.map((tab) => {
            const count = countForTab(tab.value, kpi);
            const selected = filtroSituacao === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={selected}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-all',
                  selected
                    ? 'bg-primary-container font-semibold text-on-primary-container shadow-sm'
                    : 'text-muted-foreground hover:bg-surface-highest hover:text-foreground',
                )}
                onClick={() => onSituacaoChange(tab.value)}
              >
                {tab.dotClass ? (
                  <span
                    className={cn(
                      'size-1.5 shrink-0 rounded-full',
                      tab.dotClass,
                      tab.pulse && 'animate-pulse',
                    )}
                    aria-hidden
                  />
                ) : null}
                <span className="truncate">{tab.label}</span>
                {count > 0 ? (
                  <span
                    className={cn(
                      'min-w-[1rem] rounded px-1 text-[9px] tabular-nums',
                      selected
                        ? 'bg-on-primary-container/15 text-on-primary-container'
                        : 'bg-surface-highest text-muted-foreground',
                    )}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {totalFiltrados !== undefined ? (
          <span className="hidden text-[11px] text-muted-foreground sm:inline">
            <span className="font-semibold tabular-nums text-foreground">
              {totalFiltrados}
            </span>{' '}
            {totalFiltrados === 1 ? 'resultado' : 'resultados'}
          </span>
        ) : null}
      </div>

      <div className="relative w-full sm:max-w-[240px] lg:w-auto">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          placeholder="Número ou descrição…"
          value={busca}
          onChange={(event) => onBuscaChange(event.target.value)}
          aria-label="Buscar não conformidades"
          className="h-8 w-full rounded-lg border border-outline-variant bg-surface-lowest py-1.5 pl-8 pr-3 text-[11px] text-foreground placeholder:text-muted-foreground/70 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </div>
  );
}
