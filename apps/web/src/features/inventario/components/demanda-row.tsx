'use client';

import { LayoutGrid, Pencil, Snowflake, Trash2 } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { accentSubtleBadgeBorderClassName } from '@/lib/semantic-badge-classes';
import type { DemandaContagemItem } from '@/features/inventario/types/inventario-lista.schema';

export type DemandaRowProps = {
  item: DemandaContagemItem;
  onRemover?: (id: string) => void;
};

export function DemandaRow({ item, onRemover }: DemandaRowProps) {
  const Icon = item.iconName === 'snow' ? Snowflake : LayoutGrid;

  return (
    <tr className="group transition-colors hover:bg-muted/35">
      <td className="px-6 py-4">
        <div className="flex items-center gap-2.5 md:gap-3">
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary md:size-10',
              item.iconName === 'snow' &&
                'bg-secondary/15 text-secondary-foreground',
            )}
          >
            <Icon className="size-4 md:size-[18px]" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {item.localTitulo}
            </p>
            <p className="truncate font-caption text-muted-foreground">
              {item.localSubtitulo}
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground md:size-8 md:text-caption">
            {item.responsavelNome.charAt(0)}
          </div>
          <span className="truncate text-sm text-foreground">{item.responsavelNome}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span
          className={cn(
            'rounded-full border px-2 py-0.5 text-caption font-medium md:px-2.5 md:py-1',
            item.tipo === 'cega'
              ? cn('border', accentSubtleBadgeBorderClassName)
              : 'border-secondary/35 bg-secondary/10 text-secondary',
          )}
        >
          {item.tipo === 'cega' ? 'Contagem cega' : 'Validação'}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-caption font-medium text-muted-foreground md:text-sm">
          <span className="size-2 shrink-0 rounded-full bg-outline-variant" aria-hidden />
          Aguardando início
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Editar demanda"
            className="text-muted-foreground"
          >
            <Pencil className="size-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive"
            aria-label="Remover demanda"
            onClick={() => onRemover?.(item.id)}
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      </td>
    </tr>
  );
}
