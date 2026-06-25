'use client';

import { Button, cn } from '@lilog/ui';
import {
  Loader2,
  Pencil,
  RefreshCw,
  Search,
  SearchX,
  Truck,
  X,
} from 'lucide-react';
import { useState } from 'react';

import { SidebarMain } from '@/components/layout/sidebar';
import {
  compactTableBodyClassName,
  compactTableCellClassName,
  compactTableClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
  compactTableRowClassName,
} from '@/components/ui/compact-table-classes';
import { Pagination } from '@/features/filiais/components/pagination';
import { PlacaEditSheet } from '@/features/transporte/components/placa-edit-sheet';
import { usePlacas } from '@/features/transporte/hooks/use-placas';
import {
  TODAS_TRANSPORTADORAS_ID,
  TODOS_TIPOS_VEICULO_ID,
  formatPlacaDecimal,
} from '@/features/transporte/types/placa-transportadora.schema';
import type { PlacaTransportadora } from '@/features/transporte/types/placa-transportadora.schema';

const filterFieldClass = cn(
  'w-full rounded-lg border border-outline-variant bg-surface-low px-3 py-2',
  'text-body-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring',
  'disabled:cursor-not-allowed disabled:opacity-60',
);

const filterLabelClass =
  'mb-2 block text-caption font-semibold uppercase tracking-wide text-muted-foreground';

