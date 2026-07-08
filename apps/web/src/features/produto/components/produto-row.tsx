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
import { Milk, MoreVertical, Package, Snowflake } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

import {
  compactTableCellClassName,
  compactTableRowClassName,
} from '@/components/ui/compact-table-classes';
import type {
  ProdutoCategoria,
  ProdutoListaItem,
} from '@/features/produto/types/produto-lista.schema';

import { ProdutoCategoriaBadge } from '@/features/produto/components/produto-categoria-badge';

type ProdutoRowProps = {
  produto: ProdutoListaItem;
  onExcluir?: (p: ProdutoListaItem) => void;
};

const ICON_BY_CATEGORIA: Record<ProdutoCategoria, LucideIcon> = {
  seco: Package,
  refrigerado: Snowflake,
  queijo: Milk,
};

export function ProdutoRow({ produto, onExcluir }: ProdutoRowProps) {
  const Icon = ICON_BY_CATEGORIA[produto.categoria] ?? Package;
  const editHref = `/produtos/${produto.produtoId}/edit`;

  return (
    <tr className={compactTableRowClassName}>
      <td className={compactTableCellClassName}>
        <span className="font-mono text-[11px] font-semibold text-primary">
          {produto.sku}
        </span>
      </td>

      <td className={compactTableCellClassName}>
        <div className="flex items-center gap-1.5">
          <div
            className="flex size-6 shrink-0 items-center justify-center rounded-md bg-surface-highest text-muted-foreground"
            aria-hidden
          >
            <Icon className="size-3" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium leading-tight text-foreground">
              {produto.descricao}
            </p>
            <p className="truncate text-[9px] leading-tight text-muted-foreground">
              {produto.subtitulo}
            </p>
          </div>
        </div>
      </td>

      <td className={cn(compactTableCellClassName, 'hidden font-mono text-[10px] text-muted-foreground md:table-cell')}>
        {produto.ean?.trim() ? produto.ean : '—'}
      </td>

      <td className={compactTableCellClassName}>
        <ProdutoCategoriaBadge categoria={produto.categoria} compact />
      </td>

      <td className={cn(compactTableCellClassName, 'hidden max-w-[100px] truncate text-[11px] text-foreground lg:table-cell')}>
        {produto.empresa}
      </td>

      <td className={cn(compactTableCellClassName, 'text-right')}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Ações para ${produto.sku}`}
              className="size-7 rounded-md text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-surface-highest hover:text-foreground"
            >
              <MoreVertical className="size-3.5" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[11rem]">
            <DropdownMenuItem asChild>
              <Link href={editHref}>Editar</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => {
                e.preventDefault();
                onExcluir?.(produto);
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
