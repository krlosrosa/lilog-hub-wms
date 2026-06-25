'use client';

import { cn } from '@lilog/ui';
import { Edit, History, User } from 'lucide-react';

import type { AuditEvento } from '@/features/frota/types/frota.schema';

type VeiculoTabHistoricoProps = {
  eventos: AuditEvento[];
};

const ICON_MAP = {
  history: History,
  person: User,
  edit: Edit,
} as const;

export function VeiculoTabHistorico({ eventos }: VeiculoTabHistoricoProps) {
  return (
    <div className="space-y-4">
      {eventos.map((evento, index) => {
        const Icon = ICON_MAP[evento.icon];
        const isLast = index === eventos.length - 1;

        return (
          <div
            key={evento.id}
            className="relative flex gap-4 pl-8"
          >
            {!isLast ? (
              <span
                className="absolute bottom-[-16px] left-[11px] top-2 w-0.5 bg-outline-variant"
                aria-hidden
              />
            ) : null}
            <div
              className={cn(
                'absolute left-0 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full',
                evento.icon === 'history'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
            </div>
            <div className="flex-1 rounded-lg border border-outline-variant bg-glass-bg p-4 shadow-inner-glow backdrop-blur-glass">
              <div className="flex flex-wrap justify-between gap-2">
                <p className="text-body-md text-foreground">
                  <span className="font-bold text-primary">{evento.autor}</span>{' '}
                  {evento.acao}
                </p>
                <span className="text-label-sm text-muted-foreground">
                  {evento.quando}
                </span>
              </div>
              <p className="mt-1 text-label-sm text-muted-foreground">
                {evento.detalhe}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
