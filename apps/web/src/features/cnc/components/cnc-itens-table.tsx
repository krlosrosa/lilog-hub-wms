'use client';

import Link from 'next/link';

import { cn } from '@lilog/ui';

import {
  compactTableBodyClassName,
  compactTableCellClassName,
  compactTableClassName,
  compactTableEmptyCellClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
  compactTableRowClassName,
} from '@/components/ui/compact-table-classes';
import { CncStatusBadge } from '@/features/cnc/components/cnc-status-badge';
import {
  formatFabricacaoFromItem,
  formatUnidadeMedidaItem,
  resolverLoteItem,
} from '@/features/cnc/lib/cnc-item-display-utils';
import type { CncItemListado } from '@/features/cnc/types/cnc.schema';
import {
  CNC_ITEM_TIPO_LABELS,
  CNC_SUBTIPO_LABELS,
} from '@/features/cnc/types/cnc.schema';

const TABLE_HEADERS = [
  { label: 'CNC', className: 'min-w-[108px]' },
  { label: 'Status', className: 'min-w-[88px]' },
  { label: 'SKU', className: 'min-w-[88px]' },
  { label: 'Produto', className: 'min-w-[140px]' },
  { label: 'Lote', className: 'hidden lg:table-cell min-w-[100px]' },
  { label: 'Fabricação', className: 'hidden xl:table-cell min-w-[88px]' },
  { label: 'Tipo', className: 'hidden sm:table-cell min-w-[80px]' },
  { label: 'Ocorrência', className: 'hidden md:table-cell min-w-[100px]' },
  { label: 'Un.', className: 'hidden sm:table-cell min-w-[48px]' },
  { label: 'Qtd Div.', className: 'w-16 text-right hidden sm:table-cell' },
  { label: 'Data', className: 'w-[72px] text-right' },
] as const;

type CncItensTableProps = {
  items: CncItemListado[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

function formatQuantidade(value: number | null) {
  if (value === null) {
    return '—';
  }

  return value.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
}

function getProdutoLabel(item: CncItemListado) {
  return item.descricaoProduto ?? '—';
}

function getSkuLabel(item: CncItemListado) {
  return item.sku ?? '—';
}

function getLoteLabel(item: CncItemListado) {
  return resolverLoteItem(item) ?? '—';
}

export function CncItensTable({ items }: CncItensTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={compactTableClassName}>
        <thead>
          <tr className={compactTableHeadRowClassName}>
            {TABLE_HEADERS.map((header, index) => (
              <th
                key={header.label || `col-${index}`}
                className={compactTableHeadCellClassName(header.className)}
              >
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={compactTableBodyClassName}>
          {items.length ? (
            items.map((item) => (
              <tr key={item.id} className={compactTableRowClassName}>
                <td className={compactTableCellClassName}>
                  <Link
                    href={`/cnc/${item.cncId}`}
                    className="font-mono text-[11px] font-semibold text-primary hover:underline"
                  >
                    {item.cncNumero}
                  </Link>
                </td>
                <td className={compactTableCellClassName}>
                  <CncStatusBadge situacao={item.cncSituacao} compact />
                </td>
                <td
                  className={cn(
                    compactTableCellClassName,
                    'font-mono text-[11px] text-muted-foreground',
                  )}
                  title={getSkuLabel(item)}
                >
                  {getSkuLabel(item)}
                </td>
                <td
                  className={cn(
                    compactTableCellClassName,
                    'max-w-[200px] truncate font-medium text-foreground',
                  )}
                  title={getProdutoLabel(item)}
                >
                  {getProdutoLabel(item)}
                </td>
                <td
                  className={cn(
                    compactTableCellClassName,
                    'hidden font-mono text-[11px] text-muted-foreground lg:table-cell',
                  )}
                  title={getLoteLabel(item)}
                >
                  {getLoteLabel(item)}
                </td>
                <td
                  className={cn(
                    compactTableCellClassName,
                    'hidden text-[11px] tabular-nums text-muted-foreground xl:table-cell',
                  )}
                >
                  {formatFabricacaoFromItem(item)}
                </td>
                <td
                  className={cn(
                    compactTableCellClassName,
                    'hidden text-[11px] text-muted-foreground sm:table-cell',
                  )}
                >
                  {CNC_ITEM_TIPO_LABELS[item.tipo]}
                </td>
                <td
                  className={cn(
                    compactTableCellClassName,
                    'hidden text-[11px] text-muted-foreground md:table-cell',
                  )}
                >
                  {item.subtipoOcorrencia
                    ? CNC_SUBTIPO_LABELS[item.subtipoOcorrencia]
                    : '—'}
                </td>
                <td
                  className={cn(
                    compactTableCellClassName,
                    'hidden text-[11px] font-medium uppercase text-muted-foreground sm:table-cell',
                  )}
                >
                  {formatUnidadeMedidaItem(item)}
                </td>
                <td
                  className={cn(
                    compactTableCellClassName,
                    'hidden text-right tabular-nums font-medium text-foreground sm:table-cell',
                  )}
                >
                  {formatQuantidade(item.quantidadeDivergente)}
                </td>
                <td
                  className={cn(
                    compactTableCellClassName,
                    'text-right tabular-nums text-[11px] text-muted-foreground',
                  )}
                >
                  {formatDate(item.createdAt)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={TABLE_HEADERS.length}
                className={compactTableEmptyCellClassName}
              >
                Nenhum item encontrado para os filtros aplicados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
