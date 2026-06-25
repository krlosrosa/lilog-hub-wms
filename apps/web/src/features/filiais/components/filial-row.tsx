import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from '@lilog/ui';
import { MoreVertical } from 'lucide-react';
import Link from 'next/link';

import {
  compactTableCellClassName,
  compactTableRowClassName,
} from '@/components/ui/compact-table-classes';
import { FILTRO_CLUSTER_LABELS } from '@/features/filiais/types/filial-lista.schema';
import type { FilialListaItem } from '@/features/filiais/types/filial-lista.schema';

type FilialRowProps = {
  filial: FilialListaItem;
  onExcluir?: (filial: FilialListaItem) => void;
};

export function FilialRow({ filial, onExcluir }: FilialRowProps) {
  const detalheHref = `/unidades/${filial.id}`;

  return (
    <tr className={compactTableRowClassName}>
      <td
        className={cn(
          compactTableCellClassName,
          'font-mono text-[10px] text-muted-foreground',
        )}
      >
        {filial.id}
      </td>

      <td className={compactTableCellClassName}>
        <Link
          href={detalheHref}
          className="text-[11px] font-semibold text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          {filial.nome}
        </Link>
      </td>

      <td className={cn(compactTableCellClassName, 'hidden md:table-cell')}>
        <span className="text-[11px] text-foreground">{filial.nomeFilial}</span>
      </td>

      <td className={cn(compactTableCellClassName, 'hidden lg:table-cell')}>
        <span className="rounded px-1.5 py-0 text-[9px] font-bold uppercase bg-surface-highest text-muted-foreground">
          {FILTRO_CLUSTER_LABELS[filial.cluster]}
        </span>
      </td>

      <td className={cn(compactTableCellClassName, 'hidden sm:table-cell')}>
        <span className="text-[10px] text-foreground">
          {filial.centrosCount} centro(s)
        </span>
      </td>

      <td className={cn(compactTableCellClassName, 'text-right')}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Ações para ${filial.nome}`}
              className="size-7 rounded-md text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-surface-highest hover:text-foreground"
            >
              <MoreVertical className="size-3.5" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[11rem]">
            <DropdownMenuItem asChild>
              <Link href={detalheHref}>Editar</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => {
                e.preventDefault();
                onExcluir?.(filial);
              }}
            >
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
