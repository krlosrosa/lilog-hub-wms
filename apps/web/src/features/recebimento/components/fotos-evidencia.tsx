'use client';

import { Camera, ImageIcon } from 'lucide-react';

import { FotoExpandivel } from '@/features/recebimento/components/foto-expandivel';
import type { FotoEvidencia } from '@/features/recebimento/types/recebimento-detalhe.schema';

type FotosEvidenciasProps = {
  fotos: readonly FotoEvidencia[];
  totalInformado: number;
};

export function FotosEvidencias({
  fotos,
  totalInformado,
}: FotosEvidenciasProps) {
  const total = Math.max(totalInformado, fotos.length);

  return (
    <section
      className="rounded-lg border border-outline-variant/70 bg-glass-bg p-3.5 shadow-sm backdrop-blur-glass"
      aria-labelledby="titulo-fotos"
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h2
          id="titulo-fotos"
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary"
        >
          <ImageIcon className="size-3.5" aria-hidden />
          Evidências fotográficas
        </h2>
        {total > 0 ? (
          <span className="text-[10px] font-semibold text-muted-foreground">
            {total} foto{total === 1 ? '' : 's'}
          </span>
        ) : null}
      </div>

      {fotos.length === 0 ? (
        <div className="flex items-center gap-3 rounded-md border border-dashed border-outline-variant/60 bg-muted/15 px-3 py-4">
          <Camera className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground">
              Nenhuma foto do checklist
            </p>
            <p className="text-[10px] text-muted-foreground">
              Fotos do PWA aparecem aqui após o upload.
            </p>
          </div>
        </div>
      ) : (
        <div className="hide-scrollbar -mx-0.5 flex gap-2 overflow-x-auto pb-0.5">
          {fotos.map((f) => (
            <FotoExpandivel
              key={f.id}
              id={f.id}
              url={f.url}
              legenda={f.legenda}
              showLegenda
              className="group relative size-[72px] shrink-0 overflow-hidden rounded-md border border-outline-variant/60 bg-muted/25 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-20"
            />
          ))}
        </div>
      )}
    </section>
  );
}
