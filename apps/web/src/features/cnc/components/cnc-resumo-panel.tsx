'use client';

import type { ReactNode } from 'react';

import { cn } from '@lilog/ui';
import { MessageSquareText } from 'lucide-react';

import type { CncDetalhe } from '@/features/cnc/types/cnc.schema';
import {
  CNC_ORIGEM_LABELS,
  CNC_RESPONSAVEL_LABELS,
} from '@/features/cnc/types/cnc.schema';
import {
  formatCncCurrency,
  formatCncDate,
} from '@/features/cnc/lib/cnc-detalhe-utils';
import type { InspecaoTermica } from '@/features/recebimento/types/recebimento-detalhe.schema';

type CncResumoPanelProps = {
  cnc: CncDetalhe;
  embedded?: boolean;
  inspecao?: InspecaoTermica | null;
  fotosChecklistCount?: number;
};

function ResumoBloco({
  title,
  children,
  className,
  compact = false,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <section
      className={cn(
        'rounded-lg border border-outline-variant/50 bg-glass-bg shadow-inner-glow backdrop-blur-glass',
        compact ? 'p-3' : 'rounded-xl p-4',
        className,
      )}
    >
      <h3 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className={compact ? 'mt-2' : 'mt-3'}>{children}</div>
    </section>
  );
}

function CampoResumo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm leading-relaxed text-foreground">{value}</dd>
    </div>
  );
}

export function CncResumoPanel({
  cnc,
  embedded = false,
  inspecao,
  fotosChecklistCount = 0,
}: CncResumoPanelProps) {
  return (
    <div className={embedded ? 'space-y-3' : 'space-y-4'}>
      {!embedded ? (
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Resumo da não conformidade
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Informações consolidadas para encerramento e registro de responsável.
          </p>
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        <ResumoBloco title="Identificação" compact={embedded}>
          <dl className="grid gap-3 sm:grid-cols-2">
            <CampoResumo label="Número" value={cnc.numero} />
            <CampoResumo
              label="Origem"
              value={CNC_ORIGEM_LABELS[cnc.origem]}
            />
            <CampoResumo
              label="Responsável"
              value={CNC_RESPONSAVEL_LABELS[cnc.responsavel]}
            />
            <CampoResumo
              label="Valor de débito"
              value={formatCncCurrency(cnc.valorDebito)}
            />
          </dl>
        </ResumoBloco>

        <ResumoBloco title="Cronologia" compact={embedded}>
          <dl className="grid gap-3 sm:grid-cols-2">
            <CampoResumo
              label="Aberta em"
              value={formatCncDate(cnc.createdAt)}
            />
            <CampoResumo
              label="Análise iniciada"
              value={formatCncDate(cnc.iniciadoEm)}
            />
            <CampoResumo
              label="Encerrada em"
              value={formatCncDate(cnc.encerradoEm)}
            />
            <CampoResumo
              label="Atualizada em"
              value={formatCncDate(cnc.updatedAt)}
            />
          </dl>
        </ResumoBloco>
      </div>

      {inspecao ? (
        <ResumoBloco title="Checklist do recebimento" compact={embedded}>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <CampoResumo
              label="Temp. baú"
              value={
                inspecao.tempBau != null
                  ? `${inspecao.tempBau.toFixed(1)} °C`
                  : '—'
              }
            />
            <CampoResumo
              label="Temp. produto (início)"
              value={
                inspecao.tempProdutoInicio != null
                  ? `${inspecao.tempProdutoInicio.toFixed(1)} °C`
                  : inspecao.tempProduto != null
                    ? `${inspecao.tempProduto.toFixed(1)} °C`
                    : '—'
              }
            />
            <CampoResumo
              label="Temp. produto (meio)"
              value={
                inspecao.tempProdutoMeio != null
                  ? `${inspecao.tempProdutoMeio.toFixed(1)} °C`
                  : '—'
              }
            />
            <CampoResumo
              label="Temp. produto (fim)"
              value={
                inspecao.tempProdutoFim != null
                  ? `${inspecao.tempProdutoFim.toFixed(1)} °C`
                  : '—'
              }
            />
            <CampoResumo label="Lacre" value={inspecao.lacre ?? '—'} />
            <CampoResumo
              label="Fotos do checklist"
              value={String(fotosChecklistCount)}
            />
          </dl>
          {inspecao.observacoes ? (
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">
                Obs. checklist:{' '}
              </span>
              {inspecao.observacoes}
            </p>
          ) : null}
        </ResumoBloco>
      ) : null}

      <ResumoBloco title="Observação" compact={embedded}>
        <div className="flex gap-2">
          <MessageSquareText
            className="mt-0.5 size-4 shrink-0 text-primary"
            aria-hidden
          />
          <p className="text-sm leading-relaxed text-foreground">
            {cnc.observacao ??
              'Nenhuma observação registrada. Adicione contexto, decisões ou pontos de atenção durante a análise.'}
          </p>
        </div>
      </ResumoBloco>

      {cnc.descricao ? (
        <ResumoBloco title="Descrição geral" compact={embedded}>
          <p className="text-sm leading-relaxed text-foreground">
            {cnc.descricao}
          </p>
        </ResumoBloco>
      ) : null}
    </div>
  );
}
