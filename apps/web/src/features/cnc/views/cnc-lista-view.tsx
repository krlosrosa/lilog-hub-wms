'use client';

import { cn } from '@lilog/ui';
import { Loader2 } from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';

import { Pagination } from '@/features/filiais/components/pagination';
import { CncKpiCards } from '@/features/cnc/components/cnc-kpi-cards';
import { CncTable } from '@/features/cnc/components/cnc-table';
import { useCncLista } from '@/features/cnc/hooks/use-cnc-lista';
import type { FiltroSituacaoCnc } from '@/features/cnc/types/cnc.schema';
import { CNC_SITUACAO_LABELS } from '@/features/cnc/types/cnc.schema';

const SITUACAO_OPTIONS: {
  value: FiltroSituacaoCnc;
  label: string;
}[] = [
  { value: 'todos', label: 'Todas as Situações' },
  ...(
    Object.entries(CNC_SITUACAO_LABELS) as [
      Exclude<FiltroSituacaoCnc, 'todos'>,
      string,
    ][]
  ).map(([value, label]) => ({ value, label })),
];

export function CncListaView() {
  const {
    kpi,
    busca,
    setBusca,
    filtroSituacao,
    setFiltroSituacao,
    pagina,
    setPagina,
    totalPaginas,
    itemsPagina,
    itemsInicio,
    totalFiltrados,
    totalRegistros,
    pageSize,
    isLoading,
  } = useCncLista();

  return (
    <SidebarMain>
      <main className="px-margin-mobile py-6 pb-24 md:px-margin-desktop md:py-8 md:pb-28">
        <div className="mx-auto max-w-container space-y-8">
          <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="min-w-0">
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
                Gestão de Não Conformidades
              </h1>
              <p className="mt-1 text-body-md text-muted-foreground">
                Acompanhamento e tratamento de CNCs geradas a partir de
                recebimentos com divergências ou avarias.
              </p>
            </div>
          </header>

          <div className="relative max-w-xl">
            <input
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Pesquisar por número ou descrição..."
              className={cn(
                'w-full rounded-lg border border-input bg-surface-low py-2 pl-4 pr-4',
                'text-label-md placeholder:text-muted-foreground/50',
                'focus:outline-none focus:ring-2 focus:ring-ring',
              )}
            />
          </div>

          <CncKpiCards kpi={kpi} isLoading={isLoading} />

          <div className="overflow-hidden rounded-xl border border-outline-variant/50 bg-glass-bg shadow-inner-glow backdrop-blur-glass">
            <div className="flex flex-col justify-between gap-2 border-b border-outline-variant bg-surface-low px-3 py-2 sm:flex-row sm:items-center">
              <h2 className="text-xs font-semibold text-foreground">
                Não Conformidades Recentes
              </h2>
              <select
                value={filtroSituacao}
                onChange={(event) =>
                  setFiltroSituacao(event.target.value as FiltroSituacaoCnc)
                }
                className="cursor-pointer border-none bg-transparent text-[11px] text-muted-foreground focus:ring-0"
                aria-label="Filtrar por situação"
              >
                {SITUACAO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center gap-2 px-2 py-16 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Carregando não conformidades…
              </div>
            ) : (
              <CncTable items={itemsPagina} />
            )}

            <div className="border-t border-outline-variant bg-surface-low">
              <div className="flex items-center justify-between px-3 py-1.5 text-[11px] text-muted-foreground">
                <span>
                  Exibindo {itemsPagina.length} de{' '}
                  {totalRegistros.toLocaleString('pt-BR')} CNCs
                </span>
              </div>
              <Pagination
                pagina={pagina}
                totalPaginas={totalPaginas}
                onChangePagina={setPagina}
                totalFiltrados={totalFiltrados}
                itemsInicio={itemsInicio}
                pageSize={pageSize}
                resourceLabelPlural="CNCs"
              />
            </div>
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}
