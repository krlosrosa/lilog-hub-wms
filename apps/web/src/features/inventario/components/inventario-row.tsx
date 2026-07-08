'use client';

import Link from 'next/link';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from '@lilog/ui';
import { FileText, MoreVertical } from 'lucide-react';

import {
  compactTableCellClassName,
  compactTableRowClassName,
} from '@/components/ui/compact-table-classes';
import { InventarioStatusBadge } from '@/features/inventario/components/inventario-status-badge';
import type { InventarioListaItem } from '@/features/inventario/types/inventario-lista.schema';
import { INVENTARIO_TIPO_LABELS } from '@/features/inventario/types/inventario-lista.schema';

export type InventarioRowProps = {
  item: InventarioListaItem;
};

function formatAcuracia(value: number | null) {
  if (value === null) return '—';
  return `${value.toFixed(1)}%`;
}

export function InventarioRow({ item }: InventarioRowProps) {
  const acuracia = item.acuraciaPercent;
  let acuraciaDisplayClass = 'text-muted-foreground';
  if (acuracia !== null) {
    if (acuracia >= 98) acuraciaDisplayClass = 'font-semibold text-accent';
    else if (acuracia < 96)
      acuraciaDisplayClass = 'font-semibold text-destructive';
    else acuraciaDisplayClass = 'font-semibold text-foreground';
  }

  const detalheHref = `/inventario/${item.id}`;
  const relatorioDisponivel = item.status === 'concluido';

  return (
    <tr
      className={cn(
        compactTableRowClassName,
        item.destaque && 'bg-primary/[0.04]',
      )}
    >
      <td className={cn(compactTableCellClassName, 'font-mono text-[10px]')}>
        <Link
          href={detalheHref}
          className="font-semibold text-primary underline-offset-2 transition-colors hover:underline"
        >
          {item.codigo}
        </Link>
      </td>
      <td
        className={cn(
          compactTableCellClassName,
          'whitespace-nowrap text-[11px] text-foreground',
        )}
      >
        {item.dataLabel}
      </td>
      <td className={cn(compactTableCellClassName, 'hidden sm:table-cell')}>
        <div className="flex items-center gap-1.5">
          <div
            className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-container text-[9px] font-bold leading-none text-primary-on-container"
            title={item.responsavelNome}
          >
            {item.responsavelIniciais}
          </div>
          <span className="max-w-[8rem] truncate text-[11px] text-foreground">
            {item.responsavelNome}
          </span>
        </div>
      </td>
      <td className={cn(compactTableCellClassName, 'hidden md:table-cell')}>
        <span className="rounded bg-secondary-container/25 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-secondary-foreground">
          {INVENTARIO_TIPO_LABELS[item.tipo]}
        </span>
      </td>
      <td
        className={cn(
          compactTableCellClassName,
          'text-center text-[11px] tabular-nums',
          acuraciaDisplayClass,
        )}
      >
        {formatAcuracia(item.acuraciaPercent)}
      </td>
      <td className={compactTableCellClassName}>
        <InventarioStatusBadge status={item.status} compact />
      </td>
      <td className={cn(compactTableCellClassName, 'text-right')}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Ações para ${item.codigo}`}
              className="size-7 rounded-md text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-surface-highest hover:text-foreground"
            >
              <MoreVertical className="size-3.5" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[10rem]">
            <DropdownMenuItem asChild>
              <Link href={detalheHref}>Ver detalhes</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={!relatorioDisponivel}
              onSelect={(e) => {
                if (!relatorioDisponivel) {
                  e.preventDefault();
                }
              }}
            >
              <FileText className="size-3.5" aria-hidden />
              Relatório
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
