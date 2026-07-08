'use client';

import {
  EyeOff,
  MoreVertical,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from '@lilog/ui';

import {
  compactTableCellClassName,
  compactTableRowClassName,
} from '@/components/ui/compact-table-classes';
import {
  DEMANDA_PROGRESSO_STATUS_LABELS,
  type DemandaProgressoItem,
} from '@/features/inventario/types/inventario-detalhe.schema';
import { DEMANDA_PRIORIDADE_LABELS } from '@/features/inventario/types/inventario-lista.schema';

export type DemandaRowProps = {
  item: DemandaProgressoItem;
  onRemover?: (id: string) => void;
};

const STATUS_TONE = {
  aguardando_inicio: 'bg-muted-foreground',
  em_andamento: 'bg-primary',
  concluida: 'bg-accent',
  cancelada: 'bg-destructive/70',
} as const;

export function DemandaRow({ item, onRemover }: DemandaRowProps) {
  const TipoIcon = item.tipo === 'cega' ? EyeOff : ShieldCheck;
  const prioridadeAlta = item.prioridade === 'alta' || item.prioridade === 'critica';

  return (
    <tr className={compactTableRowClassName}>
      <td className={compactTableCellClassName}>
        <div className="flex min-w-[9rem] items-center gap-2">
          <span
            className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-md',
              item.tipo === 'cega'
                ? 'bg-primary/10 text-primary'
                : 'bg-secondary/15 text-secondary-foreground',
            )}
          >
            <TipoIcon className="size-3.5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold text-foreground">
              {item.nome}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">
              {item.responsavelNome}
            </p>
          </div>
        </div>
      </td>

      <td className={cn(compactTableCellClassName, 'hidden sm:table-cell')}>
        <span
          className={cn(
            'rounded-full px-1.5 py-px text-[9px] font-semibold',
            item.tipo === 'cega'
              ? 'bg-primary/10 text-primary'
              : 'bg-secondary/15 text-secondary-foreground',
          )}
        >
          {item.tipo === 'cega' ? 'Cega' : 'Validação'}
        </span>
        {prioridadeAlta ? (
          <span className="ml-1 rounded-full bg-destructive/10 px-1.5 py-px text-[9px] font-semibold text-destructive">
            {DEMANDA_PRIORIDADE_LABELS[item.prioridade]}
          </span>
        ) : null}
      </td>

      <td className={cn(compactTableCellClassName, 'min-w-[7rem]')}>
        <div className="flex items-center gap-2">
          <div className="h-1 min-w-[3rem] flex-1 overflow-hidden rounded-full bg-surface-highest">
            <div
              className={cn(
                'h-full rounded-full',
                STATUS_TONE[item.status],
              )}
              style={{ width: `${String(item.progressPercent)}%` }}
            />
          </div>
          <span className="shrink-0 text-[10px] font-semibold tabular-nums text-foreground">
            {item.progressPercent}%
          </span>
        </div>
        <p className="mt-0.5 text-[9px] tabular-nums text-muted-foreground">
          {item.enderecosConferidos}/{item.totalEnderecos} end.
        </p>
      </td>

      <td className={compactTableCellClassName}>
        <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-muted-foreground">
          <span
            className={cn(
              'size-1.5 rounded-full',
              STATUS_TONE[item.status],
              item.status === 'em_andamento' && 'animate-pulse',
            )}
          />
          {DEMANDA_PROGRESSO_STATUS_LABELS[item.status]}
        </span>
      </td>

      <td className={cn(compactTableCellClassName, 'text-right')}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Ações para ${item.nome}`}
              className="size-7 rounded-md text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-surface-highest hover:text-foreground"
            >
              <MoreVertical className="size-3.5" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[10rem]">
            <DropdownMenuItem disabled>Editar</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => {
                e.preventDefault();
                onRemover?.(item.id);
              }}
            >
              <Trash2 className="size-3.5" aria-hidden />
              Remover
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
