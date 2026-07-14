import { UsersRound } from 'lucide-react';

import { cn } from '@lilog/ui';

type PessoaEquipeBadgeProps = {
  nome: string | null;
  compact?: boolean;
};

export function PessoaEquipeBadge({
  nome,
  compact = false,
}: PessoaEquipeBadgeProps) {
  if (!nome) {
    return (
      <span
        className={cn(
          'inline-flex items-center text-muted-foreground/70',
          compact ? 'text-[10px]' : 'text-xs',
        )}
      >
        —
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-md border border-outline-variant/60 bg-surface-low font-medium text-foreground',
        compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
      )}
      title={nome}
    >
      <UsersRound
        className={cn('shrink-0 text-primary', compact ? 'size-3' : 'size-3.5')}
        aria-hidden
      />
      <span className="truncate">{nome}</span>
    </span>
  );
}
