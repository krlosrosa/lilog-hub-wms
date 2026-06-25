'use client';

import { MoreVertical } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { accentSubtleBadgePlainClassName } from '@/lib/semantic-badge-classes';
import type { DivergenciaItem } from '@/features/inventario/types/inventario-detalhe.schema';
import {
  DIVERGENCIA_TIPO_LABELS,
} from '@/features/inventario/types/inventario-detalhe.schema';

export type DivergenciaRowProps = {
  item: DivergenciaItem;
};

export function DivergenciaRow({ item }: DivergenciaRowProps) {
  const isFalta = item.tipo === 'falta';

  return (
    <tr className="divide-outline-variant transition-colors hover:bg-muted/35">
      <td className="px-6 py-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-foreground">{item.sku}</span>
          <span className="text-caption text-muted-foreground">
            {item.produtoNome}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm font-medium text-foreground">
        {item.setor}
      </td>
      <td className="px-6 py-4 text-sm text-foreground tabular-nums">
        {item.esperadoLabel}
      </td>
      <td className="px-6 py-4 text-sm text-foreground tabular-nums">
        {item.encontradoLabel}
      </td>
      <td
        className={cn(
          'px-6 py-4 text-sm font-bold tabular-nums',
          isFalta ? 'text-destructive' : 'text-accent',
        )}
      >
        {item.diferencaLabel}
      </td>
      <td className="px-6 py-4">
        <span
          className={cn(
            'rounded px-2 py-0.5 font-caption font-bold uppercase',
            isFalta
              ? 'bg-destructive/15 text-destructive'
              : accentSubtleBadgePlainClassName,
          )}
        >
          {DIVERGENCIA_TIPO_LABELS[item.tipo]}
        </span>
      </td>
      <td className="px-6 py-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-primary"
          aria-label="Opções da divergência"
        >
          <MoreVertical aria-hidden />
        </Button>
      </td>
    </tr>
  );
}
