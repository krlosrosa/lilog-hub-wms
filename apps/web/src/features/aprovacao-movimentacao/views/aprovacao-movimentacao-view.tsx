'use client';

import { Button, cn } from '@lilog/ui';
import { CheckCheck, Loader2, Search, Sparkles } from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';

import { MovimentacaoRow } from '@/features/aprovacao-movimentacao/components/movimentacao-row';
import { MovimentacaoSummaryCards } from '@/features/aprovacao-movimentacao/components/movimentacao-summary-cards';
import { useAprovacaoMovimentacao } from '@/features/aprovacao-movimentacao/hooks/use-aprovacao-movimentacao';
import type {
  FiltroPrioridadeMovimentacao,
  FiltroTipoMovimentacao,
} from '@/features/aprovacao-movimentacao/types/aprovacao-movimentacao.schema';
import {
  MOVIMENTACAO_PRIORIDADE_LABELS,
  MOVIMENTACAO_TIPO_LABELS,
} from '@/features/aprovacao-movimentacao/types/aprovacao-movimentacao.schema';
import { Pagination } from '@/features/filiais/components/pagination';

const TIPO_OPTIONS: { value: FiltroTipoMovimentacao; label: string }[] = [
  { value: 'todos', label: 'Tipo: Todos' },
  ...(
    Object.entries(MOVIMENTACAO_TIPO_LABELS) as [
      Exclude<FiltroTipoMovimentacao, 'todos'>,
      string,
    ][]
  ).map(([value, label]) => ({ value, label: `Tipo: ${label}` })),
];

const PRIORIDADE_OPTIONS: {
  value: FiltroPrioridadeMovimentacao;
  label: string;
}[] = [
  { value: 'todas', label: 'Prioridade: Todas' },
  ...(
    Object.entries(MOVIMENTACAO_PRIORIDADE_LABELS) as [
      Exclude<FiltroPrioridadeMovimentacao, 'todas'>,
      string,
    ][]
  ).map(([value, label]) => ({ value, label: `Prioridade: ${label}` })),
];

const TABLE_HEADERS = [
  '',
  'ID Solicitação',
  'Produto / SKU',
  'Origem',
  'Destino',
  'Motivo da Regra',
  'Prioridade',
  'Ações',
] as const;

export function AprovacaoMovimentacaoView() {
  const {
    summary,
    busca,
    setBusca,
    filtroTipo,
    setFiltroTipo,
    filtroPrioridade,
    setFiltroPrioridade,
    filtroData,
    setFiltroData,
    selecionados,
    toggleSelecionado,
    toggleSelecionarTodos,
    todosPaginaSelecionados,
    pagina,
    setPagina,
    totalPaginas,
    itemsPagina,
    itemsInicio,
    totalFiltrados,
    totalPendentes,
    pageSize,
    processando,
    actions,
  } = useAprovacaoMovimentacao();

  return (
    <SidebarMain>
      <main className="px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container space-y-6">
          <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="min-w-0">
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-primary md:text-headline-lg">
                Aprovação de Movimentações
              </h1>
              <p className="mt-1 text-body-md text-muted-foreground">
                Revise, filtre e aprove solicitações de movimentação pendentes no
                estoque.
              </p>
            </div>
            <div className="relative w-full max-w-xs sm:max-w-sm">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar ID ou SKU..."
                className={cn(
                  'w-full rounded-lg border border-input bg-surface-low py-2 pl-10 pr-4',
                  'text-label-md placeholder:text-muted-foreground/50',
                  'focus:outline-none focus:ring-2 focus:ring-ring',
                )}
              />
            </div>
          </header>

          <div
            className={cn(
              'flex flex-wrap items-center justify-between gap-4 rounded-xl border border-outline-variant',
              'bg-glass-bg p-4 shadow-inner-glow backdrop-blur-glass',
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                {totalPendentes} Pendentes
              </span>
              <span className="mx-2 hidden h-4 w-px bg-outline-variant sm:block" />
              <div className="flex flex-wrap gap-3">
                <select
                  value={filtroTipo}
                  onChange={(event) =>
                    setFiltroTipo(event.target.value as FiltroTipoMovimentacao)
                  }
                  aria-label="Filtrar por tipo"
                  className={cn(
                    'rounded-lg border border-outline-variant bg-surface-low px-3 py-1.5',
                    'text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring',
                  )}
                >
                  {TIPO_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filtroPrioridade}
                  onChange={(event) =>
                    setFiltroPrioridade(
                      event.target.value as FiltroPrioridadeMovimentacao,
                    )
                  }
                  aria-label="Filtrar por prioridade"
                  className={cn(
                    'rounded-lg border border-outline-variant bg-surface-low px-3 py-1.5',
                    'text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring',
                  )}
                >
                  {PRIORIDADE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={filtroData}
                  onChange={(event) => setFiltroData(event.target.value)}
                  aria-label="Filtrar por data"
                  className={cn(
                    'rounded-lg border border-outline-variant bg-surface-low px-3 py-1.5',
                    'text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring',
                  )}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="gap-2"
                disabled={processando || selecionados.size === 0}
                onClick={() => void actions.aprovarSelecionados()}
              >
                {processando ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <CheckCheck className="size-4" aria-hidden />
                )}
                Aprovar Selecionados
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                disabled={processando || totalFiltrados === 0}
                onClick={() => void actions.aprovarEmMassa()}
              >
                {processando ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Sparkles className="size-4" aria-hidden />
                )}
                Aprovar em Massa
              </Button>
            </div>
          </div>

          <MovimentacaoSummaryCards summary={summary} />

          <div className="overflow-hidden rounded-xl border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-highest/50">
                    <th className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={todosPaginaSelecionados}
                        onChange={toggleSelecionarTodos}
                        aria-label="Selecionar todos da página"
                        className="size-4 rounded border-input accent-primary"
                      />
                    </th>
                    {TABLE_HEADERS.slice(1).map((header) => (
                      <th
                        key={header}
                        className={cn(
                          'px-4 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground',
                          header === 'Prioridade' && 'text-center',
                          header === 'Ações' && 'text-right',
                        )}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {itemsPagina.length ? (
                    itemsPagina.map((item) => (
                      <MovimentacaoRow
                        key={item.id}
                        item={item}
                        selecionado={selecionados.has(item.id)}
                        processando={processando}
                        onToggleSelecionado={toggleSelecionado}
                        onAprovar={actions.aprovar}
                        onReprovar={actions.reprovar}
                        onVerDetalhes={actions.verDetalhes}
                      />
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={TABLE_HEADERS.length}
                        className="px-4 py-12 text-center text-sm text-muted-foreground"
                      >
                        Nenhuma movimentação pendente encontrada para os filtros
                        aplicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalFiltrados > 0 && (
              <Pagination
                pagina={pagina}
                totalPaginas={totalPaginas}
                onChangePagina={setPagina}
                totalFiltrados={totalFiltrados}
                itemsInicio={itemsInicio}
                pageSize={pageSize}
                resourceLabelPlural="solicitações"
              />
            )}
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}
