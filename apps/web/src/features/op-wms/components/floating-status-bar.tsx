'use client';

import { Dumbbell, Timer, Wifi } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { glassPanelClassName } from '@/features/op-wms/components/op-wms-panel-classes';
import type { ShiftStatus } from '@/features/op-wms/types/op-wms.schema';

type FloatingStatusBarProps = {
  shiftStatus: ShiftStatus;
  className?: string;
};

export function FloatingStatusBar({ shiftStatus, className }: FloatingStatusBarProps) {
  const weightFormatted = shiftStatus.weightMovedKg.toLocaleString('pt-BR');

  return (
    <div
      className={cn(
        'pointer-events-none fixed bottom-6 left-0 right-0 z-40 px-margin-mobile md:px-margin-desktop',
        className,
      )}
    >
      <div
        className={cn(
          glassPanelClassName,
          'pointer-events-auto mx-auto flex max-w-container flex-wrap items-center justify-between gap-4 rounded-full border-primary/30 px-6 py-3 shadow-lg md:px-8',
        )}
      >
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-primary" aria-hidden />
            <span className="text-label-md text-foreground">
              Duração Turno:{' '}
              <span className="font-bold text-primary">{shiftStatus.duration}</span>
            </span>
          </div>
          <div className="hidden h-4 w-px bg-outline-variant sm:block" />
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" aria-hidden />
            <span className="text-label-md text-foreground">
              Peso Movimentado:{' '}
              <span className="font-bold text-primary">{weightFormatted} kg</span>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <div className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-high px-4 py-1.5">
            <Wifi className="h-4 w-4 text-accent" aria-hidden />
            <span className="font-mono text-caption font-bold text-foreground">
              LATENCY: {shiftStatus.latencyMs}ms
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            className="rounded-full border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
          >
            ENCERRAR TURNO
          </Button>
        </div>
      </div>
    </div>
  );
}
