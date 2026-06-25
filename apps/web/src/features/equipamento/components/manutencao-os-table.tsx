'use client';

import { Button, cn } from '@lilog/ui';
import { Loader2 } from 'lucide-react';

import {
  OS_PRIORIDADE_LABELS,
  type OrdemServico,
  type OsPrioridade,
} from '@/features/equipamento/types/equipamento.schema';

const PRIORIDADE_CLASSES: Record<OsPrioridade, string> = {
  critica: 'bg-destructive/15 text-destructive border-destructive/30',
  alta: 'bg-tertiary-container/30 text-on-tertiary-container border-tertiary/30',
  baixa: 'bg-muted text-muted-foreground border-outline-variant',
};

type ManutencaoOsTableProps = {
  ordens: OrdemServico[];
  processandoOsId: string | null;
  onAssumir: (osId: string) => void;
  onDetalhes: (osId: string) => void;
};

export function ManutencaoOsTable({
  ordens,
  processandoOsId,
  onAssumir,
  onDetalhes,
}: ManutencaoOsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-outline-variant text-caption uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3 font-semibold">OS / Equipamento</th>
            <th className="hidden px-4 py-3 font-semibold md:table-cell">
              Problema
            </th>
            <th className="px-4 py-3 font-semibold">Prioridade</th>
            <th className="hidden px-4 py-3 font-semibold sm:table-cell">
              Tempo aberto
            </th>
            <th className="px-4 py-3 text-right font-semibold">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/50">
          {ordens.map((os) => (
            <tr
              key={os.id}
              className="transition-colors hover:bg-surface-low/50"
            >
              <td className="px-4 py-4">
                <p className="font-mono text-label-sm font-semibold text-primary">
                  {os.id}
                </p>
                <p className="text-body-md text-foreground">
                  {os.equipamentoNome}
                </p>
                <p className="font-mono text-caption text-muted-foreground">
                  {os.equipamentoTag}
                </p>
              </td>
              <td className="hidden max-w-xs truncate px-4 py-4 text-body-md text-muted-foreground md:table-cell">
                {os.problema}
              </td>
              <td className="px-4 py-4">
                <span
                  className={cn(
                    'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase',
                    PRIORIDADE_CLASSES[os.prioridade],
                  )}
                >
                  {OS_PRIORIDADE_LABELS[os.prioridade]}
                </span>
              </td>
              <td className="hidden px-4 py-4 font-mono text-caption text-muted-foreground sm:table-cell">
                {os.tempoAberto}
              </td>
              <td className="px-4 py-4">
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-caption"
                    disabled={processandoOsId === os.id}
                    onClick={() => void onAssumir(os.id)}
                  >
                    {processandoOsId === os.id ? (
                      <Loader2 className="size-3 animate-spin" aria-hidden />
                    ) : (
                      'Assumir'
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-caption"
                    onClick={() => onDetalhes(os.id)}
                  >
                    Detalhes
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
