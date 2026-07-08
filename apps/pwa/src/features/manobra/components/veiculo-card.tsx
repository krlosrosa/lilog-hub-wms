import { cn } from '@lilog/ui';
import { CheckCircle2, Clock, MapPin } from 'lucide-react';

import { hapticLight } from '@/lib/haptics';

import type { Veiculo } from '../types/manobra.schema';

interface VeiculoCardProps {
  veiculo: Veiculo;
  onConfirmar: (veiculo: Veiculo) => void;
}

function formatAtribuidoEm(atribuidoEm?: string) {
  if (!atribuidoEm) return null;

  const minutos = Math.max(0, Math.floor((Date.now() - new Date(atribuidoEm).getTime()) / 60_000));
  if (minutos === 0) return 'Agora';
  if (minutos === 1) return 'Há 1 min';
  return `Há ${minutos} min`;
}

export function VeiculoCard({ veiculo, onConfirmar }: VeiculoCardProps) {
  const tempo = formatAtribuidoEm(veiculo.atribuidoEm);

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-outline-variant border-l-4 border-l-sky-500 bg-surface-container p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-label-sm uppercase tracking-wide text-on-surface-variant">Placa</p>
          <p className="font-mono text-headline-xl font-bold tracking-wider text-on-surface">
            {veiculo.placa}
          </p>
        </div>
        {tempo ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-label-sm text-on-surface-variant">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {tempo}
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-secondary/40 bg-secondary/10 p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-on-secondary">
          <MapPin className="h-6 w-6" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-label-sm text-on-surface-variant">Encostar na</p>
          <p className="truncate text-headline-lg font-bold text-secondary">{veiculo.doca}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          hapticLight();
          onConfirmar(veiculo);
        }}
        className={cn(
          'flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-label-md font-bold text-white touch-manipulation active:scale-[0.98]',
        )}
      >
        <CheckCircle2 className="h-5 w-5" aria-hidden />
        ENCOSTEI
      </button>
    </article>
  );
}
