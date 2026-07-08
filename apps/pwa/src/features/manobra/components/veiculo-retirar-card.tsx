import { ArrowRightFromLine } from 'lucide-react';

import { hapticMedium } from '@/lib/haptics';

import type { Veiculo } from '../types/manobra.schema';

interface VeiculoRetirarCardProps {
  veiculo: Veiculo;
  onRetirar: (veiculo: Veiculo) => void;
}

export function VeiculoRetirarCard({ veiculo, onRetirar }: VeiculoRetirarCardProps) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-amber-500/50 border-l-4 border-l-amber-500 bg-surface-container p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
          <ArrowRightFromLine className="h-5 w-5 text-amber-500" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-headline-md font-bold tracking-wider text-on-surface">
              {veiculo.placa}
            </p>
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-500">
              Retirar
            </span>
          </div>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            {veiculo.doca} · {veiculo.transportadora}
          </p>
        </div>
      </div>

      <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-body-sm font-medium text-amber-600 dark:text-amber-400">
        Operação concluída — retire o veículo da doca
      </p>

      <button
        type="button"
        onClick={() => {
          hapticMedium();
          onRetirar(veiculo);
        }}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-amber-500 text-label-md font-bold text-black touch-manipulation active:scale-[0.98]"
      >
        <ArrowRightFromLine className="h-5 w-5" aria-hidden />
        RETIREI
      </button>
    </article>
  );
}
