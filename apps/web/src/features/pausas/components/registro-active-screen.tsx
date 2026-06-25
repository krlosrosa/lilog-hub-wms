'use client';

import { Square, Timer, User } from 'lucide-react';

import { Button } from '@lilog/ui';

import { glassPanelClassName } from '@/features/pausas/components/pausas-panel-classes';

export type RegistroActiveScreenProps = {
  activeLabel: string;
  timerDisplay: string;
  operadorNome: string;
  displayId: string;
  onFinishPause: () => void;
};

export function RegistroActiveScreen({
  activeLabel,
  timerDisplay,
  operadorNome,
  displayId,
  onFinishPause,
}: RegistroActiveScreenProps) {
  return (
    <section className="mx-auto flex w-full max-w-2xl animate-in flex-col items-center gap-10 fade-in zoom-in-95 duration-500">
      <div
        className={`${glassPanelClassName} relative w-full overflow-hidden rounded-3xl p-12 text-center`}
      >
        <div className="pointer-events-none absolute -left-24 -top-24 size-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 size-64 rounded-full bg-tertiary/10 blur-3xl" />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-center gap-3 text-tertiary">
            <Timer className="size-8 animate-pulse" aria-hidden />
            <span className="text-headline-md font-medium uppercase tracking-widest">
              {activeLabel}
            </span>
          </div>

          <div>
            <p className="text-label-md uppercase tracking-widest text-muted-foreground">
              Tempo Decorrido
            </p>
            <p
              className="font-mono text-6xl font-black leading-tight text-primary md:text-8xl"
              aria-live="polite"
            >
              {timerDisplay}
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 pt-4">
            <div className="flex size-16 items-center justify-center rounded-full border-2 border-primary/30 bg-muted">
              <User className="size-8 text-muted-foreground" aria-hidden />
            </div>
            <p className="text-headline-md font-semibold text-foreground">
              {operadorNome}
            </p>
            <p className="text-label-md text-muted-foreground">
              ID: {displayId}
            </p>
          </div>
        </div>
      </div>

      <Button
        type="button"
        variant="destructive"
        size="lg"
        className="w-full max-w-md gap-4 py-8 text-headline-md"
        onClick={onFinishPause}
      >
        <Square className="size-6 fill-current" aria-hidden />
        Finalizar Pausa
      </Button>
    </section>
  );
}
