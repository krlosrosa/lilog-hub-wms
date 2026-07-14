'use client';

import Link from 'next/link';
import { useState, type ChangeEvent } from 'react';

import {
  ChevronRight,
  Download,
  Key,
  Loader2,
  Lock,
  Plus,
  Search,
  SearchX,
  ShieldCheck,
  Upload,
  Users,
  X,
} from 'lucide-react';

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
import { ImportPessoasModal } from '@/features/pessoas/components/import-pessoas-modal';
import {
  fieldInputClassName,
  glassPanelClassName,
} from '@/features/pessoas/components/pessoa-form-field-classes';
import { PessoaStatsCard } from '@/features/pessoas/components/pessoa-stats-card';
import { PessoaTableRow } from '@/features/pessoas/components/pessoa-table-row';
import { usePessoasGestao } from '@/features/pessoas/hooks/use-pessoas-gestao';
import { CARGO_OPTIONS } from '@/features/pessoas/types/pessoa.schema';
import { ResetSenhaModal } from '@/features/usuarios/components/reset-senha-modal';

const TABLE_HEADERS = [
  { label: 'Pessoa', className: 'min-w-[180px]' },
  { label: 'Cargo', className: 'hidden min-w-[120px] md:table-cell' },
  { label: 'Equipe', className: 'hidden min-w-[140px] lg:table-cell' },
  { label: 'Situação', className: 'w-24 text-center' },
  { label: 'Acesso', className: 'w-28 text-center' },
  { label: '', className: 'w-32 text-right' },
] as const;

const nf = new Intl.NumberFormat('pt-BR');

const filterSelectClassName =
  'h-9 min-w-0 flex-1 rounded-lg border border-outline-variant bg-surface-low px-3 text-xs text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none sm:min-w-[140px]';

