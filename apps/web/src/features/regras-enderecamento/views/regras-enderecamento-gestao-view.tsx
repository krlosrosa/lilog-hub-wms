'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Loader2,
  MoreVertical,
  Plus,
  Route,
  Search,
} from 'lucide-react';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import {
  compactTableBodyClassName,
  compactTableCellClassName,
  compactTableClassName,
  compactTableEmptyCellClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
  compactTableRowClassName,
} from '@/components/ui/compact-table-classes';
import { Pagination } from '@/features/filiais/components/pagination';
import { RegraCriterioBadge } from '@/features/regras-enderecamento/components/regra-criterio-badge';
import { RegraDeleteDialog } from '@/features/regras-enderecamento/components/regra-delete-dialog';
import { RegraDestinosResumo } from '@/features/regras-enderecamento/components/regra-destinos-resumo';
import { useRegrasEnderecamentoGestao } from '@/features/regras-enderecamento/hooks/use-regras-enderecamento-gestao';
import { CRITERIO_TIPO_OPTIONS } from '@/features/regras-enderecamento/types/regra-enderecamento.schema';

const fieldInputClassName =
  'w-full rounded-lg border border-outline-variant bg-surface-low px-4 py-3 text-body-md text-foreground placeholder:text-muted-foreground focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const glassPanelClassName =
  'rounded-xl border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass';

function StatusBadge({ ativo }: { ativo: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        ativo
          ? 'bg-tertiary/10 text-tertiary'
          : 'bg-muted text-muted-foreground',
      )}
    >
      {ativo ? 'Ativa' : 'Inativa'}
    </span>
  );
}

