'use client';

import { cn } from '@lilog/ui';
import { Loader2 } from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';

import { Pagination } from '@/features/filiais/components/pagination';
import { DebitoTransportadoraTabs } from '@/features/debito-transportadora/components/debito-transportadora-tabs';
import { DocumentoKpiCards } from '@/features/debito-transportadora/components/documento-kpi-cards';
import { DocumentoTable } from '@/features/debito-transportadora/components/documento-table';
import { useDocumentoLista } from '@/features/debito-transportadora/hooks/use-documento-lista';
import type { FiltroStatusDocumento } from '@/features/debito-transportadora/types/documento-cobranca.schema';
import { DOCUMENTO_STATUS_LABELS } from '@/features/debito-transportadora/types/documento-cobranca.schema';

const STATUS_OPTIONS: {
  value: FiltroStatusDocumento;
  label: string;
}[] = [
  { value: 'todos', label: 'Todos os Status' },
  ...(
    Object.entries(DOCUMENTO_STATUS_LABELS) as [
      Exclude<FiltroStatusDocumento, 'todos'>,
      string,
    ][]
  ).map(([value, label]) => ({ value, label })),
];

export function DocumentoListaView() {
  const {
    kpi,
    busca,
    setBusca,
    filtroTransportadora,
    setFiltroTransportadora,
    filtroStatus,
    setFiltroStatus,
    pagina,
    setPagina,
    totalPaginas,
    itemsPagina,
    itemsInicio,
    totalFiltrados,
    totalRegistros,
    pageSize,
    isLoading,
    transportadoraOptions,
  } = useDocumentoLista();

  return (
    <SidebarMain>
      <main className="px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container space-y-8">
          <header>
            <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
              Documentos de Cobrança
            </h1>
            <p className="mt-1 text-body-md text-muted-foreground">
              Gerencie os lotes de cobrança gerados a partir das ocorrências
              aprovadas.
            </p>
          </header>

          <DebitoTransportadoraTabs />

          <div className="relative max-w-xl">
            <input
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Pesquisar por número ou transportadora..."
              className={cn(
                'w-full rounded-lg border border-input bg-surface-low py-2 pl-4 pr-4',
                'text-label-md placeholder:text-muted-foreground/50',
                'focus:outline-none focus:ring-2 focus:ring-ring',
              )}
            />
          </div>

          <DocumentoKpiCards kpi={kpi} isLoading={isLoading} />

          <div className="overflow-hidden rounded-xl border border-outline-variant/50 bg-glass-bg shadow-inner-glow backdrop-blur-glass">
            <div className="flex flex-col justify-between gap-2 border-b border-outline-variant bg-surface-low px-3 py-2 sm:flex-row sm:items-center">
              <h2 className="text-xs font-semibold text-foreground">
                Documentos de Cobrança
              </h2>
              <div className="flex flex-wrap gap-3">
                <select
                  value={filtroTransportadora}
                  onChange={(event) =>
                    setFiltroTransportadora(event.target.value)
                  }
                  className="cursor-pointer border-none bg-transparent text-[11px] text-muted-foreground focus:ring-0"
                  aria-label="Filtrar por transportadora"
                >
                  {transportadoraOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filtroStatus}
                  onChange={(event) =>
                    setFiltroStatus(event.target.value as FiltroStatusDocumento)
                  }
                  className="cursor-pointer border-none bg-transparent text-[11px] text-muted-foreground focus:ring-0"
                  aria-label="Filtrar por status"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center gap-2 px-2 py-16 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Carregando documentos de cobrança…
              </div>
            ) : (
              <DocumentoTable items={itemsPagina} />
            )}

            <div className="border-t border-outline-variant bg-surface-low">
              <div className="flex items-center justify-between px-3 py-1.5 text-[11px] text-muted-foreground">
                <span>
                  Exibindo {itemsPagina.length} de{' '}
                  {totalRegistros.toLocaleString('pt-BR')} documentos
                </span>
              </div>
              <Pagination
                pagina={pagina}
                totalPaginas={totalPaginas}
                onChangePagina={setPagina}
                totalFiltrados={totalFiltrados}
                itemsInicio={itemsInicio}
                pageSize={pageSize}
                resourceLabelPlural="documentos"
              />
            </div>
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}
