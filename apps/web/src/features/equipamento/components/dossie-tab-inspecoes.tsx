'use client';

import { cn } from '@lilog/ui';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

import type { EquipamentoDossie } from '@/features/equipamento/types/equipamento.schema';

const RESULTADO_ICON = {
  aprovado: CheckCircle2,
  reprovado: XCircle,
  pendente: Clock,
} as const;

const RESULTADO_CLASSES = {
  aprovado: 'text-status-active',
  reprovado: 'text-destructive',
  pendente: 'text-tertiary',
} as const;

type DossieTabInspecoesProps = {
  equipamento: EquipamentoDossie;
};

export function DossieTabInspecoes({ equipamento }: DossieTabInspecoesProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-outline-variant">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-outline-variant bg-surface-low/50 text-caption uppercase tracking-wider text-muted-foreground">
            <th className="px-6 py-3 font-semibold">Data</th>
            <th className="px-6 py-3 font-semibold">Tipo</th>
            <th className="px-6 py-3 font-semibold">Resultado</th>
            <th className="hidden px-6 py-3 font-semibold md:table-cell">
              Responsável
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/50">
          {equipamento.inspecoes.map((ins) => {
            const Icon = RESULTADO_ICON[ins.resultado];
            return (
              <tr key={ins.id} className="hover:bg-surface-low/30">
                <td className="px-6 py-4 font-mono text-caption text-muted-foreground">
                  {ins.data}
                </td>
                <td className="px-6 py-4 text-foreground">{ins.tipo}</td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 capitalize',
                      RESULTADO_CLASSES[ins.resultado],
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                    {ins.resultado}
                  </span>
                </td>
                <td className="hidden px-6 py-4 text-muted-foreground md:table-cell">
                  {ins.responsavel}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
