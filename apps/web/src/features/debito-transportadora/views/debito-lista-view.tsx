'use client';

import { Button, cn } from '@lilog/ui';
import { Download, Filter, Loader2 } from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';

import { Pagination } from '@/features/filiais/components/pagination';
import { DebitoKpiCards } from '@/features/debito-transportadora/components/debito-kpi-cards';
import { DebitoPainelLateral } from '@/features/debito-transportadora/components/debito-painel-lateral';
import { DebitoTable } from '@/features/debito-transportadora/components/debito-table';
import { useDebitoLista } from '@/features/debito-transportadora/hooks/use-debito-lista';
import type {
  FiltroStatusDebito,
  FiltroTransportadora,
} from '@/features/debito-transportadora/types/debito.schema';
import { DEBITO_STATUS_LABELS } from '@/features/debito-transportadora/types/debito.schema';

const TRANSPORTADORA_OPTIONS: {
  value: FiltroTransportadora;
  label: string;
}[] = [
  { value: 'todas', label: 'Todas Transportadoras' },
  { value: 'swift_logistics', label: 'Swift Logistics' },
  { value: 'global_freight', label: 'Global Freight' },
  { value: 'rapid_way', label: 'Rapid Way' },
];

const STATUS_OPTIONS: {
  value: FiltroStatusDebito;
  label: string;
}[] = [
  { value: 'todos', label: 'Todos os Status' },
  ...(
    Object.entries(DEBITO_STATUS_LABELS) as [
      Exclude<FiltroStatusDebito, 'todos'>,
      string,
    ][]
  ).map(([value, label]) => ({ value, label })),
];

export function DebitoListaView() {
  const {
    kpi,
    busca,
    setBusca,
    filtroTransportadora,
    setFiltroTransportadora,
    filtroStatus,
    setFiltroStatus,
    pagina,
    setPagina,
    totalPaginas,
    itemsPagina,
    itemsInicio,
    totalFiltrados,
    totalRegistros,
    pageSize,
    exportando,
    conciliando,
    actions,
  } = useDebitoLista();

  return (
    <SidebarMain>
      <main className="px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container space-y-8">
          <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="min-w-0">
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
                Painel de Sinistros e Conciliação
              </h1>
              <p className="mt-1 text-body-md text-muted-foreground">
                Gestão proativa de anomalias e recuperação de prejuízos em
                transporte.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={actions.filtrosAvancados}
              >
                <Filter className="size-4" aria-hidden />
                Filtros Avançados
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                disabled={exportando}
                onClick={() => void actions.exportar()}
              >
                {exportando ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Download className="size-4" aria-hidden />
                )}
                Exportar Relatório
              </Button>
            </div>
          </header>

          <div className="relative max-w-xl">
            <input
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Pesquisar por protocolo ou transportadora..."
              className={cn(
                'w-full rounded-lg border border-input bg-surface-low py-2 pl-4 pr-4',
                'text-label-md placeholder:text-muted-foreground/50',
                'focus:outline-none focus:ring-2 focus:ring-ring',
              )}
            />
          </div>

          <DebitoKpiCards kpi={kpi} />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            <div className="space-y-4 lg:col-span-3">
              <div className="overflow-hidden rounded-xl border border-outline-variant/50 bg-glass-bg shadow-inner-glow backdrop-blur-glass">
                <div className="flex flex-col justify-between gap-2 border-b border-outline-variant bg-surface-low px-3 py-2 sm:flex-row sm:items-center">
                  <h2 className="text-xs font-semibold text-foreground">
                    Gestão de Ocorrências Recentes
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    <select
                      value={filtroTransportadora}
                      onChange={(event) =>
                        setFiltroTransportadora(
                          event.target.value as FiltroTransportadora,
                        )
                      }
                      className="cursor-pointer border-none bg-transparent text-[11px] text-muted-foreground focus:ring-0"
                      aria-label="Filtrar por transportadora"
                    >
                      {TRANSPORTADORA_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={filtroStatus}
                      onChange={(event) =>
                        setFiltroStatus(
                          event.target.value as FiltroStatusDebito,
                        )
                      }
                      className="cursor-pointer border-none bg-transparent text-[11px] text-muted-foreground focus:ring-0"
                      aria-label="Filtrar por status"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <DebitoTable items={itemsPagina} />

                <div className="border-t border-outline-variant bg-surface-low">
                  <div className="flex items-center justify-between px-3 py-1.5 text-[11px] text-muted-foreground">
                    <span>
                      Exibindo {itemsPagina.length} de{' '}
                      {totalRegistros.toLocaleString('pt-BR')} ocorrências
                    </span>
                  </div>
                  <Pagination
                    pagina={pagina}
                    totalPaginas={totalPaginas}
                    onChangePagina={setPagina}
                    totalFiltrados={totalFiltrados}
                    itemsInicio={itemsInicio}
                    pageSize={pageSize}
                    resourceLabelPlural="ocorrências"
                  />
                </div>
              </div>
            </div>

            <DebitoPainelLateral
              conciliando={conciliando}
              onForcarConciliacao={() => void actions.forcarConciliacao()}
              onGerarCartaDebito={() => void actions.gerarCartaDebito()}
            />
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}
