'use client';

import { cn } from '@lilog/ui';
import { Search } from 'lucide-react';

import {
  FILTRO_TRANSPORTADORA_STATUS_LABELS,
  FILTROS_TRANSPORTADORA_STATUS,
  type FiltroTransportadoraStatus,
} from '@/features/transporte/types/transportadora.schema';

type TransportadoraFiltrosProps = {
  embedded?: boolean;
  busca: string;
  onBuscaChange: (value: string) => void;
  filtroStatus: FiltroTransportadoraStatus;
  onFiltroStatusChange: (value: FiltroTransportadoraStatus) => void;
  totalFiltrados: number;
};

export function TransportadoraFiltros({
  embedded = false,
  busca,
  onBuscaChange,
  filtroStatus,
  onFiltroStatusChange,
  totalFiltrados,
}: TransportadoraFiltrosProps) {
  const formatNumber = new Intl.NumberFormat('pt-BR');

  return (
    <div
      className={cn(
        'flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between',
        embedded
          ? 'rounded-none border-0 bg-transparent p-0 shadow-none'
          : 'rounded-xl border border-outline-variant bg-glass-bg p-4 shadow-inner-glow backdrop-blur-glass',
      )}
    >
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filtrar por status da transportadora"
      >
        {FILTROS_TRANSPORTADORA_STATUS.map((status) => (
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
            {FILTRO_TRANSPORTADORA_STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end lg:w-auto lg:gap-4">
        <p className="shrink-0 text-caption text-muted-foreground lg:order-first">
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
            placeholder="Nome, ID Ravex ou CNPJ…"
            className="w-full rounded-full border border-transparent bg-surface-low py-2 pl-10 pr-4 text-body-md text-foreground placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Buscar transportadoras"
          />
        </div>
      </div>
    </div>
  );
}
