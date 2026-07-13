'use client';

import { useState } from 'react';

import { Button, cn } from '@lilog/ui';
import {
  ClipboardList,
  Filter,
  LayoutList,
  List,
  Loader2,
  SearchX,
  ShieldAlert,
} from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';

import { Pagination } from '@/features/filiais/components/pagination';
import { CncItensExportButton } from '@/features/cnc/components/cnc-itens-export-button';
import { CncItensFiltrosSheet } from '@/features/cnc/components/cnc-itens-filtros-sheet';
import { CncItensTable } from '@/features/cnc/components/cnc-itens-table';
import { CncKpiCards } from '@/features/cnc/components/cnc-kpi-cards';
import { CncTable } from '@/features/cnc/components/cnc-table';
import { CncUtilityBar } from '@/features/cnc/components/cnc-utility-bar';
import { useUnidadeContext } from '@/contexts/unidade-context';
import { useCncItensLista } from '@/features/cnc/hooks/use-cnc-itens-lista';
import { useCncLista } from '@/features/cnc/hooks/use-cnc-lista';
import {
  countCncItensFiltrosAtivos,
  getDefaultCncItensFiltros,
} from '@/features/cnc/types/cnc-itens-filtros';

type ViewMode = 'processos' | 'itens';

export function CncListaView() {
  const [viewMode, setViewMode] = useState<ViewMode>('processos');
  const [filtrosSheetAberto, setFiltrosSheetAberto] = useState(false);
  const { unidadeSelecionada } = useUnidadeContext();

  const processosLista = useCncLista();
  const itensLista = useCncItensLista();

  const isProcessos = viewMode === 'processos';
  const isLoading = isProcessos
    ? processosLista.isLoading
    : itensLista.isLoading;
  const totalFiltrados = isProcessos
    ? processosLista.totalFiltrados
    : itensLista.total;
  const itemsPagina = isProcessos ? processosLista.itemsPagina : itensLista.itens;
  const listaVazia = !isLoading && itemsPagina.length === 0;

  const temFiltrosAtivosProcessos =
    processosLista.filtroSituacao !== 'todos' ||
    processosLista.busca.trim().length > 0;
  const temFiltrosAtivosItens =
    countCncItensFiltrosAtivos(itensLista.filtros) > 0;
  const temFiltrosAtivos = isProcessos
    ? temFiltrosAtivosProcessos
    : temFiltrosAtivosItens;

  const limparFiltrosProcessos = () => {
    processosLista.setFiltroSituacao('todos');
    processosLista.setBusca('');
  };

  const limparFiltrosItens = () => {
    itensLista.setFiltros(getDefaultCncItensFiltros());
  };

  const filtrosItensAtivos = countCncItensFiltrosAtivos(itensLista.filtros);

  return (
    <SidebarMain>
      <main className="px-margin-mobile py-5 md:px-margin-desktop md:py-6">
        <div className="mx-auto max-w-container">
          <header className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                  <ShieldAlert className="size-4" aria-hidden />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  Qualidade
                </span>
              </div>
              <h1 className="text-headline-md font-semibold tracking-tight text-foreground md:text-headline-lg">
                Não Conformidades
              </h1>
              <p className="mt-0.5 max-w-lg text-xs text-muted-foreground md:text-body-md">
                CNCs geradas a partir de divergências e avarias em recebimentos.
              </p>
            </div>
          </header>

          <div className="flex flex-col gap-4 md:gap-5">
            {isProcessos ? (
              <CncKpiCards
                kpi={processosLista.kpi}
                isLoading={processosLista.isLoading}
              />
            ) : null}

            <section className="overflow-hidden rounded-xl border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
              <div className="border-b border-outline-variant bg-surface-low/30 px-3 py-3 md:px-4">
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs font-semibold text-foreground">
                      Registros
                    </h2>
                    {!isLoading && totalFiltrados > 0 ? (
                      <span className="rounded-full bg-surface-highest px-2 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                        {totalFiltrados} total
                      </span>
                    ) : null}
                  </div>

                  <div
                    className="inline-flex gap-0.5 rounded-lg border border-outline-variant/60 bg-surface-lowest p-0.5"
                    role="tablist"
                    aria-label="Modo de visualização"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={isProcessos}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-all',
                        isProcessos
                          ? 'bg-primary-container font-semibold text-on-primary-container shadow-sm'
                          : 'text-muted-foreground hover:bg-surface-highest hover:text-foreground',
                      )}
                      onClick={() => setViewMode('processos')}
                    >
                      <LayoutList className="size-3" aria-hidden />
                      Processos
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={!isProcessos}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-all',
                        !isProcessos
                          ? 'bg-primary-container font-semibold text-on-primary-container shadow-sm'
                          : 'text-muted-foreground hover:bg-surface-highest hover:text-foreground',
                      )}
                      onClick={() => setViewMode('itens')}
                    >
                      <List className="size-3" aria-hidden />
                      Itens
                    </button>
                  </div>
                </div>

                {isProcessos ? (
                  <CncUtilityBar
                    filtroSituacao={processosLista.filtroSituacao}
                    onSituacaoChange={processosLista.setFiltroSituacao}
                    busca={processosLista.busca}
                    onBuscaChange={processosLista.setBusca}
                    kpi={processosLista.kpi}
                    totalFiltrados={
                      processosLista.isLoading
                        ? undefined
                        : processosLista.totalFiltrados
                    }
                  />
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-muted-foreground">
                      Itens de não conformidade com link para o processo CNC.
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                      <CncItensExportButton
                        unidadeId={unidadeSelecionada?.id ?? null}
                        filtros={itensLista.filtros}
                        total={itensLista.total}
                        disabled={itensLista.isLoading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 shrink-0 gap-1.5 text-[11px]"
                        onClick={() => setFiltrosSheetAberto(true)}
                      >
                        <Filter className="size-3.5" aria-hidden />
                        Filtros
                        {filtrosItensAtivos > 0 ? (
                          <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                            {filtrosItensAtivos}
                          </span>
                        ) : null}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center gap-2.5 px-4 py-14">
                  <Loader2
                    className="size-7 animate-spin text-primary"
                    aria-hidden
                  />
                  <p className="text-xs text-muted-foreground">
                    {isProcessos
                      ? 'Carregando não conformidades…'
                      : 'Carregando itens…'}
                  </p>
                </div>
              ) : listaVazia ? (
                <div className="flex flex-col items-center justify-center gap-3 px-4 py-14 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-surface-highest text-muted-foreground">
                    {temFiltrosAtivos ? (
                      <SearchX className="size-6" aria-hidden />
                    ) : (
                      <ClipboardList className="size-6" aria-hidden />
                    )}
                  </div>
                  <div className="max-w-xs space-y-0.5">
                    <p className="text-sm font-semibold text-foreground">
                      {temFiltrosAtivos
                        ? isProcessos
                          ? 'Nenhuma CNC encontrada'
                          : 'Nenhum item encontrado'
                        : isProcessos
                          ? 'Nenhuma não conformidade'
                          : 'Nenhum item de CNC'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {temFiltrosAtivos
                        ? 'Ajuste os filtros para ver outros resultados.'
                        : isProcessos
                          ? 'CNCs aparecem aqui quando houver divergências em recebimentos.'
                          : 'Itens aparecem aqui quando houver divergências em recebimentos.'}
                    </p>
                  </div>
                  {temFiltrosAtivos ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={
                        isProcessos
                          ? limparFiltrosProcessos
                          : limparFiltrosItens
                      }
                    >
                      Limpar filtros
                    </Button>
                  ) : null}
                </div>
              ) : isProcessos ? (
                <CncTable items={processosLista.itemsPagina} />
              ) : (
                <CncItensTable items={itensLista.itens} />
              )}

              {totalFiltrados > 0 ? (
                <Pagination
                  pagina={
                    isProcessos
                      ? processosLista.pagina
                      : itensLista.pagina
                  }
                  totalPaginas={
                    isProcessos
                      ? processosLista.totalPaginas
                      : itensLista.totalPaginas
                  }
                  onChangePagina={
                    isProcessos
                      ? processosLista.setPagina
                      : itensLista.setPagina
                  }
                  totalFiltrados={totalFiltrados}
                  itemsInicio={
                    isProcessos
                      ? processosLista.itemsInicio
                      : itensLista.itemsInicio
                  }
                  pageSize={
                    isProcessos
                      ? processosLista.pageSize
                      : itensLista.pageSize
                  }
                  resourceLabelPlural={isProcessos ? 'CNCs' : 'itens'}
                />
              ) : null}
            </section>
          </div>
        </div>
      </main>

      <CncItensFiltrosSheet
        open={filtrosSheetAberto}
        onOpenChange={setFiltrosSheetAberto}
        filtros={itensLista.filtros}
        onAplicar={itensLista.setFiltros}
      />
    </SidebarMain>
  );
}
