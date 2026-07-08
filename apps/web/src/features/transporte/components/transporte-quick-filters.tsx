'use client';

import { cn } from '@lilog/ui';

import type { FiltroRapidoTransporte } from '@/features/transporte/types/transporte.schema';
import { FILTRO_RAPIDO_TRANSPORTE_LABELS } from '@/features/transporte/types/transporte.schema';

const FILTROS: FiltroRapidoTransporte[] = [
  'todos',
  'sem_placa',
  'alocados',
  'sem_mapa',
  'com_mapa',
];

const filterChipClass = (
  ativo: boolean,
  variante: 'default' | 'destructive' | 'tertiary' | 'warning' | 'success' = 'default',
) =>
  cn(
    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors',
    ativo
      ? variante === 'destructive'
        ? 'bg-destructive/15 text-destructive ring-1 ring-inset ring-destructive/25'
        : variante === 'tertiary'
          ? 'bg-tertiary/15 text-tertiary ring-1 ring-inset ring-tertiary/25'
          : variante === 'warning'
            ? 'bg-warning/15 text-warning ring-1 ring-inset ring-warning/25'
            : variante === 'success'
              ? 'bg-success/15 text-success ring-1 ring-inset ring-success/25'
              : 'bg-primary/10 text-primary ring-1 ring-inset ring-primary/20'
      : 'bg-surface-highest/60 text-muted-foreground ring-1 ring-inset ring-outline-variant/50 hover:bg-surface-highest',
  );

const VARIANTE_POR_FILTRO: Record<
  FiltroRapidoTransporte,
  'default' | 'destructive' | 'tertiary' | 'warning' | 'success'
> = {
  todos: 'default',
  sem_placa: 'destructive',
  alocados: 'tertiary',
  sem_mapa: 'warning',
  com_mapa: 'success',
};

type TransporteQuickFiltersProps = {
  filtroAtivo: FiltroRapidoTransporte;
  contadores: Record<FiltroRapidoTransporte, number>;
  onFiltroChange: (filtro: FiltroRapidoTransporte) => void;
  className?: string;
};

export function TransporteQuickFilters({
  filtroAtivo,
  contadores,
  onFiltroChange,
  className,
}: TransporteQuickFiltersProps) {
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
            VARIANTE_POR_FILTRO[filtro],
          )}
        >
          {FILTRO_RAPIDO_TRANSPORTE_LABELS[filtro]}
          <span className="tabular-nums opacity-80">({contadores[filtro]})</span>
        </button>
      ))}
    </div>
  );
}
