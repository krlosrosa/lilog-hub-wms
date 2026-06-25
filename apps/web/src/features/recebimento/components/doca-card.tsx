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
        className="relative flex cursor-default flex-col items-center gap-1 rounded-lg border border-outline-variant bg-surface-low px-2 py-2 text-center opacity-70"
        role="group"
        aria-label={`${label}: manutenção`}
      >
        <span className="rounded-full bg-muted px-1.5 py-px text-[9px] font-bold text-muted-foreground">
          {label}
        </span>
        <Construction className="size-5 text-outline" aria-hidden />
        <p className="text-[10px] font-bold text-muted-foreground">
          {(etiquetaManutencao ?? 'MANUT').toUpperCase()}
        </p>
      </div>
    );
  }

  const ocupada = status === 'ocupada';

  return (
    <div
      className={cn(
        'group flex cursor-pointer flex-col items-center gap-1 rounded-lg border px-2 py-2 text-center transition-all',
        ocupada
          ? 'border-primary/30 bg-surface-high hover:border-primary'
          : 'border-outline-variant bg-surface-low hover:border-status-active',
      )}
      role="group"
      aria-label={`${label}: ${ocupada ? 'ocupada' : 'disponível'}`}
    >
      <span
        className={cn(
          'rounded-full px-1.5 py-px text-[9px] font-bold',
          ocupada
            ? 'bg-primary/15 text-primary'
            : 'bg-muted text-muted-foreground',
        )}
      >
        {label}
      </span>

      {ocupada ? (
        <Truck className="size-5 shrink-0 text-primary" aria-hidden />
      ) : (
        <Dock
          className="size-5 shrink-0 text-muted-foreground opacity-35 group-hover:opacity-55"
          aria-hidden
        />
      )}

      <p className="max-w-full truncate text-[10px] font-bold text-foreground">
        {ocupada ? (placa ?? '—') : '—'}
      </p>

      <span
        className={cn(
          'rounded-full px-1.5 py-px text-[8px] font-semibold',
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
