'use client';

import { cn } from '@lilog/ui';
import { Search, Truck } from 'lucide-react';

import {
  fieldInputClassName,
  panelBodyClassName,
  panelClassName,
  panelHeaderClassName,
} from '@/features/expedicao-config-mapa/components/panel-styles';
import type { Transport } from '@/features/expedicao-config-mapa/types/config-mapa.schema';

const VISIBLE_LIMIT = 40;

type TransportListPanelProps = {
  transports: Transport[];
  totalCount: number;
  filter: string;
  onFilterChange: (value: string) => void;
};

export function TransportListPanel({
  transports,
  totalCount,
  filter,
  onFilterChange,
}: TransportListPanelProps) {
  const visible = transports.slice(0, VISIBLE_LIMIT);
  const hiddenCount = transports.length - visible.length;

  return (
    <section className={panelClassName}>
      <div className={panelHeaderClassName}>
        <div className="flex items-center gap-2">
          <Truck className="size-3.5 text-primary" aria-hidden />
          <h2 className="text-xs font-semibold text-foreground">
            Transportes selecionados
          </h2>
          <span className="rounded-full bg-primary/10 px-1.5 py-px text-[10px] font-bold text-primary">
            {totalCount}
          </span>
        </div>

        <div className="relative w-full max-w-[200px]">
          <Search
            className="absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={filter}
            onChange={(event) => onFilterChange(event.target.value)}
            placeholder="Filtrar..."
            className={cn(fieldInputClassName, 'py-1 pl-7 pr-2')}
            aria-label="Filtrar transportes"
          />
        </div>
      </div>

      <div className={cn(panelBodyClassName, 'py-2')}>
        {transports.length === 0 ? (
          <p className="py-2 text-center text-[11px] text-muted-foreground">
            Nenhum transporte encontrado.
          </p>
        ) : (
          <div className="max-h-16 overflow-y-auto">
            <div className="flex flex-wrap gap-1">
              {visible.map((transport) => (
                <span
                  key={transport.id}
                  className="inline-flex items-center gap-1 rounded border border-outline-variant/50 bg-surface-low px-1.5 py-px font-mono text-[10px]"
                >
                  <span className="font-semibold text-primary">
                    {transport.placa}
                  </span>
                  <span className="text-muted-foreground">
                    {transport.tonelagem.toFixed(1)}T
                  </span>
                </span>
              ))}
              {hiddenCount > 0 && (
                <span className="inline-flex items-center rounded border border-dashed border-outline-variant px-1.5 py-px text-[10px] text-muted-foreground">
                  +{hiddenCount}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
