'use client';

import { cn } from '@lilog/ui';

import {
  distribuicaoLabelClassName,
  distribuicaoPanelClassName,
  distribuicaoSectionTitleClassName,
} from '@/features/distribuicao-demandas/components/distribuicao-panel-classes';
import type { ConfigDistribuicao } from '@/features/distribuicao-demandas/types/distribuicao-demandas.schema';

export type CapacidadeOperacionalPanelProps = {
  config: ConfigDistribuicao;
  className?: string;
};

export function CapacidadeOperacionalPanel({
  config,
  className,
}: CapacidadeOperacionalPanelProps) {
  const separadoresEstimados = Math.max(1, Math.ceil(config.qtdFuncionarios * 0.7));
  const conferentesEstimados = Math.max(1, config.qtdFuncionarios - separadoresEstimados);
  const porDoca = Math.ceil(config.qtdFuncionarios / Math.max(1, config.qtdDocas));

  return (
    <section
      className={cn(
        distribuicaoPanelClassName,
        'flex h-full min-h-[280px] flex-col overflow-hidden',
        className,
      )}
    >
      <header className="border-b border-outline-variant px-4 py-3">
        <h2 className={distribuicaoSectionTitleClassName}>
          B — Capacidade operacional
        </h2>
      </header>

      <div className="flex-1 space-y-4 p-4 text-sm">
        <p className="text-xs text-muted-foreground">
          A simulação distribui automaticamente a equipe entre workloads com base nas
          quantidades informadas. Não é necessário alocar funcionários manualmente.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded border border-outline-variant/50 p-3">
            <p className={distribuicaoLabelClassName}>Docas ativas</p>
            <p className="font-mono text-lg tabular-nums">{config.qtdDocas}</p>
          </div>
          <div className="rounded border border-outline-variant/50 p-3">
            <p className={distribuicaoLabelClassName}>Funcionários</p>
            <p className="font-mono text-lg tabular-nums">{config.qtdFuncionarios}</p>
          </div>
          <div className="rounded border border-outline-variant/50 p-3">
            <p className={distribuicaoLabelClassName}>Sep. estimados</p>
            <p className="font-mono text-lg tabular-nums">{separadoresEstimados}</p>
          </div>
          <div className="rounded border border-outline-variant/50 p-3">
            <p className={distribuicaoLabelClassName}>Conf. estimados</p>
            <p className="font-mono text-lg tabular-nums">{conferentesEstimados}</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Média de ~{porDoca} funcionário(s) por doca/workload na simulação inicial.
        </p>
      </div>
    </section>
  );
}
