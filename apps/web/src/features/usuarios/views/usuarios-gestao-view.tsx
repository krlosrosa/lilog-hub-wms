'use client';

import Link from 'next/link';

import {
  Database,
  Key,
  Lock,
  Search,
  ShieldCheck,
  Users,
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
import {
  fieldInputClassName,
  glassPanelClassName,
} from '@/features/usuarios/components/usuario-form-field-classes';
import { UsuarioStatsCard } from '@/features/usuarios/components/usuario-stats-card';
import { UsuarioTableRow } from '@/features/usuarios/components/usuario-table-row';
import { ResetSenhaModal } from '@/features/usuarios/components/reset-senha-modal';
import { useUsuariosGestao } from '@/features/usuarios/hooks/use-usuarios-gestao';

const TABLE_HEADERS = [
  { label: 'Usuário', className: 'min-w-[160px]' },
  { label: 'Perfil', className: 'w-24' },
  { label: 'Status', className: 'w-20 text-center' },
  { label: 'Último Login', className: 'hidden md:table-cell min-w-[100px]' },
  { label: '', className: 'w-24 text-right' },
] as const;

const nf = new Intl.NumberFormat('pt-BR');

export function UsuariosGestaoView() {
  const {
    isLoading,
    kpi,
    usuarios,
    statusFiltro,
    setStatusFiltro,
    statusFiltroOpcoes,
    busca,
    setBusca,
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
    suspender,
    desbloquear,
    excluir,
    exportarCsv,
  } = useUsuariosGestao();

  return (
    <SidebarMain>
      <main className="min-h-dvh bg-background px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container">
          <header className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
                Gestão de Usuários
              </h1>
              <p className="mt-2 text-body-md text-muted-foreground">
                Monitore identidades, perfis e status de acesso do pessoal.
              </p>
            </div>
            <nav
              aria-label="Seções de gestão de usuários"
              className="flex flex-wrap gap-4 border-b border-outline-variant pb-1"
            >
              <Link
                href="/usuarios"
                className="border-b-2 border-primary pb-1 text-label-md text-primary"
              >
                Usuários
              </Link>
              <Link
                href="/usuarios/perfis"
                className="pb-1 text-label-md text-muted-foreground transition-colors hover:text-primary"
              >
                Funções
              </Link>
            </nav>
          </header>

          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={exportarCsv} disabled={isLoading}>
                Exportar CSV
              </Button>
              <Button asChild>
                <Link href="/usuarios/novo">Criar Usuário</Link>
              </Button>
            </div>
          </div>

          <div
            className={cn(
              glassPanelClassName,
              'mb-6 flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between',
            )}
          >
            <div className="relative w-full md:w-80">
              <Search
                className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Pesquisar por nome, e-mail ou função..."
                className={cn(fieldInputClassName, 'h-8 py-1 pl-8 text-xs')}
                aria-label="Pesquisar usuários"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
              <span className="mr-1 text-[10px] font-bold text-muted-foreground">
                FILTROS:
              </span>
              {statusFiltroOpcoes.map((opcao) => (
                <button
                  key={opcao.value}
                  type="button"
                  onClick={() => setStatusFiltro(opcao.value)}
                  className={cn(
                    'whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors',
                    statusFiltro === opcao.value
                      ? 'border border-primary/20 bg-surface-highest font-bold text-primary'
                      : 'bg-surface-low text-muted-foreground hover:bg-surface-high',
                  )}
                >
                  {opcao.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <UsuarioStatsCard
              icon={Users}
              label="Pessoal Total"
              value={nf.format(kpi.totalPessoal)}
              trend={`+${kpi.totalPessoalTrendPercent}% ↑`}
            />
            <UsuarioStatsCard
              icon={ShieldCheck}
              label="Ativos Agora"
              value={nf.format(kpi.ativosAgora)}
              trend={`${kpi.ativosPercent}% System`}
              iconClassName="bg-tertiary-container/10 text-tertiary"
            />
            <UsuarioStatsCard
              icon={Lock}
              label="Contas Sinalizadas"
              value={nf.format(kpi.contasSinalizadas)}
              trend="Action Req."
              iconClassName="bg-destructive/10 text-destructive"
              valueClassName="text-destructive"
              borderClassName="border-destructive/20"
            />
            <UsuarioStatsCard
              icon={Key}
              label="Rotação de Senha"
              value={`${kpi.rotacaoSenhaPercent}%`}
              trend="AVG 32d"
              iconClassName="bg-secondary/10 text-secondary"
            />
          </div>

          <div className={cn(glassPanelClassName, 'overflow-hidden')}>
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
                  {usuarios.length === 0 ? (
                    <tr>
                      <td
                        colSpan={TABLE_HEADERS.length}
                        className={compactTableEmptyCellClassName}
                      >
                        Nenhum usuário encontrado com os filtros atuais.
                      </td>
                    </tr>
                  ) : (
                    usuarios.map((usuario) => (
                      <UsuarioTableRow
                        key={usuario.id}
                        usuario={usuario}
                        onResetSenha={abrirResetSenha}
                        onSuspender={suspender}
                        onDesbloquear={desbloquear}
                        onExcluir={excluir}
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

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className={cn(glassPanelClassName, 'relative overflow-hidden p-6')}>
              <h4 className="mb-2 flex items-center text-sm font-bold text-foreground">
                <ShieldCheck className="mr-2 size-4 text-primary" aria-hidden />
                Protocolo de Segurança Ativo
              </h4>
              <p className="text-caption leading-relaxed text-muted-foreground">
                O acesso do usuário é monitorado por meio de logs criptografados.
                Contas bloqueadas exigem anulação do administrador sênior.
              </p>
            </div>
            <div className={cn(glassPanelClassName, 'relative overflow-hidden p-6')}>
              <h4 className="mb-2 flex items-center text-sm font-bold text-foreground">
                <Database className="mr-2 size-4 text-secondary" aria-hidden />
                Sincronização de Dados
              </h4>
              <p className="text-caption leading-relaxed text-muted-foreground">
                A última sincronização do diretório central foi concluída há 12
                minutos. Alterações nos perfis são propagadas instantaneamente.
              </p>
            </div>
          </div>
        </div>
      </main>

      <ResetSenhaModal
        open={resetSenhaModal.open}
        usuarioNome={resetSenhaModal.usuarioNome}
        isSubmitting={isResettingPassword}
        onOpenChange={fecharResetSenha}
        onConfirm={confirmarResetSenha}
      />
    </SidebarMain>
  );
}
