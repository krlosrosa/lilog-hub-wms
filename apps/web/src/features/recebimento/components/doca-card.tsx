'use client';

import { cn } from '@lilog/ui';
import { Construction, Dock, Truck } from 'lucide-react';

import type { DocaItem } from '@/features/recebimento/types/recebimento-lista.schema';

type DocaCardProps = {
  doca: DocaItem;
};

export function DocaCard({ doca }: DocaCardProps) {
  const { numero, status, placa, etiquetaManutencao } = doca;
  const label = `DOC ${String(numero).padStart(2, '0')}`;

  if (status === 'manutencao') {
    return (
      <div
        className="flex cursor-default flex-col items-center gap-0.5 rounded-md border border-dashed border-outline-variant bg-surface-low/50 px-1.5 py-1.5 text-center"
        role="group"
        aria-label={`${label}: manutenção`}
      >
        <span className="rounded-full bg-muted px-1.5 py-px text-[8px] font-bold text-muted-foreground">
          {label}
        </span>
        <Construction className="size-3 text-outline" aria-hidden />
        <p className="text-[8px] font-semibold text-muted-foreground">
          {(etiquetaManutencao ?? 'Manut.').toUpperCase()}
        </p>
      </div>
    );
  }

  const ocupada = status === 'ocupada';

  return (
    <div
      className={cn(
        'group flex cursor-pointer flex-col items-center gap-0.5 rounded-md border px-1.5 py-1.5 text-center transition-colors',
        ocupada
          ? 'border-primary/35 bg-primary/5 hover:border-primary'
          : 'border-outline-variant/70 bg-surface-low hover:border-status-active/50 hover:bg-status-active/5',
      )}
      role="group"
      aria-label={`${label}: ${ocupada ? 'ocupada' : 'disponível'}`}
    >
      <span
        className={cn(
          'rounded-full px-1.5 py-px text-[8px] font-bold leading-none',
          ocupada
            ? 'bg-primary/15 text-primary'
            : 'bg-muted text-muted-foreground',
        )}
      >
        {label}
      </span>

      {ocupada ? (
        <Truck className="size-3 shrink-0 text-primary" aria-hidden />
      ) : (
        <Dock
          className="size-3 shrink-0 text-status-active/60 group-hover:text-status-active"
          aria-hidden
        />
      )}

      {ocupada ? (
        <p className="max-w-full truncate font-mono text-[8px] font-semibold leading-none text-foreground">
          {placa?.trim() || 'Sem placa'}
        </p>
      ) : null}

      <span
        className={cn(
          'rounded-full px-1.5 py-px text-[7px] font-semibold uppercase leading-none tracking-wide',
          ocupada
            ? 'bg-primary/15 text-primary'
            : 'bg-status-active/10 text-status-active',
        )}
      >
        {ocupada ? 'Ocupada' : 'Livre'}
      </span>
    </div>
  );
}
