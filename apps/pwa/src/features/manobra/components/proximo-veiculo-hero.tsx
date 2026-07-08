import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { hapticLight } from '@/lib/haptics';

import type { Veiculo } from '../types/manobra.schema';

interface ProximoVeiculoHeroProps {
  veiculo: Veiculo;
  posicaoGlobal: number;
  totalNaFila: number;
  onConfirmar: (veiculo: Veiculo) => void;
}

export function ProximoVeiculoHero({
  veiculo,
  posicaoGlobal,
  totalNaFila,
  onConfirmar,
}: ProximoVeiculoHeroProps) {
  return (
    <section className="rounded-2xl border-2 border-secondary/50 bg-secondary/10 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="rounded-full bg-secondary px-3 py-1 text-label-sm font-bold uppercase tracking-wide text-on-secondary">
          Próximo agora
        </span>
        <span className="text-label-sm font-medium tabular-nums text-on-surface-variant">
          {posicaoGlobal} de {totalNaFila} na fila
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-label-sm uppercase tracking-wide text-on-surface-variant">Placa</p>
          <p className="font-mono text-headline-xl font-bold tracking-wider text-on-surface">
            {veiculo.placa}
          </p>
          <p className="mt-0.5 truncate text-label-sm font-medium text-secondary">
            {veiculo.transportadora}
          </p>
        </div>
        <ArrowRight className="h-6 w-6 shrink-0 text-secondary" aria-hidden />
        <div className="min-w-0 text-right">
          <p className="text-label-sm text-on-surface-variant">Doca</p>
          <p className="text-headline-lg font-bold text-secondary">{veiculo.doca}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          hapticLight();
          onConfirmar(veiculo);
        }}
        className="mt-4 flex h-16 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-label-lg font-bold text-white touch-manipulation active:scale-[0.98]"
      >
        <CheckCircle2 className="h-6 w-6" aria-hidden />
        ENCOSTEI
      </button>
    </section>
  );
}
