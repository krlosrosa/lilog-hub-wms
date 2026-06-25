'use client';

import { AlertTriangle, Radio, Timer, Truck, Wifi } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { glassPanelClassName } from '@/features/op-wms/components/op-wms-panel-classes';
import type { TurnoStatus } from '@/features/torre-controle-expedicao/types/torre-controle.schema';

export type TorreControleFloatingBarProps = {
  turno: TurnoStatus;
  alertasCount?: number;
  alertasCriticosCount?: number;
  onOpenAlertas?: () => void;
  className?: string;
};

export function TorreControleFloatingBar({
  turno,
  alertasCount = 0,
  alertasCriticosCount = 0,
  onOpenAlertas,
  className,
}: TorreControleFloatingBarProps) {
  const temAlertas = alertasCount > 0;

  return (
    <div
      className={cn(
        'pointer-events-none fixed bottom-6 left-0 right-0 z-40 px-margin-mobile md:px-margin-desktop',
        className,
      )}
    >
      <div className="pointer-events-auto mx-auto flex max-w-container items-end gap-3">
        <div
          className={cn(
            glassPanelClassName,
            'flex min-w-0 flex-1 flex-wrap items-center justify-between gap-4 rounded-full border-primary/30 px-6 py-3 shadow-lg md:px-8',
          )}
        >
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          <div className="flex items-center gap-2">
            <Timer className="size-5 text-primary" aria-hidden />
            <span className="text-label-md text-foreground">
              Progresso turno:{' '}
              <span className="font-bold tabular-nums text-primary">
                {turno.progressoPercent}%
              </span>
            </span>
          </div>
          <div className="hidden h-4 w-px bg-outline-variant sm:block" />
          <div className="flex items-center gap-2">
            <Truck className="size-5 text-primary" aria-hidden />
            <span className="text-label-md text-foreground">
              Previsão conclusão:{' '}
              <span className="font-bold tabular-nums text-primary">
                {turno.previsaoConclusao}
              </span>
            </span>
          </div>
          <div className="hidden h-4 w-px bg-outline-variant md:block" />
          <div className="hidden items-center gap-2 md:flex">
            <span className="text-label-md text-foreground">
              Em risco:{' '}
              <span className="font-bold tabular-nums text-destructive">
                {turno.transportesEmRisco}
              </span>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1">
            <Radio className="size-3.5 animate-pulse text-accent" aria-hidden />
            <span className="text-caption font-semibold text-accent">Ao vivo</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-high px-3 py-1.5">
            <Wifi className="size-4 text-accent" aria-hidden />
            <span className="font-mono text-caption font-bold tabular-nums text-foreground">
              {turno.latencyMs}ms
            </span>
          </div>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn(
          'relative size-14 shrink-0 rounded-full border-primary/30 shadow-lg',
          temAlertas && 'border-destructive/40 bg-destructive/5',
        )}
        onClick={onOpenAlertas}
        aria-label={
          temAlertas
            ? `Abrir centro de alertas, ${alertasCount} alerta${alertasCount !== 1 ? 's' : ''}`
            : 'Abrir centro de alertas'
        }
      >
        <AlertTriangle
          className={cn(
            'size-6',
            temAlertas ? 'text-destructive' : 'text-muted-foreground',
          )}
          aria-hidden
        />
        {temAlertas ? (
          <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold leading-none text-destructive-foreground">
            {alertasCount}
          </span>
        ) : null}
        {alertasCriticosCount > 0 ? (
          <span className="absolute bottom-1 right-1 size-2 rounded-full bg-destructive ring-2 ring-background" />
        ) : null}
      </Button>
      </div>
    </div>
  );
}
