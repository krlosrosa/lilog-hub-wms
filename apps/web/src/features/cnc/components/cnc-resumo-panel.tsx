'use client';

import type { ReactNode } from 'react';

import { cn } from '@lilog/ui';
import { FileSearch, ShieldAlert } from 'lucide-react';

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
  inspecao?: InspecaoTermica | null;
  fotosChecklistCount?: number;
};

function ResumoBloco({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-xl border border-outline-variant/50 bg-glass-bg p-4 shadow-inner-glow backdrop-blur-glass',
        className,
      )}
    >
      <h3 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
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
  inspecao,
  fotosChecklistCount = 0,
}: CncResumoPanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">
          Resumo da não conformidade
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Informações consolidadas para encerramento e registro de responsável.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ResumoBloco title="Identificação">
          <dl className="grid gap-4 sm:grid-cols-2">
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

        <ResumoBloco title="Cronologia">
          <dl className="grid gap-4 sm:grid-cols-2">
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
        <ResumoBloco title="Checklist do recebimento">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <CampoResumo
              label="Temp. baú"
              value={
                inspecao.tempBau != null
                  ? `${inspecao.tempBau.toFixed(1)} °C`
                  : '—'
              }
            />
            <CampoResumo
              label="Temp. produto"
              value={
                inspecao.tempProduto != null
                  ? `${inspecao.tempProduto.toFixed(1)} °C`
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

      <div className="grid gap-4 lg:grid-cols-2">
        <ResumoBloco title="Ação imediata">
          <div className="flex gap-2">
            <ShieldAlert
              className="mt-0.5 size-4 shrink-0 text-amber-500"
              aria-hidden
            />
            <p className="text-sm leading-relaxed text-foreground">
              {cnc.acaoImediata ??
                'Nenhuma ação imediata registrada. Defina ao encerrar a CNC ou adicione uma tratativa imediata.'}
            </p>
          </div>
        </ResumoBloco>

        <ResumoBloco title="Ação corretiva">
          <div className="flex gap-2">
            <FileSearch
              className="mt-0.5 size-4 shrink-0 text-primary"
              aria-hidden
            />
            <p className="text-sm leading-relaxed text-foreground">
              {cnc.acaoCorretiva ??
                'Nenhuma ação corretiva registrada. Documente medidas para evitar recorrência.'}
            </p>
          </div>
        </ResumoBloco>
      </div>

      {cnc.descricao ? (
        <ResumoBloco title="Descrição geral">
          <p className="text-sm leading-relaxed text-foreground">
            {cnc.descricao}
          </p>
        </ResumoBloco>
      ) : null}
    </div>
  );
}
