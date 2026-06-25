'use client';

import { Loader2, Search } from 'lucide-react';

import { cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import {
  compactTableBodyClassName,
  compactTableCellClassName,
  compactTableClassName,
  compactTableEmptyCellClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
} from '@/components/ui/compact-table-classes';
import { Pagination } from '@/features/filiais/components/pagination';
import { ENDERECO_TIPO_LABELS } from '@/features/enderecos/types/enderecos-gestao.schema';
import {
  fieldInputClassName,
  fieldLabelClassName,
  glassPanelClassName,
} from '@/features/produto-endereco/components/form-field-classes';
import { SlottingEnderecoRow } from '@/features/produto-endereco/components/slotting-endereco-row';
import {
  type FiltroSlotting,
  type FiltroTipoEndereco,
  useProdutoEnderecosGestao,
} from '@/features/produto-endereco/hooks/use-produto-enderecos-gestao';

const TIPO_FILTRO_OPCOES: { value: FiltroTipoEndereco; label: string }[] = [
  { value: 'todos', label: 'Todos os tipos' },
  { value: 'picking', label: ENDERECO_TIPO_LABELS.picking },
  { value: 'pulmao', label: ENDERECO_TIPO_LABELS.pulmao },
];

const SLOTTING_FILTRO_OPCOES: { value: FiltroSlotting; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'com_produto', label: 'Com produto' },
  { value: 'sem_produto', label: 'Sem produto' },
];

export function ProdutoEnderecosGestaoView() {
  const {
    unidadeId,
    isLoading,
    centros,
    centroId,
    setCentroId,
    tipoFiltro,
    setTipoFiltro,
    slottingFiltro,
    setSlottingFiltro,
    busca,
    setBusca,
    pagina,
    setPagina,
    totalPaginas,
    total,
    pageSize,
    linhas,
    selecionarProduto,
    limparProduto,
    alterarPapel,
    alterarOrdem,
    confirmarOrdem,
    alterarAtivo,
    formatCentroLabel,
  } = useProdutoEnderecosGestao();

  const itemsInicio = total === 0 ? 0 : (pagina - 1) * pageSize + 1;
  const itemsFim = Math.min(pagina * pageSize, total);

  return (
    <SidebarMain>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
        <header>
          <p className="text-caption font-medium uppercase tracking-wide text-muted-foreground">
            Dados mestres
          </p>
          <h1 className="text-headline-lg font-bold text-foreground">
            Slotting — Produto × Endereço
          </h1>
          <p className="mt-1 text-body-md text-muted-foreground">
            Selecione um centro, veja os endereços e aloque produtos diretamente
            na tabela.
          </p>
        </header>

        <section className={glassPanelClassName}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="filtro-centro" className={fieldLabelClassName}>
                Centro
              </label>
              <select
                id="filtro-centro"
                value={centroId}
                onChange={(event) => setCentroId(event.target.value)}
                className={fieldInputClassName}
                disabled={!unidadeId}
              >
                {centros.length === 0 ? (
                  <option value="">Carregando...</option>
                ) : (
                  centros.map((centro) => (
                    <option key={centro.id} value={centro.id}>
                      {formatCentroLabel(centro)}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label htmlFor="filtro-tipo" className={fieldLabelClassName}>
                Tipo de endereço
              </label>
              <select
                id="filtro-tipo"
                value={tipoFiltro}
                onChange={(event) =>
                  setTipoFiltro(event.target.value as FiltroTipoEndereco)
                }
                className={fieldInputClassName}
              >
                {TIPO_FILTRO_OPCOES.map((opcao) => (
                  <option key={opcao.value} value={opcao.value}>
                    {opcao.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filtro-slotting" className={fieldLabelClassName}>
                Alocação
              </label>
              <select
                id="filtro-slotting"
                value={slottingFiltro}
                onChange={(event) =>
                  setSlottingFiltro(event.target.value as FiltroSlotting)
                }
                className={fieldInputClassName}
              >
                {SLOTTING_FILTRO_OPCOES.map((opcao) => (
                  <option key={opcao.value} value={opcao.value}>
                    {opcao.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filtro-busca" className={fieldLabelClassName}>
                Buscar endereço
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  id="filtro-busca"
                  type="search"
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder="Zona, rua, posição..."
                  className={cn(fieldInputClassName, 'pl-9')}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-outline-variant bg-card shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" aria-hidden />
              Carregando endereços...
            </div>
          ) : !centroId ? (
            <div className="px-6 py-16 text-center text-body-md text-muted-foreground">
              Selecione uma unidade e um centro para configurar o slotting.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className={cn(compactTableClassName, 'min-w-[960px]')}>
                  <thead>
                    <tr className={compactTableHeadRowClassName}>
                      <th className={compactTableHeadCellClassName()}>Endereço</th>
                      <th className={compactTableHeadCellClassName()}>Zona / Rua</th>
                      <th className={compactTableHeadCellClassName()}>Tipo</th>
                      <th className={compactTableHeadCellClassName('min-w-[220px]')}>
                        Produto
                      </th>
                      <th className={compactTableHeadCellClassName()}>Papel</th>
                      <th className={compactTableHeadCellClassName()}>Ordem</th>
                      <th className={compactTableHeadCellClassName()}>Status</th>
                    </tr>
                  </thead>
                  <tbody className={compactTableBodyClassName}>
                    {linhas.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className={compactTableEmptyCellClassName}
                        >
                          Nenhum endereço encontrado para os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      linhas.map((linha) => (
                        <SlottingEnderecoRow
                          key={linha.enderecoId}
                          linha={linha}
                          disabled={!centroId}
                          onSelectProduto={selecionarProduto}
                          onClearProduto={limparProduto}
                          onChangePapel={alterarPapel}
                          onChangeOrdem={alterarOrdem}
                          onConfirmOrdem={confirmarOrdem}
                          onChangeAtivo={alterarAtivo}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-outline-variant px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-caption text-muted-foreground">
                  {itemsInicio}–{itemsFim} de {total} endereços
                </p>
                <Pagination
                  pagina={pagina}
                  totalPaginas={totalPaginas}
                  onChangePagina={setPagina}
                  totalFiltrados={total}
                  itemsInicio={itemsInicio}
                  pageSize={pageSize}
                  resourceLabelPlural="endereços"
                  compact
                />
              </div>
            </>
          )}
        </section>
      </div>
    </SidebarMain>
  );
}
