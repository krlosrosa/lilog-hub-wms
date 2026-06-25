'use client';

import { cn } from '@lilog/ui';
import { Download, Filter, Search } from 'lucide-react';

import type { FiltroTurno } from '@/features/recebimento/types/recebimento-lista.schema';
import {
  FILTRO_TURNO_LABELS,
  FILTROS_TURNO,
} from '@/features/recebimento/types/recebimento-lista.schema';

type RecebimentoUtilityBarProps = {
  embedded?: boolean;
  filtroTurno: FiltroTurno;
  onTurnoChange: (f: FiltroTurno) => void;
  busca: string;
  onBuscaChange: (value: string) => void;
  onExportar?: () => void;
  onFiltrosAvancados?: () => void;
};

export function RecebimentoUtilityBar({
  embedded,
  filtroTurno,
  onTurnoChange,
  busca,
  onBuscaChange,
  onExportar,
  onFiltrosAvancados,
}: RecebimentoUtilityBarProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 md:flex-row md:items-center md:justify-between',
        embedded
          ? 'rounded-none border-0 bg-transparent p-0 shadow-none'
          : 'rounded-xl border border-outline-variant bg-surface-low/30 p-3',
      )}
    >
      <div
        className="flex flex-wrap gap-1.5"
        role="tablist"
        aria-label="Turno ou situação"
      >
        {FILTROS_TURNO.map((opcao) => (
          <button
            key={opcao}
            type="button"
            role="tab"
            aria-selected={filtroTurno === opcao}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-colors',
              filtroTurno === opcao
                ? 'bg-primary-container font-bold text-on-primary-container'
                : 'text-muted-foreground hover:bg-surface-highest hover:text-foreground',
            )}
            onClick={() => onTurnoChange(opcao)}
          >
            {FILTRO_TURNO_LABELS[opcao]}
            {opcao === 'atrasados' ? (
              <span
                className="size-1.5 shrink-0 rounded-full bg-destructive"
                aria-hidden
              />
            ) : null}
          </button>
        ))}
      </div>

      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end md:w-auto">
        <div className="relative w-full sm:max-w-[220px]">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Placa, transportador…"
            value={busca}
            onChange={(e) => {
              onBuscaChange(e.target.value);
            }}
            className="w-full rounded-lg border border-outline-variant bg-surface-lowest py-1.5 pl-8 pr-3 text-[11px] text-foreground placeholder:text-muted-foreground/70 focus:border-transparent focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onFiltrosAvancados}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-surface-highest hover:text-foreground"
          >
            <Filter className="size-3.5 shrink-0" aria-hidden />
            Filtros
          </button>
          <button
            type="button"
            onClick={onExportar}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-highest px-2.5 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:bg-surface-highest/80"
          >
            <Download className="size-3.5 shrink-0" aria-hidden />
            Exportar
          </button>
        </div>
      </div>
    </div>
  );
}
