'use client';

import Link from 'next/link';
import { useState } from 'react';

import {
  AlertTriangle,
  ExternalLink,
  Filter,
  Loader2,
  MapPin,
  Search,
  Warehouse,
} from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import { Pagination } from '@/features/filiais/components/pagination';
import { fieldInputClassName } from '@/features/enderecos/components/form-field-classes';
import { OcupacaoKpiHeader } from '@/features/estoque-mapa-ocupacao/components/ocupacao-kpi-header';
import { PosicaoDetalheSheet } from '@/features/estoque-mapa-ocupacao/components/posicao-detalhe-sheet';
import { PosicoesFiltrosSheet } from '@/features/estoque-mapa-ocupacao/components/posicoes-filtros-sheet';
import { PosicoesTable } from '@/features/estoque-mapa-ocupacao/components/posicoes-table';
import { useEstoqueMapaOcupacao } from '@/features/estoque-mapa-ocupacao/hooks/use-estoque-mapa-ocupacao';

export function EstoqueMapaOcupacaoScreen() {
  const [filtrosSheetAberto, setFiltrosSheetAberto] = useState(false);

  const {
    unidadeId,
    unidadeNome,
    posicoes,
    kpi,
    isLoading,
    loadError,
    busca,
    setBusca,
    filtros,
    filtrosAtivos,
    aplicarFiltros,
    limparFiltros,
    pagina,
    setPagina,
    totalPaginas,
    totalFiltrados,
    itemsInicio,
    pageSize,
    posicaoSelecionada,
    sheetOpen,
    openPosicao,
    closeSheet,
    recarregar,
  } = useEstoqueMapaOcupacao();

  const ocupacaoCritica =
    kpi && (kpi.taxaOcupacaoGeral ?? kpi.ocupacaoGlobalPercent) >= 85;

  const filtrosSheetAtivos =
    filtros.zonas.length +
    filtros.niveis.length +
    filtros.tipos.length +
    filtros.status.length;

  if (!unidadeId) {
    return (
      <SidebarMain className="flex h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <Warehouse className="size-12 text-muted-foreground" aria-hidden />
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Estoque por Posição
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Selecione uma unidade no topo da tela para visualizar as posições.
          </p>
        </div>
      </SidebarMain>
    );
  }

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
                Estoque por Posição
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
                Ocupação e produtos por endereço em{' '}
                <span className="font-medium text-foreground">{unidadeNome}</span>
                . Clique na linha para abrir o detalhe.
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
                  placeholder="Buscar posição, zona ou rua..."
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  className={cn(
                    fieldInputClassName,
                    'h-9 w-full py-1.5 pl-8 pr-3 text-xs sm:w-56',
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
                {filtrosSheetAtivos > 0 ? (
                  <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                    {filtrosSheetAtivos}
                  </span>
                ) : null}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={isLoading}
                onClick={() => void recarregar()}
              >
                {isLoading ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : null}
                Atualizar
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                asChild
              >
                <Link href="/enderecos">
                  <ExternalLink className="size-3.5" aria-hidden />
                  Endereços
                </Link>
              </Button>
            </div>
          </header>

          {loadError ? (
            <div className="border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {loadError}
            </div>
          ) : null}

          <OcupacaoKpiHeader kpi={kpi} />

          {!isLoading && totalFiltrados > 0 ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5 text-primary" aria-hidden />
                <span>
                  <strong className="font-semibold text-foreground">
                    {totalFiltrados.toLocaleString('pt-BR')}
                  </strong>{' '}
                  {totalFiltrados === 1 ? 'posição' : 'posições'} no resultado
                </span>
              </span>
              {ocupacaoCritica ? (
                <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="size-3.5" aria-hidden />
                  Ocupação global acima de 85%
                </span>
              ) : null}
              {filtrosAtivos > 0 ? (
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="text-primary hover:underline"
                >
                  Limpar {filtrosAtivos}{' '}
                  {filtrosAtivos === 1 ? 'filtro ativo' : 'filtros ativos'}
                </button>
              ) : null}
            </div>
          ) : null}

          <PosicoesTable
            posicoes={posicoes}
            isLoading={isLoading}
            totalFiltrados={totalFiltrados}
            onSelectPosicao={openPosicao}
          />

          {!isLoading && totalFiltrados > 0 ? (
            <Pagination
              pagina={pagina}
              totalPaginas={totalPaginas}
              onChangePagina={setPagina}
              totalFiltrados={totalFiltrados}
              itemsInicio={itemsInicio}
              pageSize={pageSize}
              resourceLabelPlural="posições"
              compact
            />
          ) : null}
        </div>
      </main>

      <PosicoesFiltrosSheet
        open={filtrosSheetAberto}
        onOpenChange={setFiltrosSheetAberto}
        filtros={filtros}
        onAplicar={aplicarFiltros}
      />

      <PosicaoDetalheSheet
        open={sheetOpen}
        onOpenChange={closeSheet}
        posicao={posicaoSelecionada}
        unidadeId={unidadeId}
      />
    </SidebarMain>
  );
}
