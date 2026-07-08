'use client';

import { MousePointerClick } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8">
      <div className="max-w-md rounded-xl border border-dashed border-outline-variant bg-card/80 px-6 py-8 text-center backdrop-blur-sm">
        <MousePointerClick className="mx-auto mb-3 h-8 w-8 text-primary" />
        <p className="text-sm font-medium text-foreground">
          Monte o layout do seu CD
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Escolha um elemento na barra superior (estante, corredor, doca, staging
          ou saída) e clique na grade para posicionar. Use Selecionar para mover
          elementos.
        </p>
      </div>
    </div>
  );
}
