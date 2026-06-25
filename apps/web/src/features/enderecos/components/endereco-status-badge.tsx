'use client';

import { Ban, ClipboardList, Lock } from 'lucide-react';

import { cn } from '@lilog/ui';

import type { EnderecoStatus } from '@/features/enderecos/types/enderecos-gestao.schema';
import { ENDERECO_STATUS_LABELS } from '@/features/enderecos/types/enderecos-gestao.schema';

const toneByStatus: Record<
  EnderecoStatus,
  { dot: string; text: string; icon?: 'ban' | 'inventory' }
> = {
  disponivel: {
    dot: 'bg-muted-foreground',
    text: 'text-muted-foreground',
  },
  ocupado: {
    dot: 'bg-tertiary',
    text: 'text-tertiary',
  },
  bloqueado: {
    dot: 'bg-destructive',
    text: 'text-destructive',
    icon: 'ban',
  },
  inventario: {
    dot: 'bg-secondary',
    text: 'text-secondary',
    icon: 'inventory',
  },
  inativo: {
    dot: 'bg-outline-variant',
    text: 'text-muted-foreground',
    icon: 'ban',
  },
};

export type EnderecoStatusBadgeProps = {
  status: EnderecoStatus;
  compact?: boolean;
  className?: string;
};

export function EnderecoStatusBadge({
  status,
  compact = false,
  className,
}: EnderecoStatusBadgeProps) {
  const tone = toneByStatus[status];
  const label = ENDERECO_STATUS_LABELS[status];

  return (
    <span
      className={cn(
        'inline-flex items-center font-bold',
        compact ? 'gap-1 text-[10px]' : 'gap-2 text-xs',
        tone.text,
        className,
      )}
    >
      {tone.icon === 'ban' ? (
        <Ban
          className={cn('shrink-0', compact ? 'size-3' : 'size-3.5')}
          aria-hidden
        />
      ) : tone.icon === 'inventory' ? (
        <ClipboardList
          className={cn('shrink-0', compact ? 'size-3' : 'size-3.5')}
          aria-hidden
        />
      ) : (
        <span
          className={cn(
            'shrink-0 rounded-full',
            compact ? 'size-1' : 'size-1.5',
            tone.dot,
          )}
        />
      )}
      {label}
    </span>
  );
}

export type CurvaAbcBadgeProps = {
  curva: 'A' | 'B' | 'C';
  compact?: boolean;
  className?: string;
};

export function CurvaAbcBadge({
  curva,
  compact = false,
  className,
}: CurvaAbcBadgeProps) {
  const tone =
    curva === 'A'
      ? 'border-primary/30 bg-primary/10 text-primary'
      : curva === 'B'
        ? 'border-secondary/30 bg-secondary/10 text-secondary'
        : 'border-outline-variant bg-surface-highest text-muted-foreground';

  return (
    <span
      className={cn(
        'inline-flex rounded-full border font-black uppercase',
        compact
          ? 'size-5 items-center justify-center px-0 py-0 text-[10px]'
          : 'px-2 py-0.5 text-[10px]',
        tone,
        className,
      )}
    >
      {compact ? curva : `Classe ${curva}`}
    </span>
  );
}

export type EnderecoLockedFieldProps = {
  value: string;
  className?: string;
};

export function EnderecoLockedField({
  value,
  className,
}: EnderecoLockedFieldProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-lg border border-transparent bg-surface-low px-4 py-3 font-mono tracking-widest text-primary focus-within:border-primary',
        className,
      )}
    >
      <span>{value}</span>
      <Lock className="size-4 text-muted-foreground" aria-hidden />
    </div>
  );
}
