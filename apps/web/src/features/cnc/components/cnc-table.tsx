'use client';

import { useRouter } from 'next/navigation';

import { cn } from '@lilog/ui';
import { MoreVertical } from 'lucide-react';

import { CncStatusBadge } from '@/features/cnc/components/cnc-status-badge';
import type { CncListItem } from '@/features/cnc/types/cnc.schema';
import {
  CNC_ORIGEM_LABELS,
  CNC_RESPONSAVEL_LABELS,
} from '@/features/cnc/types/cnc.schema';

const TABLE_HEADERS = [
  { label: 'Número', className: 'min-w-[120px]' },
  { label: 'Responsável', className: 'min-w-[100px]' },
  { label: 'Origem', className: 'hidden md:table-cell' },
  { label: 'Valor Débito', className: 'w-24 text-right hidden sm:table-cell' },
  { label: 'Situação', className: 'min-w-[90px]' },
  { label: 'Abertura', className: 'w-24 text-right' },
  { label: '', className: 'w-8 text-center' },
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
  });
}

export function CncTable({ items }: CncTableProps) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="sticky top-0 bg-surface-highest/50 backdrop-blur-md">
            {TABLE_HEADERS.map((header, index) => (
              <th
                key={header.label || `col-${index}`}
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
          {items.length ? (
            items.map((item) => (
              <tr
                key={item.id}
                className="group cursor-pointer transition-colors hover:bg-surface-highest/50"
                onClick={() => router.push(`/cnc/${item.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    router.push(`/cnc/${item.id}`);
                  }
                }}
                tabIndex={0}
                role="link"
                aria-label={`Ver detalhes de ${item.numero}`}
              >
                <td className="px-2 py-1.5 font-mono text-[11px] font-semibold text-foreground">
                  {item.numero}
                </td>
                <td className="max-w-[140px] truncate px-2 py-1.5 font-medium text-foreground">
                  {CNC_RESPONSAVEL_LABELS[item.responsavel]}
                </td>
                <td className="hidden px-2 py-1.5 text-[11px] text-muted-foreground md:table-cell">
                  {CNC_ORIGEM_LABELS[item.origem]}
                </td>
                <td className="hidden px-2 py-1.5 text-right tabular-nums font-semibold text-foreground sm:table-cell">
                  {formatValor(item.valorDebito)}
                </td>
                <td className="px-2 py-1.5">
                  <CncStatusBadge situacao={item.situacao} compact />
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums text-[11px] text-muted-foreground">
                  {formatDate(item.createdAt)}
                </td>
                <td className="px-2 py-1.5 text-center">
                  <button
                    type="button"
                    className="text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:text-primary"
                    aria-label={`Mais ações para ${item.numero}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <MoreVertical className="mx-auto size-3.5" aria-hidden />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={TABLE_HEADERS.length}
                className="px-2 py-12 text-center text-xs text-muted-foreground"
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
