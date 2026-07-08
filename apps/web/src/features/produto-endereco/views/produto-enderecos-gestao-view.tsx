'use client';

import { useCallback, useMemo, useState } from 'react';

import {
  AlertCircle,
  Filter,
  Loader2,
  MapPin,
  Package,
  PackageOpen,
  Search,
  Upload,
} from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import {
  compactTableBodyClassName,
  compactTableClassName,
  compactTableEmptyCellClassName,
  compactTableHeadRowClassName,
} from '@/components/ui/compact-table-classes';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { Pagination } from '@/features/filiais/components/pagination';
import { EnderecoKpiCard } from '@/features/enderecos/components/endereco-kpi-card';
import {
  ProdutoEnderecosFiltrosSheet,
  type ProdutoEnderecosFiltrosSheetState,
} from '@/features/produto-endereco/components/produto-enderecos-filtros-sheet';
import { ProdutoEnderecosExportButton } from '@/features/produto-endereco/components/produto-enderecos-export-button';
import { ProdutoEnderecosImportDialog } from '@/features/produto-endereco/components/produto-enderecos-import-dialog';
import {
  fieldInputClassName,
  glassPanelClassName,
} from '@/features/produto-endereco/components/form-field-classes';
import { SlottingEnderecoRow } from '@/features/produto-endereco/components/slotting-endereco-row';
import {
  type SlottingSortColumn,
  useProdutoEnderecosGestao,
} from '@/features/produto-endereco/hooks/use-produto-enderecos-gestao';

const nf = new Intl.NumberFormat('pt-BR');

const COLUNAS_ORDENAVEIS: {
  column: SlottingSortColumn;
  label: string;
  className?: string;
}[] = [
  { column: 'endereco', label: 'Endereço', className: 'min-w-[120px]' },
  { column: 'zona', label: 'Zona / Rua' },
  { column: 'tipo', label: 'Tipo', className: 'hidden sm:table-cell' },
  { column: 'produto', label: 'Produto', className: 'min-w-[220px]' },
  { column: 'papel', label: 'Papel' },
  { column: 'ordem', label: 'Ordem', className: 'w-16' },
  { column: 'status', label: 'Status', className: 'w-20' },
];

