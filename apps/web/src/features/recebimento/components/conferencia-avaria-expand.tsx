'use client';

import { AlertTriangle } from 'lucide-react';

import { useDisplayConfig } from '@/features/config-operacional/hooks/use-display-config';
import { FotoExpandivel } from '@/features/recebimento/components/foto-expandivel';
import { getConferenciaAvariaLabels } from '@/features/recebimento/lib/avaria-labels';
import type { ConferenciaItem } from '@/features/recebimento/types/recebimento-detalhe.schema';

type ConferenciaAvariaExpandProps = {
  item: ConferenciaItem;
};

export function ConferenciaAvariaExpand({ item }: ConferenciaAvariaExpandProps) {
  const { formatQtd } = useDisplayConfig();
  const unidadesPorCaixa = item.unidadesPorCaixa ?? 1;

  return (
    <div className="space-y-3 py-1">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-destructive">
        <AlertTriangle className="size-3 shrink-0" aria-hidden />
        {item.produto} — {item.avarias.length}{' '}
        {item.avarias.length === 1 ? 'avaria registrada' : 'avarias registradas'}
      </p>

      <div className="space-y-2">
        {item.avarias.map((avaria) => {
          const labels = getConferenciaAvariaLabels(avaria);
          const totalUnidades =
            avaria.quantidadeUnidades +
            avaria.quantidadeCaixas * unidadesPorCaixa;

          return (
            <div
              key={avaria.id}
              className="rounded-md border border-destructive/20 bg-destructive/[0.04] px-2.5 py-2"
            >
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-semibold text-foreground">{labels.tipo}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{labels.natureza}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{labels.causa}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatQtd(totalUnidades, unidadesPorCaixa)}
                {avaria.replicado ? ' · replicada' : ''}
              </p>

              {avaria.fotos.length > 0 ? (
                <div className="mt-2">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Fotos ({avaria.fotos.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {avaria.fotos.map((foto) => (
                      <FotoExpandivel
                        key={foto.id}
                        id={foto.id}
                        url={foto.url}
                        legenda={foto.legenda}
                        className="group relative size-16 overflow-hidden rounded-md border border-outline-variant/60 bg-muted/25 transition-colors hover:border-destructive/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
