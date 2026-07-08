'use client';

import {
  AlertTriangle,
  Banknote,
  ClipboardCheck,
  Package,
} from 'lucide-react';

import { EnderecoKpiCard } from '@/features/enderecos/components/endereco-kpi-card';
import type { CncDetalhe } from '@/features/cnc/types/cnc.schema';
import { CNC_RESPONSAVEL_LABELS } from '@/features/cnc/types/cnc.schema';
import {
  calcularProgressoTratativas,
  calcularResumoAnomalias,
  formatCncCurrency,
} from '@/features/cnc/lib/cnc-detalhe-utils';

type CncDetalheKpisProps = {
  cnc: CncDetalhe;
};

export function CncDetalheKpis({ cnc }: CncDetalheKpisProps) {
  const anomalias = calcularResumoAnomalias(cnc.itens);
  const tratativas = calcularProgressoTratativas(cnc);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <EnderecoKpiCard
        icon={<Package className="size-4 shrink-0 text-primary" aria-hidden />}
        label="Anomalias"
        value={String(anomalias.total)}
        footer={
          anomalias.total > 0 ? (
            <p className="text-[11px] text-muted-foreground">
              {anomalias.divergencias} divergência
              {anomalias.divergencias !== 1 ? 's' : ''} · {anomalias.avarias}{' '}
              avaria{anomalias.avarias !== 1 ? 's' : ''}
            </p>
          ) : undefined
        }
      />

      <EnderecoKpiCard
        icon={
          <ClipboardCheck
            className="size-4 shrink-0 text-secondary"
            aria-hidden
          />
        }
        label="Tratativas"
        value={
          tratativas.total > 0
            ? `${tratativas.concluidas}/${tratativas.total}`
            : '0'
        }
        progressPercent={
          tratativas.total > 0 ? tratativas.percentual : undefined
        }
        progressClassName="bg-secondary"
        footer={
          tratativas.pendentes > 0 ? (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              {tratativas.pendentes} pendente
              {tratativas.pendentes !== 1 ? 's' : ''}
            </p>
          ) : tratativas.total > 0 ? (
            <p className="text-[11px] text-tertiary">Todas concluídas</p>
          ) : undefined
        }
      />

      <EnderecoKpiCard
        icon={
          <AlertTriangle
            className="size-4 shrink-0 text-amber-500"
            aria-hidden
          />
        }
        label="Responsável"
        value={CNC_RESPONSAVEL_LABELS[cnc.responsavel]}
        variant={
          cnc.responsavel === 'indeterminado' ? 'critical' : 'default'
        }
      />

      <EnderecoKpiCard
        icon={<Banknote className="size-4 shrink-0 text-tertiary" aria-hidden />}
        label="Valor de débito"
        value={formatCncCurrency(cnc.valorDebito)}
        variant={cnc.valorDebito ? 'tertiary' : 'default'}
      />
    </div>
  );
}
