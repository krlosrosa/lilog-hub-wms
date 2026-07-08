'use client';

import { useCallback, useEffect, useState } from 'react';

import { AlertTriangle, PackageSearch } from 'lucide-react';

import {
  compactTableBodyClassName,
  compactTableClassName,
  compactTableEmptyCellClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
} from '@/components/ui/compact-table-classes';
import { Pagination } from '@/features/filiais/components/pagination';
import { ConferenciaRow } from '@/features/recebimento/components/conferencia-row';

import type { ConferenciaItem } from '@/features/recebimento/types/recebimento-detalhe.schema';

const HEADERS = [
  { label: '', className: 'w-7' },
  { label: 'SKU', className: 'min-w-[100px] max-w-[120px]' },
  { label: 'Produto', className: 'min-w-[120px] max-w-[160px]' },
  { label: 'Lote', className: 'min-w-[72px] max-w-[80px]' },
  { label: 'Qtd. avariada', className: 'min-w-[72px] text-center' },
  { label: 'Contábil', className: 'w-14 text-center' },
  { label: 'Físico', className: 'w-14 text-center' },
  { label: 'Dif.', className: 'w-12 text-center' },
  { label: 'Status', className: 'w-16' },
] as const;

type ConferenciaTableProps = {
  itensPagina: readonly ConferenciaItem[];
  divergencias: number;
  pagina: number;
  totalPaginas: number;
  onChangePagina: (p: number) => void;
  totalFiltrados: number;
  itemsInicio: number;
  pageSize: number;
};

export function ConferenciaTable({
  itensPagina,
  divergencias,
  pagina,
  totalPaginas,
  onChangePagina,
  totalFiltrados,
  itemsInicio,
  pageSize,
}: ConferenciaTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [expandedLoteIds, setExpandedLoteIds] = useState<Set<string>>(
    () => new Set(),
  );

  useEffect(() => {
    setExpandedIds(new Set());
    setExpandedLoteIds(new Set());
  }, [pagina]);

  const toggleExpand = useCallback((itemId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const toggleLoteExpand = useCallback((itemId: string) => {
    setExpandedLoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  return (
    <section
      className="overflow-hidden rounded-lg border border-outline-variant/70 bg-glass-bg shadow-sm backdrop-blur-glass"
      aria-labelledby="titulo-conferencia"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/50 bg-muted/15 px-3 py-2.5">
        <div className="min-w-0">
          <h2
            id="titulo-conferencia"
            className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
          >
            <PackageSearch className="size-3.5 shrink-0 text-primary" aria-hidden />
            Conferência de carga
          </h2>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Contábil vs. conferência física
          </p>
        </div>
        {divergencias > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
            <AlertTriangle className="size-3 shrink-0" aria-hidden />
            {divergencias} divergência{divergencias === 1 ? '' : 's'}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md border border-status-active/25 bg-status-active/10 px-2 py-0.5 text-[10px] font-semibold text-status-active">
            Sem divergências
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className={compactTableClassName}>
          <thead>
            <tr className={compactTableHeadRowClassName}>
              {HEADERS.map((h) => (
                <th
                  key={h.label || 'expand'}
                  className={compactTableHeadCellClassName(h.className)}
                  scope="col"
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className={compactTableBodyClassName}>
            {itensPagina.length ? (
              itensPagina.map((linha) => (
                <ConferenciaRow
                  key={linha.id}
                  item={linha}
                  isExpanded={expandedIds.has(linha.id)}
                  onToggleExpand={toggleExpand}
                  isLoteExpanded={expandedLoteIds.has(linha.id)}
                  onToggleLoteExpand={toggleLoteExpand}
                />
              ))
            ) : (
              <tr>
                <td className={compactTableEmptyCellClassName} colSpan={HEADERS.length}>
                  Nenhum item de conferência.
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
