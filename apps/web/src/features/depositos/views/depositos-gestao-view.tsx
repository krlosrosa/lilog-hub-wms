'use client';

import {
  Check,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  Warehouse,
  X,
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
import { DepositoFormDialog } from '@/features/depositos/components/deposito-form-dialog';
import {
  DepositoFinalidadeBadge,
  DepositoSistemaBadge,
  DepositoStatusBadge,
} from '@/features/depositos/components/deposito-finalidade-badge';
import { useDepositosGestao } from '@/features/depositos/hooks/use-depositos-gestao';

const fieldInputClassName =
  'w-full rounded-lg border border-outline-variant bg-surface-low px-4 py-3 text-body-md text-foreground placeholder:text-muted-foreground focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const glassPanelClassName =
  'rounded-xl border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass';

function FlagCell({ enabled }: { enabled: boolean }) {
  return enabled ? (
    <Check className="size-4 text-tertiary" aria-label="Sim" />
  ) : (
    <X className="size-4 text-muted-foreground/60" aria-label="Não" />
  );
}

export function DepositosGestaoView() {
  const {
    unidadeId,
    isLoading,
    isSubmitting,
    depositos,
    stats,
    busca,
    setBusca,
    dialogOpen,
    dialogMode,
    depositoEmEdicao,
    abrirCriacao,
    abrirEdicao,
    fecharDialog,
    salvarDeposito,
    alternarAtivo,
  } = useDepositosGestao();

  return (
    <SidebarMain>
      <main className="min-h-dvh bg-background px-margin-mobile py-4 md:px-margin-desktop md:py-6">
        <div className="mx-auto max-w-container space-y-4 md:space-y-5">
          <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Estoque · WMS
              </p>
              <h1 className="text-headline-md font-bold tracking-tight text-foreground md:text-headline-lg">
                Gestão de Depósitos
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
                Configure depósitos lógicos de estoque por unidade.
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
                  placeholder="Buscar código ou nome..."
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  className={cn(
                    fieldInputClassName,
                    'h-9 w-full py-1.5 pl-8 pr-3 text-xs sm:w-56',
                  )}
                />
              </div>
              <Button
                size="sm"
                className="gap-1.5"
                disabled={!unidadeId || isSubmitting}
                onClick={abrirCriacao}
              >
                <Plus className="size-3.5" aria-hidden />
                Novo Depósito
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
            {[
              { label: 'Total', value: stats.total },
              { label: 'Ativos', value: stats.ativos },
              { label: 'Sistema', value: stats.sistema },
              { label: 'Customizados', value: stats.customizados },
            ].map((item) => (
              <div key={item.label} className={cn(glassPanelClassName, 'p-3 md:p-4')}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>

          <div className={cn(glassPanelClassName, 'overflow-hidden')}>
            {!unidadeId ? (
              <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
                <Warehouse className="size-8 text-muted-foreground" aria-hidden />
                <p className="text-sm font-medium text-foreground">
                  Selecione uma unidade
                </p>
                <p className="max-w-md text-xs text-muted-foreground">
                  Escolha a unidade operacional para visualizar e gerenciar os
                  depósitos lógicos.
                </p>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Carregando depósitos...
              </div>
            ) : depositos.length === 0 ? (
              <p className={compactTableEmptyCellClassName}>
                Nenhum depósito encontrado para os filtros atuais.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className={compactTableClassName}>
                  <thead>
                    <tr className={compactTableHeadRowClassName}>
                      {[
                        { label: 'Código', className: 'min-w-[100px]' },
                        { label: 'Nome', className: 'min-w-[160px]' },
                        { label: 'Finalidade', className: 'min-w-[140px]' },
                        { label: 'Venda', className: 'w-12 text-center' },
                        { label: 'Picking', className: 'w-12 text-center hidden sm:table-cell' },
                        { label: 'Endereço', className: 'w-14 text-center hidden md:table-cell' },
                        { label: 'Disponível', className: 'w-14 text-center hidden lg:table-cell' },
                        { label: 'Tipo', className: 'w-24' },
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
                    {depositos.map((item) => (
                      <tr
                        key={item.id}
                        className={cn(
                          compactTableRowClassName,
                          !item.ativo && 'opacity-60',
                        )}
                      >
                        <td className={compactTableCellClassName}>
                          <span className="font-mono text-[11px] font-semibold text-primary">
                            {item.codigo}
                          </span>
                        </td>
                        <td className={compactTableCellClassName}>
                          <span className="text-sm font-medium text-foreground">
                            {item.nome}
                          </span>
                        </td>
                        <td className={compactTableCellClassName}>
                          <DepositoFinalidadeBadge
                            finalidade={item.finalidade}
                            compact
                            muted={!item.ativo}
                          />
                        </td>
                        <td className={cn(compactTableCellClassName, 'text-center')}>
                          <FlagCell enabled={item.permiteVenda} />
                        </td>
                        <td
                          className={cn(
                            compactTableCellClassName,
                            'hidden text-center sm:table-cell',
                          )}
                        >
                          <FlagCell enabled={item.permitePicking} />
                        </td>
                        <td
                          className={cn(
                            compactTableCellClassName,
                            'hidden text-center md:table-cell',
                          )}
                        >
                          <FlagCell enabled={item.exigeEndereco} />
                        </td>
                        <td
                          className={cn(
                            compactTableCellClassName,
                            'hidden text-center lg:table-cell',
                          )}
                        >
                          <FlagCell enabled={item.contaDisponivel} />
                        </td>
                        <td className={compactTableCellClassName}>
                          <DepositoSistemaBadge sistema={item.sistema} compact />
                        </td>
                        <td className={compactTableCellClassName}>
                          <DepositoStatusBadge ativo={item.ativo} compact />
                        </td>
                        <td className={cn(compactTableCellClassName, 'text-right')}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="rounded p-0.5 text-muted-foreground opacity-60 transition-all hover:bg-muted hover:text-primary group-hover:opacity-100"
                                aria-label={`Mais opções para ${item.codigo}`}
                              >
                                <MoreVertical className="size-3.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => abrirEdicao(item)}>
                                Editar
                              </DropdownMenuItem>
                              {!item.sistema && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => void alternarAtivo(item)}
                                  >
                                    {item.ativo ? 'Inativar' : 'Ativar'}
                                  </DropdownMenuItem>
                                </>
                              )}
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
        </div>

        <DepositoFormDialog
          open={dialogOpen}
          onOpenChange={fecharDialog}
          mode={dialogMode}
          deposito={depositoEmEdicao}
          isSubmitting={isSubmitting}
          onSubmit={salvarDeposito}
        />
      </main>
    </SidebarMain>
  );
}
