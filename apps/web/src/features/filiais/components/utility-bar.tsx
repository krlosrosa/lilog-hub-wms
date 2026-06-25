import { cn } from '@lilog/ui';
import { Download, Search } from 'lucide-react';

import type { FiltroCluster } from '@/features/filiais/types/filial-lista.schema';
import { FILTRO_CLUSTER_LABELS } from '@/features/filiais/types/filial-lista.schema';

type UtilityBarProps = {
  filtroCluster: FiltroCluster;
  onFiltroChange: (cluster: FiltroCluster) => void;
  busca: string;
  onBuscaChange: (value: string) => void;
  onExportar?: () => void;
};

const FILTROS: FiltroCluster[] = [
  'todos',
  'Cross',
  'CD-Fabrica',
  'Distribuicao',
];

export function UtilityBar({
  filtroCluster,
  onFiltroChange,
  busca,
  onBuscaChange,
  onExportar,
}: UtilityBarProps) {
  return (
    <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-outline-variant bg-glass-bg p-4 backdrop-blur-glass md:flex-row">
      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Filtrar por cluster"
      >
        {FILTROS.map((filtro) => (
          <button
            key={filtro}
            type="button"
            onClick={() => onFiltroChange(filtro)}
            className={cn(
              'rounded-full px-4 py-1.5 text-xs font-medium transition-all',
              filtroCluster === filtro
                ? 'bg-primary text-primary-foreground font-bold'
                : 'text-muted-foreground hover:bg-surface-highest hover:text-foreground',
            )}
          >
            {FILTRO_CLUSTER_LABELS[filtro]}
          </button>
        ))}
      </div>

      <div className="flex w-full items-center gap-4 md:w-auto">
        <div className="relative w-full md:w-64">
          <Search
            className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Filtrar por nome ou ID..."
            value={busca}
            onChange={(e) => onBuscaChange(e.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface-lowest py-2 pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-transparent focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <button
          type="button"
          onClick={onExportar}
          className="flex shrink-0 items-center gap-2 rounded-lg border border-outline-variant bg-surface-highest px-4 py-2 text-xs font-medium text-foreground transition-all hover:bg-surface-highest/80"
        >
          <Download className="size-3.5" aria-hidden />
          Exportar
        </button>
      </div>
    </div>
  );
}
