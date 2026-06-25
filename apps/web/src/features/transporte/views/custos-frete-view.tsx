'use client';

import { cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import {
  compactTableClassName,
  compactTableEmptyCellClassName,
} from '@/components/ui/compact-table-classes';

import { CustoFreteRow } from '@/features/transporte/components/custo-frete-row';
import { CustoFreteSummaryCards } from '@/features/transporte/components/custo-frete-summary-cards';
import { useCustosFrete } from '@/features/transporte/hooks/use-custos-frete';
import type { FiltroStatusCustoFrete } from '@/features/transporte/types/transporte.schema';
import { STATUS_CUSTO_FRETE_LABELS } from '@/features/transporte/types/transporte.schema';

const STATUS_OPTIONS: { value: FiltroStatusCustoFrete; label: string }[] = [
  { value: 'todos', label: 'Status: Todos' },
  ...(
    Object.entries(STATUS_CUSTO_FRETE_LABELS) as [
      Exclude<FiltroStatusCustoFrete, 'todos'>,
      string,
    ][]
  ).map(([value, label]) => ({ value, label: `Status: ${label}` })),
];

const TABLE_HEADERS = [
  'Rota',
  'Data',
  'Veículo / Transportadora',
  'Previsto',
  'Pago',
  'Adicionais',
  'Variação',
  'Status',
  '',
] as const;

const filterInputClass = cn(
  'rounded-md border border-outline-variant bg-surface-low px-2 py-1',
  'text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring',
);

export function CustosFreteView() {
  const {
    items,
    summary,
    transportadoras,
    filtroStatus,
    setFiltroStatus,
    filtroTransportadora,
    setFiltroTransportadora,
    filtroData,
    setFiltroData,
    filtroValorMaiorQue,
    setFiltroValorMaiorQue,
    filtroValorMenorQue,
    setFiltroValorMenorQue,
  } = useCustosFrete();

  return (
    <SidebarMain>
      <main className="px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container space-y-6">
          <header>
            <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-primary md:text-headline-lg">
              Gestão de Frete
            </h1>
            <p className="mt-1 text-body-md text-muted-foreground">
              Compare custos previstos com valores realmente pagos, incluindo
              diárias e custos adicionais como pernoite, paletização e pedágio.
            </p>
          </header>

          <CustoFreteSummaryCards summary={summary} />

          <section className="flex flex-wrap items-center gap-2">
            <select
              className={filterInputClass}
              value={filtroStatus}
              onChange={(event) =>
                setFiltroStatus(event.target.value as FiltroStatusCustoFrete)
              }
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              className={filterInputClass}
              value={filtroTransportadora}
              onChange={(event) => setFiltroTransportadora(event.target.value)}
            >
              <option value="">Transportadora: Todas</option>
              {transportadoras.map((nome) => (
                <option key={nome} value={nome}>
                  {nome}
                </option>
              ))}
            </select>

            <input
              type="date"
              className={filterInputClass}
              value={filtroData}
              onChange={(event) => setFiltroData(event.target.value)}
              aria-label="Filtrar por data"
            />

            <input
              type="number"
              step={0.01}
              className={cn(filterInputClass, 'w-40 font-mono')}
              placeholder="Variação maior que (R$)"
              value={filtroValorMaiorQue}
              onChange={(event) => setFiltroValorMaiorQue(event.target.value)}
              aria-label="Filtrar variação maior que"
            />

            <input
              type="number"
              step={0.01}
              className={cn(filterInputClass, 'w-40 font-mono')}
              placeholder="Variação menor que (R$)"
              value={filtroValorMenorQue}
              onChange={(event) => setFiltroValorMenorQue(event.target.value)}
              aria-label="Filtrar variação menor que"
            />
          </section>

          <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-low/30">
            <div className="overflow-x-auto">
              <table className={compactTableClassName}>
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-low/80">
                    {TABLE_HEADERS.map((header) => (
                      <th
                        key={header || 'actions'}
                        className={cn(
                          'px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground',
                          header === 'Previsto' ||
                            header === 'Pago' ||
                            header === 'Adicionais' ||
                            header === 'Variação'
                            ? 'text-right'
                            : undefined,
                          header === 'Data' && 'hidden sm:table-cell',
                          header === 'Veículo / Transportadora' && 'hidden md:table-cell',
                          header === 'Adicionais' && 'hidden lg:table-cell',
                        )}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={TABLE_HEADERS.length}
                        className={compactTableEmptyCellClassName}
                      >
                        Nenhum custo de frete encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <CustoFreteRow key={item.custoFrete.id} item={item} />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}
