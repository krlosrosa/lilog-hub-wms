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
import { Building2, MoreVertical, Pencil, Trash2 } from 'lucide-react';

import {
  compactTableCellClassName,
  compactTableRowClassName,
} from '@/components/ui/compact-table-classes';
import { TransportadoraStatusBadge } from '@/features/transporte/components/transportadora-status-badge';
import { formatCnpj } from '@/features/transporte/types/transportadora.schema';
import type { TransportadoraListaItem } from '@/features/transporte/types/transportadora.schema';

type TransportadoraRowProps = {
  transportadora: TransportadoraListaItem;
  onEditar?: (transportadora: TransportadoraListaItem) => void;
  onExcluir?: (transportadora: TransportadoraListaItem) => void;
};

export function TransportadoraRow({
  transportadora,
  onEditar,
  onExcluir,
}: TransportadoraRowProps) {
  const formatNumber = new Intl.NumberFormat('pt-BR');

  return (
    <tr
      className={cn(
        compactTableRowClassName,
        'border-l-2 border-l-transparent hover:border-l-primary/60',
      )}
    >
      <td className={compactTableCellClassName}>
        <span className="font-mono text-[11px] font-semibold text-primary">
          {transportadora.idRavexTransportadora}
        </span>
      </td>

      <td className={compactTableCellClassName}>
        <div className="flex items-center gap-3">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/20"
            aria-hidden
          >
            <Building2 className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-medium text-foreground transition-colors group-hover:text-primary">
              {transportadora.nome}
            </p>
            <p className="truncate font-mono text-[10px] text-muted-foreground md:hidden">
              {formatCnpj(transportadora.cnpj)}
            </p>
          </div>
        </div>
      </td>

      <td
        className={cn(
          compactTableCellClassName,
          'hidden font-mono text-[11px] text-foreground md:table-cell',
        )}
      >
        {formatCnpj(transportadora.cnpj)}
      </td>

      <td
        className={cn(
          compactTableCellClassName,
          'hidden text-right font-mono text-[11px] tabular-nums text-foreground lg:table-cell',
        )}
      >
        {formatNumber.format(transportadora.quantidadeVeiculos)}
      </td>

      <td className={compactTableCellClassName}>
        <TransportadoraStatusBadge status={transportadora.status} compact />
      </td>

      <td className={cn(compactTableCellClassName, 'text-right')}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Mais ações para ${transportadora.nome}`}
              className="size-7 rounded-md text-muted-foreground opacity-70 transition-all group-hover:opacity-100 hover:bg-surface-highest hover:text-foreground"
            >
              <MoreVertical className="size-3.5" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[11rem]">
            <DropdownMenuItem
              className="flex items-center gap-2"
              onClick={() => onEditar?.(transportadora)}
            >
              <Pencil className="size-3.5" aria-hidden />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center gap-2 text-destructive focus:text-destructive"
              onClick={() => onExcluir?.(transportadora)}
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
