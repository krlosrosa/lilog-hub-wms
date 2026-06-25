import { cn } from '@lilog/ui';
import { Check, Clock, Users } from 'lucide-react';

import { hapticLight } from '@/lib/haptics';

import { formatHorarioIntervalo } from '../lib/sessao-labels';
import type { EscalaApi } from '../types';

export interface EscalaPickerCardProps {
  escala: EscalaApi;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function EscalaPickerCard({
  escala,
  selected,
  onSelect,
}: EscalaPickerCardProps) {
  return (
    <button
      type="button"
      onClick={() => {
        hapticLight();
        onSelect(escala.id);
      }}
      className={cn(
        'flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors touch-manipulation active:scale-[0.99]',
        selected
          ? 'border-secondary bg-secondary-container/30 ring-1 ring-secondary'
          : 'border-outline-variant bg-surface active:bg-surface-container',
      )}
      aria-pressed={selected}
      aria-label={`Selecionar escala ${escala.nome}`}
    >
      <div
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
          selected
            ? 'border-secondary bg-secondary text-on-secondary'
            : 'border-outline-variant bg-surface',
        )}
      >
        {selected ? <Check className="h-3 w-3" aria-hidden /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-body-md font-semibold text-on-surface">{escala.nome}</p>
        <p className="mt-0.5 flex items-center gap-1 text-body-sm text-on-surface-variant">
          <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {escala.equipeNome}
          {escala.equipeArea ? ` · ${escala.equipeArea}` : ''}
        </p>
        <p className="mt-1 flex items-center gap-1 text-label-sm text-on-surface-variant">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {formatHorarioIntervalo(
            escala.horaInicioPlanejada,
            escala.horaFimPlanejada,
          )}
          {escala.cruzaMeiaNoite ? ' · Noturno' : ''}
        </p>
        <p className="mt-1 text-label-sm text-on-surface-variant">
          {escala.totalFuncionarios} funcionário
          {escala.totalFuncionarios === 1 ? '' : 's'}
        </p>
      </div>
    </button>
  );
}
