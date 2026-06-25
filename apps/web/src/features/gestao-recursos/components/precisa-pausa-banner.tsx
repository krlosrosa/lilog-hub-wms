'use client';

import Link from 'next/link';

import { AlertTriangle } from 'lucide-react';

import { Button } from '@lilog/ui';

type PrecisaPausaBannerProps = {
  count: number;
};

export function PrecisaPausaBanner({ count }: PrecisaPausaBannerProps) {
  if (count <= 0) {
    return null;
  }

  return (
    <div
      className="flex flex-col gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="text-body-md font-medium text-foreground">
            {count === 1
              ? '1 operador precisa entrar em pausa'
              : `${count} operadores precisam entrar em pausa`}
          </p>
          <p className="text-caption text-muted-foreground">
            Oriente o registro da pausa para cumprir o intervalo de trabalho
            contínuo configurado no CD.
          </p>
        </div>
      </div>
      <Button type="button" variant="outline" size="sm" asChild>
        <Link href="/pausas/registro">Ir para registro de pausas</Link>
      </Button>
    </div>
  );
}
