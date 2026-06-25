'use client';

import Link from 'next/link';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  cn,
} from '@lilog/ui';
import { Check, ChevronRight, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';
import {
  compactTableBodyClassName,
  compactTableClassName,
  compactTableEmptyCellClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
} from '@/components/ui/compact-table-classes';
import { Pagination } from '@/features/filiais/components/pagination';
import { ClienteEspecialBadge } from '@/features/cliente-especial-expedicao/components/cliente-especial-badge';
import {
  fieldInputClassName,
  fieldLabelClassName,
  sectionCardClassName,
} from '@/features/cliente-especial-expedicao/components/form-field-classes';
import { useClientesEspeciaisLista } from '@/features/cliente-especial-expedicao/hooks/use-clientes-especiais-lista';
import type { ClienteEspecialListaItem } from '@/features/cliente-especial-expedicao/types/cliente-especial.schema';

const TABLE_HEADERS = [
  { label: 'Código', className: 'w-[12%]' },
  { label: 'Cliente', className: 'min-w-[180px]' },
  { label: 'Separação', className: 'w-[12%]' },
  { label: 'Carregamento', className: 'w-[12%]' },
  { label: 'Segregar mapa', className: 'w-[12%]' },
  { label: 'Status', className: 'w-[10%]' },
  { label: '', className: 'w-20 text-right' },
] as const;

function FlagCell({ ativo }: { ativo: boolean }) {
  return ativo ? (
    <span className="inline-flex items-center gap-1 text-emerald-600">
      <Check className="size-3.5" aria-hidden />
      Sim
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <X className="size-3.5" aria-hidden />
      Não
    </span>
  );
}

function StatusBadge({ ativo }: { ativo: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        ativo
          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
          : 'bg-muted text-muted-foreground',
      )}
    >
      {ativo ? 'Ativo' : 'Inativo'}
    </span>
  );
}

function ClienteEspecialRow({
  item,
  onDelete,
}: {
  item: ClienteEspecialListaItem;
  onDelete: (item: ClienteEspecialListaItem) => void;
}) {
  const temRegraEspecial =
    item.exigeSegregacaoMapa ||
    item.exigeSeparacaoEspecial ||
    item.exigeCarregamentoEspecial;

  return (
    <tr className="border-b border-outline-variant/60 transition-colors hover:bg-muted/30">
      <td className="px-3 py-2.5 font-mono text-xs text-foreground">
        {item.codCliente}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">
            {item.nomeCliente}
          </span>
          {temRegraEspecial ? <ClienteEspecialBadge compact /> : null}
        </div>
      </td>
      <td className="px-3 py-2.5 text-sm">
        <FlagCell ativo={item.exigeSeparacaoEspecial} />
      </td>
      <td className="px-3 py-2.5 text-sm">
        <FlagCell ativo={item.exigeCarregamentoEspecial} />
      </td>
      <td className="px-3 py-2.5 text-sm">
        <FlagCell ativo={item.exigeSegregacaoMapa} />
      </td>
      <td className="px-3 py-2.5">
        <StatusBadge ativo={item.ativo} />
      </td>
      <td className="px-3 py-2.5 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button type="button" variant="ghost" size="icon" className="size-8" asChild>
            <Link href={`/expedicao/clientes-especiais/${item.id}/edit`}>
              <Pencil className="size-3.5" aria-hidden />
              <span className="sr-only">Editar</span>
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(item)}
          >
            <Trash2 className="size-3.5" aria-hidden />
            <span className="sr-only">Excluir</span>
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function ClientesEspeciaisListaView() {
  const {
    unidadeSelecionada,
    isLoading,
    isSubmitting,
    items,
    busca,
    setBusca,
    filtroAtivo,
    setFiltroAtivo,
    pagina,
    setPagina,
    totalPaginas,
    itemsInicio,
    totalFiltrados,
    pageSize,
    clienteParaExcluir,
    setClienteParaExcluir,
    confirmarExclusao,
  } = useClientesEspeciaisLista();

  return (
    <SidebarMain>
      <AlertDialog
        open={clienteParaExcluir != null}
        onOpenChange={(open) => {
          if (!open) {
            setClienteParaExcluir(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente especial?</AlertDialogTitle>
            <AlertDialogDescription>
              O cadastro de{' '}
              <strong>
                {clienteParaExcluir?.codCliente} — {clienteParaExcluir?.nomeCliente}
              </strong>{' '}
              será removido. Transportes futuros não exibirão mais as observações
              automáticas deste cliente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={isSubmitting}
              onClick={() => void confirmarExclusao()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Excluindo…
                </>
              ) : (
                'Excluir'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <main className="px-margin-mobile py-5 md:px-margin-desktop md:py-6">
        <div className="mx-auto max-w-container space-y-4">
          <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <nav
                aria-label="Breadcrumb"
                className="mb-1 flex items-center gap-1.5 text-[10px] text-muted-foreground"
              >
                <span>Expedição</span>
                <ChevronRight className="size-3" aria-hidden />
                <span className="text-primary">Clientes Especiais</span>
              </nav>
              <h1 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
                Clientes Especiais
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Cadastre clientes com separação ou carregamento especial. Quando
                aparecerem em um transporte, o sistema alertará automaticamente na
                geração de mapas.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              className="h-8 shrink-0 gap-1.5 self-start sm:self-auto"
              asChild
            >
              <Link href="/expedicao/clientes-especiais/novo">
                <Plus className="size-3.5 shrink-0" aria-hidden />
                Novo cliente especial
              </Link>
            </Button>
          </header>

          <section className="overflow-hidden rounded-xl border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
            <div className="flex flex-col gap-3 border-b border-outline-variant px-4 py-3 md:flex-row md:items-center md:justify-between">
              <input
                value={busca}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setBusca(event.target.value)
                }
                placeholder="Buscar por código ou nome..."
                className={cn(fieldInputClassName, 'max-w-md')}
              />
              <select
                value={filtroAtivo}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                  setFiltroAtivo(
                    event.target.value as 'todos' | 'ativos' | 'inativos',
                  )
                }
                className={cn(fieldInputClassName, 'w-full md:w-44')}
              >
                <option value="todos">Todos</option>
                <option value="ativos">Ativos</option>
                <option value="inativos">Inativos</option>
              </select>
            </div>

            {!unidadeSelecionada ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                Selecione uma unidade para listar os clientes especiais.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className={cn(compactTableClassName, 'table-fixed')}>
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
                              Carregando clientes especiais...
                            </span>
                          </td>
                        </tr>
                      ) : items.length ? (
                        items.map((item) => (
                          <ClienteEspecialRow
                            key={item.id}
                            item={item}
                            onDelete={setClienteParaExcluir}
                          />
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={TABLE_HEADERS.length}
                            className={compactTableEmptyCellClassName}
                          >
                            Nenhum cliente especial encontrado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  pagina={pagina}
                  totalPaginas={totalPaginas}
                  itemsInicio={itemsInicio}
                  totalFiltrados={totalFiltrados}
                  pageSize={pageSize}
                  onChangePagina={setPagina}
                  resourceLabelPlural="clientes especiais"
                />
              </>
            )}
          </section>
        </div>
      </main>
    </SidebarMain>
  );
}
