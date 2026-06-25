'use client';

import Link from 'next/link';

import { Button, cn } from '@lilog/ui';

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
  let acuraciaDisplayClass = 'text-foreground opacity-60';
  if (acuracia !== null) {
    if (acuracia >= 98) acuraciaDisplayClass = 'font-bold text-accent';
    else if (acuracia < 96)
      acuraciaDisplayClass = 'font-bold text-destructive';
    else acuraciaDisplayClass = 'font-bold text-foreground';
  }

  return (
    <tr
      className={cn(
        'divide-outline-variant transition-colors hover:bg-muted/40',
        item.destaque && 'bg-primary/5',
      )}
    >
      <td className="px-6 py-4 text-sm font-semibold text-primary">
        {item.codigo}
      </td>
      <td className="px-6 py-4 text-sm text-foreground">{item.dataLabel}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-container text-[10px] font-bold leading-none text-primary-on-container">
            {item.responsavelIniciais}
          </div>
          <span className="text-sm text-foreground">{item.responsavelNome}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="rounded bg-secondary-container/25 px-2 py-1 font-caption uppercase tracking-wider text-secondary-foreground">
          {INVENTARIO_TIPO_LABELS[item.tipo]}
        </span>
      </td>
      <td
        className={cn(
          'px-6 py-4 text-center text-sm tabular-nums',
          acuraciaDisplayClass,
        )}
      >
        {formatAcuracia(item.acuraciaPercent)}
      </td>
      <td className="px-6 py-4">
        <InventarioStatusBadge status={item.status} />
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/inventario/${item.id}`}>Ver detalhes</Link>
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className={
              item.status !== 'concluido'
                ? 'pointer-events-none opacity-50'
                : undefined
            }
            disabled={item.status !== 'concluido'}
            type="button"
          >
            Relatório
          </Button>
        </div>
      </td>
    </tr>
  );
}
