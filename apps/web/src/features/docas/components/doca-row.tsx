'use client';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from '@lilog/ui';
import { Ban, DoorOpen, MoreVertical, Trash2, Unlock, Wrench } from 'lucide-react';

import {
  compactTableCellClassName,
  compactTableRowClassName,
} from '@/components/ui/compact-table-classes';
import { DocaStatusBadge } from '@/features/docas/components/doca-status-badge';
import type { DocaListaItem } from '@/features/docas/types/docas.schema';
import { DOCA_TIPO_LABELS } from '@/features/docas/types/docas.schema';

const TIPO_SHORT: Record<DocaListaItem['tipo'], string> = {
  recebimento: 'Rec.',
  expedicao: 'Exp.',
  compartilhada: 'Comp.',
};

type DocaRowProps = {
  doca: DocaListaItem;
  onBloquear?: (doca: DocaListaItem) => void;
  onDesbloquear?: (doca: DocaListaItem) => void;
  onManutencao?: (doca: DocaListaItem) => void;
  onExcluir?: (doca: DocaListaItem) => void;
};

export function DocaRow({
  doca,
  onBloquear,
  onDesbloquear,
  onManutencao,
  onExcluir,
}: DocaRowProps) {
  const canBlock =
    doca.situacao !== 'bloqueada' &&
    doca.situacao !== 'ocupada' &&
    doca.situacao !== 'manutencao';
  const canUnblock = doca.situacao === 'bloqueada';
  const canMaintenance =
    doca.situacao !== 'ocupada' && doca.situacao !== 'manutencao';

  return (
    <tr className={compactTableRowClassName}>
      <td className={compactTableCellClassName}>
        <div className="flex min-w-0 items-center gap-1.5">
          <div
            className="flex size-5 shrink-0 items-center justify-center rounded bg-primary/10 text-primary"
            aria-hidden
          >
            <DoorOpen className="size-3" />
          </div>
          <div className="min-w-0">
            <span className="block truncate font-mono text-[11px] font-semibold text-foreground">
              {doca.codigo}
            </span>
            <span className="block truncate text-[10px] text-muted-foreground">
              {doca.nome}
            </span>
          </div>
        </div>
      </td>
      <td className={compactTableCellClassName}>
        <span
          className="block truncate text-[11px] text-foreground"
          title={DOCA_TIPO_LABELS[doca.tipo]}
        >
          <span className="md:hidden">{TIPO_SHORT[doca.tipo]}</span>
          <span className="hidden md:inline">{DOCA_TIPO_LABELS[doca.tipo]}</span>
        </span>
      </td>
      <td
        className={cn(
          compactTableCellClassName,
          'text-right tabular-nums text-[11px] text-foreground',
        )}
      >
        {doca.capacidadeVeiculos ?? '—'}
      </td>
      <td className={compactTableCellClassName}>
        <DocaStatusBadge situacao={doca.situacao} />
      </td>
      <td className={cn(compactTableCellClassName, 'hidden lg:table-cell')}>
        <span className="block truncate font-mono text-[10px] text-muted-foreground">
          {doca.unidadeId}
        </span>
      </td>
      <td className={cn(compactTableCellClassName, 'text-right')}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Ações para ${doca.codigo}`}
              className="size-7 rounded-md text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:text-primary data-[state=open]:opacity-100"
            >
              <MoreVertical className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[11rem]">
            {canBlock ? (
              <DropdownMenuItem onSelect={() => onBloquear?.(doca)}>
                <Ban className="size-3.5" aria-hidden />
                Bloquear
              </DropdownMenuItem>
            ) : null}
            {canUnblock ? (
              <DropdownMenuItem onSelect={() => onDesbloquear?.(doca)}>
                <Unlock className="size-3.5" aria-hidden />
                Desbloquear
              </DropdownMenuItem>
            ) : null}
            {canMaintenance ? (
              <DropdownMenuItem onSelect={() => onManutencao?.(doca)}>
                <Wrench className="size-3.5" aria-hidden />
                Manutenção
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => onExcluir?.(doca)}
            >
              <Trash2 className="size-3.5" aria-hidden />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
