import { CheckCircle2, Clock } from 'lucide-react';

import type { Veiculo } from '../types/manobra.schema';

interface VeiculoNaDocaCardProps {
  veiculo: Veiculo;
}

export function VeiculoNaDocaCard({ veiculo }: VeiculoNaDocaCardProps) {
  return (
    <article className="flex flex-col gap-2 rounded-xl border border-emerald-500/30 border-l-4 border-l-emerald-500 bg-surface-container p-4">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-10 w-10 shrink-0 text-emerald-500" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-headline-md font-bold tracking-wider text-on-surface">
            {veiculo.placa}
          </p>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            {veiculo.doca} · {veiculo.transportadora}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-500">
          Na doca
        </span>
      </div>
      <p className="flex items-center gap-1.5 pl-[52px] text-label-sm text-on-surface-variant">
        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Aguardando conclusão na doca
      </p>
    </article>
  );
}
