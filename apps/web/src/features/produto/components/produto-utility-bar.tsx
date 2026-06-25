'use client';

import { cn } from '@lilog/ui';
import { Filter, Search } from 'lucide-react';

import type { FiltroCategoriaProduto } from '@/features/produto/types/produto-lista.schema';
import {
  FILTRO_PRODUTO_LABELS,
  FILTROS_PRODUTO,
} from '@/features/produto/types/produto-lista.schema';

type ProdutoUtilityBarProps = {
  embedded?: boolean;
  compact?: boolean;
  filtroCategoria: FiltroCategoriaProduto;
  onFiltroChange: (f: FiltroCategoriaProduto) => void;
  busca: string;
  onBuscaChange: (value: string) => void;
  onFiltrosAvancados?: () => void;
  filtrosAvancadosAtivos?: number;
};

export function ProdutoUtilityBar({
  embedded,
  compact,
  filtroCategoria,
  onFiltroChange,
  busca,
  onBuscaChange,
  onFiltrosAvancados,
  filtrosAvancadosAtivos = 0,
}: ProdutoUtilityBarProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between',
        embedded
          ? 'rounded-none border-0 bg-transparent p-0 shadow-none'
          : 'rounded-xl border border-outline-variant bg-surface-low/30 p-3',
      )}
    >
      <div
        className="flex flex-wrap gap-1"
        role="group"
        aria-label="Filtrar por categoria"
      >
        {FILTROS_PRODUTO.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => {
              onFiltroChange(f);
            }}
            className={cn(
              'rounded-full transition-colors',
              compact ? 'px-2.5 py-0.5 text-[11px]' : 'px-4 py-1.5 text-label-md',
              filtroCategoria === f
                ? 'bg-primary-container font-semibold text-on-primary-container'
                : 'text-muted-foreground hover:bg-surface-highest hover:text-foreground',
            )}
          >
            {FILTRO_PRODUTO_LABELS[f]}
          </button>
        ))}
      </div>

      <div className="flex w-full items-center gap-2 lg:w-auto">
        <div className="relative min-w-0 flex-1 lg:w-52">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            placeholder="SKU, nome, EAN…"
            value={busca}
            onChange={(e) => {
              onBuscaChange(e.target.value);
            }}
            className="h-8 w-full rounded-md border border-outline-variant/60 bg-surface-low py-1 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {onFiltrosAvancados ? (
          <button
            type="button"
            onClick={onFiltrosAvancados}
            aria-label="Filtros avançados"
            className={cn(
              'relative inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-outline-variant/60 text-muted-foreground transition-colors hover:bg-surface-highest hover:text-foreground',
              filtrosAvancadosAtivos > 0 &&
                'border-primary/40 bg-primary/5 text-primary',
            )}
          >
            <Filter className="size-3.5" aria-hidden />
            {filtrosAvancadosAtivos > 0 ? (
              <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                {filtrosAvancadosAtivos}
              </span>
            ) : null}
          </button>
        ) : null}
      </div>
    </div>
  );
}
