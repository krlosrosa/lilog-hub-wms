'use client';

import { cn } from '@lilog/ui';
import { User } from 'lucide-react';

import type { MotoristaVinculo } from '@/features/frota/types/frota.schema';

type VeiculoTabMotoristasProps = {
  motoristas: MotoristaVinculo[];
};

export function VeiculoTabMotoristas({ motoristas }: VeiculoTabMotoristasProps) {
  return (
    <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
      {motoristas.map((motorista) => (
        <article
          key={motorista.id}
          className={cn(
            'flex gap-6 rounded-lg border border-outline-variant bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass',
            motorista.papel === 'backup' && 'opacity-70',
          )}
        >
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded border-2 border-primary bg-surface-container-high text-primary">
            <User className="h-10 w-10" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h4 className="text-title-md font-medium text-primary">
                {motorista.nome}
              </h4>
              <span
                className={cn(
                  'rounded px-2 py-0.5 text-label-sm font-medium',
                  motorista.papel === 'primary'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {motorista.papel === 'primary' ? 'Principal' : 'Reserva'}
              </span>
            </div>
            <p className="text-body-md text-foreground">
              CNH categoria: {motorista.cnhCategoria}
            </p>
            <p className="mt-1 text-label-sm text-muted-foreground">
              Na frota desde: {motorista.desde}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
