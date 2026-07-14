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
import type { CentroOrigemListaItem } from '@/features/centros-origem/types/centro-origem-form.schema';

type CentroOrigemRowProps = {
  item: CentroOrigemListaItem;
  onExcluir?: (item: CentroOrigemListaItem) => void;
};

export function CentroOrigemRow({ item, onExcluir }: CentroOrigemRowProps) {
  const detalheHref = `/centros-origem/${encodeURIComponent(item.centro)}`;

  return (
    <tr className={compactTableRowClassName}>
      <td
        className={cn(
          compactTableCellClassName,
          'font-mono text-[10px] text-muted-foreground',
        )}
      >
        {item.centro}
      </td>

      <td className={compactTableCellClassName}>
        <Link
          href={detalheHref}
          className="text-[11px] font-semibold text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          {item.nome}
        </Link>
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
          <DropdownMenuContent align="end" className="min-w-[11rem]">
            <DropdownMenuItem asChild>
              <Link href={detalheHref}>Editar</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => onExcluir?.(item)}
            >
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
