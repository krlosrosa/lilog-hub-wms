'use client';

import { DocaCard } from '@/features/recebimento/components/doca-card';
import type { DocaItem } from '@/features/recebimento/types/recebimento-lista.schema';

type DocasControlProps = {
  docas: readonly DocaItem[];
  compact?: boolean;
};

export function DocasControl({ docas, compact }: DocasControlProps) {
  return (
    <section
      aria-labelledby="titulo-controle-docas"
      className={
        compact
          ? 'rounded-xl border border-outline-variant bg-glass-bg p-3 shadow-inner-glow backdrop-blur-glass'
          : 'rounded-xl border border-outline-variant bg-glass-bg p-4 shadow-inner-glow backdrop-blur-glass md:p-5'
      }
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2
          id="titulo-controle-docas"
          className="text-sm font-bold text-foreground"
        >
          Controle de docas
        </h2>

        <div className="flex flex-wrap items-center gap-2 text-[9px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span
              className="size-2 rounded-full bg-status-active"
              aria-hidden
            />
            Livre
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-primary" aria-hidden />
            Ocupada
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-outline" aria-hidden />
            Manut.
          </span>
        </div>
      </div>

      <div
        className={
          compact
            ? 'grid grid-cols-2 gap-1.5'
            : 'grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5'
        }
      >
        {docas.map((d) => (
          <DocaCard key={d.numero} doca={d} />
        ))}
      </div>
    </section>
  );
}