export function PessoasGestaoView() {
  const [importModalOpen, setImportModalOpen] = useState(false);

  const {
    isLoading,
    kpi,
    pessoas,
    situacaoFiltro,
    setSituacaoFiltro,
    situacaoFiltroOpcoes,
    acessoFiltro,
    setAcessoFiltro,
    acessoFiltroOpcoes,
    equipeFiltro,
    setEquipeFiltro,
    equipeFiltroOpcoes,
    cargoFiltro,
    setCargoFiltro,
    busca,
    setBusca,
    temFiltrosAtivos,
    resetFiltros,
    pagina,
    setPagina,
    totalPaginas,
    totalFiltrados,
    itemsInicio,
    pageSize,
    resetSenhaModal,
    isResettingPassword,
    abrirResetSenha,
    fecharResetSenha,
    confirmarResetSenha,
    bloquearAcesso,
    desbloquearAcesso,
    desligar,
    exportarCsv,
    recarregar,
  } = usePessoasGestao();

  const listaVazia = !isLoading && pessoas.length === 0;

  return (
    <SidebarMain>
      <main className="min-h-dvh bg-background px-margin-mobile py-5 md:px-margin-desktop md:py-6">
        <div className="mx-auto max-w-container space-y-5">
          <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <nav
                aria-label="Breadcrumb"
                className="mb-1.5 flex items-center gap-1.5 text-[10px] text-muted-foreground"
              >
                <span>Gestão</span>
                <ChevronRight className="size-3" aria-hidden />
                <span className="text-primary">Pessoas</span>
              </nav>
              <h1 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
                Pessoas
              </h1>
              <p className="mt-1 max-w-2xl text-body-sm text-muted-foreground">
                Cadastro unificado de colaboradores operacionais, equipes e
                acesso ao sistema.
              </p>
            </div>
            <nav
              aria-label="Seções de pessoas"
              className="flex flex-wrap gap-4 border-b border-outline-variant pb-1"
            >
              <Link
                href="/pessoas"
                className="border-b-2 border-primary pb-1 text-label-md text-primary"
              >
                Diretório
              </Link>
              <Link
                href="/usuarios/perfis"
                className="pb-1 text-label-md text-muted-foreground transition-colors hover:text-primary"
              >
                Perfis de Acesso
              </Link>
            </nav>
          </header>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <PessoaStatsCard
              icon={Users}
              label="Total"
              value={nf.format(kpi.total)}
            />
            <PessoaStatsCard
              icon={ShieldCheck}
              label="Ativos"
              value={nf.format(kpi.ativosOperacionais)}
              iconClassName="bg-tertiary-container/10 text-tertiary"
            />
            <PessoaStatsCard
              icon={Key}
              label="Com Acesso"
              value={nf.format(kpi.comAcesso)}
              iconClassName="bg-secondary/10 text-secondary"
            />
            <PessoaStatsCard
              icon={Lock}
              label="Bloqueados"
              value={nf.format(kpi.bloqueados)}
              iconClassName="bg-destructive/10 text-destructive"
              valueClassName="text-destructive"
              borderClassName="border-destructive/20"
            />
          </div>

          <section className={cn(glassPanelClassName, 'overflow-hidden')}>
            <div className="border-b border-outline-variant p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative min-w-0 flex-1 lg:max-w-sm">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={busca}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setBusca(event.target.value)
                    }
                    placeholder="Buscar por nome ou matrícula…"
                    className={cn(fieldInputClassName, 'h-9 pl-9 text-sm')}
                    aria-label="Pesquisar pessoas"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5"
                    onClick={exportarCsv}
                    disabled={isLoading}
                  >
                    <Download className="size-3.5" aria-hidden />
                    <span className="hidden sm:inline">Exportar</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5"
                    onClick={() => setImportModalOpen(true)}
                    disabled={isLoading}
                  >
                    <Upload className="size-3.5" aria-hidden />
                    <span className="hidden sm:inline">Importar</span>
                  </Button>
                  <Button asChild size="sm" className="h-9 gap-1.5">
                    <Link href="/pessoas/novo">
                      <Plus className="size-3.5" aria-hidden />
                      Nova Pessoa
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  value={equipeFiltro}
                  onChange={(event) =>
                    setEquipeFiltro(event.target.value as typeof equipeFiltro)
                  }
                  className={filterSelectClassName}
                  aria-label="Filtrar por equipe"
                >
                  {equipeFiltroOpcoes.map((opcao) => (
                    <option key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </option>
                  ))}
                </select>

                <select
                  value={cargoFiltro}
                  onChange={(event) =>
                    setCargoFiltro(event.target.value as typeof cargoFiltro)
                  }
                  className={filterSelectClassName}
                  aria-label="Filtrar por cargo"
                >
                  <option value="todos">Todos os cargos</option>
                  {CARGO_OPTIONS.map((opcao) => (
                    <option key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </option>
                  ))}
                </select>

                <select
                  value={situacaoFiltro}
                  onChange={(event) =>
                    setSituacaoFiltro(event.target.value as typeof situacaoFiltro)
                  }
                  className={filterSelectClassName}
                  aria-label="Filtrar por situação"
                >
                  {situacaoFiltroOpcoes.map((opcao) => (
                    <option key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </option>
                  ))}
                </select>

                <select
                  value={acessoFiltro}
                  onChange={(event) =>
                    setAcessoFiltro(event.target.value as typeof acessoFiltro)
                  }
                  className={filterSelectClassName}
                  aria-label="Filtrar por acesso"
                >
                  {acessoFiltroOpcoes.map((opcao) => (
                    <option key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </option>
                  ))}
                </select>

                {temFiltrosAtivos ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 gap-1 text-muted-foreground"
                    onClick={resetFiltros}
                  >
                    <X className="size-3.5" aria-hidden />
                    Limpar filtros
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className={compactTableClassName}>
                <thead>
                  <tr className={compactTableHeadRowClassName}>
                    {TABLE_HEADERS.map((header) => (
                      <th
                        key={header.label || 'actions'}
                        className={compactTableHeadCellClassName(header.className)}
                      >
                        {header.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={compactTableBodyClassName}>
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={TABLE_HEADERS.length}
                        className={compactTableEmptyCellClassName}
                      >
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                          Carregando pessoas…
                        </span>
                      </td>
                    </tr>
                  ) : listaVazia ? (
                    <tr>
                      <td colSpan={TABLE_HEADERS.length} className="px-4 py-16">
                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                          <SearchX className="size-10 opacity-60" aria-hidden />
                          <div className="text-center">
                            <p className="text-sm font-medium text-foreground">
                              Nenhuma pessoa encontrada
                            </p>
                            <p className="mt-1 text-xs">
                              {temFiltrosAtivos
                                ? 'Tente ajustar os filtros ou limpar a busca.'
                                : 'Cadastre a primeira pessoa para começar.'}
                            </p>
                          </div>
                          {temFiltrosAtivos ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={resetFiltros}
                            >
                              Limpar filtros
                            </Button>
                          ) : (
                            <Button asChild size="sm">
                              <Link href="/pessoas/novo">Nova Pessoa</Link>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pessoas.map((pessoa) => (
                      <PessoaTableRow
                        key={pessoa.id}
                        pessoa={pessoa}
                        onResetSenha={abrirResetSenha}
                        onBloquear={bloquearAcesso}
                        onDesbloquear={desbloquearAcesso}
                        onDesligar={desligar}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalFiltrados > 0 ? (
              <Pagination
                pagina={pagina}
                totalPaginas={totalPaginas}
                onChangePagina={setPagina}
                totalFiltrados={totalFiltrados}
                itemsInicio={itemsInicio}
                pageSize={pageSize}
                resourceLabelPlural="pessoas"
              />
            ) : null}
          </section>
        </div>
      </main>

      <ResetSenhaModal
        open={resetSenhaModal.open}
        usuarioNome={resetSenhaModal.pessoaNome}
        isSubmitting={isResettingPassword}
        onOpenChange={fecharResetSenha}
        onConfirm={confirmarResetSenha}
      />

      <ImportPessoasModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onSuccess={() => {
          void recarregar();
        }}
      />
    </SidebarMain>
  );
}
