'use client';

import type { EscalaApi } from '@/features/sessao-operacao/types/escala.api';
import { EscalaTurnoBadge } from '@/features/sessao-operacao/components/escala-turno-badge';
import { formatHorarioIntervalo } from '@/features/sessao-operacao/types/escala.schema';
import { Users } from 'lucide-react';

type EscalaTableRowProps = {
  escala: EscalaApi;
  isSelected: boolean;
  onSelect: (escala: EscalaApi) => void;
};

export function EscalaTableRow({
  escala,
  isSelected,
  onSelect,
}: EscalaTableRowProps) {
  return (
    <tr
      className={`cursor-pointer border-b border-outline-variant/60 transition-colors hover:bg-surface-highest/60 ${
        isSelected ? 'bg-primary/5' : ''
      }`}
      onClick={() => onSelect(escala)}
    >
      <td className="px-4 py-3 text-body-sm font-medium text-foreground">
        {escala.nome}
      </td>
      <td className="hidden px-4 py-3 text-body-sm text-muted-foreground md:table-cell">
        {escala.equipeNome}
      </td>
      <td className="px-4 py-3 text-body-sm text-foreground">
        <div className="flex items-center gap-2">
          <span>
            {formatHorarioIntervalo(
              escala.horaInicioPlanejada,
              escala.horaFimPlanejada,
            )}
          </span>
          <EscalaTurnoBadge cruzaMeiaNoite={escala.cruzaMeiaNoite} />
        </div>
      </td>
      <td className="hidden px-4 py-3 text-body-sm text-muted-foreground lg:table-cell">
        {escala.equipeArea ?? '—'}
      </td>
      <td className="px-4 py-3 text-body-sm text-foreground">
        <span className="inline-flex items-center gap-1">
          <Users className="size-4 text-muted-foreground" aria-hidden />
          {escala.totalFuncionarios}
        </span>
      </td>
      <td className="px-4 py-3 text-body-sm">
        <span
          className={`rounded-full px-2 py-0.5 text-caption font-semibold ${
            escala.ativo
              ? 'bg-primary/10 text-primary'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {escala.ativo ? 'Ativa' : 'Inativa'}
        </span>
      </td>
    </tr>
  );
}
