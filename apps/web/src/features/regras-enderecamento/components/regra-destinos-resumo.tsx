import { MapPin } from 'lucide-react';

import { cn } from '@lilog/ui';

import type { RegraEnderecamentoListaItem } from '@/features/regras-enderecamento/types/regra-enderecamento.schema';

type RegraDestinosResumoProps = {
  destinos: RegraEnderecamentoListaItem['destinos'];
  compact?: boolean;
};

export function RegraDestinosResumo({
  destinos,
  compact = false,
}: RegraDestinosResumoProps) {
  const ordenados = [...destinos]
    .filter((destino) => destino.ativo)
    .sort((left, right) => left.prioridade - right.prioridade);

  if (ordenados.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">Sem destinos ativos</span>
    );
  }

  return (
    <div className="space-y-1">
      {ordenados.map((destino) => (
        <div
          key={`${destino.prioridade}-${destino.tipo}-${destino.zona ?? destino.enderecoId}`}
          className={cn(
            'flex items-center gap-1.5 text-xs text-foreground',
            compact && 'text-[11px]',
          )}
        >
          <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
            {destino.prioridade}
          </span>
          <MapPin className="size-3 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate">
            {destino.tipo === 'zona'
              ? [destino.zona, destino.rua].filter(Boolean).join(' · ') ||
                'Zona/corredor'
              : (destino.enderecoLabel ?? destino.enderecoId)}
          </span>
        </div>
      ))}
    </div>
  );
}
