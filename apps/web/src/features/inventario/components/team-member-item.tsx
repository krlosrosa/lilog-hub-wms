'use client';

import { cn } from '@lilog/ui';

import type { MembroProdutividade } from '@/features/inventario/types/inventario-detalhe.schema';

export type TeamMemberItemProps = {
  membro: MembroProdutividade;
};

const RING_BY_TONE = {
  primary: 'border-primary/35 bg-primary/20',
  secondary: 'border-secondary/35 bg-secondary/20',
  accent: 'border-accent/35 bg-accent/20',
};

const NAME_BY_TONE = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  accent: 'text-accent',
};

export function TeamMemberItem({ membro }: TeamMemberItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/40 md:gap-4 md:p-3">
      <div
        className={cn(
          'relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border text-xs font-bold md:size-10',
          NAME_BY_TONE[membro.tone],
          RING_BY_TONE[membro.tone],
        )}
      >
        {!membro.avatarUrl ? (
          <span aria-hidden>{membro.nome.charAt(0)}</span>
        ) : null}
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold leading-tight text-foreground">
          {membro.nome}
        </p>
        <p className="truncate text-caption text-muted-foreground">{membro.papel}</p>
      </div>
      <div className="text-right">
        <p
          className={cn(
            'text-caption font-bold tabular-nums md:text-sm',
            NAME_BY_TONE[membro.tone],
          )}
        >
          {membro.itensCount} itens
        </p>
        <p className="text-caption text-muted-foreground">
          {membro.segundosPorItem}s / item
        </p>
      </div>
    </div>
  );
}