export function PlacasView() {
  const {
    transportadoras,
    transportadoraSelecionada,
    transportadoraSelecionadaId,
    visualizandoTodas,
    selecionarTransportadora,
    perfisTarifas,
    isLoadingPerfis,
    tiposVeiculo,
    tipoVeiculoFiltro,
    selecionarTipoVeiculo,
    placas,
    totalFiltrados,
    pagina,
    setPagina,
    totalPaginas,
    itemsInicio,
    pageSize,
    busca,
    setBusca,
    isLoadingTransportadoras,
    isLoading,
    isSyncing,
    isUpdatingPerfil,
    sincronizarComRavex,
    selectedIds,
    selectedCount,
    todasPaginaSelecionadas,
    algumaPaginaSelecionada,
    toggleSelect,
    toggleSelectAllPagina,
    clearSelection,
    perfilMassaId,
    setPerfilMassaId,
    atualizarPerfil,
    atualizarPerfilMassa,
  } = usePlacas();

  const [placaEditando, setPlacaEditando] = useState<PlacaTransportadora | null>(
    null,
  );
  const [sheetAberto, setSheetAberto] = useState(false);

  const listaVazia = placas.length === 0;
  const temBusca = busca.trim().length > 0;
  const semTransportadoras = !isLoadingTransportadoras && transportadoras.length === 0;
  const formatNumber = new Intl.NumberFormat('pt-BR');

  const abrirEdicao = (placa: PlacaTransportadora) => {
    setPlacaEditando(placa);
    setSheetAberto(true);
  };

  const fecharEdicao = () => {
    setSheetAberto(false);
    setPlacaEditando(null);
  };

  const salvarPerfilSheet = async (
    placaId: string,
    perfilTarifaId: string | null,
  ) => {
    await atualizarPerfil(placaId, perfilTarifaId);
    fecharEdicao();
  };

  const tableHeaders = visualizandoTodas
    ? [
        { label: '', className: 'w-[44px]' },
        { label: 'Placa', className: 'w-[120px]' },
        { label: 'Transportadora', className: 'min-w-[180px]' },
        { label: 'Tipo de veículo', className: 'min-w-[140px]' },
        { label: 'Perfil', className: 'min-w-[160px]' },
        { label: 'Peso (kg)', className: 'hidden w-[100px] text-right md:table-cell' },
        { label: 'Cubagem', className: 'hidden w-[100px] text-right lg:table-cell' },
        { label: 'Tara', className: 'hidden w-[100px] text-right lg:table-cell' },
        { label: 'Estrangeiro', className: 'w-[110px]' },
        { label: 'Ações', className: 'w-[72px]' },
      ]
    : [
        { label: '', className: 'w-[44px]' },
        { label: 'Placa', className: 'w-[120px]' },
        { label: 'Tipo de veículo', className: 'min-w-[160px]' },
        { label: 'Perfil', className: 'min-w-[160px]' },
        { label: 'Peso (kg)', className: 'hidden w-[100px] text-right md:table-cell' },
        { label: 'Cubagem', className: 'hidden w-[100px] text-right lg:table-cell' },
        { label: 'Tara', className: 'hidden w-[100px] text-right lg:table-cell' },
        { label: 'Estrangeiro', className: 'w-[110px]' },
        { label: 'Ações', className: 'w-[72px]' },
      ];

  return (
    <SidebarMain>
      <main className="px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                  <Truck className="size-5" aria-hidden />
                </span>
                <span className="text-caption font-bold uppercase tracking-widest text-primary">
                  Transporte
                </span>
              </div>
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
                Gestão de Placas
              </h1>
              <p className="mt-1 max-w-xl text-body-md text-muted-foreground">
                Visualize a frota, filtre por tipo de veículo e associe perfis de
                tarifa individualmente ou em massa.
              </p>
            </div>

            <Button
              size="sm"
              className="gap-1.5 self-start sm:self-auto"
              disabled={
                visualizandoTodas ||
                !transportadoraSelecionadaId ||
                isSyncing ||
                isLoadingTransportadoras
              }
              title={
                visualizandoTodas
                  ? 'Selecione uma transportadora para sincronizar'
                  : undefined
              }
              onClick={() => void sincronizarComRavex()}
            >
              {isSyncing ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="size-4" aria-hidden />
              )}
              Sincronizar com RAVEX
            </Button>
          </div>

          <section className="overflow-hidden rounded-xl border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
            <div className="border-b border-outline-variant bg-surface-low/30 px-4 py-4 md:px-6">
              <div className="grid gap-4 md:grid-cols-3 md:items-end">
                <div>
                  <label htmlFor="transportadora-placas-select" className={filterLabelClass}>
                    Transportadora
                  </label>
                  <select
                    id="transportadora-placas-select"
                    value={transportadoraSelecionadaId}
                    onChange={(event) => selecionarTransportadora(event.target.value)}
                    disabled={isLoadingTransportadoras}
                    className={filterFieldClass}
                  >
                    <option value={TODAS_TRANSPORTADORAS_ID}>
                      Todas as transportadoras
                    </option>
                    {transportadoras.map((transportadora) => (
                      <option key={transportadora.id} value={transportadora.id}>
                        {transportadora.nome} (Ravex {transportadora.idRavexTransportadora})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="tipo-veiculo-placas-select" className={filterLabelClass}>
                    Tipo de veículo
                  </label>
                  <select
                    id="tipo-veiculo-placas-select"
                    value={tipoVeiculoFiltro}
                    onChange={(event) => selecionarTipoVeiculo(event.target.value)}
                    disabled={isLoadingTransportadoras || isLoading}
                    className={filterFieldClass}
                  >
                    <option value={TODOS_TIPOS_VEICULO_ID}>Todos os tipos</option>
                    {tiposVeiculo.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="busca-placas" className={filterLabelClass}>
                    Buscar placa
                  </label>
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <input
                      id="busca-placas"
                      type="search"
                      value={busca}
                      onChange={(event) => setBusca(event.target.value)}
                      placeholder={
                        visualizandoTodas
                          ? 'Placa, tipo ou transportadora...'
                          : 'Placa ou tipo de veículo...'
                      }
                      disabled={isLoadingTransportadoras}
                      className={cn(filterFieldClass, 'pl-10')}
                    />
                  </div>
                </div>
              </div>

              {selectedCount > 0 ? (
                <div className="mt-4 flex flex-col gap-3 rounded-lg border border-primary/25 bg-primary/5 p-3 md:flex-row md:items-end">
                  <div className="flex-1">
                    <p className="text-body-sm font-semibold text-foreground">
                      {selectedCount}{' '}
                      {selectedCount === 1 ? 'placa selecionada' : 'placas selecionadas'}
                    </p>
                    <label htmlFor="perfil-massa-select" className={cn(filterLabelClass, 'mt-2')}>
                      Associar perfil em massa
                    </label>
                    <select
                      id="perfil-massa-select"
                      value={perfilMassaId}
                      onChange={(event) => setPerfilMassaId(event.target.value)}
                      disabled={isUpdatingPerfil || isLoadingPerfis}
                      className={filterFieldClass}
                    >
                      <option value="">Remover perfil</option>
                      {perfisTarifas.map((perfil) => (
                        <option key={perfil.id} value={perfil.id}>
                          {perfil.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={isUpdatingPerfil}
                      onClick={() => void atualizarPerfilMassa()}
                    >
                      {isUpdatingPerfil ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : null}
                      Aplicar às selecionadas
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isUpdatingPerfil}
                      onClick={clearSelection}
                    >
                      <X className="size-4" aria-hidden />
                      Limpar seleção
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/60 pt-3">
                <p className="text-body-sm text-muted-foreground">
                  {visualizandoTodas ? (
                    <>
                      Exibindo placas de{' '}
                      <span className="font-semibold text-foreground">
                        todas as transportadoras
                      </span>{' '}
                      da unidade.
                    </>
                  ) : transportadoraSelecionada ? (
                    <>
                      <span className="font-semibold text-foreground">
                        {transportadoraSelecionada.nome}
                      </span>{' '}
                      · {transportadoraSelecionada.quantidadeVeiculos} veículo(s)
                      cadastrado(s).
                    </>
                  ) : null}
                </p>
                <p className="text-caption text-muted-foreground">
                  <span className="font-mono font-semibold text-foreground">
                    {formatNumber.format(totalFiltrados)}
                  </span>{' '}
                  {totalFiltrados === 1 ? 'placa' : 'placas'}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              {isLoadingTransportadoras || isLoading ? (
                <div className="flex items-center justify-center gap-2 px-4 py-16 text-body-md text-muted-foreground">
                  <Loader2 className="size-5 animate-spin" aria-hidden />
                  Carregando placas…
                </div>
              ) : semTransportadoras && visualizandoTodas && listaVazia ? (
                <div className="flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
                  <div className="flex size-14 items-center justify-center rounded-full bg-surface-highest text-muted-foreground">
                    <Truck className="size-7" aria-hidden />
                  </div>
                  <div className="max-w-sm space-y-1">
                    <p className="text-title-md font-semibold text-foreground">
                      Nenhuma placa sincronizada
                    </p>
                    <p className="text-body-md text-muted-foreground">
                      Cadastre uma transportadora e sincronize a frota com a
                      Ravex para começar.
                    </p>
                  </div>
                </div>
              ) : (
                <table className={compactTableClassName}>
                  <thead>
                    <tr className={compactTableHeadRowClassName}>
                      {tableHeaders.map((col, index) => (
                        <th
                          key={`${col.label}-${index}`}
                          className={compactTableHeadCellClassName(col.className)}
                        >
                          {index === 0 ? (
                            <input
                              type="checkbox"
                              checked={todasPaginaSelecionadas}
                              ref={(element) => {
                                if (element) {
                                  element.indeterminate =
                                    algumaPaginaSelecionada &&
                                    !todasPaginaSelecionadas;
                                }
                              }}
                              onChange={toggleSelectAllPagina}
                              aria-label="Selecionar todas as placas da página"
                              className="size-3.5 rounded border-input accent-primary"
                            />
                          ) : (
                            col.label
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={compactTableBodyClassName}>
                    {listaVazia ? (
                      <tr>
                        <td colSpan={tableHeaders.length} className="px-4 py-16">
                          <div className="flex flex-col items-center justify-center gap-4 text-center">
                            <div className="flex size-14 items-center justify-center rounded-full bg-surface-highest text-muted-foreground">
                              {temBusca ? (
                                <SearchX className="size-7" aria-hidden />
                              ) : (
                                <Truck className="size-7" aria-hidden />
                              )}
                            </div>
                            <div className="max-w-sm space-y-1">
                              <p className="text-title-md font-semibold text-foreground">
                                {temBusca || tipoVeiculoFiltro !== TODOS_TIPOS_VEICULO_ID
                                  ? 'Nenhuma placa encontrada'
                                  : 'Nenhuma placa sincronizada'}
                              </p>
                              <p className="text-body-md text-muted-foreground">
                                {temBusca || tipoVeiculoFiltro !== TODOS_TIPOS_VEICULO_ID
                                  ? 'Ajuste os filtros para ver outros resultados.'
                                  : visualizandoTodas
                                    ? 'Selecione uma transportadora e sincronize com a Ravex.'
                                    : 'Clique em "Sincronizar com RAVEX" para importar a frota desta transportadora.'}
                              </p>
                            </div>
                            {!temBusca &&
                            tipoVeiculoFiltro === TODOS_TIPOS_VEICULO_ID &&
                            !visualizandoTodas ? (
                              <Button
                                size="sm"
                                className="gap-1.5"
                                disabled={isSyncing}
                                onClick={() => void sincronizarComRavex()}
                              >
                                {isSyncing ? (
                                  <Loader2 className="size-4 animate-spin" aria-hidden />
                                ) : (
                                  <RefreshCw className="size-4" aria-hidden />
                                )}
                                Sincronizar com RAVEX
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      placas.map((placa) => (
                        <tr
                          key={placa.id}
                          className={cn(
                            compactTableRowClassName,
                            'border-l-2 border-l-transparent hover:border-l-primary/60',
                            selectedIds.has(placa.id) && 'bg-primary/5',
                          )}
                        >
                          <td className={compactTableCellClassName}>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(placa.id)}
                              onChange={() => toggleSelect(placa.id)}
                              aria-label={`Selecionar placa ${placa.placa}`}
                              className="size-3.5 rounded border-input accent-primary"
                            />
                          </td>
                          <td className={compactTableCellClassName}>
                            <span className="font-mono text-[11px] font-bold text-primary">
                              {placa.placa}
                            </span>
                          </td>
                          {visualizandoTodas ? (
                            <td className={compactTableCellClassName}>
                              <p className="truncate text-[12px] font-medium text-foreground">
                                {placa.transportadoraNome ?? '—'}
                              </p>
                            </td>
                          ) : null}
                          <td className={compactTableCellClassName}>
                            <p className="truncate text-[12px] font-medium text-foreground">
                              {placa.tipoVeiculoNome ?? '—'}
                            </p>
                          </td>
                          <td className={compactTableCellClassName}>
                            <select
                              value={placa.perfilTarifaId ?? ''}
                              onChange={(event) =>
                                void atualizarPerfil(
                                  placa.id,
                                  event.target.value || null,
                                )
                              }
                              disabled={isUpdatingPerfil || isLoadingPerfis}
                              aria-label={`Perfil da placa ${placa.placa}`}
                              className={cn(
                                'max-w-[180px] rounded-md border border-outline-variant bg-surface-low px-2 py-1',
                                'text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring',
                                'disabled:cursor-not-allowed disabled:opacity-60',
                              )}
                            >
                              <option value="">Sem perfil</option>
                              {perfisTarifas.map((perfil) => (
                                <option key={perfil.id} value={perfil.id}>
                                  {perfil.nome}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td
                            className={cn(
                              compactTableCellClassName,
                              'hidden text-right font-mono text-[11px] tabular-nums text-foreground md:table-cell',
                            )}
                          >
                            {formatPlacaDecimal(placa.peso)}
                          </td>
                          <td
                            className={cn(
                              compactTableCellClassName,
                              'hidden text-right font-mono text-[11px] tabular-nums text-foreground lg:table-cell',
                            )}
                          >
                            {formatPlacaDecimal(placa.cubagem)}
                          </td>
                          <td
                            className={cn(
                              compactTableCellClassName,
                              'hidden text-right font-mono text-[11px] tabular-nums text-foreground lg:table-cell',
                            )}
                          >
                            {formatPlacaDecimal(placa.tara)}
                          </td>
                          <td className={compactTableCellClassName}>
                            <span
                              className={cn(
                                'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                                placa.estrangeiro
                                  ? 'bg-secondary/15 text-secondary ring-1 ring-inset ring-secondary/25'
                                  : 'bg-surface-highest text-muted-foreground ring-1 ring-inset ring-outline-variant/50',
                              )}
                            >
                              {placa.estrangeiro ? 'Sim' : 'Não'}
                            </span>
                          </td>
                          <td className={compactTableCellClassName}>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="size-7"
                              aria-label={`Editar placa ${placa.placa}`}
                              onClick={() => abrirEdicao(placa)}
                            >
                              <Pencil className="size-3.5" aria-hidden />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {!isLoading && !isLoadingTransportadoras && totalFiltrados > 0 ? (
              <Pagination
                pagina={pagina}
                totalPaginas={totalPaginas}
                onChangePagina={setPagina}
                totalFiltrados={totalFiltrados}
                itemsInicio={itemsInicio}
                pageSize={pageSize}
                resourceLabelPlural="placas"
              />
            ) : null}
          </section>
        </div>
      </main>

      <PlacaEditSheet
        placa={placaEditando}
        perfisTarifas={perfisTarifas}
        open={sheetAberto}
        isSaving={isUpdatingPerfil}
        onOpenChange={(aberto) => {
          if (!aberto) {
            fecharEdicao();
          }
        }}
        onSalvarPerfil={salvarPerfilSheet}
      />
    </SidebarMain>
  );
}
