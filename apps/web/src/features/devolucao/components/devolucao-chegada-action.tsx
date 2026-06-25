'use client';

import Link from 'next/link';

import { ArrowRight, Truck } from 'lucide-react';

import { cn } from '@lilog/ui';

type DevolucaoChegadaActionProps = {
  demandaId: string;
  placa: string;
  compact?: boolean;
  className?: string;
};

export function DevolucaoChegadaAction({
  demandaId,
  placa,
  compact = false,
  className,
}: DevolucaoChegadaActionProps) {
  if (compact) {
    return (
      <Link
        href={`/devolucao/${demandaId}/registro-chegada`}
        title={`Validar chegada — ${placa}`}
        className={cn(
          'inline-flex items-center gap-1 rounded border border-primary/30 bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary transition-colors',
          'hover:border-primary/50 hover:bg-primary hover:text-primary-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          className,
        )}
      >
        <Truck className="size-3 shrink-0" aria-hidden />
        Chegada
      </Link>
    );
  }

  return (
    <Link
      href={`/devolucao/${demandaId}/registro-chegada`}
      className={cn(
        'group relative inline-flex items-center gap-2 overflow-hidden rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-label-md font-semibold text-primary transition-all',
        'hover:border-primary/50 hover:bg-primary hover:text-primary-foreground hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      <span
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"
        aria-hidden
      />
      <span className="relative flex size-7 items-center justify-center rounded-md bg-primary/15 transition-colors group-hover:bg-primary-foreground/15">
        <Truck className="size-4" aria-hidden />
      </span>
      <span className="relative flex flex-col items-start leading-tight">
        <span>Validar Chegada</span>
        <span className="font-mono text-[10px] font-normal opacity-80">
          {placa}
        </span>
      </span>
      <ArrowRight
        className="relative size-4 transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}