export function ProdutoEnderecosGestaoView() {
  const [importDialogAberto, setImportDialogAberto] = useState(false);
  const [filtrosSheetAberto, setFiltrosSheetAberto] = useState(false);

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
    papelFiltro,
    setPapelFiltro,
    ativoFiltro,
    setAtivoFiltro,
    zonasFiltro,
    setZonasFiltro,
    busca,
    setBusca,
    buscaProduto,
    setBuscaProduto,
    apenasPendentes,
    setApenasPendentes,
    sortColumn,
    sortDirection,
    alternarOrdenacao,
    filtrosAtivos,
    statsCentro,
    pendentesCount,
    pagina,
    setPagina,
    totalPaginas,
    total,
    totalExibidos,
    pageSize,
    linhas,
    selecionarProduto,
    limparProduto,
    alterarPapel,
    alterarOrdem,
    confirmarOrdem,
    alterarAtivo,
    recarregar,
    formatCentroLabel,
  } = useProdutoEnderecosGestao();

  const filtrosSheet = useMemo(
    (): ProdutoEnderecosFiltrosSheetState => ({
      centroId,
      tipoFiltro,
      slottingFiltro,
      papelFiltro,
      ativoFiltro,
      zonasFiltro,
      buscaProduto,
      apenasPendentes,
    }),
    [
      centroId,
      tipoFiltro,
      slottingFiltro,
      papelFiltro,
      ativoFiltro,
      zonasFiltro,
      buscaProduto,
      apenasPendentes,
    ],
  );

  const aplicarFiltrosSheet = useCallback(
    (filtros: ProdutoEnderecosFiltrosSheetState) => {
      setCentroId(filtros.centroId);
      setTipoFiltro(filtros.tipoFiltro);
      setSlottingFiltro(filtros.slottingFiltro);
      setPapelFiltro(filtros.papelFiltro);
      setAtivoFiltro(filtros.ativoFiltro);
      setZonasFiltro(filtros.zonasFiltro);
      setBuscaProduto(filtros.buscaProduto);
      setApenasPendentes(filtros.apenasPendentes);
    },
    [
      setCentroId,
      setTipoFiltro,
      setSlottingFiltro,
      setPapelFiltro,
      setAtivoFiltro,
      setZonasFiltro,
      setBuscaProduto,
      setApenasPendentes,
    ],
  );

  const exportParams = useMemo(
    () =>
      centroId
        ? {
            centroId,
            unidadeId,
            tipo: tipoFiltro === 'todos' ? undefined : tipoFiltro,
            search: busca,
            slotting:
              slottingFiltro === 'todos' ? undefined : slottingFiltro,
          }
        : null,
    [busca, centroId, slottingFiltro, tipoFiltro, unidadeId],
  );

  const itemsInicio = total === 0 ? 0 : (pagina - 1) * pageSize + 1;
  const itemsFim = Math.min(pagina * pageSize, total);
  const taxaAlocacao =
    total > 0 ? Math.round((statsCentro.enderecosComProduto / total) * 100) : 0;

  return (
    <SidebarMain>
      <main className="min-h-dvh bg-background px-margin-mobile py-4 md:px-margin-desktop md:py-6">
        <div className="mx-auto max-w-container space-y-4 md:space-y-5">
          <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Dados mestres · WMS
              </p>
              <h1 className="text-headline-md font-bold tracking-tight text-foreground md:text-headline-lg">
                Slotting — Produto × Endereço
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
                Aloque produtos nos endereços do centro ou importe alterações em
                massa via Excel.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[12rem] flex-1 sm:flex-none">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  id="filtro-busca-endereco"
                  type="search"
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder="Buscar endereço..."
                  className={cn(
                    fieldInputClassName,
                    'h-9 w-full py-1.5 pl-8 pr-3 text-xs sm:w-52',
                  )}
                />
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setFiltrosSheetAberto(true)}
              >
                <Filter className="size-3.5" aria-hidden />
                Filtros
                {filtrosAtivos > 0 && (
                  <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                    {filtrosAtivos}
                  </span>
                )}
              </Button>

              <ProdutoEnderecosExportButton
                params={exportParams}
                disabled={!centroId || isLoading}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setImportDialogAberto(true)}
                disabled={!centroId}
              >
                <Upload className="size-3.5" aria-hidden />
                Importar
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-2 gap-2 md:gap-3 xl:grid-cols-4">
            <EnderecoKpiCard
              icon={
                <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
              }
              label="Endereços (filtro)"
              value={nf.format(total)}
              footer={
                <p className="text-[10px] text-muted-foreground">
                  Página {pagina} de {totalPaginas}
                </p>
              }
            />
            <EnderecoKpiCard
              icon={
                <Package
                  className="size-4 shrink-0 text-secondary"
                  aria-hidden
                />
              }
              label="Endereços alocados"
              value={nf.format(statsCentro.enderecosComProduto)}
              badge={
                <span className="text-[10px] font-medium text-muted-foreground">
                  {nf.format(statsCentro.totalAlocacoes)} alocações
                </span>
              }
              progressPercent={taxaAlocacao}
              progressClassName="bg-secondary"
            />
            <EnderecoKpiCard
              icon={
                <PackageOpen
                  className="size-4 shrink-0 text-tertiary"
                  aria-hidden
                />
              }
              label="Exibidos agora"
              value={nf.format(totalExibidos)}
              badge={
                <span className="text-[10px] font-medium text-muted-foreground">
                  Nesta página
                </span>
              }
            />
            <EnderecoKpiCard
              variant={pendentesCount > 0 ? 'critical' : 'default'}
              icon={
                <AlertCircle
                  className={cn(
                    'size-4 shrink-0',
                    pendentesCount > 0
                      ? 'text-destructive'
                      : 'text-muted-foreground',
                  )}
                  aria-hidden
                />
              }
              label="Alterações pendentes"
              value={nf.format(pendentesCount)}
              badge={
                pendentesCount > 0 ? (
                  <span className="text-[10px] font-bold text-destructive">
                    Salvar na tabela
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-muted-foreground">
                    Sincronizado
                  </span>
                )
              }
            />
          </div>

          <ProdutoEnderecosImportDialog
            open={importDialogAberto}
            onOpenChange={setImportDialogAberto}
            onSuccess={() => void recarregar()}
          />

          <ProdutoEnderecosFiltrosSheet
            open={filtrosSheetAberto}
            onOpenChange={setFiltrosSheetAberto}
            filtros={filtrosSheet}
            onAplicar={aplicarFiltrosSheet}
            centros={centros}
            unidadeId={unidadeId}
            formatCentroLabel={formatCentroLabel}
          />

          <div className={cn(glassPanelClassName, 'overflow-hidden p-0')}>
            <div className="flex flex-col gap-1 border-b border-outline-variant px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {isLoading ? (
                  'Carregando endereços...'
                ) : !centroId ? (
                  'Selecione um centro para configurar o slotting.'
                ) : (
                  <>
                    <span className="font-semibold text-foreground">
                      {nf.format(totalExibidos)}
                    </span>{' '}
                    de {nf.format(total)} endereço
                    {total === 1 ? '' : 's'} nesta página
                    {pendentesCount > 0 && (
                      <span className="ml-1 text-destructive">
                        · {pendentesCount} pendente
                        {pendentesCount === 1 ? '' : 's'}
                      </span>
                    )}
                  </>
                )}
              </p>
              {sortColumn && (
                <p className="text-[10px] text-muted-foreground">
                  Ordenado por{' '}
                  <span className="font-medium text-foreground">
                    {
                      COLUNAS_ORDENAVEIS.find(
                        (item) => item.column === sortColumn,
                      )?.label
                    }
                  </span>{' '}
                  ({sortDirection === 'asc' ? 'crescente' : 'decrescente'})
                </p>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
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
                        {COLUNAS_ORDENAVEIS.map((coluna) => (
                          <SortableTableHead
                            key={coluna.column}
                            label={coluna.label}
                            column={coluna.column}
                            activeColumn={sortColumn}
                            direction={sortDirection}
                            onSort={alternarOrdenacao}
                            className={coluna.className}
                          />
                        ))}
                      </tr>
                    </thead>
                    <tbody className={compactTableBodyClassName}>
                      {linhas.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className={compactTableEmptyCellClassName}
                          >
                            Nenhum endereço encontrado para os filtros
                            selecionados.
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
                    {itemsInicio}–{itemsFim} de {total} endereços carregados
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
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}
