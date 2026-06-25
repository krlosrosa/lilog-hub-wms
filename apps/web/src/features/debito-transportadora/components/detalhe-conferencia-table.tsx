'use client';

import { AlertTriangle, ClipboardCheck } from 'lucide-react';

import { cn } from '@lilog/ui';

import { Pagination } from '@/features/filiais/components/pagination';
import { DetalheConferenciaRow } from '@/features/debito-transportadora/components/detalhe-conferencia-row';
import type {
  DebitoConferenciaItem,
  DebitoNotaFiscal,
} from '@/features/debito-transportadora/types/debito.schema';

const HEADERS = [
  { label: 'Produto', className: 'min-w-[160px]' },
  { label: 'NF', className: 'hidden sm:table-cell w-24 text-center' },
  { label: 'Esp.', className: 'w-14 text-center' },
  { label: 'Conf.', className: 'w-14 text-center' },
  { label: 'Div.', className: 'w-14 text-center' },
  { label: 'Anom.', className: 'w-20 text-center' },
  { label: 'Impacto', className: 'w-24 text-right' },
] as const;

type DetalheConferenciaTableProps = {
  itensPagina: readonly DebitoConferenciaItem[];
  notasFiscais: readonly DebitoNotaFiscal[];
  totalAnomalias: number;
  pagina: number;
  totalPaginas: number;
  onChangePagina: (pagina: number) => void;
  totalFiltrados: number;
  itemsInicio: number;
  pageSize: number;
};

export function DetalheConferenciaTable({
  itensPagina,
  notasFiscais,
  totalAnomalias,
  pagina,
  totalPaginas,
  onChangePagina,
  totalFiltrados,
  itemsInicio,
  pageSize,
}: DetalheConferenciaTableProps) {
  const notasPorId = Object.fromEntries(
    notasFiscais.map((nf) => [nf.id, nf]),
  ) as Record<string, DebitoNotaFiscal>;

  return (
    <section
      className="overflow-hidden rounded-xl border border-outline-variant/50 bg-glass-bg shadow-inner-glow backdrop-blur-glass"
      aria-labelledby="titulo-conferencia-debito"
    >
      <div className="flex flex-col gap-2 border-b border-outline-variant bg-surface-low px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            id="titulo-conferencia-debito"
            className="flex items-center gap-1.5 text-xs font-semibold text-foreground"
          >
            <ClipboardCheck className="size-3.5 text-primary" aria-hidden />
            Itens Conferidos
          </h2>
          <p className="mt-0.5 max-w-xl text-[11px] text-muted-foreground">
            Comparativo por NF entre quantidades declaradas e conferência física.
          </p>
        </div>
        {totalAnomalias > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 bg-destructive/15 px-2 py-0.5 text-[10px] font-semibold text-destructive">
            <AlertTriangle className="size-3 shrink-0" aria-hidden />
            {totalAnomalias} anomalias
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-status-active/30 bg-status-active/10 px-2 py-0.5 text-[10px] font-semibold text-status-active">
            Sem anomalias
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="sticky top-0 bg-surface-highest/50 backdrop-blur-md">
              {HEADERS.map((header) => (
                <th
                  key={header.label}
                  scope="col"
                  className={cn(
                    'border-b border-outline-variant px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground',
                    header.className,
                  )}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {itensPagina.length ? (
              itensPagina.map((item) => (
                <DetalheConferenciaRow
                  key={item.id}
                  item={item}
                  notaFiscal={notasPorId[item.nfId]}
                />
              ))
            ) : (
              <tr>
                <td
                  colSpan={HEADERS.length}
                  className="px-2 py-12 text-center text-xs text-muted-foreground"
                >
                  Nenhum item conferido registrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        pagina={pagina}
        totalPaginas={totalPaginas}
        onChangePagina={onChangePagina}
        totalFiltrados={totalFiltrados}
        itemsInicio={itemsInicio}
        pageSize={pageSize}
        resourceLabelPlural="itens conferidos"
      />
    </section>
  );
}
