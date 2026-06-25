'use client';

import { Search } from 'lucide-react';

import type { FiltroAtivo } from '@/features/regras-expedicao/types/regra-expedicao.schema';

type RegrasExpedicaoFiltrosProps = {
  busca: string;
  onBuscaChange: (value: string) => void;
  filtroAtivo: FiltroAtivo;
  onFiltroAtivoChange: (value: FiltroAtivo) => void;
  totalFiltrados: number;
};

const FILTROS_ATIVO: { value: FiltroAtivo; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'ativo', label: 'Ativas' },
  { value: 'inativo', label: 'Inativas' },
];

export function RegrasExpedicaoFiltros({
  busca,
  onBuscaChange,
  filtroAtivo,
  onFiltroAtivoChange,
  totalFiltrados,
}: RegrasExpedicaoFiltrosProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
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

      <div className="flex flex-wrap gap-1.5">
        {FILTROS_ATIVO.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onFiltroAtivoChange(value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filtroAtivo === value
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface-highest text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
