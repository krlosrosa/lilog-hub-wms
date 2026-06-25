import Link from 'next/link';

import { ChevronRight } from 'lucide-react';

import type { SessaoApi } from '@/features/sessao-operacao/types/sessao.api';
import { EscalaTurnoBadge } from '@/features/sessao-operacao/components/escala-turno-badge';
import { SessaoStatusBadge } from '@/features/sessao-operacao/components/sessao-status-badge';
import {
  formatDataReferencia,
} from '@/features/sessao-operacao/types/sessao.schema';
import { formatHorarioIntervalo } from '@/features/sessao-operacao/types/escala.schema';

type SessaoTableRowProps = {
  sessao: SessaoApi;
};

export function SessaoTableRow({ sessao }: SessaoTableRowProps) {
  return (
    <tr className="border-b border-outline-variant/60 transition-colors hover:bg-surface-highest/40">
      <td className="px-4 py-3 text-body-sm font-medium text-foreground">
        <div className="flex flex-col gap-0.5">
          <span>{sessao.escalaNome}</span>
          <span className="text-caption text-muted-foreground">
            {sessao.equipeNome}
          </span>
        </div>
      </td>
      <td className="hidden px-4 py-3 text-body-sm text-foreground md:table-cell">
        {formatDataReferencia(sessao.dataReferencia)}
      </td>
      <td className="px-4 py-3 text-body-sm text-foreground">
        <div className="flex items-center gap-2">
          <span>
            {formatHorarioIntervalo(
              sessao.horaInicioPlanejada,
              sessao.horaFimPlanejada,
            )}
          </span>
          {sessao.cruzaMeiaNoite && <EscalaTurnoBadge cruzaMeiaNoite />}
        </div>
      </td>
      <td className="hidden px-4 py-3 text-body-sm text-muted-foreground lg:table-cell">
        {sessao.totalFuncionarios}
      </td>
      <td className="px-4 py-3">
        <SessaoStatusBadge status={sessao.status} />
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`/sessao-operacao/sessoes/${sessao.id}`}
          className="inline-flex items-center gap-1 text-body-sm text-primary hover:underline"
        >
          Gerenciar
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </td>
    </tr>
  );
}
