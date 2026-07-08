'use client';

import { cn } from '@lilog/ui';

import type { MembroProdutividade } from '@/features/inventario/types/inventario-detalhe.schema';

export type TeamMemberItemProps = {
  membro: MembroProdutividade;
};

const RING_BY_TONE = {
  primary: 'border-primary/35 bg-primary/15',
  secondary: 'border-secondary/35 bg-secondary/15',
  accent: 'border-accent/35 bg-accent/15',
};

const NAME_BY_TONE = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  accent: 'text-accent',
};

export function TeamMemberItem({ membro }: TeamMemberItemProps) {
  return (
    <div className="flex items-center gap-2 rounded-md px-1.5 py-1.5 transition-colors hover:bg-surface-highest/40">
      <div
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold',
          NAME_BY_TONE[membro.tone],
          RING_BY_TONE[membro.tone],
        )}
      >
        {!membro.avatarUrl ? (
          <span aria-hidden>{membro.nome.charAt(0)}</span>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-semibold leading-tight text-foreground">
          {membro.nome}
        </p>
        <p className="truncate text-[10px] text-muted-foreground">{membro.papel}</p>
      </div>
      <div className="text-right">
        <p
          className={cn(
            'text-[10px] font-bold tabular-nums',
            NAME_BY_TONE[membro.tone],
          )}
        >
          {membro.itensCount} itens
        </p>
        <p className="text-[10px] text-muted-foreground">
          {membro.segundosPorItem}s/item
        </p>
      </div>
    </div>
  );
}
