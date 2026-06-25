'use client';

import { cn } from '@lilog/ui';
import { Search } from 'lucide-react';

import type {
  FiltroDocaSituacao,
  FiltroDocaTipo,
} from '@/features/docas/types/docas.schema';
import {
  FILTRO_DOCA_SITUACAO_LABELS,
  FILTRO_DOCA_TIPO_LABELS,
  FILTROS_DOCA_SITUACAO,
  FILTROS_DOCA_TIPO,
} from '@/features/docas/types/docas.schema';

type DocaFiltrosProps = {
  busca: string;
  onBuscaChange: (value: string) => void;
  filtroSituacao: FiltroDocaSituacao;
  onFiltroSituacaoChange: (value: FiltroDocaSituacao) => void;
  filtroTipo: FiltroDocaTipo;
  onFiltroTipoChange: (value: FiltroDocaTipo) => void;
  embedded?: boolean;
};

const selectClassName =
  'h-8 shrink-0 rounded-md border border-outline-variant bg-surface-low px-2 text-[11px] text-foreground focus-visible:border-primary focus-visible:outline-none';

export function DocaFiltros({
  busca,
  onBuscaChange,
  filtroSituacao,
  onFiltroSituacaoChange,
  filtroTipo,
  onFiltroTipoChange,
  embedded = false,
}: DocaFiltrosProps) {
  const content = (
    <>
      <div className="relative min-w-[10rem] flex-1">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          placeholder="Buscar por código ou nome..."
          value={busca}
          onChange={(e) => onBuscaChange(e.target.value)}
          className="h-8 w-full rounded-md border border-outline-variant bg-surface-low py-1 pl-8 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
      <select
        id="filtro-situacao"
        value={filtroSituacao}
        onChange={(e) =>
          onFiltroSituacaoChange(e.target.value as FiltroDocaSituacao)
        }
        className={cn(selectClassName, 'w-[8rem]')}
        aria-label="Filtrar por situação"
      >
        {FILTROS_DOCA_SITUACAO.map((opcao) => (
          <option key={opcao} value={opcao}>
            {FILTRO_DOCA_SITUACAO_LABELS[opcao]}
          </option>
        ))}
      </select>
      <select
        id="filtro-tipo"
        value={filtroTipo}
        onChange={(e) => onFiltroTipoChange(e.target.value as FiltroDocaTipo)}
        className={cn(selectClassName, 'w-[8rem]')}
        aria-label="Filtrar por tipo"
      >
        {FILTROS_DOCA_TIPO.map((opcao) => (
          <option key={opcao} value={opcao}>
            {FILTRO_DOCA_TIPO_LABELS[opcao]}
          </option>
        ))}
      </select>
    </>
  );

  if (embedded) {
    return (
      <div
        className="flex flex-wrap items-center gap-2 border-b border-outline-variant bg-surface-low/50 px-3 py-2"
        role="search"
      >
        {content}
      </div>
    );
  }

  return (
    <section className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-outline-variant bg-glass-bg p-3 shadow-inner-glow backdrop-blur-glass">
      {content}
    </section>
  );
}
