'use client';

import { Button, cn } from '@lilog/ui';
import { Check, ClipboardList, Plus } from 'lucide-react';

import type { CncDetalhe } from '@/features/cnc/types/cnc.schema';
import {
  CNC_RESPONSAVEL_LABELS,
  CNC_TRATATIVA_STATUS_LABELS,
  CNC_TRATATIVA_TIPO_LABELS,
} from '@/features/cnc/types/cnc.schema';
import { formatCncDate } from '@/features/cnc/lib/cnc-detalhe-utils';

type CncTratativasPanelProps = {
  cnc: CncDetalhe;
  podeGerenciar: boolean;
  processando: boolean;
  onAdicionar: () => void;
  onConcluir: (tratativaId: string) => void;
};

const TIPO_ACCENT: Record<
  CncDetalhe['tratativas'][number]['tipo'],
  string
> = {
  imediata: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  corretiva: 'border-primary/30 bg-primary/10 text-primary',
  preventiva: 'border-secondary/30 bg-secondary/10 text-secondary',
};

export function CncTratativasPanel({
  cnc,
  podeGerenciar,
  processando,
  onAdicionar,
  onConcluir,
}: CncTratativasPanelProps) {
  if (cnc.tratativas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-outline-variant bg-surface-low/30 px-6 py-16 text-center">
        <ClipboardList
          className="size-10 text-muted-foreground/50"
          aria-hidden
        />
        <div>
          <p className="text-sm font-medium text-foreground">
            Nenhuma tratativa registrada
          </p>
          <p className="mt-1 max-w-md text-xs text-muted-foreground">
            {podeGerenciar
              ? 'Após analisar as anomalias, registre ações imediatas, corretivas ou preventivas.'
              : 'Inicie a análise para registrar tratativas nesta CNC.'}
          </p>
        </div>
        {podeGerenciar ? (
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            onClick={onAdicionar}
          >
            <Plus className="size-3.5" aria-hidden />
            Adicionar tratativa
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Tratativas</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Acompanhe ações definidas durante a análise e marque como concluídas.
          </p>
        </div>

        {podeGerenciar ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1.5"
            onClick={onAdicionar}
          >
            <Plus className="size-3.5" aria-hidden />
            Adicionar
          </Button>
        ) : null}
      </div>

      <div className="space-y-3">
        {cnc.tratativas.map((tratativa) => {
          const pendente = tratativa.status === 'pendente';
          const concluida = tratativa.status === 'concluida';

          return (
            <article
              key={tratativa.id}
              className={cn(
                'rounded-xl border p-4 transition-colors',
                concluida
                  ? 'border-tertiary/30 bg-tertiary/5'
                  : pendente
                    ? 'border-outline-variant/50 bg-glass-bg'
                    : 'border-muted bg-muted/20 opacity-70',
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase',
                        TIPO_ACCENT[tratativa.tipo],
                      )}
                    >
                      {CNC_TRATATIVA_TIPO_LABELS[tratativa.tipo]}
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        concluida
                          ? 'bg-tertiary/15 text-tertiary'
                          : pendente
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                            : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {CNC_TRATATIVA_STATUS_LABELS[tratativa.status]}
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed text-foreground">
                    {tratativa.descricao}
                  </p>

                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span>
                      Responsável:{' '}
                      <span className="font-medium text-foreground">
                        {CNC_RESPONSAVEL_LABELS[tratativa.responsavelTipo]}
                      </span>
                    </span>
                    {tratativa.prazo ? (
                      <>
                        <span aria-hidden>·</span>
                        <span>
                          Prazo:{' '}
                          <span className="font-medium text-foreground">
                            {formatCncDate(tratativa.prazo)}
                          </span>
                        </span>
                      </>
                    ) : null}
                    {tratativa.concluidaEm ? (
                      <>
                        <span aria-hidden>·</span>
                        <span>
                          Concluída em{' '}
                          <span className="font-medium text-foreground">
                            {formatCncDate(tratativa.concluidaEm)}
                          </span>
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>

                {pendente && podeGerenciar && cnc.situacao === 'em_analise' ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 shrink-0"
                    disabled={processando}
                    onClick={() => onConcluir(tratativa.id)}
                  >
                    <Check className="size-3.5" aria-hidden />
                    Concluir
                  </Button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
