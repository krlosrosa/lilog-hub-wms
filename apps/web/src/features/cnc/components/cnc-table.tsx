'use client';

import { useRouter } from 'next/navigation';

import { cn } from '@lilog/ui';
import { ChevronRight } from 'lucide-react';

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
import type { CncListItem } from '@/features/cnc/types/cnc.schema';
import {
  CNC_ORIGEM_LABELS,
  CNC_RESPONSAVEL_LABELS,
} from '@/features/cnc/types/cnc.schema';

const TABLE_HEADERS = [
  { label: 'Número', className: 'min-w-[108px]' },
  { label: 'Responsável', className: 'min-w-[88px]' },
  { label: 'Origem', className: 'hidden md:table-cell' },
  { label: 'Débito', className: 'w-20 text-right hidden sm:table-cell' },
  { label: 'Situação', className: 'min-w-[80px]' },
  { label: 'Abertura', className: 'w-[72px] text-right' },
  { label: '', className: 'w-6' },
] as const;

type CncTableProps = {
  items: CncListItem[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

function formatValor(valor: number | null) {
  if (valor === null) {
    return '—';
  }

  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

export function CncTable({ items }: CncTableProps) {
  const router = useRouter();

  const navigate = (id: string) => router.push(`/cnc/${id}`);

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
              <tr
                key={item.id}
                className={cn(
                  compactTableRowClassName,
                  'cursor-pointer',
                )}
                onClick={() => navigate(item.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigate(item.id);
                  }
                }}
                tabIndex={0}
                role="link"
                aria-label={`Ver detalhes de ${item.numero}`}
              >
                <td
                  className={cn(
                    compactTableCellClassName,
                    'font-mono text-[11px] font-semibold text-primary',
                  )}
                >
                  {item.numero}
                </td>
                <td
                  className={cn(
                    compactTableCellClassName,
                    'max-w-[120px] truncate font-medium text-foreground',
                  )}
                >
                  {CNC_RESPONSAVEL_LABELS[item.responsavel]}
                </td>
                <td
                  className={cn(
                    compactTableCellClassName,
                    'hidden text-[11px] text-muted-foreground md:table-cell',
                  )}
                >
                  {CNC_ORIGEM_LABELS[item.origem]}
                </td>
                <td
                  className={cn(
                    compactTableCellClassName,
                    'hidden text-right tabular-nums font-medium text-foreground sm:table-cell',
                  )}
                >
                  {formatValor(item.valorDebito)}
                </td>
                <td className={compactTableCellClassName}>
                  <CncStatusBadge situacao={item.situacao} compact />
                </td>
                <td
                  className={cn(
                    compactTableCellClassName,
                    'text-right tabular-nums text-[11px] text-muted-foreground',
                  )}
                >
                  {formatDate(item.createdAt)}
                </td>
                <td className={cn(compactTableCellClassName, 'text-right')}>
                  <ChevronRight
                    className="ml-auto size-3.5 text-muted-foreground/40 transition-colors group-hover:text-primary"
                    aria-hidden
                  />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={TABLE_HEADERS.length}
                className={compactTableEmptyCellClassName}
              >
                Nenhuma não conformidade encontrada para os filtros aplicados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
