import { Package } from 'lucide-react';

import type { MapaGrupoCorte } from '@/features/corte-operacional/types/corte-operacional.schema';

type CorteMapaResumoProps = {
  mapa: MapaGrupoCorte;
};

export function CorteMapaResumo({ mapa }: CorteMapaResumoProps) {
  return (
    <div className="rounded-xl border border-outline-variant/50 bg-surface-low p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-primary/10 p-2 text-primary">
          <Package className="size-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Mapa de Separação
          </p>
          <p className="font-mono text-sm font-semibold text-foreground">
            {mapa.titulo}
          </p>
          <p className="text-xs text-muted-foreground">
            {mapa.microUuid} · Rota {mapa.transporteRota} · {mapa.totalItens}{' '}
            itens · {mapa.pesoTotalKg.toLocaleString('pt-BR')} kg
          </p>
          {mapa.subtitulo ? (
            <p className="mt-1 text-[11px] text-muted-foreground">
              {mapa.subtitulo}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
