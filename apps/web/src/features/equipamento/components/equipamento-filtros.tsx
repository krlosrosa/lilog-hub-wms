'use client';

import { cn } from '@lilog/ui';
import { Search } from 'lucide-react';

import {
  FILTRO_EQUIPAMENTO_STATUS_LABELS,
  FILTROS_EQUIPAMENTO_STATUS,
  TIPO_EQUIPAMENTO_LABELS,
  type FiltroEquipamentoStatus,
  type TipoEquipamento,
} from '@/features/equipamento/types/equipamento.schema';

const TIPOS_FILTRO: Array<{ value: TipoEquipamento | 'todos'; label: string }> =
  [
    { value: 'todos', label: 'Todos os tipos' },
    { value: 'empilhadeira', label: TIPO_EQUIPAMENTO_LABELS.empilhadeira },
    {
      value: 'transpaleteira',
      label: TIPO_EQUIPAMENTO_LABELS.transpaleteira,
    },
    { value: 'reach_truck', label: TIPO_EQUIPAMENTO_LABELS.reach_truck },
    { value: 'order_picker', label: TIPO_EQUIPAMENTO_LABELS.order_picker },
  ];

type EquipamentoFiltrosProps = {
  embedded?: boolean;
  busca: string;
  onBuscaChange: (value: string) => void;
  filtroStatus: FiltroEquipamentoStatus;
  onFiltroStatusChange: (value: FiltroEquipamentoStatus) => void;
  filtroTipo: TipoEquipamento | 'todos';
  onFiltroTipoChange: (value: TipoEquipamento | 'todos') => void;
  totalFiltrados: number;
};

export function EquipamentoFiltros({
  embedded = false,
  busca,
  onBuscaChange,
  filtroStatus,
  onFiltroStatusChange,
  filtroTipo,
  onFiltroTipoChange,
  totalFiltrados,
}: EquipamentoFiltrosProps) {
  const formatNumber = new Intl.NumberFormat('pt-BR');

  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        embedded
          ? 'rounded-none border-0 bg-transparent p-0 shadow-none'
          : 'rounded-xl border border-outline-variant bg-glass-bg p-4 shadow-inner-glow backdrop-blur-glass',
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filtrar por status"
        >
          {FILTROS_EQUIPAMENTO_STATUS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => onFiltroStatusChange(status)}
              className={cn(
                'rounded-full px-4 py-1.5 text-label-md transition-colors',
                filtroStatus === status
                  ? 'bg-primary-container font-bold text-on-primary-container shadow-[0_0_12px_hsl(var(--primary-container)/0.25)]'
                  : 'text-muted-foreground hover:bg-surface-highest hover:text-foreground',
              )}
            >
              {FILTRO_EQUIPAMENTO_STATUS_LABELS[status]}
            </button>
          ))}
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end lg:w-auto lg:gap-4">
          <p className="shrink-0 text-caption text-muted-foreground">
            <span className="font-mono font-semibold text-foreground">
              {formatNumber.format(totalFiltrados)}
            </span>{' '}
            {totalFiltrados === 1 ? 'resultado' : 'resultados'}
          </p>

          <div className="relative w-full sm:max-w-xs lg:w-72">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              value={busca}
              onChange={(e) => onBuscaChange(e.target.value)}
              placeholder="TAG, nome, modelo ou localização…"
              className="w-full rounded-full border border-transparent bg-surface-low py-2 pl-10 pr-4 text-body-md text-foreground placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Buscar equipamentos"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-caption font-medium uppercase tracking-wider text-muted-foreground">
          Tipo:
        </span>
        {TIPOS_FILTRO.map((tipo) => (
          <button
            key={tipo.value}
            type="button"
            onClick={() => onFiltroTipoChange(tipo.value)}
            className={cn(
              'rounded-md border px-3 py-1 text-caption transition-colors',
              filtroTipo === tipo.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-outline-variant text-muted-foreground hover:border-primary/40 hover:text-foreground',
            )}
          >
            {tipo.label}
          </button>
        ))}
      </div>
    </div>
  );
}
