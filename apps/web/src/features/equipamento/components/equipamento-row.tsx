'use client';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  cn,
} from '@lilog/ui';
import {
  Ban,
  ChevronRight,
  Eye,
  Forklift,
  History,
  MoreVertical,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';

import {
  compactTableCellClassName,
  compactTableRowClassName,
} from '@/components/ui/compact-table-classes';
import { EquipamentoStatusBadge } from '@/features/equipamento/components/equipamento-status-badge';
import type { EquipamentoListaItem } from '@/features/equipamento/types/equipamento.schema';

const AVATAR_STATUS_CLASSES = {
  operando: 'bg-primary/15 text-primary ring-primary/20',
  pausa: 'bg-secondary/15 text-secondary-foreground ring-secondary/20',
  manutencao: 'bg-tertiary/15 text-tertiary ring-tertiary/20',
  bloqueado: 'bg-destructive/15 text-destructive ring-destructive/20',
} as const;

type EquipamentoRowProps = {
  equipamento: EquipamentoListaItem;
};

export function EquipamentoRow({ equipamento }: EquipamentoRowProps) {
  const detalheHref = `/equipamento/${equipamento.id}`;

  return (
    <tr
      className={cn(
        compactTableRowClassName,
        'border-l-2 border-l-transparent hover:border-l-primary/60',
      )}
    >
      <td className={compactTableCellClassName}>
        <Link
          href={detalheHref}
          className="font-mono text-[11px] font-semibold text-primary transition-colors hover:text-primary-fixed-dim hover:underline"
        >
          {equipamento.tag}
        </Link>
      </td>

      <td className={compactTableCellClassName}>
        <Link href={detalheHref} className="flex items-center gap-3">
          <div
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-lg ring-1',
              AVATAR_STATUS_CLASSES[equipamento.status],
            )}
            aria-hidden
          >
            <Forklift className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-medium text-foreground transition-colors group-hover:text-primary">
              {equipamento.nome}
            </p>
            <p className="truncate font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              ID {equipamento.id}
            </p>
          </div>
        </Link>
      </td>

      <td
        className={cn(
          compactTableCellClassName,
          'hidden text-[11px] text-foreground md:table-cell',
        )}
      >
        {equipamento.modelo}
      </td>

      <td className={compactTableCellClassName}>
        <EquipamentoStatusBadge status={equipamento.status} compact />
      </td>

      <td
        className={cn(
          compactTableCellClassName,
          'hidden max-w-[140px] truncate text-[10px] text-muted-foreground lg:table-cell',
        )}
      >
        {equipamento.localizacao}
      </td>

      <td
        className={cn(
          compactTableCellClassName,
          'hidden font-mono text-[10px] text-muted-foreground xl:table-cell',
        )}
      >
        {equipamento.horimetro.toLocaleString('pt-BR')} h
      </td>

      <td className={cn(compactTableCellClassName, 'text-right')}>
        <div className="flex items-center justify-end gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-md text-muted-foreground opacity-70 transition-all hover:bg-primary/10 hover:text-primary group-hover:opacity-100"
            asChild
          >
            <Link
              href={detalheHref}
              aria-label={`Ver dossiê de ${equipamento.tag}`}
            >
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Mais ações para ${equipamento.tag}`}
                className="size-7 rounded-md text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-surface-highest hover:text-foreground"
              >
                <MoreVertical className="size-3.5" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[11rem]">
              <DropdownMenuItem asChild>
                <Link href={detalheHref} className="flex items-center gap-2">
                  <Eye className="size-3.5" aria-hidden />
                  Ver dossiê
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/equipamento/manutencao"
                  className="flex items-center gap-2"
                >
                  <Wrench className="size-3.5" aria-hidden />
                  Manutenção
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={detalheHref} className="flex items-center gap-2">
                  <History className="size-3.5" aria-hidden />
                  Histórico
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 text-destructive">
                <Ban className="size-3.5" aria-hidden />
                Bloquear
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}
