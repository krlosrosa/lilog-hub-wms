'use client';

import Link from 'next/link';

import { Clock, Download, Plus, Search, TrendingUp, Users } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import {
  compactTableBodyClassName,
  compactTableClassName,
  compactTableEmptyCellClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
} from '@/components/ui/compact-table-classes';
import { Pagination } from '@/features/filiais/components/pagination';
import {
  glassPanelClassName,
} from '@/features/funcionarios/components/funcionario-form-field-classes';
import { FuncionarioStatsCard } from '@/features/funcionarios/components/funcionario-stats-card';
import { FuncionarioTableRow } from '@/features/funcionarios/components/funcionario-table-row';
import { useFuncionariosGestao } from '@/features/funcionarios/hooks/use-funcionarios-gestao';

const nf = new Intl.NumberFormat('pt-BR');

const filterSelectClassName =
  'h-9 shrink-0 rounded-lg border border-outline-variant bg-surface-low px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const filterSearchClassName =
  'h-9 min-w-0 flex-1 rounded-lg border border-outline-variant bg-surface-low py-1.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function FuncionariosGestaoView() {
  const {
    isLoading,
    kpi,
    funcionarios,
    statusFiltro,
    setStatusFiltro,
    statusFiltroOpcoes,
    departamentoFiltro,
    setDepartamentoFiltro,
    departamentoFiltroOpcoes,
    turnoFiltro,
    setTurnoFiltro,
    turnoFiltroOpcoes,
    busca,
    setBusca,
    pagina,
    setPagina,
    totalPaginas,
    totalFiltrados,
    itemsInicio,
    pageSize,
    verHistorico,
    exportarCsv,
  } = useFuncionariosGestao();

  return (
    <SidebarMain>
      <main className="min-h-dvh bg-background px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container space-y-5">
          <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
                Diretório de Funcionários
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Pessoal operacional sem acesso ao sistema — produtividade e alocação.
              </p>
            </div>
            <Button asChild size="sm" className="shrink-0 gap-1.5">
              <Link href="/funcionarios/novo">
                <Plus className="size-4" aria-hidden />
                Registrar
              </Link>
            </Button>
          </header>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <FuncionarioStatsCard
              icon={Users}
              label="Total"
              value={nf.format(kpi.totalFuncionarios)}
              trendPercent={kpi.totalFuncionariosTrendPercent}
              progressPercent={kpi.totalFuncionariosProgress}
            />
            <FuncionarioStatsCard
              icon={TrendingUp}
              label="Produtividade média"
              value={`${kpi.produtividadeMedia}%`}
              trendPercent={kpi.produtividadeMediaTrendPercent}
              progressPercent={kpi.produtividadeMediaProgress}
              iconClassName="bg-accent/10 text-accent"
              progressClassName="bg-accent"
            />
            <FuncionarioStatsCard
              icon={Clock}
              label="Horário médio"
              value={kpi.horarioMedioOperacao}
              trendPercent={kpi.horarioMedioTrendPercent}
              progressPercent={kpi.horarioMedioProgress}
              iconClassName="bg-secondary/10 text-secondary"
              progressClassName="bg-secondary"
            />
          </div>

          <div
            className={cn(
              glassPanelClassName,
              'flex flex-nowrap items-center gap-2 overflow-x-auto p-3',
            )}
            role="search"
          >
            <div className="relative min-w-[12rem] flex-1">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Nome ou matrícula..."
                className={filterSearchClassName}
                aria-label="Buscar funcionários"
              />
            </div>
            <select
              value={departamentoFiltro}
              onChange={(e) =>
                setDepartamentoFiltro(
                  e.target.value as typeof departamentoFiltro,
                )
              }
              className={cn(filterSelectClassName, 'w-[7.5rem]')}
              aria-label="Departamento"
            >
              {departamentoFiltroOpcoes.map((opcao) => (
                <option key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </option>
              ))}
            </select>
            <select
              value={turnoFiltro}
              onChange={(e) =>
                setTurnoFiltro(e.target.value as typeof turnoFiltro)
              }
              className={cn(filterSelectClassName, 'w-[6.5rem]')}
              aria-label="Turno"
            >
              {turnoFiltroOpcoes.map((opcao) => (
                <option key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </option>
              ))}
            </select>
            <select
              value={statusFiltro}
              onChange={(e) =>
                setStatusFiltro(e.target.value as typeof statusFiltro)
              }
              className={cn(filterSelectClassName, 'w-[6rem]')}
              aria-label="Status"
            >
              {statusFiltroOpcoes.map((opcao) => (
                <option key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </option>
              ))}
            </select>
          </div>

          <div className={cn(glassPanelClassName, 'overflow-hidden')}>
            <div className="overflow-x-auto">
              <table className={cn(compactTableClassName, 'table-fixed')}>
                <thead>
                  <tr className={compactTableHeadRowClassName}>
                    <th className={compactTableHeadCellClassName('w-[28%]')}>
                      Funcionário
                    </th>
                    <th className={compactTableHeadCellClassName('hidden w-[18%] sm:table-cell')}>
                      Cargo
                    </th>
                    <th className={compactTableHeadCellClassName('w-[22%]')}>
                      Operação
                    </th>
                    <th className={compactTableHeadCellClassName('w-[14%]')}>
                      Prod.
                    </th>
                    <th className={compactTableHeadCellClassName('w-[12%] text-center')}>
                      Status
                    </th>
                    <th className={compactTableHeadCellClassName('w-[6%] text-right')}>
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className={compactTableBodyClassName}>
                  {funcionarios.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className={compactTableEmptyCellClassName}
                      >
                        Nenhum funcionário encontrado com os filtros atuais.
                      </td>
                    </tr>
                  ) : (
                    funcionarios.map((funcionario) => (
                      <FuncionarioTableRow
                        key={funcionario.id}
                        funcionario={funcionario}
                        onVerHistorico={verHistorico}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              pagina={pagina}
              totalPaginas={totalPaginas}
              onChangePagina={setPagina}
              totalFiltrados={totalFiltrados}
              itemsInicio={itemsInicio}
              pageSize={pageSize}
              resourceLabelPlural="funcionários"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={exportarCsv}
              disabled={isLoading}
              className="gap-1.5"
            >
              <Download className="size-4" aria-hidden />
              Exportar CSV
            </Button>
            <span className="text-xs text-muted-foreground">
              {totalFiltrados === 0 ? 0 : itemsInicio + 1}–
              {Math.min(itemsInicio + pageSize, totalFiltrados)} de{' '}
              {nf.format(kpi.totalFuncionarios)}
            </span>
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}
