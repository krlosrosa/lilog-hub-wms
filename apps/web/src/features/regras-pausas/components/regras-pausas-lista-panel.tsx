'use client';

import { SearchX } from 'lucide-react';
import type { ReactNode } from 'react';

import {
  compactTableBodyClassName,
  compactTableClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
} from '@/components/ui/compact-table-classes';
import { RegrasProdutividadeFiltros } from '@/features/config-operacional/components/regras-produtividade-filtros';
import { RegrasProdutividadeStatsCards } from '@/features/config-operacional/components/regras-produtividade-stats';
import type {
  FiltroAtivo,
  RegrasProdutividadeStats,
} from '@/features/config-operacional/types/regra-produtividade-base.schema';
import { Pagination } from '@/features/filiais/components/pagination';

const TABLE_HEADERS = [
  { label: 'Perfil', className: 'min-w-[180px]' },
  { label: 'Tipo', className: 'hidden sm:table-cell w-[100px]' },
  { label: 'Intervalo / Duração', className: 'hidden md:table-cell w-[160px]' },
  { label: 'Status', className: 'w-[90px]' },
  { label: 'Padrão', className: 'hidden md:table-cell w-[90px]' },
  { label: '', className: 'w-16 text-right' },
] as const;

type RegrasPausasListaPanelProps = {
  stats: RegrasProdutividadeStats;
  busca: string;
  onBuscaChange: (value: string) => void;
  filtroAtivo: FiltroAtivo;
  onFiltroAtivoChange: (value: FiltroAtivo) => void;
  totalFiltrados: number;
  pagina: number;
  totalPaginas: number;
  onChangePagina: (pagina: number) => void;
  itemsInicio: number;
  pageSize: number;
  listaVazia: boolean;
  temFiltrosAtivos: boolean;
  children: ReactNode;
};

export function RegrasPausasListaPanel({
  stats,
  busca,
  onBuscaChange,
  filtroAtivo,
  onFiltroAtivoChange,
  totalFiltrados,
  pagina,
  totalPaginas,
  onChangePagina,
  itemsInicio,
  pageSize,
  listaVazia,
  temFiltrosAtivos,
  children,
}: RegrasPausasListaPanelProps) {
  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <RegrasProdutividadeStatsCards
        stats={stats}
        metaLabel="Regra padrão de pausa"
      />

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
        <div className="border-b border-outline-variant bg-surface-low/30 px-4 py-4 md:px-6">
          <RegrasProdutividadeFiltros
            busca={busca}
            onBuscaChange={onBuscaChange}
            filtroAtivo={filtroAtivo}
            onFiltroAtivoChange={onFiltroAtivoChange}
            totalFiltrados={totalFiltrados}
          />
        </div>

        {listaVazia ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <SearchX className="mb-3 size-10 text-muted-foreground/50" aria-hidden />
            <p className="text-sm font-medium text-foreground">Nenhuma regra encontrada</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {temFiltrosAtivos
                ? 'Tente ajustar os filtros ou a busca.'
                : 'Crie a primeira regra de pausa para este tipo.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={compactTableClassName}>
                <thead>
                  <tr className={compactTableHeadRowClassName}>
                    {TABLE_HEADERS.map((header) => (
                      <th
                        key={header.label}
                        scope="col"
                        className={`${compactTableHeadCellClassName} ${header.className}`}
                      >
                        {header.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={compactTableBodyClassName}>{children}</tbody>
              </table>
            </div>

            <div className="border-t border-outline-variant px-4 py-3 md:px-6">
              <Pagination
                pagina={pagina}
                totalPaginas={totalPaginas}
                onChangePagina={onChangePagina}
                itemsInicio={itemsInicio}
                totalFiltrados={totalFiltrados}
                pageSize={pageSize}
                resourceLabelPlural="regras"
                compact
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
