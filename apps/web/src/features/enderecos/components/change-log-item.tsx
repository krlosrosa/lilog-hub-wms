'use client';

import { ArrowRight, Edit, RefreshCw, User } from 'lucide-react';

import { cn } from '@lilog/ui';

import type { ChangeLogItem } from '@/features/enderecos/types/enderecos-configuracao.schema';

const iconByTipo: Record<
  ChangeLogItem['tipo'],
  { icon: typeof User; bg: string; text: string }
> = {
  alteracao: {
    icon: User,
    bg: 'bg-primary',
    text: 'text-primary-foreground',
  },
  regra: {
    icon: RefreshCw,
    bg: 'bg-secondary',
    text: 'text-secondary-foreground',
  },
  vinculo: {
    icon: Edit,
    bg: 'bg-surface-highest border border-outline-variant',
    text: 'text-muted-foreground',
  },
};

export type ChangeLogItemRowProps = {
  item: ChangeLogItem;
  isLast?: boolean;
};

export function ChangeLogItemRow({ item, isLast }: ChangeLogItemRowProps) {
  const config = iconByTipo[item.tipo];
  const Icon = config.icon;

  return (
    <div className={cn('relative pl-8', !isLast && 'pb-2')}>
      <div
        className={cn(
          'absolute left-0 top-1 flex size-[22px] items-center justify-center rounded-full shadow-sm',
          config.bg,
          config.text,
        )}
      >
        <Icon className="size-3.5" aria-hidden />
      </div>
      <div>
        <span className="block text-label-md text-foreground">{item.titulo}</span>
        <span className="mb-1 block text-[11px] text-muted-foreground">
          {item.descricao}
        </span>
        {item.valorAnterior && item.valorNovo && (
          <div className="inline-flex items-center gap-2 rounded bg-surface-highest px-2 py-1 font-mono text-[11px]">
            <span className="text-destructive">{item.valorAnterior}</span>
            <ArrowRight className="size-3 text-muted-foreground" aria-hidden />
            <span className="text-tertiary">{item.valorNovo}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export type ChangeLogTimelineProps = {
  items: ChangeLogItem[];
  onVerCompleto?: () => void;
  className?: string;
};

export function ChangeLogTimeline({
  items,
  onVerCompleto,
  className,
}: ChangeLogTimelineProps) {
  return (
    <section className={className}>
      <div className="relative space-y-6 before:absolute before:bottom-0 before:left-[11px] before:top-2 before:w-px before:bg-outline-variant/50">
        {items.map((item, index) => (
          <ChangeLogItemRow
            key={item.id}
            item={item}
            isLast={index === items.length - 1}
          />
        ))}
      </div>
      {onVerCompleto && (
        <button
          type="button"
          onClick={onVerCompleto}
          className="mt-6 w-full py-2 text-xs font-bold uppercase tracking-wider text-primary hover:underline"
        >
          Ver Histórico Completo
        </button>
      )}
    </section>
  );
}
