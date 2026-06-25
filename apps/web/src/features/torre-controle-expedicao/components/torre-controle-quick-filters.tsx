'use client';

import { cn } from '@lilog/ui';

import type { FiltroRapidoTorre } from '@/features/torre-controle-expedicao/types/torre-controle.schema';
import { FILTRO_RAPIDO_TORRE_LABELS } from '@/features/torre-controle-expedicao/types/torre-controle.schema';

const FILTROS: FiltroRapidoTorre[] = [
  'todos',
  'prioritarios',
  'atrasados',
  'criticos',
  'prioritarios_atrasados',
];

const filterChipClass = (
  ativo: boolean,
  variante: 'default' | 'destructive' = 'default',
) =>
  cn(
    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors',
    ativo
      ? variante === 'destructive'
        ? 'bg-destructive/15 text-destructive ring-1 ring-inset ring-destructive/25'
        : 'bg-primary/10 text-primary ring-1 ring-inset ring-primary/20'
      : 'bg-surface-highest/60 text-muted-foreground ring-1 ring-inset ring-outline-variant/50 hover:bg-surface-highest',
  );

type TorreControleQuickFiltersProps = {
  filtroAtivo: FiltroRapidoTorre;
  contadores: Record<FiltroRapidoTorre, number>;
  onFiltroChange: (filtro: FiltroRapidoTorre) => void;
  className?: string;
};

export function TorreControleQuickFilters({
  filtroAtivo,
  contadores,
  onFiltroChange,
  className,
}: TorreControleQuickFiltersProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Filtros rápidos
      </span>
      {FILTROS.map((filtro) => (
        <button
          key={filtro}
          type="button"
          onClick={() => onFiltroChange(filtro)}
          className={filterChipClass(
            filtroAtivo === filtro,
            filtro === 'prioritarios_atrasados' || filtro === 'criticos'
              ? 'destructive'
              : 'default',
          )}
        >
          {FILTRO_RAPIDO_TORRE_LABELS[filtro]}
          <span className="tabular-nums opacity-80">({contadores[filtro]})</span>
        </button>
      ))}
    </div>
  );
}