export function RegrasEnderecamentoGestaoView() {
  const router = useRouter();
  const {
    unidadeId,
    isLoading,
    isSubmitting,
    regras,
    stats,
    busca,
    setBusca,
    criterioFiltro,
    setCriterioFiltro,
    ativoFiltro,
    setAtivoFiltro,
    pagina,
    setPagina,
    totalPaginas,
    total,
    pageSize,
    deleteDialogOpen,
    regraParaExcluir,
    abrirExclusao,
    fecharExclusao,
    alternarAtivo,
    confirmarExclusao,
  } = useRegrasEnderecamentoGestao();

  const itemsInicio = total === 0 ? 0 : (pagina - 1) * pageSize + 1;

  return (
    <SidebarMain>
      <main className="min-h-dvh bg-background px-margin-mobile py-4 md:px-margin-desktop md:py-6">
        <div className="mx-auto max-w-container space-y-4 md:space-y-5">
          <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Armazenagem · WMS
              </p>
              <h1 className="text-headline-md font-bold tracking-tight text-foreground md:text-headline-lg">
                Regras de Endereçamento
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
                Configure para onde o sistema sugere armazenar cada grupo, categoria
                ou produto, com fallback por zona ou endereço específico.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[12rem] flex-1 sm:flex-none">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  type="search"
                  placeholder="Buscar regra ou critério..."
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  className={cn(
                    fieldInputClassName,
                    'h-9 w-full py-1.5 pl-8 pr-3 text-xs sm:w-56',
                  )}
                />
              </div>
              {unidadeId ? (
                <Button size="sm" className="gap-1.5" asChild>
                  <Link href="/armazenagem/regras-enderecamento/nova">
                    <Plus className="size-3.5" aria-hidden />
                    Nova Regra
                  </Link>
                </Button>
              ) : (
                <Button size="sm" className="gap-1.5" disabled>
                  <Plus className="size-3.5" aria-hidden />
                  Nova Regra
                </Button>
              )}
            </div>
          </header>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
            {[
              { label: 'Total', value: stats.total },
              { label: 'Ativas (página)', value: stats.ativas },
              { label: 'Por grupo', value: stats.porGrupo },
              { label: 'Por produto', value: stats.porProduto },
            ].map((item) => (
              <div key={item.label} className={cn(glassPanelClassName, 'p-3 md:p-4')}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={criterioFiltro}
              onChange={(event) =>
                setCriterioFiltro(
                  event.target.value as typeof criterioFiltro,
                )
              }
              className={cn(fieldInputClassName, 'h-9 w-auto min-w-[10rem] py-1.5 text-xs')}
            >
              <option value="todos">Todos os critérios</option>
              {CRITERIO_TIPO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={ativoFiltro}
              onChange={(event) =>
                setAtivoFiltro(event.target.value as typeof ativoFiltro)
              }
              className={cn(fieldInputClassName, 'h-9 w-auto min-w-[9rem] py-1.5 text-xs')}
            >
              <option value="todos">Todos os status</option>
              <option value="ativos">Somente ativas</option>
              <option value="inativos">Somente inativas</option>
            </select>
          </div>

          <div className={cn(glassPanelClassName, 'overflow-hidden')}>
            {!unidadeId ? (
              <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
                <Route className="size-8 text-muted-foreground" aria-hidden />
                <p className="text-sm font-medium text-foreground">
                  Selecione uma unidade
                </p>
                <p className="max-w-md text-xs text-muted-foreground">
                  Escolha a unidade operacional para configurar as regras de
                  endereçamento automático na armazenagem.
                </p>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Carregando regras...
              </div>
            ) : regras.length === 0 ? (
              <p className={compactTableEmptyCellClassName}>
                Nenhuma regra encontrada para os filtros atuais.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className={compactTableClassName}>
                  <thead>
                    <tr className={compactTableHeadRowClassName}>
                      {[
                        { label: 'Regra', className: 'min-w-[160px]' },
                        { label: 'Critério', className: 'min-w-[160px]' },
                        { label: 'Prioridade', className: 'w-20' },
                        { label: 'Destinos', className: 'min-w-[220px]' },
                        { label: 'Status', className: 'w-20' },
                        { label: '', className: 'w-8' },
                      ].map((column) => (
                        <th
                          key={column.label || 'actions'}
                          className={compactTableHeadCellClassName(column.className)}
                        >
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={compactTableBodyClassName}>
                    {regras.map((item) => (
                      <tr
                        key={item.id}
                        className={cn(
                          compactTableRowClassName,
                          !item.ativo && 'opacity-60',
                        )}
                      >
                        <td className={compactTableCellClassName}>
                          <span className="text-sm font-medium text-foreground">
                            {item.nome}
                          </span>
                        </td>
                        <td className={compactTableCellClassName}>
                          <RegraCriterioBadge
                            criterioTipo={item.criterioTipo}
                            criterioValor={item.criterioValor}
                            compact
                            muted={!item.ativo}
                          />
                        </td>
                        <td className={compactTableCellClassName}>
                          <span className="font-mono text-xs text-foreground">
                            {item.prioridade}
                          </span>
                        </td>
                        <td className={compactTableCellClassName}>
                          <RegraDestinosResumo destinos={item.destinos} compact />
                        </td>
                        <td className={compactTableCellClassName}>
                          <StatusBadge ativo={item.ativo} />
                        </td>
                        <td className={cn(compactTableCellClassName, 'text-right')}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="rounded p-0.5 text-muted-foreground opacity-60 transition-all hover:bg-muted hover:text-primary group-hover:opacity-100"
                                aria-label={`Mais opções para ${item.nome}`}
                              >
                                <MoreVertical className="size-3.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/armazenagem/regras-enderecamento/${item.id}`,
                                  )
                                }
                              >
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => void alternarAtivo(item)}
                              >
                                {item.ativo ? 'Inativar' : 'Ativar'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => abrirExclusao(item)}
                              >
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {unidadeId && total > 0 && (
            <Pagination
              pagina={pagina}
              totalPaginas={totalPaginas}
              onChangePagina={setPagina}
              totalFiltrados={total}
              itemsInicio={itemsInicio}
              pageSize={pageSize}
              resourceLabelPlural="regras"
              compact
            />
          )}
        </div>

        <RegraDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={fecharExclusao}
          nome={regraParaExcluir?.nome}
          isSubmitting={isSubmitting}
          onConfirm={confirmarExclusao}
        />
      </main>
    </SidebarMain>
  );
}
