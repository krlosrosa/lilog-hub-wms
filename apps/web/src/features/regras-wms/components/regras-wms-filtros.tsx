'use client';

import { Search } from 'lucide-react';

import {
  FILTRO_GATILHO_LABELS,
  type FiltroAtivo,
  type FiltroGatilho,
} from '@/features/regras-wms/types/regra-wms.schema';

type RegrasWmsFiltrosProps = {
  embedded?: boolean;
  busca: string;
  onBuscaChange: (value: string) => void;
  filtroGatilho: FiltroGatilho;
  onFiltroGatilhoChange: (value: FiltroGatilho) => void;
  filtroAtivo: FiltroAtivo;
  onFiltroAtivoChange: (value: FiltroAtivo) => void;
  totalFiltrados: number;
};

const FILTROS_ATIVO: { value: FiltroAtivo; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'ativo', label: 'Ativas' },
  { value: 'inativo', label: 'Inativas' },
];

export function RegrasWmsFiltros({
  busca,
  onBuscaChange,
  filtroGatilho,
  onFiltroGatilhoChange,
  filtroAtivo,
  onFiltroAtivoChange,
  totalFiltrados,
}: RegrasWmsFiltrosProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={busca}
            onChange={(e) => onBuscaChange(e.target.value)}
            placeholder="Buscar por nome ou descrição..."
            className="w-full rounded-lg border border-outline-variant bg-surface-lowest py-2.5 pl-10 pr-4 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <p className="text-caption text-muted-foreground">
          {totalFiltrados} regra{totalFiltrados !== 1 ? 's' : ''} encontrada
          {totalFiltrados !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(FILTRO_GATILHO_LABELS) as FiltroGatilho[]).map(
            (gatilho) => (
              <button
                key={gatilho}
                type="button"
                onClick={() => onFiltroGatilhoChange(gatilho)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filtroGatilho === gatilho
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface-highest text-muted-foreground hover:text-foreground'
                }`}
              >
                {FILTRO_GATILHO_LABELS[gatilho]}
              </button>
            ),
          )}
        </div>

        <div className="hidden h-5 w-px bg-outline-variant sm:block" aria-hidden />

        <div className="flex flex-wrap gap-1.5">
          {FILTROS_ATIVO.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onFiltroAtivoChange(value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filtroAtivo === value
                  ? 'bg-secondary text-secondary-foreground'
                  : 'bg-surface-highest text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
