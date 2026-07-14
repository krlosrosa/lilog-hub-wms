'use client';

import { cn } from '@lilog/ui';
import { CalendarClock, FileSpreadsheet, Filter, Search } from 'lucide-react';

import { RecebimentoStatusQuickFilter } from '@/features/recebimento/components/recebimento-status-quick-filter';
import type { FiltroTurno } from '@/features/recebimento/types/recebimento-lista.schema';
import type { RecebimentoStatus } from '@/features/recebimento/types/recebimento-lista.schema';
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
  statusFiltro: RecebimentoStatus[];
  onStatusFiltroChange: (value: RecebimentoStatus[]) => void;
  onGerarMovimentacao?: () => void;
  onReagendar?: () => void;
  onSelecionarTodos?: () => void;
  onLimparSelecao?: () => void;
  selecionaveisTotal?: number;
  todosSelecionados?: boolean;
  onFiltrosAvancados?: () => void;
  filtrosAvancadosAtivos?: number;
  totalFiltrados?: number;
  selecionadosCount?: number;
};

export function RecebimentoUtilityBar({
  embedded,
  filtroTurno,
  onTurnoChange,
  busca,
  onBuscaChange,
  statusFiltro,
  onStatusFiltroChange,
  onGerarMovimentacao,
  onReagendar,
  onSelecionarTodos,
  onLimparSelecao,
  selecionaveisTotal = 0,
  todosSelecionados = false,
  onFiltrosAvancados,
  filtrosAvancadosAtivos = 0,
  totalFiltrados,
  selecionadosCount = 0,
}: RecebimentoUtilityBarProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between',
        embedded
          ? 'rounded-none border-0 bg-transparent p-0 shadow-none'
          : 'rounded-xl border border-outline-variant bg-surface-low/30 p-3',
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <div
          className="inline-flex flex-wrap gap-0.5 rounded-lg border border-outline-variant/60 bg-surface-lowest p-0.5"
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
                'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all',
                filtroTurno === opcao
                  ? 'bg-primary-container font-semibold text-on-primary-container shadow-sm'
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

        {totalFiltrados !== undefined ? (
          <span className="text-[11px] text-muted-foreground">
            <span className="font-semibold tabular-nums text-foreground">
              {totalFiltrados}
            </span>{' '}
            {totalFiltrados === 1 ? 'resultado' : 'resultados'}
          </span>
        ) : null}

        {selecionadosCount > 0 ? (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
            {selecionadosCount} selecionado
            {selecionadosCount === 1 ? '' : 's'}
          </span>
        ) : null}

        {selecionaveisTotal > 0 && (onSelecionarTodos || onLimparSelecao) ? (
          <button
            type="button"
            onClick={todosSelecionados ? onLimparSelecao : onSelecionarTodos}
            className="text-[11px] font-medium text-primary underline-offset-2 hover:underline"
          >
            {todosSelecionados
              ? 'Limpar seleção'
              : `Selecionar todos (${selecionaveisTotal})`}
          </button>
        ) : null}
      </div>

      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end lg:w-auto">
        <div className="relative min-w-0 flex-1 sm:max-w-[220px] lg:flex-initial">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Placa, transportador, OCR, transporte…"
            value={busca}
            onChange={(e) => {
              onBuscaChange(e.target.value);
            }}
            aria-label="Buscar recebimentos"
            className="h-8 w-full rounded-lg border border-outline-variant bg-surface-lowest py-1.5 pl-8 pr-3 text-[11px] text-foreground placeholder:text-muted-foreground/70 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {onReagendar ? (
            <button
              type="button"
              onClick={onReagendar}
              className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-secondary/30 bg-secondary/10 px-2.5 text-[11px] font-semibold text-secondary transition-colors hover:bg-secondary/15"
            >
              <CalendarClock className="size-3 shrink-0" aria-hidden />
              <span className="hidden sm:inline">Reagendar</span>
              <span className="sm:hidden">Reag.</span>
            </button>
          ) : null}
          {selecionadosCount > 0 && onGerarMovimentacao ? (
            <button
              type="button"
              onClick={onGerarMovimentacao}
              className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/15"
            >
              <FileSpreadsheet className="size-3 shrink-0" aria-hidden />
              <span className="hidden sm:inline">Gerar movimentação</span>
              <span className="sm:hidden">MIGO</span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={onFiltrosAvancados}
            aria-label="Filtros avançados"
            className={cn(
              'relative inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-outline-variant px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-surface-highest hover:text-foreground',
              filtrosAvancadosAtivos > 0 &&
                'border-primary/30 bg-primary/5 text-primary',
            )}
          >
            <Filter className="size-3 shrink-0" aria-hidden />
            Filtros
            {filtrosAvancadosAtivos > 0 ? (
              <span className="flex size-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                {filtrosAvancadosAtivos}
              </span>
            ) : null}
          </button>
          <RecebimentoStatusQuickFilter
            value={statusFiltro}
            onChange={onStatusFiltroChange}
          />
        </div>
      </div>
    </div>
  );
}
